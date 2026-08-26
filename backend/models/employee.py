from sqlalchemy import Column, String, DateTime, Text, func
from database.connection import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(50))
    status = Column(String(20), nullable=False, default="Active")
    role = Column(String(20), nullable=False, default="Employee")
    avatar = Column(Text)
    joining_date = Column(String(50))
    location = Column(String(150))
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
