from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from schemas import (
    SubscriptionGroupCreate, SubscriptionGroupUpdate, SubscriptionGroupOut
)
from routers.auth import get_current_user, require_admin
from services import (
    get_subscription_groups, get_subscription_group_by_id,
    create_subscription_group, update_subscription_group, delete_subscription_group
)

router = APIRouter(prefix="/api/subscription-groups", tags=["subscription-groups"])

@router.get("", response_model=List[SubscriptionGroupOut])
def list_groups(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_subscription_groups(db)

@router.get("/{id}", response_model=SubscriptionGroupOut)
def get_group(id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    grp = get_subscription_group_by_id(db, id)
    if not grp:
        raise HTTPException(status_code=404, detail="Subscription group not found")
    return grp

@router.post("", response_model=SubscriptionGroupOut)
def add_group(
    payload: SubscriptionGroupCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Group Name is required")
    return create_subscription_group(db, payload.model_dump(), current_user.name)

@router.put("/{id}", response_model=SubscriptionGroupOut)
def edit_group(
    id: str,
    payload: SubscriptionGroupUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = get_subscription_group_by_id(db, id)
    if not existing:
        raise HTTPException(status_code=404, detail="Subscription group not found")
    return update_subscription_group(db, id, payload.model_dump(exclude_unset=True), current_user.name)

@router.delete("/{id}")
def remove_group(
    id: str,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    grp = get_subscription_group_by_id(db, id)
    if not grp:
        raise HTTPException(status_code=404, detail="Subscription group not found")
    if grp.get("plans_count", 0) > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this group while it contains subscription plans. Please remove or reassign the plans first."
        )
    success = delete_subscription_group(db, id, current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Subscription group not found")
    return {"message": "Subscription group deleted successfully"}
