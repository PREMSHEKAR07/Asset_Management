from sqlalchemy import Column, String, Text, DateTime, func
from database.connection import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(50), primary_key=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    date = Column(String(50), nullable=False)
    author = Column(String(100), nullable=False, default="IT Admin Desk")
    type = Column(String(50), nullable=False, default="General")
    priority = Column(String(20), nullable=False, default="Medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
