from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database.connection import get_db
from schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeBulkDeleteRequest
from routers.auth import get_current_user, require_admin
from services import (
    get_employees, get_employee_by_id, create_employee, update_employee, delete_employee, bulk_delete_employees
)

router = APIRouter(prefix="/api/employees", tags=["employees"])

@router.get("", response_model=List[EmployeeOut])
def list_employees(
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Returns list of employees
    results = get_employees(db, search, department, status)
    return results

@router.post("", response_model=EmployeeOut)
def add_employee(
    payload: EmployeeCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Check if duplicate ID or email/username
    existing = get_employee_by_id(db, payload.id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Employee ID {payload.id} already exists")
    
    from sqlalchemy import text
    email_exists = db.execute(text("SELECT id FROM employees WHERE email = :email"), {"email": payload.email}).first()
    if email_exists:
        raise HTTPException(status_code=400, detail=f"Employee email {payload.email} is already in use")
        
    if payload.username:
        user_exists = db.execute(text("SELECT id FROM employees WHERE LOWER(username) = LOWER(:u)"), {"u": payload.username.strip()}).first()
        if user_exists:
            raise HTTPException(status_code=400, detail=f"Username '{payload.username}' is already in use")
        
    return create_employee(db, payload.model_dump(), current_user.name)

@router.post("/bulk-delete")
@router.delete("/bulk-delete")
def bulk_delete_employees_route(
    payload: EmployeeBulkDeleteRequest,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    count = bulk_delete_employees(db, payload.employee_ids, current_user.name)
    return {"message": f"Successfully deleted {count} employees", "count": count}

@router.post("/bulk-import")
def bulk_import(
    payload: List[EmployeeCreate],
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    from services.auth_service import get_password_hash
    from services.db_services import log_activity
    from datetime import datetime

    success_count = 0
    failed_rows = []

    # 1. Pre-fetch existing employee IDs, emails, and usernames for fast duplicate checks
    existing_ids = {str(r[0]).upper().strip() for r in db.execute(text("SELECT id FROM employees")).all() if r[0]}
    existing_emails = {str(r[0]).lower().strip() for r in db.execute(text("SELECT email FROM employees WHERE email IS NOT NULL")).all() if r[0]}
    existing_usernames = {str(r[0]).lower().strip() for r in db.execute(text("SELECT username FROM employees WHERE username IS NOT NULL")).all() if r[0]}

    # 2. Pre-compute default password hashes once (bcrypt is slow if recomputed per row)
    cached_hashes = {
        "employee123": get_password_hash("employee123"),
        "admin123": get_password_hash("admin123")
    }

    insert_query = text("""
        INSERT INTO employees (id, name, department, designation, email, username, phone, status, role, avatar, joining_date, location, password_hash)
        VALUES (:id, :name, :department, :designation, :email, :username, :phone, :status, :role, :avatar, :joining_date, :location, :password_hash)
    """)

    for idx, emp_schema in enumerate(payload):
        try:
            eid_upper = emp_schema.id.upper().strip()
            if eid_upper in existing_ids:
                failed_rows.append({"row": idx + 2, "reason": f"Employee ID '{emp_schema.id}' already exists."})
                continue

            email_lower = (emp_schema.email or "").lower().strip()
            if email_lower and email_lower in existing_emails:
                failed_rows.append({"row": idx + 2, "reason": f"Employee with email '{emp_schema.email}' already exists."})
                continue

            emp_data = emp_schema.model_dump()
            
            # Determine username
            explicit_user = emp_data.get("username")
            if explicit_user:
                raw_username = str(explicit_user).strip()
            elif emp_data.get("email"):
                raw_username = emp_data["email"].split('@')[0].strip()
            else:
                raw_username = eid_upper.lower()

            final_username = raw_username
            user_lower = raw_username.lower()

            if user_lower in existing_usernames:
                # If username auto-derived from email clashes with an existing username, disambiguate with employee ID
                if not explicit_user:
                    candidate = f"{raw_username}_{eid_upper.lower()}"
                    if candidate.lower() not in existing_usernames:
                        final_username = candidate
                        user_lower = candidate.lower()
                    else:
                        failed_rows.append({"row": idx + 2, "reason": f"Username '{raw_username}' already exists."})
                        continue
                else:
                    failed_rows.append({"row": idx + 2, "reason": f"Username '{raw_username}' already exists."})
                    continue

            role = emp_data.get("role") or "Employee"
            default_pwd = "admin123" if str(role).strip().lower() == "admin" else "employee123"

            pwd_raw = emp_data.get("password")
            if pwd_raw and pwd_raw not in cached_hashes:
                hashed = get_password_hash(pwd_raw)
            else:
                hashed = cached_hashes.get(pwd_raw or default_pwd, cached_hashes["employee123"])

            db.execute(insert_query, {
                "id": eid_upper,
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

            existing_ids.add(eid_upper)
            if email_lower:
                existing_emails.add(email_lower)
            existing_usernames.add(user_lower)
            success_count += 1
        except Exception as e:
            db.rollback()
            err_msg = str(e)
            if "Duplicate entry" in err_msg or "1062" in err_msg:
                if "employees_username_key" in err_msg or "username" in err_msg:
                    err_msg = f"Username is already in use by another employee."
                elif "PRIMARY" in err_msg:
                    err_msg = f"Employee ID '{emp_schema.id}' already exists."
                elif "email" in err_msg:
                    err_msg = f"Employee email '{emp_schema.email}' already exists."
                else:
                    err_msg = "Duplicate record already exists in database."
            failed_rows.append({"row": idx + 2, "reason": err_msg})

    if success_count > 0:
        db.commit()
        log_activity(db, current_user.name, "Bulk Import Employees", f"Imported {success_count} employee(s)")

    return {
        "totalRows": len(payload),
        "successCount": success_count,
        "failedRows": failed_rows
    }

@router.get("/{id}", response_model=EmployeeOut)
def get_employee(id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    employee = get_employee_by_id(db, id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.put("/{id}", response_model=EmployeeOut)
def edit_employee(
    id: str,
    payload: EmployeeUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check authorization: Admin can edit anyone. Employees can only edit themselves.
    if current_user.role != "Admin" and current_user.id != id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this profile")
        
    existing = get_employee_by_id(db, id)
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return update_employee(db, id, payload.model_dump(exclude_unset=True), current_user.name)

@router.delete("/{id}")
def remove_employee(id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    success = delete_employee(db, id, current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}
