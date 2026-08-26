from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database.connection import get_db
from routers.auth import require_admin

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(current_user = Depends(require_admin), db: Session = Depends(get_db)):
    # 1. Total counts
    total_assets = db.execute(text("SELECT COUNT(*) FROM assets WHERE type != 'Desktop'")).scalar()
    assigned_assets = db.execute(text("SELECT COUNT(*) FROM assets WHERE status = 'Assigned' AND type != 'Desktop'")).scalar()
    available_assets = db.execute(text("SELECT COUNT(*) FROM assets WHERE status = 'Available' AND type != 'Desktop'")).scalar()
    repair_assets = db.execute(text("SELECT COUNT(*) FROM assets WHERE status = 'Under Repair' AND type != 'Desktop'")).scalar()
    disposed_assets = db.execute(text("SELECT COUNT(*) FROM assets WHERE status = 'Disposed' AND type != 'Desktop'")).scalar()
    
    total_employees = db.execute(text("SELECT COUNT(*) FROM employees")).scalar()
    active_employees = db.execute(text("SELECT COUNT(*) FROM employees WHERE status = 'Active'")).scalar()
    inactive_employees = db.execute(text("SELECT COUNT(*) FROM employees WHERE status = 'Inactive'")).scalar()
    
    total_repairs = db.execute(text("SELECT COUNT(*) FROM repairs")).scalar()
    
    # 2. Category count breakdown
    cat_rows = db.execute(text("""
        SELECT type as category, COUNT(*) as count 
        FROM assets 
        WHERE type != 'Desktop'
        GROUP BY type 
        ORDER BY count DESC
    """)).all()
    categories_breakdown = [{"category": row.category, "count": row.count} for row in cat_rows]
    
    # 3. Monthly assignment trends (Dummy data placeholder matching typical Recharts format)
    # The frontend usually plots assignment trends by month. We can query assigned_at or return seed values.
    # Standard format: [{"name": "Jan", "Laptops": 12, "Monitors": 4}, ...]
    # We can aggregate from db or return standard trend counts
    trends = [
        {"name": "Jan", "Laptops": 5, "Monitors": 2, "Others": 3},
        {"name": "Feb", "Laptops": 8, "Monitors": 4, "Others": 5},
        {"name": "Mar", "Laptops": 15, "Monitors": 8, "Others": 12},
        {"name": "Apr", "Laptops": 10, "Monitors": 6, "Others": 8},
        {"name": "May", "Laptops": 22, "Monitors": 12, "Others": 15},
        {"name": "Jun", "Laptops": 18, "Monitors": 10, "Others": 10},
        {"name": "Jul", "Laptops": 25, "Monitors": 15, "Others": 20}
    ]
    
    return {
        "assets": {
            "total": total_assets,
            "assigned": assigned_assets,
            "available": available_assets,
            "under_repair": repair_assets,
            "disposed": disposed_assets
        },
        "employees": {
            "total": total_employees,
            "active": active_employees,
            "inactive": inactive_employees
        },
        "repairs": {
            "total": total_repairs
        },
        "categories_breakdown": categories_breakdown,
        "assignment_trends": trends
    }
