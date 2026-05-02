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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
