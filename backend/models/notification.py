from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, func
from database.connection import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    time = Column(String(100), nullable=False)
    read = Column(Boolean, nullable=False, default=False)
    type = Column(String(20), nullable=False)  # info, success, warning, danger, alert
    employee_id = Column(String(50), ForeignKey("employees.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
