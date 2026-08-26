from sqlalchemy import Column, String, Integer, DateTime, Text, func
from database.connection import Base

class License(Base):
    __tablename__ = "licenses"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="Available")  # Available, Expiring Soon, Expired, Cancelled
    group_id = Column(String(50), nullable=True)
    group_name = Column(String(100), nullable=True)
    vendor = Column(String(100), default="Subscription")
    license_key = Column(String(150), default="N/A")
    seats = Column(Integer, nullable=False, default=1)
    cost = Column(String(50), default="N/A")
    start_date = Column(String(50))
    end_date = Column(String(50), nullable=False)
    alert_days_before = Column(Integer, nullable=False, default=30)
    admin_email = Column(String(150), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

