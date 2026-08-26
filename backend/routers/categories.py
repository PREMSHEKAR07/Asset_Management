from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from schemas import CategoryCreate, CategoryUpdate, CategoryOut
from routers.auth import get_current_user, require_admin
from services import (
    get_categories, create_category, update_category, delete_category
)

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("", response_model=List[CategoryOut])
def list_categories(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_categories(db)

@router.post("", response_model=CategoryOut)
def add_category(
    payload: CategoryCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    existing = db.execute(
        text("""
            SELECT id FROM categories 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(:name)) 
              AND LOWER(TRIM(owner_entity)) = LOWER(TRIM(:owner_entity))
              AND LOWER(TRIM(`group`)) = LOWER(TRIM(:group))
        """),
        {"name": payload.name, "owner_entity": payload.owner_entity, "group": payload.group}
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Category '{payload.name}' already exists in {payload.owner_entity}")
        
    return create_category(db, payload.model_dump(), current_user.name)

@router.put("/{id}", response_model=CategoryOut)
def edit_category(
    id: str,
    payload: CategoryUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    existing = db.execute(text("SELECT id, name, `group`, scope, owner_entity FROM categories WHERE id = :id"), {"id": id}).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
        
    new_name = payload.name if payload.name is not None else existing.name
    new_owner = payload.owner_entity if payload.owner_entity is not None else existing.owner_entity
    new_group = payload.group if payload.group is not None else getattr(existing, 'group', 'IT')
    
    conflict = db.execute(
        text("""
            SELECT id FROM categories 
            WHERE id != :id 
              AND LOWER(TRIM(name)) = LOWER(TRIM(:name)) 
              AND LOWER(TRIM(owner_entity)) = LOWER(TRIM(:owner_entity))
              AND LOWER(TRIM(`group`)) = LOWER(TRIM(:group))
        """),
        {"id": id, "name": new_name, "owner_entity": new_owner, "group": new_group}
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail=f"Category '{new_name}' already exists in {new_owner}")
        
    return update_category(db, id, payload.model_dump(exclude_unset=True), current_user.name)


@router.delete("/{id}")
def remove_category(id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    success = delete_category(db, id, current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}
