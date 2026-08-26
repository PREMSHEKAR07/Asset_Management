from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from schemas import NotificationOut
from routers.auth import get_current_user
from services import get_notifications, mark_notification_read, mark_all_notifications_read

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationOut])
def list_notifications(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # Non-admins get broadcast notifications + their specific notifications
    emp_id = None if current_user.role == "Admin" else current_user.id
    return get_notifications(db, emp_id)

@router.put("/{id}/read")
def read_notification(id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    mark_notification_read(db, id)
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def read_all_notifications(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    emp_id = None if current_user.role == "Admin" else current_user.id
    mark_all_notifications_read(db, emp_id)
    return {"message": "All notifications marked as read"}
