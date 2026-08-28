from sqlalchemy import BigInteger, Column, DateTime, String, func
from database import Base

class User(Base):
    __tablename__ = "users"
    id            = Column(BigInteger, primary_key=True)
    name          = Column(String(100),  nullable=False)
    email         = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255),   nullable=False)
    created_at    = Column(DateTime, nullable=False, server_default=func.now())
