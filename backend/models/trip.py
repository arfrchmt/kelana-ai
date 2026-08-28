from sqlalchemy import BigInteger, Boolean, Column, Float, ForeignKey, Integer, String, Text
from database import Base

class Trip(Base):
    __tablename__ = "trips"
    id            = Column(Integer, primary_key=True)
    destination   = Column(String,  nullable=False)
    days          = Column(Integer, nullable=False)
    budget        = Column(Float,   nullable=False)
    category      = Column(String,  nullable=False)
    daily_budget  = Column(Float,   nullable=False)
    ai_recommendation = Column(Text, nullable=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    is_active     = Column(Boolean, nullable=False, default=True, server_default="true")
