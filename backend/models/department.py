from sqlalchemy import Column, String, DateTime, func
from database.connection import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
