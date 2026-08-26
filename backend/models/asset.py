from sqlalchemy import Column, String, DateTime, ForeignKey, func
from database.connection import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(50), primary_key=True)
    type = Column(String(100), nullable=False)
    brand = Column(String(100), nullable=False)
    model = Column(String(150), nullable=False)
    serial_number = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Available")  # Available, Assigned, Under Repair, Disposed
    ownership = Column(String(100), nullable=False, default="Quadrant IT Services")
    group = Column(String(20), nullable=False, default="IT")
    charger_serial_number = Column(String(100), default="N/A")
    condition = Column(String(50), nullable=False, default="Good")
    assigned_to = Column(String(50), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    purchase_date = Column(String(50))
    warranty_end_date = Column(String(50))
    assigned_date = Column(String(50), default="N/A")
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    acceptance_status = Column(String(50), default="Accepted")  # Pending, Accepted, Rejected, N/A
    image = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
