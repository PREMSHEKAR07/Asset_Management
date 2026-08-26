from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas import GuidelineUpdate, GuidelineOut
from routers.auth import get_current_user, require_admin
from services import get_guideline, update_guideline

router = APIRouter(prefix="/api/guidelines", tags=["guidelines"])

@router.get("", response_model=GuidelineOut)
def read_guidelines(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    guide = get_guideline(db)
    if not guide:
        raise HTTPException(status_code=404, detail="Guidelines not found")
    return guide

@router.put("", response_model=GuidelineOut)
def edit_guidelines(
    payload: GuidelineUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return update_guideline(db, payload.model_dump(exclude_unset=True), current_user.name)
