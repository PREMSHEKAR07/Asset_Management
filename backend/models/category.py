from sqlalchemy import Column, String, DateTime, Text, func
from database.connection import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    icon_name = Column(String(50))
    group = Column(String(20), nullable=False)  # IT, Non-IT
    scope = Column(String(20), nullable=False)  # Employee, Organization
    owner_entity = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

