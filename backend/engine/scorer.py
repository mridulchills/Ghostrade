import pandas as pd
import numpy as np

def compute_trust_score(df: pd.DataFrame) -> dict:
    """Returns dict: trust_score, label, color, active_signals, volume_spike_pct,
       price_delta_30d, top_flag, top_flag_sigma"""
    
    # Check if df is empty or doesn't have required columns
    if df.empty or 'anomaly_score' not in df.columns:
        return {}
        
    latest_row = df.iloc[-1]
    
    # Features
    features = ["VAI_z", "VBS_z", "PVD_z", "LIP_z"]
    
    # Check recent window (last 5 days) for peak anomaly to ensure recent events drag down the score
    recent_window = df.tail(5)
    max_anomaly = max(0, recent_window["anomaly_score"].max())
    
    # Max average z_magnitude in the last 5 days
    max_z_magnitude = recent_window[features].abs().mean(axis=1).max()
    
    # Base raw score, more heavily weighted
    raw = (max_anomaly * 0.6) + (max_z_magnitude * 0.4)
    # Reduced the multiplier from 30 to 15 to be less harsh on baseline scores
    trust_score = max(0, min(100, 100 - (raw * 15)))
    
    # Smart Time-Decay Penalty for anomalies
    recent_30d = df.tail(30).reset_index(drop=True)
    if "is_anomaly" in recent_30d.columns:
        n = len(recent_30d)
        total_penalty = 0.0
        for i, row in recent_30d.iterrows():
            if row["is_anomaly"]:
                days_ago = n - 1 - i
                # Exponential decay: recent anomalies have higher impact
                weight = np.exp(-days_ago / 7.0) 
                
                # Dynamic penalty based on the actual magnitude of the 4 indicators
                z_mag = row[features].abs().mean() if pd.notna(row[features].abs().mean()) else 1.0
                day_penalty = 10.0 * z_mag 
                
                total_penalty += weight * day_penalty
        
        trust_score = max(0, trust_score - total_penalty)

    # Classification
    if trust_score >= 70:
        label = "Stable"
        color = "#5DCAA5"
    elif trust_score > 40:
        label = "Suspicious"
        color = "#F0C040"
    else:
        label = "Ghost Trade"
        color = "#E05A5A"
        
    # Stats
    active_signals = sum(abs(latest_row[f]) > 1.0 for f in features)
    
    # volume_spike_pct: (VAI_z_latest / 1.0) * 100 (approximate) - we can just use the actual ratio from signals?
    # Actually PRD says: volume_spike_pct: (VAI_z_latest / 1.0) * 100
    volume_spike_pct = (latest_row["VAI_z"] / 1.0) * 100 if pd.notna(latest_row["VAI_z"]) else 0.0
    
    # price_delta_30d
    first_close = df["Close"].iloc[0]
    last_close = latest_row["Close"]
    price_delta_30d = ((last_close - first_close) / first_close) * 100 if first_close != 0 else 0.0
    
    # top_flag
    z_scores = latest_row[features]
    if z_scores.notna().any():
        top_flag_col = z_scores.abs().idxmax()
        top_flag_sigma = abs(latest_row[top_flag_col])
        # Map feature name to readable name
        name_map = {
            "VAI_z": "Volume Anomaly Index",
            "VBS_z": "Volatility Burst Score",
            "PVD_z": "Price-Volume Divergence",
            "LIP_z": "Liquidity Instability Proxy"
        }
        top_flag = name_map.get(top_flag_col, top_flag_col)
    else:
        top_flag = "None"
        top_flag_sigma = 0.0
        
    return {
        "trust_score": int(trust_score),
        "label": label,
        "color": color,
        "active_signals": int(active_signals),
        "volume_spike_pct": float(volume_spike_pct),
        "price_delta_30d": float(price_delta_30d),
        "top_flag": top_flag,
        "top_flag_sigma": float(top_flag_sigma)
    }
