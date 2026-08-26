from typing import Optional, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta, timezone
import json
from models import Employee, Asset, Category, License, Repair, RepairUpdate, SoftwareTicket, SoftwareTicketUpdate, Announcement, Guideline, Notification, ActivityLog, AssetHistory
from services.auth_service import get_password_hash
from fastapi import HTTPException

# --- UTILITIES: ACTIVITY LOGS & NOTIFICATIONS ---

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    return datetime.now(IST)

def format_relative_time(created_at: Any, static_time: Optional[str] = None) -> str:
    if not created_at:
        return static_time or "Just now"
    
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except Exception:
            return created_at or static_time or "Just now"
            
    if not hasattr(created_at, "tzinfo"):
        return static_time or "Just now"

    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
        
    diff = now - created_at
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        mins = int(seconds // 60)
        return f"{mins} min ago" if mins == 1 else f"{mins} mins ago"
    elif seconds < 86400:
        hours = int(seconds // 3600)
        return f"{hours} hour ago" if hours == 1 else f"{hours} hours ago"
    elif seconds < 2592000:
        days = int(seconds // 86400)
        return f"{days} day ago" if days == 1 else f"{days} days ago"
    else:
        months = int(seconds // 2592000)
        return f"{months} month ago" if months == 1 else f"{months} months ago"


def log_activity(db: Session, user: str, activity: str, details: str, ip_address: str = "192.168.1.10"):
    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    max_num = 0
    try:
        rows = db.execute(text("SELECT id FROM activity_log WHERE id LIKE 'ACT%'")).all()
        for r in rows:
            if r[0] and r[0].startswith("ACT"):
                try:
                    num = int(r[0][3:])
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass
    except Exception:
        pass
        
    n = max_num + 1
    for attempt in range(50):
        act_id = f"ACT{str(n).zfill(3)}"
        try:
            query = text("""
                INSERT INTO activity_log (id, `user`, activity, details, ip_address, date_time, created_at)
                VALUES (:id, :user, :activity, :details, :ip_address, :date_time, :created_at)
            """)
            db.execute(query, {
                "id": act_id,
                "user": user,
                "activity": activity,
                "details": details,
                "ip_address": ip_address,
                "date_time": now_str,
                "created_at": datetime.now()
            })
            db.commit()
            break
        except Exception:
            db.rollback()
            n += 1
def log_asset_history(
    db: Session,
    asset_id: str,
    action: str,
    employee_id: Optional[str] = None,
    employee_name: Optional[str] = None,
    performed_by: str = "System",
    date_str: Optional[str] = None,
    condition: Optional[str] = None,
    remarks: Optional[str] = None,
    details: Optional[str] = None
):
    if not date_str:
        date_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    try:
        max_num = 0
        try:
            rows = db.execute(text("SELECT id FROM asset_history WHERE id LIKE 'ASH%'")).all()
            for r in rows:
                if r[0] and str(r[0]).startswith("ASH"):
                    try:
                        num = int(str(r[0]).replace("ASH", ""))
                        if num > max_num:
                            max_num = num
                    except Exception:
                        pass
        except Exception:
            pass
        
        hist_id = f"ASH{str(max_num + 1).zfill(5)}"
        desc = details or remarks or f"{action} for asset {asset_id}"
        title = f"{action}: {remarks}"[:150] if remarks else f"{action} by {performed_by}"[:150]
        
        try:
            db.execute(text("""
                INSERT INTO asset_history (id, asset_id, event_type, title, description, performed_by, date_time)
                VALUES (:id, :asset_id, :event_type, :title, :description, :performed_by, :date_time)
            """), {
                "id": hist_id,
                "asset_id": asset_id,
                "event_type": action,
                "title": title,
                "description": desc,
                "performed_by": performed_by,
                "date_time": date_str
            })
            db.commit()
        except Exception:
            try:
                db.execute(text("""
                    INSERT INTO asset_history (asset_id, action, employee_id, employee_name, performed_by, date, `condition`, remarks, details)
                    VALUES (:asset_id, :action, :employee_id, :employee_name, :performed_by, :date, :condition, :remarks, :details)
                """), {
                    "asset_id": asset_id,
                    "action": action,
                    "employee_id": employee_id,
                    "employee_name": employee_name,
                    "performed_by": performed_by,
                    "date": date_str,
                    "condition": condition,
                    "remarks": remarks,
                    "details": details
                })
                db.commit()
            except Exception as e_inner:
                print(f"[Asset History Log Warning] Failed to log asset history: {e_inner}")
    except Exception as e:
        print(f"[Asset History Log Warning] Failed to log asset history: {e}")

def create_notification(db: Session, title: str, message: str, notif_type: str, employee_id: Optional[str] = None):
    try:
        max_num = 0
        try:
            rows = db.execute(text("SELECT id FROM notifications WHERE id LIKE 'NT%'")).all()
            for r in rows:
                if r[0] and r[0].startswith("NT"):
                    try:
                        num = int(r[0][2:])
                        if num > max_num:
                            max_num = num
                    except ValueError:
                        pass
        except Exception:
            pass
            
        n = max_num + 1
        for attempt in range(50):
            notif_id = f"NT{str(n).zfill(3)}"
            try:
                query = text("""
                    INSERT INTO notifications (id, title, message, time, `read`, type, employee_id, created_at)
                    VALUES (:id, :title, :message, :time, :read, :type, :employee_id, :created_at)
                """)
                db.execute(query, {
                    "id": notif_id,
                    "title": title,
                    "message": message,
                    "time": "Just now",
                    "read": False,
                    "type": notif_type,
                    "employee_id": employee_id,
                    "created_at": datetime.now()
                })
                db.commit()
                break
            except Exception:
                db.rollback()
                n += 1
    except Exception as e:
        db.rollback()
        print(f"[Notification Service Warning] Failed to create notification: {e}")



# --- EMPLOYEE SERVICES ---

def get_employees(db: Session, search: Optional[str] = None, department: Optional[str] = None, status: Optional[str] = None):
    sql = "SELECT * FROM employees WHERE 1=1"
    params = {}
    if search:
        sql += " AND (id LIKE :search OR name LIKE :search OR email LIKE :search OR department LIKE :search)"
        params["search"] = f"%{search}%"
    if department and department != "All":
        sql += " AND department = :department"
        params["department"] = department
    if status and status != "All":
        sql += " AND status = :status"
        params["status"] = status
    sql += " ORDER BY id"
    return db.execute(text(sql), params).all()

def get_employee_by_id(db: Session, emp_id: str):
    if not emp_id:
        return None
    clean_id = emp_id.strip()
    sql = "SELECT * FROM employees WHERE LOWER(TRIM(id)) = LOWER(TRIM(:id)) LIMIT 1"
    res = db.execute(text(sql), {"id": clean_id}).first()
    if not res:
        sql_exact = "SELECT * FROM employees WHERE id = :id LIMIT 1"
        res = db.execute(text(sql_exact), {"id": clean_id}).first()
    return res

def get_employee_by_username_or_email(db: Session, login_name: str):
    if not login_name:
        return None
    clean_login = login_name.strip().lower()
    sql = """
        SELECT * FROM employees 
        WHERE LOWER(TRIM(email)) = :login 
           OR LOWER(TRIM(username)) = :login 
           OR LOWER(TRIM(id)) = :login 
           OR LOWER(TRIM(name)) = :login
        LIMIT 1
    """
    return db.execute(text(sql), {"login": clean_login}).first()

def get_admin_emails(db: Session) -> List[str]:
    rows = db.execute(text("SELECT email FROM employees WHERE LOWER(TRIM(role)) = 'admin' AND LOWER(TRIM(status)) = 'active'")).all()
    emails = []
    for r in rows:
        if r and r[0]:
            e = str(r[0]).strip().replace(".@", "@")
            if "@" in e and "." in e.split("@")[-1]:
                emails.append(e)
    return list(set(emails))

def create_employee(db: Session, emp_data: dict, operator_name: str):
    emp_id = emp_data["id"].strip().upper()
    role = emp_data.get("role") or "Employee"
    default_pwd = "admin123" if str(role).strip().lower() == "admin" else "employee123"
    hashed = get_password_hash(emp_data.get("password") or default_pwd)
    
    # Determine username safely
    explicit_user = emp_data.get("username")
    if explicit_user:
        final_username = str(explicit_user).strip()
    elif emp_data.get("email"):
        raw_username = emp_data["email"].split('@')[0].strip()
        final_username = raw_username
        # Check if auto-derived username already exists
        check_user = db.execute(text("SELECT id FROM employees WHERE LOWER(username) = LOWER(:u)"), {"u": final_username}).first()
        if check_user:
            final_username = f"{raw_username}_{emp_id.lower()}"
            counter = 1
            while db.execute(text("SELECT id FROM employees WHERE LOWER(username) = LOWER(:u)"), {"u": final_username}).first():
                final_username = f"{raw_username}_{emp_id.lower()}_{counter}"
                counter += 1
    else:
        final_username = emp_id.lower()

    query = text("""
        INSERT INTO employees (id, name, department, designation, email, username, phone, status, role, avatar, joining_date, location, password_hash)
        VALUES (:id, :name, :department, :designation, :email, :username, :phone, :status, :role, :avatar, :joining_date, :location, :password_hash)
    """)
    try:
        db.execute(query, {
            "id": emp_id,
            "name": emp_data["name"],
            "department": emp_data["department"],
            "designation": emp_data["designation"],
            "email": emp_data["email"],
            "username": final_username,
            "phone": emp_data.get("phone"),
            "status": emp_data.get("status") or "Active",
            "role": role,
            "avatar": emp_data.get("avatar"),
            "joining_date": emp_data.get("joining_date") or datetime.now().strftime("%d %b %Y"),
            "location": emp_data.get("location") or "Hyderabad, India",
            "password_hash": hashed
        })
        db.commit()
    except Exception as e:
        db.rollback()
        err_msg = str(e)
        if "Duplicate entry" in err_msg or "1062" in err_msg:
            if "employees_username_key" in err_msg or "username" in err_msg:
                raise HTTPException(status_code=400, detail=f"Username '{final_username}' is already in use by another employee")
            elif "PRIMARY" in err_msg:
                raise HTTPException(status_code=400, detail=f"Employee ID '{emp_id}' already exists")
            elif "email" in err_msg:
                raise HTTPException(status_code=400, detail=f"Employee email '{emp_data.get('email')}' already exists")
            else:
                raise HTTPException(status_code=400, detail="A duplicate employee record already exists")
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {err_msg}")

    log_activity(db, operator_name, "Add Employee", f"Added new employee {emp_data['name']} ({emp_id})")
    return get_employee_by_id(db, emp_id)

def update_employee(db: Session, emp_id: str, emp_data: dict, operator_name: str):
    sql = "UPDATE employees SET "
    updates = []
    params = {"id": emp_id}
    
    for key, value in emp_data.items():
        if key in ["name", "department", "designation", "email", "username", "phone", "status", "role", "avatar", "joining_date", "location"]:
            updates.append(f"{key} = :{key}")
            params[key] = value
            
    if not updates:
        return get_employee_by_id(db, emp_id)

    sql += ", ".join(updates) + " WHERE id = :id"
    try:
        db.execute(text(sql), params)
        db.commit()
    except Exception as e:
        db.rollback()
        err_msg = str(e)
        if "Duplicate entry" in err_msg or "1062" in err_msg:
            if "employees_username_key" in err_msg or "username" in err_msg:
                raise HTTPException(status_code=400, detail="Username is already in use by another employee")
            elif "email" in err_msg:
                raise HTTPException(status_code=400, detail="Employee email is already in use by another employee")
            else:
                raise HTTPException(status_code=400, detail="A duplicate employee record already exists")
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {err_msg}")
    
    log_activity(db, operator_name, "Update Employee", f"Updated employee profile for {emp_data.get('name') or emp_id}")
    return get_employee_by_id(db, emp_id)

def delete_employee(db: Session, emp_id: str, operator_name: str):
    employee = get_employee_by_id(db, emp_id)
    if not employee:
        return False
    try:
        # Unassign assets assigned to this employee and reset status
        db.execute(
            text("UPDATE assets SET assigned_to = NULL, status = 'Available', assigned_date = 'N/A' WHERE assigned_to = :id"),
            {"id": emp_id}
        )
        # Clear reported_by reference in repairs
        db.execute(
            text("UPDATE repairs SET reported_by = NULL WHERE reported_by = :id"),
            {"id": emp_id}
        )
        # Delete employee notifications
        db.execute(
            text("DELETE FROM notifications WHERE employee_id = :id"),
            {"id": emp_id}
        )
        # Delete employee record
        db.execute(text("DELETE FROM employees WHERE id = :id"), {"id": emp_id})
        db.commit()
        log_activity(db, operator_name, "Delete Employee", f"Deleted employee {emp_id}")
        return True
    except Exception as e:
        db.rollback()
        raise e

def bulk_delete_employees(db: Session, employee_ids: list, operator_name: str):
    if not employee_ids:
        return 0
    valid_ids = [str(eid).strip().upper() for eid in employee_ids if eid and str(eid).strip()]
    if not valid_ids:
        return 0
    from sqlalchemy import bindparam
    try:
        # Unassign assets assigned to these employees and reset status
        stmt_assets = text("""
            UPDATE assets 
            SET assigned_to = NULL, status = 'Available', assigned_date = 'N/A' 
            WHERE assigned_to IN :ids
        """).bindparams(bindparam("ids", expanding=True))
        db.execute(stmt_assets, {"ids": valid_ids})

        # Clear reported_by reference in repairs
        stmt_repairs = text("""
            UPDATE repairs 
            SET reported_by = NULL 
            WHERE reported_by IN :ids
        """).bindparams(bindparam("ids", expanding=True))
        db.execute(stmt_repairs, {"ids": valid_ids})

        # Delete employee notifications
        stmt_notifs = text("""
            DELETE FROM notifications 
            WHERE employee_id IN :ids
        """).bindparams(bindparam("ids", expanding=True))
        db.execute(stmt_notifs, {"ids": valid_ids})

        # Delete employee records
        stmt_emps = text("""
            DELETE FROM employees 
            WHERE id IN :ids
        """).bindparams(bindparam("ids", expanding=True))
        db.execute(stmt_emps, {"ids": valid_ids})

        db.commit()
        count = len(valid_ids)
        log_activity(db, operator_name, "Bulk Delete Employees", f"Deleted {count} employee(s)")
        return count
    except Exception as e:
        db.rollback()
        raise e

def change_employee_password(db: Session, emp_id: str, new_password: str):
    hashed = get_password_hash(new_password)
    db.execute(text("UPDATE employees SET password_hash = :hash WHERE id = :id"), {"hash": hashed, "id": emp_id})
    db.commit()


# --- CATEGORY SERVICES ---

def get_categories(db: Session):
    return db.execute(text("SELECT * FROM categories ORDER BY id")).all()

def create_category(db: Session, cat_data: dict, operator_name: str):
    cat_id = cat_data.get("id")
    
    # Auto-resolve duplicate primary key or missing ID
    if not cat_id or db.execute(text("SELECT id FROM categories WHERE id = :id"), {"id": cat_id}).first():
        rows = db.execute(text("SELECT id FROM categories WHERE id LIKE 'CAT%'")).all()
        max_num = 0
        for r in rows:
            if r[0] and r[0].startswith("CAT"):
                try:
                    num = int(r[0][3:])
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass
        next_num = max_num + 1
        cat_id = f"CAT{str(next_num).zfill(3)}"
        while db.execute(text("SELECT id FROM categories WHERE id = :id"), {"id": cat_id}).first():
            next_num += 1
            cat_id = f"CAT{str(next_num).zfill(3)}"
            
    cat_data["id"] = cat_id

    query = text("""
        INSERT INTO categories (id, name, description, icon_name, `group`, scope, owner_entity)
        VALUES (:id, :name, :description, :icon_name, :group, :scope, :owner_entity)
    """)
    db.execute(query, {
        "id": cat_data["id"],
        "name": cat_data["name"],
        "description": cat_data.get("description"),
        "icon_name": cat_data.get("icon_name"),
        "group": cat_data["group"],
        "scope": cat_data["scope"],
        "owner_entity": cat_data["owner_entity"]
    })
    db.commit()
    log_activity(db, operator_name, "Add Category", f"Added new asset category {cat_data['name']}")
    return db.execute(text("SELECT * FROM categories WHERE id = :id"), {"id": cat_data["id"]}).first()


def update_category(db: Session, cat_id: str, cat_data: dict, operator_name: str):
    sql = "UPDATE categories SET "
    updates = []
    params = {"id": cat_id}
    for key, val in cat_data.items():
        if key in ["name", "description", "icon_name", "group", "scope", "owner_entity"]:
            updates.append(f'`{key}` = :{key}' if key == 'group' else f"{key} = :{key}")
            params[key] = val
    sql += ", ".join(updates) + " WHERE id = :id"
    db.execute(text(sql), params)
    db.commit()
    log_activity(db, operator_name, "Update Category", f"Updated category {cat_data.get('name') or cat_id}")
    return db.execute(text("SELECT * FROM categories WHERE id = :id"), {"id": cat_id}).first()

def delete_category(db: Session, cat_id: str, operator_name: str):
    category = db.execute(text("SELECT * FROM categories WHERE id = :id"), {"id": cat_id}).first()
    if category:
        db.execute(text("DELETE FROM categories WHERE id = :id"), {"id": cat_id})
        db.commit()
        log_activity(db, operator_name, "Delete Category", f"Deleted asset category {category.name}")
        return True
    return False


# --- ASSET SERVICES ---

def get_assets(db: Session, search: Optional[str] = None, type_filter: Optional[str] = None, scope_filter: Optional[str] = None):
    sql = "SELECT * FROM assets WHERE type != 'Desktop'"
    params = {}
    if search:
        sql += " AND (id LIKE :search OR brand LIKE :search OR model LIKE :search OR serial_number LIKE :search)"
        params["search"] = f"%{search}%"
    if type_filter and type_filter != "All":
        sql += " AND type = :type"
        params["type"] = type_filter
    if scope_filter and scope_filter != "All":
        if scope_filter == "Assigned":
            sql += " AND status = 'Assigned'"
        else:
            sql += " AND status != 'Assigned'"
            
    sql += " ORDER BY id"
    return db.execute(text(sql), params).all()

def get_asset_by_id(db: Session, asset_id: str):
    if not asset_id:
        return None
    clean_id = asset_id.strip()
    res = db.execute(text("SELECT * FROM assets WHERE LOWER(TRIM(id)) = LOWER(TRIM(:id)) LIMIT 1"), {"id": clean_id}).first()
    if not res:
        res = db.execute(text("SELECT * FROM assets WHERE id = :id LIMIT 1"), {"id": clean_id}).first()
    return res

def create_asset(db: Session, asset_data: dict, operator_name: str):
    asset_id = asset_data.get("id")
    ownership = (asset_data.get("ownership") or "Quadrant IT Services").strip()
    
    # Auto-resolve duplicate primary key or missing ID
    if not asset_id or db.execute(text("SELECT id FROM assets WHERE id = :id"), {"id": asset_id}).first():
        owner_lower = ownership.lower()
        prefix = 'QITS'
        if 'dsv' in owner_lower:
            prefix = 'DSV'
        elif 'dhl' in owner_lower:
            prefix = 'DHL'
            
        rows = db.execute(text("SELECT id FROM assets WHERE id LIKE :prefix"), {"prefix": f"{prefix}%"}).all()
        existing_ids = set(r[0] for r in rows)
        
        max_num = 0
        for eid in existing_ids:
            if eid and eid.startswith(prefix):
                try:
                    num = int(eid[len(prefix):])
                    if num > max_num:
                        max_num = num
                except Exception:
                    pass
                    
        next_num = max_num + 1
        asset_id = f"{prefix}{str(next_num).zfill(4)}"
        while asset_id in existing_ids:
            next_num += 1
            asset_id = f"{prefix}{str(next_num).zfill(4)}"
            
    asset_data["id"] = asset_id

    query = text("""
        INSERT INTO assets (id, type, brand, model, serial_number, status, ownership, `group`, charger_serial_number, `condition`, assigned_to, purchase_date, warranty_end_date, assigned_date, assigned_at, image)
        VALUES (:id, :type, :brand, :model, :serial_number, :status, :ownership, :group, :charger_serial_number, :condition, :assigned_to, :purchase_date, :warranty_end_date, :assigned_date, :assigned_at, :image)
    """)
    db.execute(query, {
        "id": asset_data["id"],
        "type": asset_data["type"],
        "brand": asset_data["brand"],
        "model": asset_data["model"],
        "serial_number": asset_data["serial_number"],
        "status": asset_data.get("status") or "Available",
        "ownership": asset_data.get("ownership") or "Quadrant IT Services",
        "group": asset_data.get("group") or "IT",
        "charger_serial_number": asset_data.get("charger_serial_number") or "N/A",
        "condition": asset_data.get("condition") or "Good",
        "assigned_to": asset_data.get("assigned_to"),
        "purchase_date": asset_data.get("purchase_date") or datetime.now().strftime("%d %b %Y"),
        "warranty_end_date": asset_data.get("warranty_end_date") or (datetime.now() + timedelta(days=3*365)).strftime("%d %b %Y"),
        "assigned_date": asset_data.get("assigned_date") or "N/A",
        "assigned_at": asset_data.get("assigned_at"),
        "image": asset_data.get("image") or "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=80&h=80&fit=crop"
    })
    db.commit()
    log_activity(db, operator_name, "Add Asset", f"Added new asset {asset_data['brand']} {asset_data['model']} ({asset_data['id']})")
    
    # Log initial asset history entry
    log_asset_history(
        db=db,
        asset_id=asset_data["id"],
        action="Asset Registered",
        employee_id=asset_data.get("assigned_to"),
        employee_name=None,
        performed_by=operator_name,
        date_str=asset_data.get("purchase_date") or get_ist_now().strftime("%d %b %Y, %I:%M %p"),
        condition=asset_data.get("condition") or "Good",
        remarks=f"Registered asset {asset_data['brand']} {asset_data['model']} under {asset_data.get('ownership', 'Quadrant IT Services')}.",
        details=f"Initial registration with serial number: {asset_data['serial_number']} (Status: {asset_data.get('status', 'Available')})"
    )
    
    return get_asset_by_id(db, asset_data["id"])

def update_asset(db: Session, asset_id: str, asset_data: dict, operator_name: str):
    sql = "UPDATE assets SET "
    updates = []
    params = {"id": asset_id}
    for key, val in asset_data.items():
        if key in ["type", "brand", "model", "serial_number", "status", "ownership", "group", "charger_serial_number", "condition", "assigned_to", "purchase_date", "warranty_end_date", "assigned_date", "assigned_at", "image"]:
            updates.append(f'`{key}` = :{key}' if key in ['group', 'condition'] else f"{key} = :{key}")
            params[key] = val
    sql += ", ".join(updates) + " WHERE id = :id"
    db.execute(text(sql), params)
    db.commit()
    log_activity(db, operator_name, "Update Asset", f"Updated asset details for {asset_id}")
    
    # Log update in asset history
    updated_fields = ", ".join([k for k in asset_data.keys() if k != "id"])
    log_asset_history(
        db=db,
        asset_id=asset_id,
        action="Details Updated",
        employee_id=asset_data.get("assigned_to"),
        employee_name=None,
        performed_by=operator_name,
        condition=asset_data.get("condition"),
        remarks=f"Asset specifications or metadata updated by {operator_name}.",
        details=f"Updated fields: {updated_fields}" if updated_fields else "Asset information updated."
    )
    
    return get_asset_by_id(db, asset_id)

def delete_asset(db: Session, asset_id: str, operator_name: str):
    asset = get_asset_by_id(db, asset_id)
    if asset:
        db.execute(text("DELETE FROM assets WHERE id = :id"), {"id": asset_id})
        db.commit()
        log_activity(db, operator_name, "Delete Asset", f"Deleted asset {asset_id}")
        return True
    return False

def bulk_delete_assets(db: Session, asset_ids: list, operator_name: str):
    if not asset_ids:
        return 0
    valid_ids = [str(aid).strip() for aid in asset_ids if aid and str(aid).strip()]
    if not valid_ids:
        return 0
    from sqlalchemy import bindparam
    stmt = text("DELETE FROM assets WHERE id IN :ids").bindparams(bindparam("ids", expanding=True))
    db.execute(stmt, {"ids": valid_ids})
    db.commit()
    count = len(valid_ids)
    log_activity(db, operator_name, "Bulk Delete Assets", f"Deleted {count} asset(s)")
    return count

def _extract_field(obj, field_name: str, default=None):
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(field_name, default)
    if hasattr(obj, '_mapping') and field_name in obj._mapping:
        val = obj._mapping[field_name]
        return val if val is not None else default
    val = getattr(obj, field_name, None)
    if val is not None:
        return val
    return default

def assign_assets_service(db: Session, emp_id: str, asset_ids: list, assign_date: Optional[str] = None, remarks: Optional[str] = None, operator_name: str = "System"):
    clean_emp_id = emp_id.strip() if emp_id else ""
    employee = get_employee_by_id(db, clean_emp_id) or get_employee_by_username_or_email(db, clean_emp_id)
    if not employee:
        print(f"[assign_assets_service Error] Employee '{emp_id}' not found in database.", flush=True)
        return False
        
    emp_name = _extract_field(employee, 'name', 'Employee')
    emp_db_id = _extract_field(employee, 'id', clean_emp_id)
    emp_dept = _extract_field(employee, 'department', 'N/A')
    emp_email = _extract_field(employee, 'email', None)
    
    now_iso = datetime.now(timezone.utc)
    if assign_date:
        try:
            date_formatted = datetime.strptime(assign_date, "%Y-%m-%d").strftime("%d %b %Y")
        except Exception:
            try:
                date_formatted = datetime.fromisoformat(assign_date.replace("Z", "+00:00")).strftime("%d %b %Y")
            except Exception:
                date_formatted = assign_date
    else:
        date_formatted = datetime.now().strftime("%d %b %Y")
    
    assigned_assets_list = []
    for aid in asset_ids:
        clean_aid = str(aid).strip()
        asset_obj = get_asset_by_id(db, clean_aid)
        if asset_obj:
            assigned_assets_list.append(asset_obj)

        db.execute(text("""
            UPDATE assets 
            SET status = 'Assigned', assigned_to = :emp_id, assigned_date = :assign_date, assigned_at = :assigned_at, acceptance_status = 'Pending' 
            WHERE LOWER(TRIM(id)) = LOWER(TRIM(:id))
        """), {
            "emp_id": emp_db_id,
            "assign_date": date_formatted,
            "assigned_at": now_iso,
            "id": clean_aid
        })
        log_activity(db, operator_name, "Assign Asset", f"Assigned asset {clean_aid} to {emp_name} ({emp_db_id})")
        
        # Log in asset history
        log_asset_history(
            db=db,
            asset_id=clean_aid,
            action="Assigned to Employee",
            employee_id=emp_db_id,
            employee_name=emp_name,
            performed_by=operator_name,
            date_str=date_formatted,
            condition="Good",
            remarks=remarks or f"Assigned to {emp_name} ({emp_dept})",
            details=f"Asset assigned to {emp_name} ({emp_db_id}) by {operator_name}. Remarks: {remarks or 'None'}. Awaiting employee acceptance."
        )
        
    db.commit()
    create_notification(db, "Assets Assigned", f"{len(asset_ids)} asset(s) assigned to {emp_name}. Awaiting employee acceptance.", "info", None)
    create_notification(db, "Asset Assigned - Acknowledgment Required", f"{len(asset_ids)} asset(s) have been assigned to you. Please review and accept or reject in your employee portal.", "info", emp_db_id)

    # Trigger email notification to the assigned employee
    if emp_email:
        clean_email = str(emp_email).strip().replace(".@", "@")
        if "@" in clean_email and "." in clean_email.split("@")[-1]:
            try:
                from services.email_service import send_email_async
                print(f"[assign_assets_service] Dispatching assignment notification email to employee: {clean_email}...", flush=True)

                # Build HTML table for assigned assets
                asset_rows_html = ""
                for idx, a in enumerate(assigned_assets_list, 1):
                    a_id = _extract_field(a, 'id', 'N/A')
                    asset_type = _extract_field(a, 'type', 'N/A')
                    asset_brand = _extract_field(a, 'brand', '')
                    asset_model = _extract_field(a, 'model', '')
                    device_name = f"{asset_brand} {asset_model}".strip() or "N/A"
                    serial_num = _extract_field(a, 'serial_number', 'N/A')
                    charger_sn = _extract_field(a, 'charger_serial_number', 'N/A')
                    bg_color = "#f8fafc" if idx % 2 != 0 else "#ffffff"
                    
                    asset_rows_html += f"""
                    <tr style="background-color: {bg_color};">
                      <td style="padding: 10px 12px; font-weight: bold; color: #1e293b; border: 1px solid #e2e8f0;">{a_id}</td>
                      <td style="padding: 10px 12px; color: #334155; border: 1px solid #e2e8f0;">{asset_type}</td>
                      <td style="padding: 10px 12px; color: #334155; border: 1px solid #e2e8f0;">{device_name}</td>
                      <td style="padding: 10px 12px; color: #334155; font-family: monospace; font-size: 13px; border: 1px solid #e2e8f0;">{serial_num}</td>
                      <td style="padding: 10px 12px; color: #334155; font-family: monospace; font-size: 13px; border: 1px solid #e2e8f0;">{charger_sn or 'N/A'}</td>
                    </tr>
                    """

                count_str = f"{len(asset_ids)} Asset{'s' if len(asset_ids) > 1 else ''}"
                email_subject = f"[QITS Asset Assignment] IT Equipment Assigned to You ({count_str})"
                
                email_body = f"""
                <html>
                  <body style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 20px; background-color: #f1f5f9;">
                    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                      <div style="background-color: #0f172a; padding: 20px 24px; text-align: left;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Quadrant IT Services</h2>
                        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Asset Management System</p>
                      </div>
                      
                      <div style="padding: 24px;">
                        <h3 style="color: #2563eb; margin-top: 0;">📦 IT Equipment Assigned</h3>
                        <p>Hello <strong>{emp_name}</strong>,</p>
                        <p>The IT Administrator (<strong>{operator_name}</strong>) has assigned <strong>{len(asset_ids)}</strong> IT asset(s) to your employee account.</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
                          <tr style="background: #f8fafc;">
                            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold; width: 140px;">Employee</td>
                            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{emp_name} (ID: {emp_db_id})</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Department</td>
                            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{emp_dept}</td>
                          </tr>
                          <tr style="background: #f8fafc;">
                            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Assigned Date</td>
                            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{date_formatted}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Assigned By</td>
                            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{operator_name}</td>
                          </tr>
                          {f'<tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Remarks</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{remarks}</td></tr>' if remarks else ''}
                        </table>

                        <h4 style="color: #0f172a; margin: 20px 0 10px 0;">Equipment Details:</h4>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                          <thead>
                            <tr style="background-color: #0f172a; color: #ffffff;">
                              <th style="padding: 8px 12px; text-align: left; border: 1px solid #0f172a;">Asset ID</th>
                              <th style="padding: 8px 12px; text-align: left; border: 1px solid #0f172a;">Type</th>
                              <th style="padding: 8px 12px; text-align: left; border: 1px solid #0f172a;">Brand & Model</th>
                              <th style="padding: 8px 12px; text-align: left; border: 1px solid #0f172a;">Serial Number</th>
                              <th style="padding: 8px 12px; text-align: left; border: 1px solid #0f172a;">Charger S/N</th>
                            </tr>
                          </thead>
                          <tbody>
                            {asset_rows_html}
                          </tbody>
                        </table>

                        <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                          <p style="color: #854d0e; margin: 0; font-size: 14px; font-weight: bold;">📌 Action Required: Accept or Reject Assigned Asset(s)</p>
                          <p style="color: #713f12; margin: 6px 0 0 0; font-size: 13px; line-height: 1.5;">
                            Please go to the <strong>Employee Portal</strong> to review your assigned equipment. Click <strong>Accept</strong> to confirm receipt of your IT equipment, or click <strong>Reject</strong> (with reason) if you have not received the item(s) or if there are any discrepancies.
                          </p>
                        </div>

                        <p style="color: #64748b; font-size: 12px; margin: 0;">
                          If you have any questions, please contact Central IT or raise an IT Support ticket.
                        </p>
                      </div>
                      
                      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                          This is an automated notification from Quadrant IT Asset Management System.
                        </p>
                      </div>
                    </div>
                  </body>
                </html>
                """
                send_email_async(clean_email, email_subject, email_body)
            except Exception as e_mail:
                print(f"[assign_assets_service] Email dispatch error: {e_mail}", flush=True)
        else:
            print(f"[assign_assets_service Warning] Employee '{clean_emp_id}' has invalid email format: '{emp_email}'. Email not sent.", flush=True)
    else:
        print(f"[assign_assets_service Warning] Employee '{clean_emp_id}' has no email registered in the database. Email not sent.", flush=True)

    return True

def accept_asset_assignment_service(db: Session, asset_id: str, employee_id: str, operator_name: str = "Employee") -> bool:
    asset = get_asset_by_id(db, asset_id)
    if not asset:
        return False
    employee = get_employee_by_id(db, employee_id)
    emp_name = employee.name if employee else (operator_name or "Employee")
    emp_id = employee.id if employee else employee_id

    # Update acceptance status
    db.execute(text("""
        UPDATE assets 
        SET acceptance_status = 'Accepted'
        WHERE id = :id
    """), {"id": asset_id})
    db.commit()

    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    date_str = get_ist_now().strftime("%d %b %Y")

    log_activity(db, emp_name, "Asset Accepted", f"{emp_name} ({emp_id}) accepted assignment of asset {asset_id} ({asset.brand} {asset.model})")
    
    log_asset_history(
        db=db,
        asset_id=asset_id,
        action="Accepted by Employee",
        employee_id=emp_id,
        employee_name=emp_name,
        performed_by=emp_name,
        date_str=date_str,
        condition=asset.condition or "Good",
        remarks=f"Assignment accepted by employee {emp_name}",
        details=f"Asset {asset_id} ({asset.brand} {asset.model}) successfully acknowledged and accepted on {now_str}."
    )

    # In-app notifications: for admins (broadcast) and for the employee
    create_notification(
        db,
        f"Asset {asset_id} Accepted",
        f"Employee {emp_name} ({emp_id}) has accepted asset {asset.brand} {asset.model} (Serial No: {asset.serial_number}).",
        "success",
        None
    )
    create_notification(
        db,
        f"Asset {asset_id} Accepted",
        f"You have confirmed and accepted {asset.brand} {asset.model}.",
        "success",
        emp_id
    )

    # Trigger email to all admins
    try:
        from services.email_service import send_email_async
        admin_emails = get_admin_emails(db)
        if not admin_emails:
            admin_emails = ["admin@company.com"]
        
        email_subject = f"[QITS Asset Acknowledged] {emp_name} Accepted Asset {asset_id}"
        email_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #16a34a; margin-top: 0;">✓ Asset Assignment Accepted</h2>
              <p>Hello Admin Team,</p>
              <p>Employee <strong>{emp_name}</strong> (ID: <strong>{emp_id}</strong>) has <strong>ACCEPTED</strong> the assigned IT equipment.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Asset ID</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{asset.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Device</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{asset.brand} {asset.model} ({asset.type})</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Serial Number</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{asset.serial_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Acknowledged On</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">{now_str}</td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 13px;">This is an automated notification from the Quadrant IT Asset Management System.</p>
            </div>
          </body>
        </html>
        """
        for a_email in admin_emails:
            send_email_async(a_email, email_subject, email_body)
    except Exception as e_mail:
        print(f"[accept_asset_assignment_service] Email error: {e_mail}")

    return True

def reject_asset_assignment_service(db: Session, asset_id: str, employee_id: str, reason: Optional[str] = None, operator_name: str = "Employee") -> bool:
    asset = get_asset_by_id(db, asset_id)
    if not asset:
        return False
    employee = get_employee_by_id(db, employee_id)
    emp_name = employee.name if employee else (operator_name or "Employee")
    emp_id = employee.id if employee else employee_id
    rejection_reason = (reason or "").strip() or "No specific reason provided by employee."

    # Update asset: unassign it, set status to Available, and record rejection
    db.execute(text("""
        UPDATE assets 
        SET status = 'Available', assigned_to = NULL, assigned_date = 'N/A', assigned_at = NULL, acceptance_status = 'Rejected'
        WHERE id = :id
    """), {"id": asset_id})
    db.commit()

    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    date_str = get_ist_now().strftime("%d %b %Y")

    log_activity(db, emp_name, "Asset Rejected", f"{emp_name} ({emp_id}) rejected assignment of asset {asset_id}. Reason: {rejection_reason}")
    
    log_asset_history(
        db=db,
        asset_id=asset_id,
        action="Rejected by Employee",
        employee_id=emp_id,
        employee_name=emp_name,
        performed_by=emp_name,
        date_str=date_str,
        condition=asset.condition or "Good",
        remarks=f"Assignment rejected: {rejection_reason}",
        details=f"Asset assignment rejected by {emp_name} ({emp_id}) on {now_str}. Reason: {rejection_reason}. Asset returned to Available pool."
    )

    # In-app notifications: for admins (broadcast) and for the employee
    create_notification(
        db,
        f"Asset {asset_id} Rejected",
        f"Employee {emp_name} ({emp_id}) REJECTED asset {asset.brand} {asset.model} ({asset.id}). Reason: {rejection_reason}",
        "danger",
        None
    )
    create_notification(
        db,
        f"Asset {asset_id} Assignment Rejected",
        f"You have rejected assignment of {asset.brand} {asset.model}. IT Admin has been notified.",
        "warning",
        emp_id
    )

    # Trigger rejection email to all admins
    try:
        from services.email_service import send_email_async
        admin_emails = get_admin_emails(db)
        if not admin_emails:
            admin_emails = ["admin@company.com"]
        
        email_subject = f"[QITS Asset Rejection Alert] {emp_name} Rejected Asset {asset_id}"
        email_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background: #fffdfd;">
              <h2 style="color: #dc2626; margin-top: 0;">⚠ Asset Assignment Rejected</h2>
              <p>Hello Admin Team,</p>
              <p>Employee <strong>{emp_name}</strong> (ID: <strong>{emp_id}</strong>) has <strong>REJECTED</strong> the assigned asset.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #fef2f2;">
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2; font-weight: bold;">Asset ID</td>
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2;">{asset.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2; font-weight: bold;">Device</td>
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2;">{asset.brand} {asset.model} ({asset.type})</td>
                </tr>
                <tr style="background: #fef2f2;">
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2; font-weight: bold;">Serial Number</td>
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2;">{asset.serial_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2; font-weight: bold;">Rejection Reason</td>
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2; color: #b91c1c; font-weight: bold;">{rejection_reason}</td>
                </tr>
                <tr style="background: #fef2f2;">
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2; font-weight: bold;">Time</td>
                  <td style="padding: 8px 12px; border: 1px solid #fee2e2;">{now_str}</td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 13px;">The asset status has been automatically returned to 'Available' in the system inventory.</p>
            </div>
          </body>
        </html>
        """
        for a_email in admin_emails:
            send_email_async(a_email, email_subject, email_body)
    except Exception as e_mail:
        print(f"[reject_asset_assignment_service] Email error: {e_mail}")

    return True


def return_assets_service(db: Session, emp_id: str, asset_ids: list, return_date: Optional[str] = None, return_condition: Optional[str] = None, remarks: Optional[str] = None, operator_name: str = "System"):
    employee = get_employee_by_id(db, emp_id)
    if not employee:
        return False
        
    cond_clean = (return_condition or "").strip()
    cond_lower = cond_clean.lower()

    if "disposed" in cond_lower or "damaged" in cond_lower:
        next_status = "Disposed"
        asset_cond = "Damaged"
    elif "repair" in cond_lower or "defective" in cond_lower:
        next_status = "Under Repair"
        asset_cond = "Under Repair"
    elif "fair" in cond_lower:
        next_status = "Available"
        asset_cond = "Fair"
    elif "poor" in cond_lower:
        next_status = "Available"
        asset_cond = "Poor"
    else:
        next_status = "Available"
        asset_cond = "Good"

    date_formatted = datetime.strptime(return_date, "%Y-%m-%d").strftime("%d %b %Y") if (return_date and "-" in return_date) else (return_date or datetime.now().strftime("%d %b %Y"))

    for aid in asset_ids:
        db.execute(text("""
            UPDATE assets 
            SET status = :status, `condition` = :condition, assigned_to = NULL, assigned_date = 'N/A', assigned_at = NULL 
            WHERE id = :id
        """), {
            "status": next_status,
            "condition": asset_cond,
            "id": aid
        })
        log_activity(db, operator_name, "Return Asset", f"Returned asset {aid} from {employee.name} (Condition: {return_condition or 'Good'})")
        
        # Log in asset history
        log_asset_history(
            db=db,
            asset_id=aid,
            action="Asset Returned",
            employee_id=emp_id,
            employee_name=employee.name,
            performed_by=operator_name,
            date_str=date_formatted,
            condition=asset_cond,
            remarks=remarks or f"Returned by {employee.name} in {asset_cond} condition",
            details=f"Asset returned from {employee.name} ({emp_id}). Received Condition: {return_condition or 'Good'}. Next Status: {next_status}. Remarks: {remarks or 'None'}"
        )
        
        if next_status == "Under Repair":
            # Generate repair ticket
            count = db.execute(text("SELECT COUNT(*) FROM repairs")).scalar() or 0
            rep_id = f"REP{str(count + 1).zfill(5)}"
            req_date = datetime.now().strftime("%d %b %Y %I:%M %p")
            
            db.execute(text("""
                INSERT INTO repairs (id, asset_id, reported_by, issue, description, request_date, priority, assigned_to, estimated_completion, status)
                VALUES (:id, :asset_id, :reported_by, :issue, :description, :request_date, :priority, :assigned_to, :est_completion, :status)
            """), {
                "id": rep_id,
                "asset_id": aid,
                "reported_by": emp_id,
                "issue": f"Returned in {return_condition} condition. {remarks or ''}",
                "description": f"Asset returned in {return_condition} condition by employee. Remarks: {remarks or 'None'}",
                "request_date": req_date,
                "priority": "Medium",
                "assigned_to": "IT Support Team",
                "est_completion": "Awaiting inspection",
                "status": "In Progress"
            })
            
            # Insert first update
            db.execute(text("""
                INSERT INTO repair_updates (repair_id, date, message)
                VALUES (:rep_id, :date, :message)
            """), {
                "rep_id": rep_id,
                "date": req_date,
                "message": f"Repair request generated on return by {employee.name}."
            })
            
            log_activity(db, operator_name, "Create Repair", f"Generated repair request {rep_id} for returned asset {aid}")
            
            log_asset_history(
                db=db,
                asset_id=aid,
                action="Repair Ticket Raised",
                employee_id=emp_id,
                employee_name=employee.name,
                performed_by=operator_name,
                date_str=req_date,
                condition="Under Repair",
                remarks=f"Repair ticket {rep_id} created upon asset return.",
                details=f"Issue: Returned in {return_condition} condition. {remarks or ''}"
            )

    db.commit()
    create_notification(db, "Assets Returned", f"{len(asset_ids)} asset(s) successfully returned by {employee.name}.", "success", None)
    create_notification(db, "Asset Return Processed", f"{len(asset_ids)} asset(s) return processed successfully.", "success", emp_id)
    return True

def get_asset_full_history_service(db: Session, asset_id: str):
    asset = get_asset_by_id(db, asset_id)
    if not asset:
        return None
        
    # 1. Fetch current assigned employee details if assigned
    current_emp = None
    if asset.assigned_to:
        emp = get_employee_by_id(db, asset.assigned_to)
        if emp:
            current_emp = {
                "id": emp.id,
                "name": emp.name,
                "department": emp.department,
                "designation": emp.designation,
                "email": emp.email,
                "avatar": emp.avatar
            }
            
    # 2. Fetch logged history from asset_history table
    history_rows = []
    try:
        history_rows = db.execute(
            text("SELECT * FROM asset_history WHERE asset_id = :aid ORDER BY id ASC"),
            {"aid": asset_id}
        ).all()
    except Exception as e:
        print(f"[Asset History Warning] Failed querying asset_history table: {e}")
        
    # 3. Fetch repairs for this asset
    repairs_rows = db.execute(
        text("SELECT * FROM repairs WHERE asset_id = :aid ORDER BY id DESC"),
        {"aid": asset_id}
    ).all()

    repairs_list = []
    for rep in repairs_rows:
        updates = get_repair_updates(db, rep.id)
        rep_emp = get_employee_by_id(db, rep.reported_by) if rep.reported_by else None
        repairs_list.append({
            "id": rep.id,
            "assetId": rep.asset_id,
            "reportedBy": rep.reported_by,
            "employeeName": rep_emp.name if rep_emp else rep.reported_by,
            "issue": rep.issue,
            "description": rep.description,
            "requestDate": rep.request_date,
            "priority": rep.priority,
            "assignedTo": rep.assigned_to,
            "estimatedCompletion": rep.estimated_completion,
            "status": rep.status,
            "acceptedBy": rep.accepted_by,
            "acceptedDate": rep.accepted_date,
            "updates": [{"id": u.id, "date": u.date, "message": u.message} for u in updates]
        })

    # 4. Fetch activity logs mentioning this asset
    act_rows = db.execute(
        text("SELECT * FROM activity_log WHERE details LIKE :aid_pattern ORDER BY id ASC"),
        {"aid_pattern": f"%{asset_id}%"}
    ).all()

    # 5. Build Unified Timeline Events
    timeline_events = []
    has_creation = False
    
    for h in history_rows:
        timeline_events.append({
            "id": h.id,
            "assetId": h.asset_id,
            "action": h.action,
            "employeeId": h.employee_id,
            "employeeName": h.employee_name,
            "performedBy": h.performed_by,
            "date": h.date,
            "condition": h.condition,
            "remarks": h.remarks,
            "details": h.details,
            "createdAt": h.created_at
        })
        if "Created" in h.action or "Register" in h.action or "Add Asset" in h.action:
            has_creation = True

    # If no initial registration record exists in asset_history (e.g. seeded data), add baseline Purchase/Registration
    if not has_creation:
        timeline_events.insert(0, {
            "id": None,
            "assetId": asset.id,
            "action": "Asset Registered / Purchased",
            "employeeId": None,
            "employeeName": None,
            "performedBy": "Inventory Admin",
            "date": asset.purchase_date or "10 May 2024",
            "condition": asset.condition or "Good",
            "remarks": f"Asset procured and registered under {asset.ownership}.",
            "details": f"Initial procurement: {asset.brand} {asset.model} (Serial No: {asset.serial_number}, Class: {asset.group})",
            "createdAt": asset.created_at
        })

    # Synthesize events from activity logs if not already captured
    existing_actions = set((e["action"], e["date"]) for e in timeline_events)
    for act in act_rows:
        act_name = act.activity
        if act_name == "Assign Asset" and ("Assigned to Employee", act.date_time) not in existing_actions:
            emp_name = None
            emp_id = None
            if "to " in act.details:
                part = act.details.split("to ")[1]
                if "(" in part:
                    emp_name = part.split("(")[0].strip()
                    emp_id = part.split("(")[1].replace(")", "").strip()
            timeline_events.append({
                "id": None,
                "assetId": asset.id,
                "action": "Assigned to Employee",
                "employeeId": emp_id,
                "employeeName": emp_name,
                "performedBy": act.user,
                "date": act.date_time,
                "condition": asset.condition or "Good",
                "remarks": act.details,
                "details": f"Assigned to {emp_name} ({emp_id})" if emp_name else act.details,
                "createdAt": act.created_at
            })
        elif act_name == "Return Asset" and ("Asset Returned", act.date_time) not in existing_actions:
            emp_name = None
            if "from " in act.details:
                emp_name = act.details.split("from ")[1].split("(")[0].strip()
            timeline_events.append({
                "id": None,
                "assetId": asset.id,
                "action": "Asset Returned",
                "employeeId": None,
                "employeeName": emp_name,
                "performedBy": act.user,
                "date": act.date_time,
                "condition": "Good",
                "remarks": act.details,
                "details": act.details,
                "createdAt": act.created_at
            })

    # Add repair tickets to timeline if not already present
    existing_timeline_details = set(e.get("details", "") for e in timeline_events)
    for rep in repairs_list:
        rep_date = rep["requestDate"]
        ticket_detail = f"Ticket {rep['id']}: {rep['issue']}"
        if not any(rep["id"] in d for d in existing_timeline_details):
            timeline_events.append({
                "id": None,
                "assetId": asset.id,
                "action": "Maintenance / Repair Request",
                "employeeId": rep["reportedBy"],
                "employeeName": rep["employeeName"],
                "performedBy": rep["employeeName"] or "Employee",
                "date": rep_date,
                "condition": "Under Repair",
                "remarks": f"Priority: {rep['priority']} | Status: {rep['status']}",
                "details": f"Ticket {rep['id']}: {rep['issue']}. {rep['description'] or ''}",
                "createdAt": None
            })
            for upd in rep["updates"]:
                if upd["message"] != "Repair request created.":
                    timeline_events.append({
                        "id": None,
                        "assetId": asset.id,
                        "action": "Repair Update / Resolution",
                        "employeeId": None,
                        "employeeName": rep["acceptedBy"] or rep["assignedTo"],
                        "performedBy": rep["acceptedBy"] or rep["assignedTo"] or "IT Support",
                        "date": upd["date"],
                        "condition": "Good" if rep["status"] == "Completed" else "Under Repair",
                        "remarks": f"Ticket {rep['id']} Status: {rep['status']}",
                        "details": upd["message"],
                        "createdAt": None
                    })

    # If currently assigned and no assigned event in timeline, synthesize current assignment
    has_assigned_event = any("Assign" in e["action"] for e in timeline_events)
    if asset.status == "Assigned" and asset.assigned_to and not has_assigned_event:
        timeline_events.append({
            "id": None,
            "assetId": asset.id,
            "action": "Assigned to Employee",
            "employeeId": asset.assigned_to,
            "employeeName": current_emp["name"] if current_emp else asset.assigned_to,
            "performedBy": "System Admin",
            "date": asset.assigned_date if asset.assigned_date != "N/A" else "12 May 2024",
            "condition": asset.condition or "Good",
            "remarks": f"Active assignment to {current_emp['name'] if current_emp else asset.assigned_to}",
            "details": f"Asset deployed and assigned for active work.",
            "createdAt": asset.assigned_at or asset.created_at
        })

    # 6. Build Structured Assignments History List
    assignments_list = []
    # If currently assigned
    if asset.assigned_to:
        assignments_list.append({
            "employeeId": asset.assigned_to,
            "employeeName": current_emp["name"] if current_emp else asset.assigned_to,
            "employeeDepartment": current_emp["department"] if current_emp else "IT",
            "assignedDate": asset.assigned_date if asset.assigned_date != "N/A" else "12 May 2024",
            "returnedDate": None,
            "condition": asset.condition or "Good",
            "remarks": "Current active assignment",
            "status": "Active"
        })
    
    # Check returned events in timeline
    for h in timeline_events:
        if "Return" in h["action"]:
            assignments_list.append({
                "employeeId": h.get("employeeId") or "-",
                "employeeName": h.get("employeeName") or "Employee",
                "employeeDepartment": "-",
                "assignedDate": "-",
                "returnedDate": h["date"],
                "condition": h.get("condition") or "Good",
                "remarks": h.get("remarks") or "Asset returned in working condition",
                "status": "Returned"
            })

    return {
        "asset": asset,
        "currentAssignedEmployee": current_emp,
        "timeline": timeline_events,
        "assignments": assignments_list,
        "repairs": repairs_list
    }


# --- SUBSCRIPTION GROUP SERVICES ---

def get_subscription_groups(db: Session):
    groups = db.execute(text("SELECT * FROM subscription_groups ORDER BY name ASC")).mappings().all()
    results = []
    from services.license_scheduler import parse_license_date
    now = datetime.now()
    for g in groups:
        g_dict = dict(g)
        # Count plans inside this group
        plans = db.execute(text("SELECT id, status, end_date, alert_days_before FROM licenses WHERE group_id = :gid"), {"gid": g_dict["id"]}).mappings().all()
        plans_count = len(plans)
        
        # Calculate expiring soon count
        expiring_soon_count = 0
        for p in plans:
            p_status = (p.get("status") or "").lower().strip()
            if p_status not in ["cancelled", "inactive", "deactivated"]:
                end_dt = parse_license_date(p.get("end_date"))
                if end_dt:
                    rem_days = (end_dt - now.date()).days
                    alert_days = p.get("alert_days_before") or 30
                    if 0 <= rem_days <= alert_days:
                        expiring_soon_count += 1

        # Count unique employees assigned to plans in this group
        plan_ids = [p["id"] for p in plans]
        assigned_employees_count = 0
        if plan_ids:
            from sqlalchemy import bindparam
            stmt = text("SELECT COUNT(DISTINCT employee_id) FROM license_assignments WHERE license_id IN :pids").bindparams(bindparam("pids", expanding=True))
            assigned_employees_count = db.execute(stmt, {"pids": plan_ids}).scalar() or 0

        g_dict["plans_count"] = plans_count
        g_dict["assigned_employees_count"] = assigned_employees_count
        g_dict["expiring_soon_count"] = expiring_soon_count
        results.append(g_dict)
    return results

def get_subscription_group_by_id(db: Session, group_id: str):
    row = db.execute(text("SELECT * FROM subscription_groups WHERE id = :id"), {"id": group_id}).mappings().first()
    if not row:
        return None
    g_dict = dict(row)
    plans = db.execute(text("SELECT id, status, end_date, alert_days_before FROM licenses WHERE group_id = :gid"), {"gid": g_dict["id"]}).mappings().all()
    g_dict["plans_count"] = len(plans)
    
    from services.license_scheduler import parse_license_date
    now = datetime.now()
    expiring_soon_count = 0
    for p in plans:
        p_status = (p.get("status") or "").lower().strip()
        if p_status not in ["cancelled", "inactive", "deactivated"]:
            end_dt = parse_license_date(p.get("end_date"))
            if end_dt:
                rem_days = (end_dt - now.date()).days
                alert_days = p.get("alert_days_before") or 30
                if 0 <= rem_days <= alert_days:
                    expiring_soon_count += 1
    g_dict["expiring_soon_count"] = expiring_soon_count

    plan_ids = [p["id"] for p in plans]
    if plan_ids:
        from sqlalchemy import bindparam
        stmt = text("SELECT COUNT(DISTINCT employee_id) FROM license_assignments WHERE license_id IN :pids").bindparams(bindparam("pids", expanding=True))
        g_dict["assigned_employees_count"] = db.execute(stmt, {"pids": plan_ids}).scalar() or 0
    else:
        g_dict["assigned_employees_count"] = 0
    return g_dict

def create_subscription_group(db: Session, group_data: dict, operator_name: str):
    import uuid
    gid = group_data.get("id") or f"GRP{uuid.uuid4().hex[:8].upper()}"
    query = text("""
        INSERT INTO subscription_groups (id, name, description, vendor, created_at)
        VALUES (:id, :name, :description, :vendor, :created_at)
    """)
    db.execute(query, {
        "id": gid,
        "name": group_data["name"].strip(),
        "description": group_data.get("description", "").strip(),
        "vendor": (group_data.get("vendor") or group_data["name"]).strip(),
        "created_at": datetime.now()
    })
    db.commit()
    log_activity(db, operator_name, "Create Subscription Group", f"Created subscription group: {group_data['name']}")
    return get_subscription_group_by_id(db, gid)

def update_subscription_group(db: Session, group_id: str, group_data: dict, operator_name: str):
    sql = "UPDATE subscription_groups SET "
    updates = []
    params = {"id": group_id}
    for key, val in group_data.items():
        if key in ["name", "description", "vendor"] and val is not None:
            updates.append(f"{key} = :{key}")
            params[key] = val
    if updates:
        sql += ", ".join(updates) + " WHERE id = :id"
        db.execute(text(sql), params)
        if "name" in group_data and group_data["name"]:
            db.execute(text("UPDATE licenses SET group_name = :gname WHERE group_id = :gid"), {"gname": group_data["name"], "gid": group_id})
        db.commit()
        log_activity(db, operator_name, "Update Subscription Group", f"Updated subscription group: {group_data.get('name') or group_id}")
    return get_subscription_group_by_id(db, group_id)

def delete_subscription_group(db: Session, group_id: str, operator_name: str):
    group = get_subscription_group_by_id(db, group_id)
    if group:
        # Check if group has plans - safe delete rule: cannot delete while containing plans
        has_plans = db.execute(text("SELECT COUNT(*) FROM licenses WHERE group_id = :gid"), {"gid": group_id}).scalar()
        if has_plans and has_plans > 0:
            return False
        db.execute(text("DELETE FROM subscription_groups WHERE id = :id"), {"id": group_id})
        db.commit()
        log_activity(db, operator_name, "Delete Subscription Group", f"Deleted subscription group: {group['name']}")
        return True
    return False


# --- LICENSE SERVICES ---

def get_licenses(db: Session):
    rows = db.execute(text("SELECT * FROM licenses ORDER BY id")).mappings().all()
    results = []
    assignments_stmt = text("""
        SELECT la.id as assignment_id, la.license_id, la.assigned_at, la.assigned_by,
               e.id as employee_id, e.name as employee_name, e.email as employee_email,
               e.department as employee_department, e.designation as employee_designation,
               e.avatar as employee_avatar
        FROM license_assignments la
        LEFT JOIN employees e ON la.employee_id = e.id
    """)
    try:
        assignments_rows = db.execute(assignments_stmt).mappings().all()
    except Exception:
        assignments_rows = []

    assignments_by_lic = {}
    for r in assignments_rows:
        lic_id = r["license_id"]
        if lic_id not in assignments_by_lic:
            assignments_by_lic[lic_id] = []
        assignments_by_lic[lic_id].append({
            "id": r["assignment_id"],
            "employeeId": r["employee_id"],
            "name": r["employee_name"] or r["employee_id"],
            "email": r["employee_email"] or "N/A",
            "department": r["employee_department"] or "General",
            "designation": r["employee_designation"] or "Employee",
            "avatar": r["employee_avatar"],
            "assignedAt": str(r["assigned_at"]) if r["assigned_at"] else None,
            "assignedBy": r["assigned_by"]
        })

    for r in rows:
        d = dict(r)
        lic_id = d["id"]
        assigned = assignments_by_lic.get(lic_id, [])
        d["assigned_employees"] = assigned
        d["assigned_count"] = len(assigned)
        results.append(d)
    return results

def get_license_by_id(db: Session, lic_id: str):
    row = db.execute(text("SELECT * FROM licenses WHERE id = :id"), {"id": lic_id}).mappings().first()
    if not row:
        return None
    d = dict(row)
    try:
        assignments_stmt = text("""
            SELECT la.id as assignment_id, la.license_id, la.assigned_at, la.assigned_by,
                   e.id as employee_id, e.name as employee_name, e.email as employee_email,
                   e.department as employee_department, e.designation as employee_designation,
                   e.avatar as employee_avatar
            FROM license_assignments la
            LEFT JOIN employees e ON la.employee_id = e.id
            WHERE la.license_id = :lid
        """)
        assignments_rows = db.execute(assignments_stmt, {"lid": lic_id}).mappings().all()
        d["assigned_employees"] = [{
            "id": r["assignment_id"],
            "employeeId": r["employee_id"],
            "name": r["employee_name"] or r["employee_id"],
            "email": r["employee_email"] or "N/A",
            "department": r["employee_department"] or "General",
            "designation": r["employee_designation"] or "Employee",
            "avatar": r["employee_avatar"],
            "assignedAt": str(r["assigned_at"]) if r["assigned_at"] else None,
            "assignedBy": r["assigned_by"]
        } for r in assignments_rows]
        d["assigned_count"] = len(d["assigned_employees"])
    except Exception:
        d["assigned_employees"] = []
        d["assigned_count"] = 0
    return d

def create_license(db: Session, lic_data: dict, operator_name: str):
    if not lic_data.get("id"):
        max_num = 0
        try:
            rows = db.execute(text("SELECT id FROM licenses WHERE id LIKE 'LIC%'")).all()
            for r in rows:
                if r[0] and str(r[0]).startswith("LIC"):
                    try:
                        num = int(str(r[0])[3:])
                        if num > max_num:
                            max_num = num
                    except ValueError:
                        pass
        except Exception:
            pass
        lic_id = f"LIC{str(max_num + 1).zfill(3)}"
    else:
        lic_id = lic_data["id"]

    # Double check if lic_id already exists, if so increment until unique
    while db.execute(text("SELECT id FROM licenses WHERE id = :id"), {"id": lic_id}).first():
        try:
            num = int(lic_id.replace("LIC", "")) + 1
            lic_id = f"LIC{str(num).zfill(3)}"
        except ValueError:
            lic_id = f"{lic_id}_1"
    
    group_id = lic_data.get("group_id")
    group_name = lic_data.get("group_name")
    if group_id and not group_name:
        grp = db.execute(text("SELECT name FROM subscription_groups WHERE id = :id"), {"id": group_id}).first()
        if grp:
            group_name = grp[0]

    query = text("""
        INSERT INTO licenses (id, name, status, group_id, group_name, vendor, license_key, seats, cost, start_date, end_date, alert_days_before, admin_email, description)
        VALUES (:id, :name, :status, :group_id, :group_name, :vendor, :license_key, :seats, :cost, :start_date, :end_date, :alert_days_before, :admin_email, :description)
    """)
    db.execute(query, {
        "id": lic_id,
        "name": lic_data["name"],
        "status": lic_data.get("status") or "Available",
        "group_id": group_id,
        "group_name": group_name,
        "vendor": lic_data.get("vendor") or "Subscription",
        "license_key": lic_data.get("license_key") or "N/A",
        "seats": lic_data.get("seats") or 1,
        "cost": lic_data.get("cost") or "N/A",
        "start_date": lic_data.get("start_date") or datetime.now().strftime("%d %b %Y"),
        "end_date": lic_data["end_date"],
        "alert_days_before": lic_data.get("alert_days_before") or 30,
        "admin_email": lic_data.get("admin_email") or "admin@company.com",
        "description": lic_data.get("description") or "Software license subscription."
    })
    db.commit()

    # Initial employee assignments if provided
    assigned_employee_ids = lic_data.get("assigned_employee_ids") or []
    if assigned_employee_ids:
        assign_employees_to_license(db, lic_id, assigned_employee_ids, operator_name)

    log_activity(db, operator_name, "Add License", f"Added new software license: {lic_data['name']}")
    return get_license_by_id(db, lic_id)

def update_license(db: Session, lic_id: str, lic_data: dict, operator_name: str):
    sql = "UPDATE licenses SET "
    updates = []
    params = {"id": lic_id}

    if "group_id" in lic_data:
        group_id = lic_data["group_id"]
        if group_id:
            grp = db.execute(text("SELECT name FROM subscription_groups WHERE id = :id"), {"id": group_id}).first()
            if grp:
                lic_data["group_name"] = grp[0]
        else:
            lic_data["group_name"] = None

    for key, val in lic_data.items():
        if key in ["name", "status", "group_id", "group_name", "vendor", "license_key", "seats", "cost", "start_date", "end_date", "alert_days_before", "admin_email", "description"]:
            updates.append(f"{key} = :{key}")
            params[key] = val
    if updates:
        sql += ", ".join(updates) + " WHERE id = :id"
        db.execute(text(sql), params)
        db.commit()

    # Sync employee assignments if provided in update payload
    if "assigned_employee_ids" in lic_data and lic_data["assigned_employee_ids"] is not None:
        target_eids = list(dict.fromkeys(str(eid).strip() for eid in lic_data["assigned_employee_ids"] if str(eid).strip()))
        if target_eids:
            from sqlalchemy import bindparam
            # Delete assignments not in target_eids
            db.execute(
                text("DELETE FROM license_assignments WHERE license_id = :lid AND employee_id NOT IN :eids").bindparams(bindparam("eids", expanding=True)),
                {"lid": lic_id, "eids": target_eids}
            )
            # Insert any missing assignments
            import uuid
            for eid in target_eids:
                exists = db.execute(
                    text("SELECT id FROM license_assignments WHERE license_id = :lid AND employee_id = :eid"),
                    {"lid": lic_id, "eid": eid}
                ).first()
                if not exists:
                    aid = f"LA{uuid.uuid4().hex[:8].upper()}"
                    db.execute(text("""
                        INSERT INTO license_assignments (id, license_id, employee_id, assigned_at, assigned_by)
                        VALUES (:id, :lid, :eid, :at, :by)
                    """), {
                        "id": aid,
                        "lid": lic_id,
                        "eid": eid,
                        "at": datetime.now(),
                        "by": operator_name
                    })
            db.commit()
        else:
            # Clear all assignments
            db.execute(text("DELETE FROM license_assignments WHERE license_id = :lid"), {"lid": lic_id})
            db.commit()

    log_activity(db, operator_name, "Update License", f"Updated software license: {lic_data.get('name') or lic_id}")
    return get_license_by_id(db, lic_id)

def delete_license(db: Session, lic_id: str, operator_name: str):
    license = get_license_by_id(db, lic_id)
    if license:
        db.execute(text("DELETE FROM license_assignments WHERE license_id = :id"), {"id": lic_id})
        db.execute(text("DELETE FROM licenses WHERE id = :id"), {"id": lic_id})
        db.commit()
        log_activity(db, operator_name, "Delete License", f"Deleted software license: {license.get('name') or lic_id}")
        return True
    return False

# --- LICENSE ASSIGNMENT SERVICES ---

def assign_employees_to_license(db: Session, license_id: str, employee_ids: list, operator_name: str):
    if not employee_ids:
        return get_license_by_id(db, license_id)
    
    import uuid
    added_count = 0
    for emp_id in employee_ids:
        clean_eid = str(emp_id).strip()
        if not clean_eid:
            continue
        existing = db.execute(
            text("SELECT id FROM license_assignments WHERE license_id = :lid AND employee_id = :eid"),
            {"lid": license_id, "eid": clean_eid}
        ).first()
        if not existing:
            aid = f"LA{uuid.uuid4().hex[:8].upper()}"
            db.execute(text("""
                INSERT INTO license_assignments (id, license_id, employee_id, assigned_at, assigned_by)
                VALUES (:id, :lid, :eid, :at, :by)
            """), {
                "id": aid,
                "lid": license_id,
                "eid": clean_eid,
                "at": datetime.now(),
                "by": operator_name
            })
            added_count += 1
    
    db.commit()
    lic = get_license_by_id(db, license_id)
    if added_count > 0 and lic:
        log_activity(db, operator_name, "Assign License", f"Assigned {added_count} employee(s) to plan '{lic.get('name')}'")
        create_notification(db, "License Assigned", f"{added_count} employee(s) assigned to '{lic.get('name')}'.", "success")
    return lic

def unassign_employee_from_license(db: Session, license_id: str, employee_id: str, operator_name: str):
    clean_eid = str(employee_id).strip()
    db.execute(
        text("DELETE FROM license_assignments WHERE license_id = :lid AND employee_id = :eid"),
        {"lid": license_id, "eid": clean_eid}
    )
    db.commit()
    lic = get_license_by_id(db, license_id)
    if lic:
        log_activity(db, operator_name, "Unassign License", f"Unassigned employee {clean_eid} from plan '{lic.get('name')}'")
    return lic


# --- REPAIR / TICKET SERVICES ---

def get_repairs(db: Session, reported_by: Optional[str] = None):
    sql = "SELECT * FROM repairs"
    params = {}
    if reported_by:
        sql += " WHERE reported_by = :reported_by"
        params["reported_by"] = reported_by
    sql += " ORDER BY id DESC"
    return db.execute(text(sql), params).all()

def get_repair_by_id(db: Session, rep_id: str):
    return db.execute(text("SELECT * FROM repairs WHERE id = :id"), {"id": rep_id}).first()

def get_repair_updates(db: Session, rep_id: str):
    return db.execute(text("SELECT * FROM repair_updates WHERE repair_id = :rep_id ORDER BY id"), {"rep_id": rep_id}).all()

def create_repair(db: Session, rep_data: dict, operator_name: str):
    count = db.execute(text("SELECT COUNT(*) FROM repairs")).scalar() or 0
    n = count + 1
    while True:
        rep_id = f"TKT{str(n).zfill(4)}"
        exists = db.execute(text("SELECT id FROM repairs WHERE id = :id"), {"id": rep_id}).first()
        if not exists:
            break
        n += 1
    req_date = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    
    # Safely validate asset_id against assets table
    raw_asset_id = rep_data.get("asset_id")
    valid_asset_id = None
    if raw_asset_id:
        asset_exists = db.execute(text("SELECT id FROM assets WHERE id = :id"), {"id": raw_asset_id}).first()
        if asset_exists:
            valid_asset_id = raw_asset_id
    
    db.execute(text("""
        INSERT INTO repairs (id, asset_id, reported_by, issue, description, request_date, priority, assigned_to, estimated_completion, status)
        VALUES (:id, :asset_id, :reported_by, :issue, :description, :request_date, :priority, :assigned_to, :est_completion, :status)
    """), {
        "id": rep_id,
        "asset_id": valid_asset_id,
        "reported_by": rep_data["reported_by"],
        "issue": rep_data["issue"],
        "description": rep_data.get("description") or f"Reported fault: {rep_data['issue']}",
        "request_date": req_date,
        "priority": rep_data.get("priority") or "Medium",
        "assigned_to": rep_data.get("assigned_to") or "IT Support Team",
        "est_completion": rep_data.get("estimated_completion") or "Awaiting inspection",
        "status": "In Progress"
    })
    
    # Insert first update
    db.execute(text("""
        INSERT INTO repair_updates (repair_id, date, message)
        VALUES (:rep_id, :date, :message)
    """), {
        "rep_id": rep_id,
        "date": req_date,
        "message": "Repair request created."
    })
    
    # Update asset status to Under Repair only if valid asset exists and not a new asset request
    if valid_asset_id and not str(rep_data.get("issue", "")).startswith("New Asset Request"):
        db.execute(text("UPDATE assets SET status = 'Under Repair' WHERE id = :asset_id"), {"asset_id": valid_asset_id})
    
    db.commit()
    log_activity(db, operator_name, "Create Repair", f"Created repair request {rep_id} for asset {valid_asset_id or 'General Request'}")
    
    is_new_asset = str(rep_data.get("issue", "")).startswith("New Asset Request") or "new ticket" in str(rep_data.get("issue", "")).lower() or "request new" in str(rep_data.get("issue", "")).lower()
    if is_new_asset:
        notif_title = "New IT Equipment Ticket Raised"
        notif_msg = f"New Ticket {rep_id} raised by {operator_name}: '{rep_data['issue']}'"
    else:
        notif_title = "New Support Ticket Raised"
        notif_msg = f"Ticket {rep_id} raised by {operator_name} for asset {valid_asset_id or 'N/A'}: '{rep_data['issue']}'"

    # Create Broadcast Notification for Admin (employee_id = None)
    create_notification(
        db,
        notif_title,
        notif_msg,
        "warning",
        None
    )

    # Create Confirmation Notification for Reporting Employee
    if rep_data.get("reported_by"):
        create_notification(
            db,
            "Support Ticket Submitted",
            f"Your request {rep_id} ('{rep_data['issue']}') has been received by IT Support.",
            "info",
            rep_data["reported_by"]
        )

    # Trigger Email Dispatch Asynchronously
    try:
        from services.email_service import send_email_async
        from app.config import settings
        # Collect recipient emails for Admin notification (DB Admins + default SMTP_USER)
        admin_emails = set()
        default_admin = getattr(settings, "SMTP_USER", "helloquad05@gmail.com")
        if default_admin:
            admin_emails.add(default_admin)
        
        try:
            admin_rows = db.execute(text("SELECT email FROM employees WHERE role = 'Admin' AND email IS NOT NULL AND email != ''")).all()
            for r in admin_rows:
                if r.email:
                    admin_emails.add(r.email)
        except Exception as e_adm:
            print(f"[create_repair] Warning: Failed fetching DB admin emails: {e_adm}")

        email_subject = f"[QITS Ticket {rep_id}] {notif_title}"
        email_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin:0;">QITS IT Asset Management Desk</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <h3 style="color: #2563eb;">{notif_title}</h3>
              <p><strong>Ticket ID:</strong> {rep_id}</p>
              <p><strong>Raised By:</strong> {operator_name} (Employee ID: {rep_data['reported_by']})</p>
              <p><strong>Issue / Item:</strong> {rep_data['issue']}</p>
              <p><strong>Priority:</strong> {rep_data.get('priority', 'Medium')}</p>
              <p><strong>Description / Details:</strong> {rep_data.get('description', 'N/A')}</p>
              <p><strong>Request Date (IST):</strong> {req_date}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">This is an automated notification from Quadrant IT Services Management System.</p>
            </div>
          </body>
        </html>
        """
        for admin_email in admin_emails:
            send_email_async(admin_email, email_subject, email_body)

        # Send confirmation email to Employee if email exists
        emp = db.execute(text("SELECT email FROM employees WHERE id = :id"), {"id": rep_data['reported_by']}).first()
        if emp and emp.email:
            emp_subject = f"[QITS Ticket {rep_id}] Ticket Submitted Successfully ({notif_title})"
            emp_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="margin:0;">Quadrant IT Support Desk</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                  <h3 style="color: #16a34a;">Ticket Submission Received</h3>
                  <p>Hello {operator_name},</p>
                  <p>Your ticket request (Ticket ID: <strong>{rep_id}</strong>) has been successfully logged. Our IT Support team has been notified and will review your request shortly.</p>
                  <p><strong>Ticket Category:</strong> {notif_title}</p>
                  <p><strong>Summary / Requested Item:</strong> {rep_data['issue']}</p>
                  <p><strong>Priority:</strong> {rep_data.get('priority', 'Medium')}</p>
                  <p><strong>Description:</strong> {rep_data.get('description', 'N/A')}</p>
                  <p><strong>Status:</strong> In Progress / Awaiting Review</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #64748b;">Quadrant IT Services Asset Management System</p>
                </div>
              </body>
            </html>
            """
            send_email_async(emp.email, emp_subject, emp_body)
    except Exception as email_err:
        print(f"[Email Dispatch Warning] {email_err}")

    return get_repair_by_id(db, rep_id)

def add_repair_update_service(db: Session, rep_id: str, status: str, message: str, operator_name: str):
    repair = get_repair_by_id(db, rep_id)
    if not repair:
        return False
        
    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    
    # Insert update
    db.execute(text("""
        INSERT INTO repair_updates (repair_id, date, message)
        VALUES (:rep_id, :date, :message)
    """), {
        "rep_id": rep_id,
        "date": now_str,
        "message": message
    })
    
    # Update status
    db.execute(text("UPDATE repairs SET status = :status WHERE id = :id"), {"status": status, "id": rep_id})
    
    # If completed or cancelled, restore appropriate asset status
    if status in ["Completed", "Cancelled", "Resolved"]:
        if repair.asset_id:
            asset_row = db.execute(text("SELECT assigned_to FROM assets WHERE id = :asset_id"), {"asset_id": repair.asset_id}).first()
            if asset_row and asset_row.assigned_to:
                db.execute(text("UPDATE assets SET status = 'Assigned' WHERE id = :asset_id"), {"asset_id": repair.asset_id})
            else:
                db.execute(text("UPDATE assets SET status = 'Available' WHERE id = :asset_id"), {"asset_id": repair.asset_id})
        log_activity(db, operator_name, f"Resolve/Cancel Repair", f"Status of repair request {rep_id} set to {status}")
    else:
        log_activity(db, operator_name, "Update Repair", f"Updated repair status of {rep_id} to {status}")
        
    db.commit()
    if repair:
        if repair.reported_by and operator_name != repair.reported_by:
            create_notification(
                db,
                f"Update on Repair Ticket {rep_id}",
                f"Status: {status}. {message}",
                "info" if status != "Completed" else "success",
                repair.reported_by
            )
        else:
            create_notification(
                db,
                f"New Message on Repair Ticket {rep_id}",
                f"Update from {operator_name} on Ticket {rep_id}: '{message}'",
                "info",
                None
            )
    return True

def accept_repair_service(db: Session, rep_id: str, admin_name: str):
    repair = get_repair_by_id(db, rep_id)
    if not repair:
        return False
        
    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    
    db.execute(text("""
        UPDATE repairs 
        SET accepted_by = :admin, accepted_date = :adate, assigned_to = :admin, status = 'In Progress'
        WHERE id = :id
    """), {
        "admin": admin_name,
        "adate": now_str,
        "id": rep_id
    })
    
    db.execute(text("""
        INSERT INTO repair_updates (repair_id, date, message)
        VALUES (:rep_id, :date, :message)
    """), {
        "rep_id": rep_id,
        "date": now_str,
        "message": f"Accepted by {admin_name} and assigned for resolution."
    })
    
    if repair.asset_id:
        db.execute(text("UPDATE assets SET status = 'Under Repair' WHERE id = :asset_id"), {"asset_id": repair.asset_id})
    
    db.commit()
    log_activity(db, admin_name, "Accept Repair", f"Admin {admin_name} accepted repair ticket {rep_id}")
    if repair and repair.reported_by:
        create_notification(
            db,
            f"Repair Ticket {rep_id} Accepted",
            f"Your repair ticket for asset {repair.asset_id or 'General Request'} has been accepted by {admin_name}.",
            "info",
            repair.reported_by
        )
    return True

def reject_repair_service(db: Session, rep_id: str, admin_name: str):
    repair = get_repair_by_id(db, rep_id)
    if not repair:
        return False
        
    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    
    db.execute(text("UPDATE repairs SET status = 'Cancelled' WHERE id = :id"), {"id": rep_id})
    
    db.execute(text("""
        INSERT INTO repair_updates (repair_id, date, message)
        VALUES (:rep_id, :date, :message)
    """), {
        "rep_id": rep_id,
        "date": now_str,
        "message": f"Rejected / Cancelled by {admin_name}."
    })
    
    if repair.asset_id:
        asset_row = db.execute(text("SELECT assigned_to FROM assets WHERE id = :asset_id"), {"asset_id": repair.asset_id}).first()
        if asset_row and asset_row.assigned_to:
            db.execute(text("UPDATE assets SET status = 'Assigned' WHERE id = :asset_id"), {"asset_id": repair.asset_id})
        else:
            db.execute(text("UPDATE assets SET status = 'Available' WHERE id = :asset_id"), {"asset_id": repair.asset_id})
    
    db.commit()
    log_activity(db, admin_name, "Reject Repair", f"Admin {admin_name} rejected repair ticket {rep_id}")
    if repair and repair.reported_by:
        create_notification(
            db,
            f"Repair Ticket {rep_id} Cancelled",
            f"Your repair ticket for asset {repair.asset_id or 'General Request'} has been cancelled by {admin_name}.",
            "danger",
            repair.reported_by
        )
    return True


# --- ANNOUNCEMENT SERVICES ---

def cleanup_expired_records(db: Session):
    """
    Automatically purges records older than 7 days:
    1. Announcements auto-delete after 7 days
    2. Notifications expire after 7 days
    """
    now = datetime.now()
    cutoff = now - timedelta(days=7)
    
    # 1. Purge announcements older than 7 days
    try:
        db.execute(text("DELETE FROM announcements WHERE created_at IS NOT NULL AND created_at < :cutoff"), {"cutoff": cutoff})
        
        # Check any announcement records where created_at is null using date string
        all_ann = db.execute(text("SELECT id, date FROM announcements WHERE created_at IS NULL")).fetchall()
        for ann_id, ann_date_str in all_ann:
            if ann_date_str:
                try:
                    ann_dt = datetime.strptime(ann_date_str.strip(), "%d %b %Y")
                    if (now - ann_dt).days >= 7:
                        db.execute(text("DELETE FROM announcements WHERE id = :id"), {"id": ann_id})
                except Exception:
                    pass
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Cleanup Warning] Failed to cleanup expired announcements: {e}")

    # 2. Purge notifications older than 7 days
    try:
        db.execute(text("DELETE FROM notifications WHERE created_at IS NOT NULL AND created_at < :cutoff"), {"cutoff": cutoff})
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Cleanup Warning] Failed to cleanup expired notifications: {e}")


def get_announcements(db: Session):
    cleanup_expired_records(db)
    return db.execute(text("SELECT * FROM announcements ORDER BY id DESC")).all()

def create_announcement(db: Session, ann_data: dict, operator_name: str):
    cleanup_expired_records(db)
    count = db.execute(text("SELECT COUNT(*) FROM announcements")).scalar() or 0
    n = count + 1
    while True:
        ann_id = f"ANN{str(n).zfill(3)}"
        exists = db.execute(text("SELECT id FROM announcements WHERE id = :id"), {"id": ann_id}).first()
        if not exists:
            break
        n += 1
    now_date = datetime.now().strftime("%d %b %Y")
    
    query = text("""
        INSERT INTO announcements (id, title, message, date, author, type, priority, created_at)
        VALUES (:id, :title, :message, :date, :author, :type, :priority, :created_at)
    """)
    db.execute(query, {
        "id": ann_id,
        "title": ann_data["title"],
        "message": ann_data["message"],
        "date": now_date,
        "author": operator_name,
        "type": ann_data.get("type") or "General",
        "priority": ann_data.get("priority") or "Medium",
        "created_at": datetime.now()
    })
    db.commit()
    log_activity(db, operator_name, "Post Announcement", f"Admin posted announcement: \"{ann_data['title']}\"")
    return db.execute(text("SELECT * FROM announcements WHERE id = :id"), {"id": ann_id}).first()

def delete_announcement(db: Session, ann_id: str, operator_name: str):
    ann = db.execute(text("SELECT * FROM announcements WHERE id = :id"), {"id": ann_id}).first()
    if ann:
        db.execute(text("DELETE FROM announcements WHERE id = :id"), {"id": ann_id})
        db.commit()
        log_activity(db, operator_name, "Delete Announcement", f"Deleted announcement: \"{ann.title}\"")
        return True
    return False


# --- GUIDELINE SERVICES ---

def get_guideline(db: Session):
    return db.execute(text("SELECT * FROM guidelines WHERE id = 'SYSTEM_GUIDELINE'")).first()

def update_guideline(db: Session, guide_data: dict, operator_name: str):
    current = get_guideline(db)
    now_date = datetime.now().strftime("%d %b %Y")
    
    sql = "UPDATE guidelines SET uploaded_date = :u_date, "
    updates = []
    params = {"u_date": now_date}
    
    for key, val in guide_data.items():
        if key in ["title", "version", "summary", "content", "file_name", "size", "download_url"]:
            updates.append(f"{key} = :{key}")
            params[key] = val
            
    sql += ", ".join(updates) + " WHERE id = 'SYSTEM_GUIDELINE'"
    db.execute(text(sql), params)
    db.commit()
    log_activity(db, operator_name, "Update Guidelines PDF", f"Admin posted updated Asset Guidelines PDF")
    return get_guideline(db)


# --- NOTIFICATION SERVICES ---

def get_notifications(db: Session, emp_id: Optional[str] = None):
    cleanup_expired_records(db)
    if emp_id is None:
        sql = "SELECT * FROM notifications WHERE employee_id IS NULL"
        params = {}
    else:
        sql = "SELECT * FROM notifications WHERE employee_id = :emp_id"
        params = {"emp_id": emp_id}
    sql += " ORDER BY created_at DESC"
    rows = db.execute(text(sql), params).mappings().all()
    result = []
    for r in rows:
        item = dict(r)
        item["time"] = format_relative_time(item.get("created_at"), item.get("time"))
        result.append(item)
    return result

def mark_notification_read(db: Session, notif_id: str):
    db.execute(text("UPDATE notifications SET `read` = TRUE WHERE id = :id"), {"id": notif_id})
    db.commit()

def mark_all_notifications_read(db: Session, emp_id: Optional[str] = None):
    if emp_id is None:
        sql = "UPDATE notifications SET `read` = TRUE WHERE employee_id IS NULL AND `read` = FALSE"
        params = {}
    else:
        sql = "UPDATE notifications SET `read` = TRUE WHERE employee_id = :emp_id AND `read` = FALSE"
        params = {"emp_id": emp_id}
    db.execute(text(sql), params)
    db.commit()


# --- ACTIVITY LOG SERVICES ---

def get_activities(db: Session, user_email: Optional[str] = None, user_name: Optional[str] = None):
    # Populate only the last 7 days of activity records from the database
    cutoff = datetime.now() - timedelta(days=7)
    sql = "SELECT * FROM activity_log WHERE (created_at >= :cutoff OR created_at IS NULL)"
    params: dict[str, Any] = {"cutoff": cutoff}
    if user_email or user_name:
        sql += " AND (`user` = :email OR `user` = :name)"
        params["email"] = user_email
        params["name"] = user_name
    sql += " ORDER BY created_at DESC"
    return db.execute(text(sql), params).all()


# --- SOFTWARE TICKET SERVICES ---

def get_software_tickets(db: Session, reported_by: Optional[str] = None):
    sql = "SELECT * FROM software_tickets"
    params = {}
    if reported_by:
        sql += " WHERE reported_by = :reported_by"
        params["reported_by"] = reported_by
    sql += " ORDER BY id DESC"
    return db.execute(text(sql), params).all()

def get_software_ticket_by_id(db: Session, ticket_id: str):
    return db.execute(text("SELECT * FROM software_tickets WHERE id = :id"), {"id": ticket_id}).first()

def get_software_ticket_updates(db: Session, ticket_id: str):
    return db.execute(text("SELECT * FROM software_ticket_updates WHERE ticket_id = :ticket_id ORDER BY id"), {"ticket_id": ticket_id}).all()

def create_software_ticket(db: Session, ticket_data: dict, operator_name: str):
    count = db.execute(text("SELECT COUNT(*) FROM software_tickets")).scalar() or 0
    n = count + 1
    while True:
        ticket_id = f"INC{str(n).zfill(4)}"
        exists = db.execute(text("SELECT id FROM software_tickets WHERE id = :id"), {"id": ticket_id}).first()
        if not exists:
            break
        n += 1
    req_date = get_ist_now().strftime("%d %b %Y, %I:%M %p")

    db.execute(text("""
        INSERT INTO software_tickets (id, reported_by, issue, description, working_mode, request_date, priority, assigned_to, status)
        VALUES (:id, :reported_by, :issue, :description, :working_mode, :request_date, :priority, :assigned_to, :status)
    """), {
        "id": ticket_id,
        "reported_by": ticket_data["reported_by"],
        "issue": ticket_data["issue"],
        "description": ticket_data.get("description") or f"Software ticket: {ticket_data['issue']}",
        "working_mode": ticket_data.get("working_mode") or "Onsite",
        "request_date": req_date,
        "priority": ticket_data.get("priority") or "Medium",
        "assigned_to": ticket_data.get("assigned_to") or "IT Support Team",
        "status": "Pending"
    })

    # First update
    db.execute(text("""
        INSERT INTO software_ticket_updates (ticket_id, date, message)
        VALUES (:ticket_id, :date, :message)
    """), {
        "ticket_id": ticket_id,
        "date": req_date,
        "message": "Software ticket created."
    })

    db.commit()
    log_activity(db, operator_name, "Create Software Ticket", f"Created software ticket {ticket_id}: '{ticket_data['issue']}'")

    create_notification(
        db,
        "New Software Ticket Raised",
        f"Software Ticket {ticket_id} raised by {operator_name}: '{ticket_data['issue']}'",
        "warning",
        None
    )

    if ticket_data.get("reported_by"):
        create_notification(
            db,
            "Software Ticket Submitted",
            f"Your software ticket {ticket_id} ('{ticket_data['issue']}') has been received by IT Support.",
            "info",
            ticket_data["reported_by"]
        )

    # Automated Email Dispatch for Software Tickets (Admins & Employee)
    try:
        from services.email_service import send_email_async
        from app.config import settings

        admin_emails = set()
        default_admin = getattr(settings, "SMTP_USER", "helloquad05@gmail.com")
        if default_admin:
            admin_emails.add(default_admin)

        try:
            admin_rows = db.execute(text("SELECT email FROM employees WHERE role = 'Admin' AND email IS NOT NULL AND email != ''")).all()
            for r in admin_rows:
                if r.email:
                    admin_emails.add(r.email)
        except Exception as e_adm:
            print(f"[create_software_ticket] Warning: Failed fetching DB admin emails: {e_adm}")

        email_subject = f"[QITS Software Ticket {ticket_id}] New Software Support Request"
        email_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin:0;">QITS Software Support Desk</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <h3 style="color: #2563eb;">New Software Ticket Raised</h3>
              <p><strong>Ticket ID:</strong> {ticket_id}</p>
              <p><strong>Raised By:</strong> {operator_name} (Employee ID: {ticket_data['reported_by']})</p>
              <p><strong>Work Mode:</strong> {ticket_data.get('working_mode', 'Onsite')}</p>
              <p><strong>Issue / Requested Software:</strong> {ticket_data['issue']}</p>
              <p><strong>Priority:</strong> {ticket_data.get('priority', 'Medium')}</p>
              <p><strong>Description / Details:</strong> {ticket_data.get('description', 'N/A')}</p>
              <p><strong>Request Date (IST):</strong> {req_date}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">This is an automated notification from Quadrant IT Services Management System.</p>
            </div>
          </body>
        </html>
        """
        for admin_email in admin_emails:
            send_email_async(admin_email, email_subject, email_body)

        # Send confirmation email to Employee if email exists
        emp = db.execute(text("SELECT email FROM employees WHERE id = :id"), {"id": ticket_data['reported_by']}).first()
        if emp and emp.email:
            emp_subject = f"[QITS Software Ticket {ticket_id}] Ticket Submitted Successfully"
            emp_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="margin:0;">Quadrant IT Support Desk</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                  <h3 style="color: #16a34a;">Software Ticket Submission Received</h3>
                  <p>Hello {operator_name},</p>
                  <p>Your software ticket request (Ticket ID: <strong>{ticket_id}</strong>) has been successfully logged. Our IT Support team has been notified and will review your request shortly.</p>
                  <p><strong>Ticket Category:</strong> Software Support / License Request</p>
                  <p><strong>Work Mode:</strong> {ticket_data.get('working_mode', 'Onsite')}</p>
                  <p><strong>Summary / Requested Item:</strong> {ticket_data['issue']}</p>
                  <p><strong>Priority:</strong> {ticket_data.get('priority', 'Medium')}</p>
                  <p><strong>Description:</strong> {ticket_data.get('description', 'N/A')}</p>
                  <p><strong>Status:</strong> Pending / In Progress</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #64748b;">Quadrant IT Services Asset & Software Management System</p>
                </div>
              </body>
            </html>
            """
            send_email_async(emp.email, emp_subject, emp_body)
    except Exception as email_err:
        print(f"[create_software_ticket] Email Dispatch Warning: {email_err}")

    return get_software_ticket_by_id(db, ticket_id)

def add_software_ticket_update_service(db: Session, ticket_id: str, status: Optional[str], message: str, operator_name: str) -> bool:
    ticket = get_software_ticket_by_id(db, ticket_id)
    if not ticket:
        return False
    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    db.execute(text("""
        INSERT INTO software_ticket_updates (ticket_id, date, message)
        VALUES (:ticket_id, :date, :message)
    """), {
        "ticket_id": ticket_id,
        "date": now_str,
        "message": f"[{operator_name}] {message}"
    })
    if status:
        db.execute(text("UPDATE software_tickets SET status = :status WHERE id = :id"), {"status": status, "id": ticket_id})
    db.commit()
    log_activity(db, operator_name, "Update Software Ticket", f"Added update to software ticket {ticket_id}")

    if ticket:
        if ticket.reported_by and operator_name != ticket.reported_by:
            create_notification(
                db,
                f"Update on Software Ticket {ticket_id}",
                f"Status: {status or ticket.status}. {message}",
                "info" if status != "Completed" and status != "Resolved" else "success",
                ticket.reported_by
            )
        else:
            create_notification(
                db,
                f"New Message on Software Ticket {ticket_id}",
                f"Update from {operator_name} on Ticket {ticket_id}: '{message}'",
                "info",
                None
            )

    try:
        from services.email_service import send_email_async
        emp = db.execute(text("SELECT email, name FROM employees WHERE id = :id"), {"id": ticket.reported_by}).first()
        if emp and emp.email:
            send_email_async(
                emp.email,
                f"[QITS Software Ticket {ticket_id}] Update Notification",
                f"""
                <html>
                  <body style="font-family: Arial, sans-serif; color: #333;">
                    <h3>Software Ticket Update ({ticket_id})</h3>
                    <p>Hello {emp.name or 'Employee'},</p>
                    <p>Your software ticket <strong>{ticket_id}</strong> has a new update:</p>
                    <p><strong>Update Message:</strong> {message}</p>
                    <p><strong>Status:</strong> {status or ticket.status}</p>
                    <hr />
                    <p style="font-size: 12px; color: #64748b;">Quadrant IT Services Support Team</p>
                  </body>
                </html>
                """
            )
    except Exception as e_em:
        print(f"[add_software_ticket_update_service] Email Warning: {e_em}")

    return True

def accept_software_ticket_service(db: Session, ticket_id: str, operator_name: str) -> bool:
    ticket = get_software_ticket_by_id(db, ticket_id)
    if not ticket:
        return False
    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    db.execute(text("""
        UPDATE software_tickets 
        SET status = 'In Progress', accepted_by = :accepted_by, accepted_date = :accepted_date 
        WHERE id = :id
    """), {
        "accepted_by": operator_name,
        "accepted_date": now_str,
        "id": ticket_id
    })
    db.execute(text("""
        INSERT INTO software_ticket_updates (ticket_id, date, message)
        VALUES (:ticket_id, :date, :message)
    """), {
        "ticket_id": ticket_id,
        "date": now_str,
        "message": f"Ticket accepted by {operator_name}. Status changed to In Progress."
    })
    db.commit()
    log_activity(db, operator_name, "Accept Software Ticket", f"Accepted software ticket {ticket_id}")

    if ticket and ticket.reported_by:
        create_notification(
            db,
            f"Software Ticket {ticket_id} Accepted",
            f"Your software ticket has been accepted by {operator_name} and is in progress.",
            "info",
            ticket.reported_by
        )

    try:
        from services.email_service import send_email_async
        emp = db.execute(text("SELECT email, name FROM employees WHERE id = :id"), {"id": ticket.reported_by}).first()
        if emp and emp.email:
            send_email_async(
                emp.email,
                f"[QITS Software Ticket {ticket_id}] Ticket Accepted",
                f"""
                <html>
                  <body style="font-family: Arial, sans-serif; color: #333;">
                    <h3>Software Ticket Accepted ({ticket_id})</h3>
                    <p>Hello {emp.name or 'Employee'},</p>
                    <p>Your software ticket <strong>{ticket_id}</strong> has been accepted by admin <strong>{operator_name}</strong>.</p>
                    <p><strong>Status:</strong> In Progress</p>
                    <hr />
                    <p style="font-size: 12px; color: #64748b;">Quadrant IT Services Support Team</p>
                  </body>
                </html>
                """
            )
    except Exception as e_em:
        print(f"[accept_software_ticket_service] Email Warning: {e_em}")

    return True

def reject_software_ticket_service(db: Session, ticket_id: str, operator_name: str) -> bool:
    ticket = get_software_ticket_by_id(db, ticket_id)
    if not ticket:
        return False
    now_str = get_ist_now().strftime("%d %b %Y, %I:%M %p")
    db.execute(text("""
        UPDATE software_tickets 
        SET status = 'Cancelled', accepted_by = :accepted_by, accepted_date = :accepted_date 
        WHERE id = :id
    """), {
        "accepted_by": operator_name,
        "accepted_date": now_str,
        "id": ticket_id
    })
    db.execute(text("""
        INSERT INTO software_ticket_updates (ticket_id, date, message)
        VALUES (:ticket_id, :date, :message)
    """), {
        "ticket_id": ticket_id,
        "date": now_str,
        "message": f"Ticket cancelled/rejected by {operator_name}."
    })
    db.commit()
    log_activity(db, operator_name, "Reject Software Ticket", f"Rejected software ticket {ticket_id}")

    if ticket and ticket.reported_by:
        create_notification(
            db,
            f"Software Ticket {ticket_id} Cancelled",
            f"Your software ticket has been cancelled by {operator_name}.",
            "danger",
            ticket.reported_by
        )

    try:
        from services.email_service import send_email_async
        emp = db.execute(text("SELECT email, name FROM employees WHERE id = :id"), {"id": ticket.reported_by}).first()
        if emp and emp.email:
            send_email_async(
                emp.email,
                f"[QITS Software Ticket {ticket_id}] Ticket Cancelled",
                f"""
                <html>
                  <body style="font-family: Arial, sans-serif; color: #333;">
                    <h3>Software Ticket Cancelled ({ticket_id})</h3>
                    <p>Hello {emp.name or 'Employee'},</p>
                    <p>Your software ticket <strong>{ticket_id}</strong> has been cancelled by admin <strong>{operator_name}</strong>.</p>
                    <p><strong>Status:</strong> Cancelled</p>
                    <hr />
                    <p style="font-size: 12px; color: #64748b;">Quadrant IT Services Support Team</p>
                  </body>
                </html>
                """
            )
    except Exception as e_em:
        print(f"[reject_software_ticket_service] Email Warning: {e_em}")

    return True
