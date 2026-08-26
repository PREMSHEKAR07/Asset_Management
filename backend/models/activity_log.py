from sqlalchemy import Column, String, Text, DateTime, func
from database.connection import Base

class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(String(50), primary_key=True)
    user = Column(String(100), nullable=False)
    activity = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    ip_address = Column(String(50), default="192.168.1.10")
    date_time = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
