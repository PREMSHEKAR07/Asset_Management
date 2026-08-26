from sqlalchemy import Column, String, DateTime, func
from database.connection import Base

class LicenseAssignment(Base):
    __tablename__ = "license_assignments"

    id = Column(String(50), primary_key=True)
    license_id = Column(String(50), nullable=False)
    employee_id = Column(String(50), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(String(100), nullable=True, default="Admin")
