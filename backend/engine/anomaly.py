import pandas as pd
from sklearn.ensemble import IsolationForest

def run_anomaly_detection(df: pd.DataFrame) -> pd.DataFrame:
    """Fits IF, adds anomaly_score and is_anomaly columns. Returns enriched DataFrame."""
    df_out = df.copy()
    
    # Drop rows with NaN (from rolling calculations) before training
    # But we want to keep the same index for df_out
    features = ["VAI_z", "VBS_z", "PVD_z", "LIP_z"]
    
    # We create a mask for valid rows
    valid_mask = df_out[features].notna().all(axis=1)
    
    if not valid_mask.any():
        # If no valid rows, just return defaults
        df_out['anomaly_score'] = 0.0
        df_out['is_anomaly'] = False
        return df_out
        
    X = df_out.loc[valid_mask, features]
    
    # Fit IsolationForest
    model = IsolationForest(contamination='auto', random_state=42)
    model.fit(X)
    
    # Extract anomaly score
    # scikit-learn's decision_function returns negative for anomalies and positive for normal points
    # PRD says anomaly_score = -model.decision_function(X) (higher = more anomalous)
    anomaly_scores = -model.decision_function(X)
    
    # Predict (-1 is anomaly, 1 is normal)
    preds = model.predict(X)
    
    # Add to output df
    df_out.loc[valid_mask, 'anomaly_score'] = anomaly_scores
    df_out.loc[valid_mask, 'is_anomaly'] = preds == -1
    
    # Forward fill or fillna for the invalid rows
    df_out['anomaly_score'] = df_out['anomaly_score'].fillna(0.0)
    df_out['is_anomaly'] = df_out['is_anomaly'].fillna(False)
    
    return df_out
