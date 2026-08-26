from sqlalchemy import Column, String, DateTime, Text, func
from database.connection import Base

class SubscriptionGroup(Base):
    __tablename__ = "subscription_groups"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    vendor = Column(String(100), nullable=True, default="Subscription")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
