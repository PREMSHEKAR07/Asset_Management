from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from database.connection import Base

class AssetHistory(Base):
    __tablename__ = "asset_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(50), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # Asset Created, Assigned, Returned, Repair Ticket Raised, Repair Updated, Details Updated, Disposed
    employee_id = Column(String(50), nullable=True)
    employee_name = Column(String(150), nullable=True)
    performed_by = Column(String(100), nullable=False, default="System")
    date = Column(String(50), nullable=False)
    condition = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
