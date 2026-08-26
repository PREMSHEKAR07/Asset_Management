from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from schemas import SoftwareTicketCreate, SoftwareTicketUpdateSchema, SoftwareTicketOut
from routers.auth import get_current_user, require_admin
from services import (
    get_software_tickets, get_software_ticket_by_id, get_software_ticket_updates,
    create_software_ticket, add_software_ticket_update_service,
    accept_software_ticket_service, reject_software_ticket_service
)

router = APIRouter(prefix="/api/software-tickets", tags=["software-tickets"])

@router.get("", response_model=List[SoftwareTicketOut])
def list_software_tickets(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # If not Admin, filter by reported_by
    reported_by = None if current_user.role == "Admin" else current_user.id
    tickets = get_software_tickets(db, reported_by)
    
    results = []
    for t in tickets:
        updates = get_software_ticket_updates(db, t.id)
        results.append({
            "id": t.id,
            "reported_by": t.reported_by,
            "issue": t.issue,
            "description": t.description,
            "working_mode": getattr(t, "working_mode", "Onsite") or "Onsite",
            "request_date": t.request_date,
            "priority": t.priority,
            "assigned_to": t.assigned_to,
            "status": t.status,
            "accepted_by": t.accepted_by,
            "accepted_date": t.accepted_date,
            "updates": updates,
            "created_at": t.created_at
        })
    return results

@router.get("/{id}", response_model=SoftwareTicketOut)
def get_software_ticket(id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = get_software_ticket_by_id(db, id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Software ticket not found")
        
    if current_user.role != "Admin" and ticket.reported_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
        
    updates = get_software_ticket_updates(db, id)
    return {
        "id": ticket.id,
        "reported_by": ticket.reported_by,
        "issue": ticket.issue,
        "description": ticket.description,
        "working_mode": getattr(ticket, "working_mode", "Onsite") or "Onsite",
        "request_date": ticket.request_date,
        "priority": ticket.priority,
        "assigned_to": ticket.assigned_to,
        "status": ticket.status,
        "accepted_by": ticket.accepted_by,
        "accepted_date": ticket.accepted_date,
        "updates": updates,
        "created_at": ticket.created_at
    }

@router.post("", response_model=SoftwareTicketOut)
def add_software_ticket(
    payload: SoftwareTicketCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "Admin" and payload.reported_by != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot file software ticket on behalf of another employee")
        
    t = create_software_ticket(db, payload.model_dump(), current_user.name)
    if not t:
        raise HTTPException(status_code=400, detail="Failed to create software ticket")
    updates = get_software_ticket_updates(db, t.id)
    return {
        "id": t.id,
        "reported_by": t.reported_by,
        "issue": t.issue,
        "description": t.description,
        "working_mode": getattr(t, "working_mode", "Onsite") or "Onsite",
        "request_date": t.request_date,
        "priority": t.priority,
        "assigned_to": t.assigned_to,
        "status": t.status,
        "accepted_by": t.accepted_by,
        "accepted_date": t.accepted_date,
        "updates": updates,
        "created_at": t.created_at
    }

@router.post("/{id}/updates")
def add_update(
    id: str,
    payload: SoftwareTicketUpdateSchema,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = get_software_ticket_by_id(db, id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Software ticket not found")
        
    if current_user.role != "Admin" and ticket.reported_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this ticket")
        
    success = add_software_ticket_update_service(db, id, payload.status, payload.message, current_user.name)
    if not success:
        raise HTTPException(status_code=500, detail="Update failed")
    return {"message": "Update added successfully"}

@router.post("/{id}/accept")
def accept_software_ticket(id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    success = accept_software_ticket_service(db, id, f"{current_user.name} (Admin)")
    if not success:
        raise HTTPException(status_code=404, detail="Software ticket not found")
    return {"message": "Software ticket accepted successfully"}

@router.post("/{id}/reject")
def reject_software_ticket(id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    success = reject_software_ticket_service(db, id, f"{current_user.name} (Admin)")
    if not success:
        raise HTTPException(status_code=404, detail="Software ticket not found")
    return {"message": "Software ticket cancelled successfully"}
