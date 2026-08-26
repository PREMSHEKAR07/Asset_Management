from sqlalchemy import Column, String, Text, DateTime, func
from database.connection import Base

class Guideline(Base):
    __tablename__ = "guidelines"

    id = Column(String(20), primary_key=True, default="SYSTEM_GUIDELINE")
    title = Column(String(150), nullable=False)
    version = Column(String(20), nullable=False)
    uploaded_date = Column(String(50), nullable=False)
    size = Column(String(20))
    file_name = Column(String(100))
    summary = Column(Text)
    content = Column(Text)
    download_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
