from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from database.connection import Base

class SoftwareTicket(Base):
    __tablename__ = "software_tickets"

    id = Column(String(50), primary_key=True)
    reported_by = Column(String(50), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    issue = Column(String(255), nullable=False)
    description = Column(Text)
    working_mode = Column(String(50), nullable=False, default="Onsite")  # Onsite, Remote, Hybrid
    request_date = Column(String(100), nullable=False)
    priority = Column(String(50), nullable=False, default="Medium")  # Low, Medium, High
    assigned_to = Column(String(100), default="IT Support Team")
    status = Column(String(50), nullable=False, default="Pending")  # Pending, In Progress, Completed, Cancelled
    accepted_by = Column(String(100))
    accepted_date = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to updates
    updates = relationship("SoftwareTicketUpdate", back_populates="ticket", cascade="all, delete-orphan", order_by="SoftwareTicketUpdate.id")

class SoftwareTicketUpdate(Base):
    __tablename__ = "software_ticket_updates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String(50), ForeignKey("software_tickets.id", ondelete="CASCADE"), nullable=True)
    date = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("SoftwareTicket", back_populates="updates")
