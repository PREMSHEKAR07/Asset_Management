from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from schemas import ActivityLogOut, ActivityLogCreate
from routers.auth import get_current_user
from services import get_activities, log_activity

router = APIRouter(prefix="/api/activity", tags=["activity"])

@router.get("", response_model=List[ActivityLogOut])
def list_activities(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "Admin":
        return get_activities(db)
    else:
        # Non-admins get logs where user = their name or email/username
        return get_activities(db, current_user.email, current_user.name)

@router.post("")
def add_activity(
    payload: ActivityLogCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log_activity(db, current_user.name, payload.activity, payload.details)
    return {"message": "Activity logged successfully"}

