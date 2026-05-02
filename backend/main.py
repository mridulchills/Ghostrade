import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np
from engine.fetcher import fetch_ohlcv
from engine.signals import compute_signals
from engine.anomaly import run_anomaly_detection
from engine.scorer import compute_trust_score
from fastapi import Depends
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base
import models
import schemas
from twilio.rest import Client
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GHOSTRADE API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    ticker: str

class AnalyzeResponse(BaseModel):
    ticker: str
    result: Dict[str, Any]
    chart_data: List[Dict[str, Any]]
    signals: Dict[str, Any]
    ohlcv: Dict[str, Any]

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_ticker(req: AnalyzeRequest):
    try:
        # Step 1: Fetch
        df = fetch_ohlcv(req.ticker)
        
        # Step 2: Signals
        df = compute_signals(df)
        
        # Step 3: Anomaly
        df = run_anomaly_detection(df)
        
        # Step 4: Scorer
        result = compute_trust_score(df)
        
        # --- Build rich chart data ---
        df_reset = df.reset_index()
        date_col = df_reset.columns[0]
        
        chart_data = []
        for _, row in df_reset.iterrows():
            entry = {
                "date": str(row[date_col].date()) if hasattr(row[date_col], 'date') else str(row[date_col]),
                "close": float(row["Close"]),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "volume": float(row["Volume"]),
                "is_anomaly": bool(row["is_anomaly"]) if pd.notna(row.get("is_anomaly")) else False,
            }
            # Add signal z-scores per row
            for sig in ["VAI_z", "VBS_z", "PVD_z", "LIP_z"]:
                entry[sig] = float(row[sig]) if pd.notna(row.get(sig)) else 0.0
            chart_data.append(entry)
        
        # --- Build per-signal summary for the latest row ---
        latest = df.iloc[-1]
        signal_map = {
            "VAI": {"name": "Volume Anomaly Index", "z": "VAI_z", "icon": "psychology"},
            "VBS": {"name": "Volatility Burst Score", "z": "VBS_z", "icon": "waves"},
            "PVD": {"name": "Price-Volume Divergence", "z": "PVD_z", "icon": "analytics"},
            "LIP": {"name": "Liquidity Instability Proxy", "z": "LIP_z", "icon": "security"},
        }
        signals = {}
        for key, meta in signal_map.items():
            z_val = float(latest[meta["z"]]) if pd.notna(latest.get(meta["z"])) else 0.0
            flagged = abs(z_val) > 1.0
            signals[key] = {
                "name": meta["name"],
                "z_score": round(z_val, 3),
                "sigma": round(abs(z_val), 2),
                "flagged": flagged,
                "status": "CRITICAL" if abs(z_val) > 2.5 else "WARNING" if abs(z_val) > 1.0 else "NORMAL",
                "icon": meta["icon"],
            }
        
        # --- Build OHLCV summary ---
        latest_row = df.iloc[-1]
        ohlcv = {
            "open": round(float(latest_row["Open"]), 2),
            "high": round(float(latest_row["High"]), 2),
            "low": round(float(latest_row["Low"]), 2),
            "close": round(float(latest_row["Close"]), 2),
            "volume": int(latest_row["Volume"]),
            "avg_volume_20d": int(df["Volume"].rolling(20).mean().iloc[-1]) if len(df) >= 20 else int(df["Volume"].mean()),
            "high_30d": round(float(df["High"].max()), 2),
            "low_30d": round(float(df["Low"].min()), 2),
            "volatility_30d": round(float(df["Close"].pct_change().std() * np.sqrt(252) * 100), 2),
            "anomaly_days": int(df["is_anomaly"].sum()) if "is_anomaly" in df.columns else 0,
            "total_days": len(df),
        }
            
        return AnalyzeResponse(
            ticker=req.ticker.upper(),
            result=result,
            chart_data=chart_data,
            signals=signals,
            ohlcv=ohlcv,
        )
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/watchlist/{user_id}", response_model=List[schemas.WatchlistItem])
def get_watchlist(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Watchlist).filter(models.Watchlist.user_id == user_id).all()

@app.post("/api/watchlist", response_model=schemas.WatchlistItem)
def add_watchlist(item: schemas.WatchlistCreate, db: Session = Depends(get_db)):
    count = db.query(models.Watchlist).filter(models.Watchlist.user_id == item.user_id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 tickers allowed in watchlist.")
    
    db_item = models.Watchlist(user_id=item.user_id, ticker=item.ticker.upper())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/watchlist/{item_id}")
def delete_watchlist(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.Watchlist).filter(models.Watchlist.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted successfully"}

@app.get("/api/alerts/{user_id}", response_model=List[schemas.AlertItem])
def get_alerts(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Alert).filter(models.Alert.user_id == user_id).all()

@app.post("/api/alerts", response_model=schemas.AlertItem)
def add_alert(item: schemas.AlertCreate, db: Session = Depends(get_db)):
    db_item = models.Alert(
        user_id=item.user_id,
        ticker=item.ticker.upper(),
        trust_score_cutoff=item.trust_score_cutoff,
        phone_number=item.phone_number
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/alerts/{item_id}")
def delete_alert(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.Alert).filter(models.Alert.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(db_item)
    db.commit()
@app.post("/api/alerts/check")
def check_alerts(db: Session = Depends(get_db)):
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_phone_number = os.getenv('TWILIO_PHONE_NUMBER')
    
    if not account_sid or not auth_token or not from_phone_number:
        raise HTTPException(status_code=500, detail="Twilio credentials not configured")
        
    client = Client(account_sid, auth_token)
    
    alerts = db.query(models.Alert).all()
    triggered = []
    
    for alert in alerts:
        try:
            # Reusing the existing analyze logic 
            df = fetch_ohlcv(alert.ticker)
            df = compute_signals(df)
            df = run_anomaly_detection(df)
            result = compute_trust_score(df)
            
            score = result.get('trust_score', 0)
            
            if score <= alert.trust_score_cutoff: # If it drops below or hits the cutoff
                # Send SMS
                message = client.messages.create(
                    body=f"🚨 GHOSTRADE ALERT 🚨\n\nTicker: {alert.ticker}\nTrust Score: {score}/100\nThreshold: {alert.trust_score_cutoff}\n\nReview immediately on your dashboard.",
                    from_=from_phone_number,
                    to=alert.phone_number
                )
                triggered.append({"id": alert.id, "ticker": alert.ticker, "score": score})
        except Exception as e:
            print(f"Error processing alert {alert.id}: {str(e)}")
            continue
            
    return {"message": "Checked alerts", "triggered": triggered}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
