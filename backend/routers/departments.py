from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from database.connection import get_db
from schemas import DepartmentCreate
from routers.auth import get_current_user, require_admin
from services.db_services import log_activity
from models.department import Department

router = APIRouter(prefix="/api/departments", tags=["departments"])

def fetch_all_departments(db: Session) -> List[str]:
    # 1. Fetch from departments table
    db_dept_rows = db.execute(text("SELECT name FROM departments WHERE name IS NOT NULL ORDER BY name")).fetchall()
    table_depts = [r[0].strip() for r in db_dept_rows if r[0] and r[0].strip()]

    # 2. Fetch from employees table
    emp_dept_rows = db.execute(text("SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND TRIM(department) != ''")).fetchall()
    emp_depts = [r[0].strip() for r in emp_dept_rows if r[0] and r[0].strip()]

    # 3. Base standard departments
    standard_depts = ["IT", "HR", "Marketing", "Sales", "Finance"]

    # Combine all unique preserving case
    seen = set()
    result = []
    for d in standard_depts + table_depts + emp_depts:
        clean = d.strip()
        lower_key = clean.lower()
        if clean and lower_key not in seen:
            seen.add(lower_key)
            result.append(clean)
    return result

@router.get("", response_model=List[str])
def list_departments(db: Session = Depends(get_db)):
    """Fetch all unique departments in the system."""
    return fetch_all_departments(db)

@router.post("", response_model=List[str])
def add_department(
    payload: DepartmentCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department name cannot be empty")

    # Check if department already exists (case-insensitive)
    existing = db.execute(text("SELECT id, name FROM departments WHERE LOWER(name) = LOWER(:name)"), {"name": name}).first()
    if existing:
        return fetch_all_departments(db)

    # Generate unique ID for department
    count = db.execute(text("SELECT COUNT(*) FROM departments")).scalar() or 0
    dept_id = f"DEP{str(count + 1).zfill(3)}"
    while db.execute(text("SELECT id FROM departments WHERE id = :id"), {"id": dept_id}).first():
        count += 1
        dept_id = f"DEP{str(count + 1).zfill(3)}"

    try:
        new_dept = Department(id=dept_id, name=name, created_by=current_user.name)
        db.add(new_dept)
        db.commit()
        log_activity(db, current_user.name, "Add Department", f"Added new department: {name}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to add department: {str(e)}")

    return fetch_all_departments(db)

@router.put("/{department_name}", response_model=List[str])
def update_department(
    department_name: str,
    payload: DepartmentCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    old_name = (department_name or "").strip()
    new_name = (payload.name or "").strip()
    if not old_name or not new_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department names cannot be empty")

    try:
        # Check if department exists in departments table
        existing = db.execute(text("SELECT id FROM departments WHERE LOWER(name) = LOWER(:old_name)"), {"old_name": old_name}).first()
        if existing:
            db.execute(text("UPDATE departments SET name = :new_name WHERE id = :id"), {"new_name": new_name, "id": existing[0]})
        else:
            count = db.execute(text("SELECT COUNT(*) FROM departments")).scalar() or 0
            dept_id = f"DEP{str(count + 1).zfill(3)}"
            while db.execute(text("SELECT id FROM departments WHERE id = :id"), {"id": dept_id}).first():
                count += 1
                dept_id = f"DEP{str(count + 1).zfill(3)}"
            db.execute(text("INSERT INTO departments (id, name, created_by) VALUES (:id, :name, :created_by)"), {"id": dept_id, "name": new_name, "created_by": current_user.name})

        # Update all employees belonging to old_name
        db.execute(text("UPDATE employees SET department = :new_name WHERE LOWER(department) = LOWER(:old_name)"), {"new_name": new_name, "old_name": old_name})
        db.commit()
        log_activity(db, current_user.name, "Edit Department", f"Renamed department '{old_name}' to '{new_name}'")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update department: {str(e)}")

    return fetch_all_departments(db)

@router.delete("/{department_name}", response_model=List[str])
def delete_department(
    department_name: str,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    clean_name = (department_name or "").strip()
    if not clean_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department name cannot be empty")

    try:
        # Delete from departments table
        db.execute(text("DELETE FROM departments WHERE LOWER(name) = LOWER(:name)"), {"name": clean_name})
        # If any employees belong to this department, set them to 'Unassigned'
        db.execute(text("UPDATE employees SET department = 'Unassigned' WHERE LOWER(department) = LOWER(:name)"), {"name": clean_name})
        db.commit()
        log_activity(db, current_user.name, "Delete Department", f"Deleted department: {clean_name}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete department: {str(e)}")

    return fetch_all_departments(db)

