from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database.connection import get_db
from schemas import AssetCreate, AssetUpdate, AssetOut, AssetAssignRequest, AssetReturnRequest, AssetFullHistoryResponse, AssetAcceptRejectRequest, AssetBulkDeleteRequest
from routers.auth import get_current_user, require_admin
from services import (
    get_assets, get_asset_by_id, create_asset, update_asset, delete_asset, bulk_delete_assets,
    assign_assets_service, return_assets_service, get_asset_full_history_service,
    accept_asset_assignment_service, reject_asset_assignment_service
)

router = APIRouter(prefix="/api/assets", tags=["assets"])

@router.get("", response_model=List[AssetOut])
def list_assets(
    search: Optional[str] = None,
    type_filter: Optional[str] = None,
    scope_filter: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_assets(db, search, type_filter, scope_filter)

@router.get("/{id}/history", response_model=AssetFullHistoryResponse)
def get_asset_history_route(id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    history_data = get_asset_full_history_service(db, id)
    if not history_data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return history_data

@router.get("/{id}", response_model=AssetOut)
def get_asset(id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = get_asset_by_id(db, id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.post("", response_model=AssetOut)
def add_asset(
    payload: AssetCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = get_asset_by_id(db, payload.id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Asset ID {payload.id} already exists")
    
    # Check duplicate serial number
    from sqlalchemy import text
    serial_exists = db.execute(text("SELECT id FROM assets WHERE serial_number = :sn"), {"sn": payload.serial_number}).first()
    if serial_exists:
        raise HTTPException(status_code=400, detail=f"Asset with serial number {payload.serial_number} already exists")
        
    return create_asset(db, payload.model_dump(), current_user.name)

@router.put("/{id}", response_model=AssetOut)
def edit_asset(
    id: str,
    payload: AssetUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = get_asset_by_id(db, id)
    if not existing:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    return update_asset(db, id, payload.model_dump(exclude_unset=True), current_user.name)

@router.post("/bulk-delete")
@router.delete("/bulk-delete")
def bulk_delete_assets_route(
    payload: AssetBulkDeleteRequest,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    count = bulk_delete_assets(db, payload.asset_ids, current_user.name)
    return {"message": f"Successfully deleted {count} assets", "count": count}

@router.delete("/{id}")
def remove_asset(id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    success = delete_asset(db, id, current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted successfully"}

@router.post("/assign")
def assign_assets(
    payload: AssetAssignRequest,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    success = assign_assets_service(
        db, 
        payload.employee_id, 
        payload.asset_ids, 
        payload.assign_date, 
        payload.remarks, 
        current_user.name
    )
    if not success:
        raise HTTPException(status_code=400, detail="Assignment failed. Verify employee exists.")
    return {"message": f"Successfully assigned {len(payload.asset_ids)} assets"}

@router.post("/return")
def return_assets(
    payload: AssetReturnRequest,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    success = return_assets_service(
        db,
        payload.employee_id,
        payload.asset_ids,
        payload.return_date,
        payload.condition,
        payload.remarks,
        current_user.name
    )
    if not success:
        raise HTTPException(status_code=400, detail="Return failed. Verify employee exists.")
@router.post("/{id}/accept")
def accept_asset_route(
    id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = accept_asset_assignment_service(db, id, current_user.id, current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found or acceptance failed")
    return {"message": f"Successfully accepted asset {id}"}

@router.post("/{id}/reject")
def reject_asset_route(
    id: str,
    payload: Optional[AssetAcceptRejectRequest] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reason = payload.reason if payload else None
    success = reject_asset_assignment_service(db, id, current_user.id, reason, current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found or rejection failed")
    return {"message": f"Successfully rejected asset {id}"}

@router.post("/bulk-import")
def bulk_import_assets(
    payload: List[AssetCreate],
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    success_count = 0
    failed_rows = []
    
    # Pre-fetch existing IDs and Serial Numbers in one query each for fast duplicate checks
    existing_ids = {str(r[0]).upper() for r in db.execute(text("SELECT id FROM assets")).all() if r[0]}
    existing_serials = {str(r[0]).lower().strip() for r in db.execute(text("SELECT serial_number FROM assets WHERE serial_number IS NOT NULL")).all() if r[0]}
    
    for idx, asset_schema in enumerate(payload):
        try:
            aid_upper = asset_schema.id.upper().strip()
            if aid_upper in existing_ids:
                failed_rows.append({"row": idx + 2, "reason": f"Asset ID '{asset_schema.id}' already exists."})
                continue
                
            sn_lower = (asset_schema.serial_number or "").lower().strip()
            if not sn_lower:
                asset_schema.serial_number = f"SN-{aid_upper}"
                sn_lower = asset_schema.serial_number.lower().strip()
            elif sn_lower in existing_serials:
                asset_schema.serial_number = f"{asset_schema.serial_number}_{aid_upper}"
                sn_lower = asset_schema.serial_number.lower().strip()
                
            create_asset(db, asset_schema.model_dump(), current_user.name)
            existing_ids.add(aid_upper)
            if sn_lower:
                existing_serials.add(sn_lower)
            success_count += 1
        except Exception as e:
            failed_rows.append({"row": idx + 2, "reason": str(e)})
            
    return {
        "totalRows": len(payload),
        "successCount": success_count,
        "failedRows": failed_rows
    }

