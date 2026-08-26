from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from schemas import AnnouncementCreate, AnnouncementOut
from routers.auth import get_current_user, require_admin
from services import (
    get_announcements, create_announcement, delete_announcement
)

router = APIRouter(prefix="/api/announcements", tags=["announcements"])

@router.get("", response_model=List[AnnouncementOut])
def list_announcements(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_announcements(db)

@router.post("", response_model=AnnouncementOut)
def add_announcement(
    payload: AnnouncementCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return create_announcement(db, payload.model_dump(), current_user.name)

@router.delete("/{id}")
def remove_announcement(id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    success = delete_announcement(db, id, current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted successfully"}
