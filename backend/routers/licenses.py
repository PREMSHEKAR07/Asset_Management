from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from schemas import (
    LicenseCreate, LicenseUpdate, LicenseOut, LicenseRenewRequest,
    LicenseCancelRequest, LicenseAssignRequest
)
from routers.auth import get_current_user, require_admin
from services import (
    get_licenses, get_license_by_id, create_license, update_license, delete_license,
    assign_employees_to_license, unassign_employee_from_license,
    get_admin_emails, send_email_async, create_notification, log_activity,
    send_license_alert_to_all_admins, check_and_trigger_all_license_expiry_alerts
)
from typing import Optional

router = APIRouter(prefix="/api/licenses", tags=["licenses"])

@router.get("", response_model=List[LicenseOut])
def list_licenses(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_licenses(db)

@router.get("/{id}", response_model=LicenseOut)
def get_single_license(id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    lic = get_license_by_id(db, id)
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
    return lic

@router.post("", response_model=LicenseOut)
def add_license(
    payload: LicenseCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if payload.id:
        existing = get_license_by_id(db, payload.id)
        if existing:
            raise HTTPException(status_code=400, detail="License ID already exists")
            
    return create_license(db, payload.model_dump(), current_user.name)

@router.put("/{id}", response_model=LicenseOut)
def edit_license(
    id: str,
    payload: LicenseUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = get_license_by_id(db, id)
    if not existing:
        raise HTTPException(status_code=404, detail="License not found")
        
    return update_license(db, id, payload.model_dump(exclude_unset=True), current_user.name)

@router.post("/{id}/assign", response_model=LicenseOut)
def assign_license_employees_route(
    id: str,
    payload: LicenseAssignRequest,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    lic = get_license_by_id(db, id)
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
    return assign_employees_to_license(db, id, payload.employee_ids, current_user.name)

@router.delete("/{id}/unassign/{employee_id}", response_model=LicenseOut)
def unassign_license_employee_route(
    id: str,
    employee_id: str,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    lic = get_license_by_id(db, id)
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
    return unassign_employee_from_license(db, id, employee_id, current_user.name)

@router.post("/{id}/renew", response_model=LicenseOut)
def renew_license_route(
    id: str,
    payload: LicenseRenewRequest,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    lic = get_license_by_id(db, id)
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
    
    prev_end_date = lic.get("end_date") or ""
    update_data = {
        "end_date": payload.end_date,
        "status": "Available"
    }
    if payload.start_date:
        update_data["start_date"] = payload.start_date
    if payload.alert_days_before is not None:
        update_data["alert_days_before"] = payload.alert_days_before
    if payload.vendor:
        update_data["vendor"] = payload.vendor
    if payload.cost:
        update_data["cost"] = payload.cost
    if payload.seats is not None:
        update_data["seats"] = payload.seats
        
    updated = update_license(db, id, update_data, current_user.name)
    
    # Log renewal activity & notification
    details_msg = f"Renewed license '{lic.get('name')}' until {payload.end_date} (Previous End Date: {prev_end_date})."
    create_notification(db, "License Renewed", details_msg, "success")
    log_activity(db, current_user.name, "Renew License", details_msg)
    
    return updated

@router.post("/{id}/cancel", response_model=LicenseOut)
def cancel_license_route(
    id: str,
    payload: Optional[LicenseCancelRequest] = None,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    lic = get_license_by_id(db, id)
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
        
    reason = (payload.reason if payload and payload.reason else "Deactivated by administrator").strip()
    updated = update_license(db, id, {"status": "Deactivated"}, current_user.name)
    
    # Log deactivation activity & notification
    details_msg = f"Deactivated software subscription '{lic.get('name')}'. Reason: {reason}"
    create_notification(db, "License Deactivated", details_msg, "warning")
    log_activity(db, current_user.name, "Deactivate License", details_msg)
    
    return updated

@router.delete("/{id}")
def remove_license(id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    success = delete_license(db, id, current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="License not found")
    return {"message": "License deleted successfully"}

@router.post("/bulk-import")
def bulk_import_licenses(
    payload: List[LicenseCreate],
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    success_count = 0
    failed_rows = []
    
    existing_ids = {str(r[0]).upper() for r in db.execute(text("SELECT id FROM licenses")).all() if r[0]}
    
    for idx, lic_schema in enumerate(payload):
        try:
            lic_data = lic_schema.model_dump()
            if lic_schema.id:
                lid_upper = lic_schema.id.upper().strip()
                if lid_upper in existing_ids:
                    failed_rows.append({"row": idx + 2, "reason": f"License ID '{lic_schema.id}' already exists."})
                    continue
                existing_ids.add(lid_upper)
            
            create_license(db, lic_data, current_user.name)
            success_count += 1
        except Exception as e:
            failed_rows.append({"row": idx + 2, "reason": f"Error inserting record: {str(e)}"})
            
    create_notification(
        db,
        "License Batch Import",
        f"Import completed: {success_count} subscription(s) imported successfully ({len(failed_rows)} failed).",
        "success" if success_count > 0 else "error"
    )
    log_activity(
        db,
        current_user.name,
        "Import Licenses",
        f"Bulk imported {success_count} software subscriptions via Excel upload."
    )
    return {
        "success": True,
        "message": f"Successfully imported {success_count} license subscriptions.",
        "imported_count": success_count,
        "failed_count": len(failed_rows),
        "failed_rows": failed_rows
    }

@router.post("/check-expiry")
def run_license_expiry_check(current_user = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Admin-only endpoint to trigger a scan of all software licenses and send alerts according to the 10-day & 5-day rules.
    """
    results = check_and_trigger_all_license_expiry_alerts(db, force_all=False)
    return {
        "message": f"License expiry scan completed successfully. {len(results)} alert(s) triggered.",
        "triggered_count": len(results),
        "details": results
    }

@router.post("/{id}/alert")
def trigger_alert(id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    from models.license import License as LicenseModel
    lic = db.query(LicenseModel).filter(LicenseModel.id == id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
        
    res = send_license_alert_to_all_admins(
        db=db,
        lic=lic,
        is_automated=False,
        operator_name=current_user.name
    )
    return res

