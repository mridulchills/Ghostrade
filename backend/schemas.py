from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WatchlistItem(BaseModel):
    id: int
    user_id: str
    ticker: str
    created_at: datetime

    class Config:
        from_attributes = True

class WatchlistCreate(BaseModel):
    user_id: str
    ticker: str

class AlertItem(BaseModel):
    id: int
    user_id: str
    ticker: str
    trust_score_cutoff: float
    phone_number: str
    created_at: datetime

    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    user_id: str
    ticker: str
    trust_score_cutoff: float
    phone_number: str
