import os
import yfinance as yf
import pandas as pd

CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'cache')

def fetch_ohlcv(ticker: str) -> pd.DataFrame:
    """Returns 30-day OHLCV DataFrame or raises a descriptive ValueError."""
    ticker = ticker.upper().strip()
    cache_path = os.path.join(CACHE_DIR, f"{ticker}.csv")
    
    try:
        # Try fetching from yfinance
        stock = yf.Ticker(ticker)
        # Fetch 150 days to ensure we have at least 90 trading days
        df = stock.history(period="150d")
        
        if df.empty:
            raise ValueError(f"Ticker '{ticker}' not found or no data returned.")
            
        # Ensure required columns exist
        required_cols = ["Open", "High", "Low", "Close", "Volume"]
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")
                
        df = df[required_cols]
        
        # We need at least 20 days for calculations (rolling window size)
        # Let's take the last 30 trading days for the history view
        df = df.tail(30)
        
        if len(df) < 20:
            raise ValueError(f"Not enough history for {ticker}. Need at least 20 rows.")
            
        # Save to cache
        os.makedirs(CACHE_DIR, exist_ok=True)
        df.to_csv(cache_path)
        return df
        
    except Exception as e:
        # If it's our ValueError, check if it's because of empty df (invalid ticker)
        # For network issues, try fallback.
        # It's hard to distinguish network error from invalid ticker in yfinance except df.empty
        if "not found or no data" in str(e) or "Not enough history" in str(e):
            raise
            
        # Try fallback
        if os.path.exists(cache_path):
            df = pd.read_csv(cache_path, index_col=0, parse_dates=True)
            if len(df) >= 20:
                return df
                
        raise ValueError(f"Unable to fetch data for {ticker}. Network issue and no cache available. Error: {str(e)}")
