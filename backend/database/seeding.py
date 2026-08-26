import os
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from database.connection import Base, engine
from services.auth_service import get_password_hash

def seed_database(db: Session):
    # 1. Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    print("Verifying database core schema and initial setup...")
    
    # 2. Seed Guidelines (Singleton)
    try:
        guidelines_count = db.execute(text("SELECT COUNT(*) FROM guidelines")).scalar()
        if guidelines_count == 0:
            db.execute(text("""
                INSERT INTO guidelines (id, title, version, uploaded_date, size, file_name, summary, content, download_url)
                VALUES ('SYSTEM_GUIDELINE', 'Quadrant IT Services - Asset Policy & Usage Guidelines 2026', 'v2.4', '20 Jul 2026', '2.4 MB', 'Quadrant_IT_Asset_Policy_2026.pdf', 'Official company policy guidelines governing hardware usage, security protocols, return policies, and maintenance procedures.', '1. All assigned hardware assets remain the property of Quadrant IT Services.\n2. Employees are responsible for physical care and security of assigned laptops, monitors, and peripherals.\n3. Any hardware fault or damage must be reported immediately via the Raise Ticket portal.\n4. Assets must be returned intact upon offboarding or department transfer.', '#')
            """))
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Guidelines check warning: {e}")

    # 3. Seed Core System Categories if table is empty
    try:
        categories_count = db.execute(text("SELECT COUNT(*) FROM categories")).scalar()
        if categories_count == 0:
            initial_categories = [
              { "id": 'CAT001', "name": 'Laptop', "description": 'Portable computer devices assigned to individual employees for daily work', "icon_name": 'Laptop', "group": 'IT', "scope": 'Employee', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT002', "name": 'Monitor', "description": 'External high-res display screens for desktop setups and workstations', "icon_name": 'Monitor', "group": 'IT', "scope": 'Organization', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT003', "name": 'Mouse', "description": 'Wireless and optical ergonomic pointing devices for workers', "icon_name": 'Mouse', "group": 'IT', "scope": 'Employee', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT004', "name": 'Keyboard', "description": 'Mechanical and membrane keyboards assigned to employees', "icon_name": 'Keyboard', "group": 'IT', "scope": 'Employee', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT005', "name": 'Headphones', "description": 'Audio headsets and noise-cancelling headphones for workers', "icon_name": 'Headphones', "group": 'IT', "scope": 'Employee', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT006', "name": 'Printer', "description": 'Shared department laser printers and corporate office hardware', "icon_name": 'Printer', "group": 'IT', "scope": 'Organization', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT007', "name": 'Cpu', "description": 'Central processing units, servers, and corporate IT workstations', "icon_name": 'Cpu', "group": 'IT', "scope": 'Organization', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT008', "name": 'Chairs', "description": 'Ergonomic mesh office chairs and executive seating', "icon_name": 'Briefcase', "group": 'Non-IT', "scope": 'Organization', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT009', "name": 'Tables', "description": 'Modular office desks, conference and standing tables', "icon_name": 'Grid', "group": 'Non-IT', "scope": 'Organization', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT010', "name": 'Whiteboards', "description": 'Magnetic dry-erase boards and presentation panels', "icon_name": 'Grid', "group": 'Non-IT', "scope": 'Organization', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT011', "name": 'Storage Cabinets', "description": 'Filing cabinets, lockers and pedestal drawers', "icon_name": 'Box', "group": 'Non-IT', "scope": 'Organization', "owner_entity": 'Quadrant IT Services Asset' },
              { "id": 'CAT012', "name": 'DSV Laptop', "description": 'DSV Logistics client hardware & laptops', "icon_name": 'Laptop', "group": 'IT', "scope": 'Employee', "owner_entity": 'DSV Asset' },
              { "id": 'CAT013', "name": 'DSV Barcode Scanner', "description": 'DSV Warehouse hand-held inventory scanners', "icon_name": 'Cpu', "group": 'IT', "scope": 'Organization', "owner_entity": 'DSV Asset' },
              { "id": 'CAT014', "name": 'DSV Pallet Rack', "description": 'DSV Industrial storage racking systems', "icon_name": 'Box', "group": 'Non-IT', "scope": 'Organization', "owner_entity": 'DSV Asset' },
              { "id": 'CAT015', "name": 'DHL Laptop', "description": 'DHL Logistics client hardware & laptops', "icon_name": 'Laptop', "group": 'IT', "scope": 'Employee', "owner_entity": 'DHL Asset' },
              { "id": 'CAT016', "name": 'DHL Barcode Scanner', "description": 'DHL Warehouse hand-held inventory scanners', "icon_name": 'Cpu', "group": 'IT', "scope": 'Organization', "owner_entity": 'DHL Asset' },
              { "id": 'CAT017', "name": 'DHL Pallet Rack', "description": 'DHL Industrial storage racking systems', "icon_name": 'Box', "group": 'Non-IT', "scope": 'Organization', "owner_entity": 'DHL Asset' }
            ]
            from models.category import Category
            for cat in initial_categories:
                try:
                    existing = db.query(Category).filter(Category.id == cat["id"]).first()
                    if not existing:
                        db.add(Category(**cat))
                        db.commit()
                except Exception:
                    db.rollback()
    except Exception as e:
        db.rollback()
        print(f"Categories check warning: {e}")

    # 4. Ensure default Admin account exists with required credentials
    try:
        admin_email = "qitsassetadmin@quadrantitservices.com"
        admin_pwd_hash = get_password_hash("@Qitsassetpassword##123")
        existing_admin = db.execute(
            text("SELECT id FROM employees WHERE LOWER(TRIM(email)) = :email"),
            {"email": admin_email.lower()}
        ).first()

        if not existing_admin:
            # Check if QADM001 or username already exists
            existing_id = db.execute(text("SELECT id FROM employees WHERE id = 'QADM001'")).first()
            admin_id = 'QADM001' if not existing_id else f"QADM{int(datetime.now().timestamp()) % 10000:04d}"

            db.execute(text("""
                INSERT INTO employees (id, name, department, designation, email, username, phone, status, role, avatar, joining_date, location, password_hash)
                VALUES (
                    :id,
                    'QITS Asset Admin',
                    'IT Department',
                    'System Administrator',
                    :email,
                    'qitsassetadmin',
                    '+91 98765 43210',
                    'Active',
                    'Admin',
                    NULL,
                    '15 Jan 2022',
                    'Hyderabad, India',
                    :pwd
                )
            """), {"id": admin_id, "email": admin_email, "pwd": admin_pwd_hash})
            db.commit()
            print(f"Seeded default admin account (email: {admin_email}, username: qitsassetadmin).")
        else:
            # Ensure password hash, role, and active status are up to date
            db.execute(text("""
                UPDATE employees 
                SET password_hash = :pwd, role = 'Admin', status = 'Active' 
                WHERE LOWER(TRIM(email)) = :email
            """), {"email": admin_email.lower(), "pwd": admin_pwd_hash})
            db.commit()
            print(f"Verified and updated default admin account credentials for {admin_email}.")
    except Exception as e:
        db.rollback()
        print(f"Admin account verification warning: {e}")

    # 5. Ensure default Demo Employee account exists
    try:
        emp_email = "employee@quadrantitservices.com"
        emp_pwd_hash = get_password_hash("Employee@123")
        existing_emp = db.execute(
            text("SELECT id FROM employees WHERE LOWER(TRIM(email)) = :email"),
            {"email": emp_email.lower()}
        ).first()

        if not existing_emp:
            db.execute(text("""
                INSERT INTO employees (id, name, department, designation, email, username, phone, status, role, avatar, joining_date, location, password_hash)
                VALUES (
                    'EMP001',
                    'John Doe',
                    'Engineering',
                    'Software Engineer',
                    :email,
                    'johndoe',
                    '+91 98765 12345',
                    'Active',
                    'Employee',
                    NULL,
                    '01 Feb 2024',
                    'Hyderabad, India',
                    :pwd
                )
            """), {"email": emp_email, "pwd": emp_pwd_hash})
            db.commit()
            print(f"Seeded default demo employee account ({emp_email}).")
    except Exception as e:
        db.rollback()
        print(f"Employee account verification warning: {e}")

    # 6. Seed Core System Departments if table is empty
    try:
        departments_count = db.execute(text("SELECT COUNT(*) FROM departments")).scalar()
        if departments_count == 0:
            initial_departments = [
                {"id": "DEP001", "name": "IT"},
                {"id": "DEP002", "name": "HR"},
                {"id": "DEP003", "name": "Marketing"},
                {"id": "DEP004", "name": "Sales"},
                {"id": "DEP005", "name": "Finance"},
                {"id": "DEP006", "name": "Engineering"},
                {"id": "DEP007", "name": "Information Technology"}
            ]
            from models.department import Department
            for dept in initial_departments:
                try:
                    existing = db.query(Department).filter(Department.name == dept["name"]).first()
                    if not existing:
                        db.add(Department(id=dept["id"], name=dept["name"], created_by="System"))
                        db.commit()
                except Exception:
                    db.rollback()
    except Exception as e:
        db.rollback()
        print(f"Departments check warning: {e}")

    print("Database verification complete.")

