import pandas as pd
import numpy as np

def zscore(series: pd.Series) -> pd.Series:
    """Computes static z-score handling zero variance safely."""
    mean = series.mean()
    std = series.std()
    if pd.isna(std) or std == 0:
        return pd.Series(0, index=series.index)
    return (series - mean) / std

def average_true_range(high, low, close, window=14):
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window, min_periods=1).mean()

def compute_signals(df: pd.DataFrame) -> pd.DataFrame:
    """Adds VAI_z, VBS_z, PVD_z, LIP_z columns. Returns enriched DataFrame."""
    df = df.copy()
    
    # 1. VAI — Volume Anomaly Index
    rolling_vol = df['Volume'].rolling(20, min_periods=1).mean()
    vai = df['Volume'] / rolling_vol.replace(0, np.nan)
    df['VAI_z'] = zscore(vai.fillna(1.0))
    
    # 2. VBS — Volatility Burst Score
    atr_14 = average_true_range(df['High'], df['Low'], df['Close'], 14)
    rolling_atr_std = atr_14.rolling(20, min_periods=1).std()
    vbs = atr_14 / rolling_atr_std.replace(0, np.nan)
    df['VBS_z'] = zscore(vbs.fillna(0.0))
    
    # 3. PVD — Price-Volume Divergence
    price_direction = np.sign(df['Close'].diff().fillna(0))
    volume_direction = np.sign(df['Volume'].diff().fillna(0))
    # rolling correlation, filling initial NaNs
    rolling_corr = price_direction.rolling(5, min_periods=2).corr(volume_direction)
    pvd = 1 - rolling_corr.fillna(0)
    df['PVD_z'] = zscore(pvd)
    
    # 4. LIP — Liquidity Instability Proxy
    lip = (df['High'] - df['Low']) / df['Close'].replace(0, np.nan)
    df['LIP_z'] = zscore(lip.fillna(0))
    
    return df
