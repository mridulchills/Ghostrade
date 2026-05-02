from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Clerk user ID
    ticker = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Clerk user ID
    ticker = Column(String, index=True)
    trust_score_cutoff = Column(Float)
    phone_number = Column(String) # Indian phone number for Whatsapp
    created_at = Column(DateTime, default=datetime.utcnow)
