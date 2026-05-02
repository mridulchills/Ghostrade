# GHOSTRADE

**Real-Time Market Integrity Engine**

GHOSTRADE is a full-stack financial surveillance tool that audits market behavior rather than predicting price. Given any stock ticker, it fetches one year of OHLCV data, computes four proprietary statistical microstructure signals, runs an unsupervised machine learning anomaly detection pipeline, and outputs a Trust Score between 0 and 100  classifying any market move as Stable, Suspicious, or Ghost Trade.



## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Signal Engine](#signal-engine)
- [Trust Score and Classification](#trust-score-and-classification)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend](#backend-setup)
  - [Frontend](#frontend-setup)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Configuration](#configuration)
- [ESLint Configuration](#eslint-configuration)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)



## Overview

Retail traders are routinely exposed to market moves that appear technically valid but are structurally manufactured — fake breakouts, wash trading, liquidity sweeps, and coordinated pump activity. GHOSTRADE addresses this by computing a statistically grounded integrity signal on raw OHLCV data.

The core question GHOSTRADE answers is:

> Is this price move statistically real, or is it manufactured?

The system does not predict price direction. It does not give buy or sell signals. It exclusively evaluates the structural integrity of recent market behavior for a given ticker.



## Architecture

GHOSTRADE follows a client-server architecture with a clean separation between the analytical backend and the interactive frontend.

```
User Input (Ticker)
        |
        v
  Frontend (React + Vite)
        |
        | POST /api/analyze
        v
  Backend (FastAPI)
        |
        +-- engine/fetcher.py    -> yfinance OHLCV fetch + CSV cache fallback
        +-- engine/signals.py    -> VAI, VBS, PVD, LIP computation + Z-scoring
        +-- engine/anomaly.py    -> IsolationForest anomaly detection
        +-- engine/scorer.py     -> Trust Score (0-100) + classification label
        |
        v
  JSON Response (chart_data, signals, ohlcv, result)
        |
        v
  Frontend Dashboard (Plotly charts, signal cards, integrity log)
```

The backend is a stateless REST API. Each request to `/api/analyze` runs the full pipeline end-to-end for the requested ticker. No session state is maintained between requests.

---

## Signal Engine

All four signals are derived from raw OHLCV data. Each signal is Z-score normalized against the ticker's historical baseline before being fed into the anomaly model.

### VAI — Volume Anomaly Index

Computes the ratio of today's volume to the 20-day rolling average volume. A high VAI Z-score indicates a statistically significant volume surge relative to the ticker's own baseline — a classic precursor to wash trading or distribution.

```
VAI = Volume / rolling_20d_avg_volume
VAI_z = zscore(VAI)
```

### VBS — Volatility Burst Score

Uses Average True Range (ATR, 14-day) divided by its own rolling standard deviation to measure instability beyond historical norms. A high VBS Z-score flags sudden, structurally unexplained volatility.

```
ATR_14 = average_true_range(High, Low, Close, window=14)
VBS = ATR_14 / rolling_std(ATR_14)
VBS_z = zscore(VBS)
```

### PVD — Price-Volume Divergence

Computes a rolling 5-day correlation between the direction of price change and the direction of volume change. A low or negative correlation (high PVD Z-score) means price is moving without volume conviction — a hallmark of manufactured moves.

```
PVD = 1 - rolling_5d_corr(sign(price_diff), sign(volume_diff))
PVD_z = zscore(PVD)
```

### LIP — Liquidity Instability Proxy

Uses the intraday spread proxy `(High - Low) / Close` as a measure of market depth fragility. A high LIP Z-score indicates a structurally thin order book or potential manipulation through spread widening.

```
LIP = (High - Low) / Close
LIP_z = zscore(LIP)
```

### Anomaly Detection Pipeline

1. All four Z-scores are computed for every trading day in the fetched history.
2. An `IsolationForest` model is fit on the Z-score feature matrix for all valid rows.
3. Anomaly scores (`-decision_function`) are extracted per day — higher values are more anomalous.
4. Days are labeled as anomalous (`is_anomaly = True`) where the IsolationForest predicts -1.
5. The Trust Score engine combines the peak anomaly score with Z-score magnitudes over a rolling 5-day window, then applies a time-decay penalty for anomalous days in the trailing 30 days.

---

## Trust Score and Classification

The Trust Score is a normalized 0-to-100 value representing the statistical integrity of the most recent market behavior. It is not a price target or return forecast.

| Score Range | Label      | Meaning                                                                                                 |
|-------------|------------|---------------------------------------------------------------------------------------------------------|
| 70 - 100    | Stable     | Move is statistically consistent with historical behavior. Low manipulation probability.                |
| 41 - 69     | Suspicious | One or more signals show abnormal patterns. Caution warranted before acting on this move.               |
| 0 - 40      | Ghost Trade | Multiple signals confirm structural anomaly. High probability of manufactured or manipulated activity. |

Color coding is consistent throughout the UI: teal (#5DCAA5) for Stable, gold (#F0C040) for Suspicious, and red (#E05A5A) for Ghost Trade.

### Scoring Formula

```python
raw = (max_anomaly_score_5d * 0.6) + (max_avg_z_magnitude_5d * 0.4)
trust_score = max(0, min(100, 100 - (raw * 15)))

# Time-decay penalty for anomalous days in trailing 30 days
for each anomalous_day:
    days_ago = distance from today
    weight = exp(-days_ago / 7.0)   # exponential decay, half-life ~7 days
    day_penalty = 10.0 * avg_z_magnitude_of_day
    total_penalty += weight * day_penalty

trust_score = max(0, trust_score - total_penalty)
```

---

## Tech Stack

### Backend

| Component        | Technology                                        |
|------------------|---------------------------------------------------|
| Language         | Python 3.10+                                      |
| API Framework    | FastAPI                                           |
| ASGI Server      | Uvicorn                                           |
| Data Validation  | Pydantic v2                                       |
| Data Fetching    | yfinance (free, no API key required)              |
| Data Processing  | pandas, NumPy                                     |
| Machine Learning | scikit-learn (IsolationForest)                    |
| CORS             | FastAPI CORSMiddleware (open for development)     |

### Frontend

| Component        | Technology                                        |
|------------------|---------------------------------------------------|
| Language         | TypeScript 6+                                     |
| Framework        | React 19                                          |
| Build Tool       | Vite 5 with @vitejs/plugin-react (Babel/Oxc)      |
| Routing          | React Router DOM v7                               |
| Charts           | Plotly.js via react-plotly.js                     |
| Styling          | Tailwind CSS v4 (via @tailwindcss/vite plugin)    |
| Icons            | Lucide React + Google Material Symbols (CDN)      |
| Linting          | ESLint 10 + typescript-eslint + react-hooks plugin|

---

## Project Structure

```
GHOSTRADE/
|
+-- backend/
|   +-- main.py                  # FastAPI application entry point, /api/analyze endpoint
|   +-- requirements.txt         # Python dependencies
|   +-- data/
|   |   +-- cache/               # Per-ticker CSV files used as offline fallback
|   +-- engine/
|       +-- fetcher.py           # yfinance OHLCV fetch, validation, and CSV cache management
|       +-- signals.py           # VAI, VBS, PVD, LIP signal computation and Z-scoring
|       +-- anomaly.py           # IsolationForest fit, anomaly_score and is_anomaly columns
|       +-- scorer.py            # Trust Score (0-100), label, and per-metric statistics
|
+-- frontend/
|   +-- index.html               # HTML entry point (Material Symbols font CDN included)
|   +-- vite.config.ts           # Vite config with React and Tailwind CSS plugins
|   +-- tsconfig.json            # TypeScript project references root
|   +-- tsconfig.app.json        # App-specific TypeScript config (strict mode)
|   +-- tsconfig.node.json       # Node/Vite config TypeScript settings
|   +-- eslint.config.js         # ESLint flat config with TypeScript and React rules
|   +-- package.json             # Node dependencies and npm scripts
|   +-- public/                  # Static assets served at root
|   +-- src/
|       +-- main.tsx             # React root mount
|       +-- App.tsx              # BrowserRouter and route declarations
|       +-- config.ts            # VITE_API_URL environment variable export
|       +-- index.css            # Global CSS: design tokens, utilities, animations
|       +-- App.css              # App-level styles
|       +-- assets/              # Static image assets
|       +-- types/               # TypeScript type declarations (AnalyzeResponse, react-plotly.d.ts)
|       +-- components/
|       |   +-- LiquidLoader.tsx # Animated intro/loading component
|       |   +-- LiquidLoader.css # LiquidLoader-specific keyframe animations
|       +-- pages/
|           +-- LandingPage.tsx  # Hero search input, signal key cards, footer ticker
|           +-- DashboardPage.tsx# Full analysis dashboard: charts, signal cards, integrity log
|           +-- HistoryPage.tsx  # Historical analysis view for a given ticker
|
+-- PRD.md                       # Product Requirements Document v2.0
+-- README.md                    # This file
+-- .gitignore
```

---

## Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher (LTS recommended)
- **npm** 9 or higher
- Internet access for yfinance data fetching (offline CSV cache is used as fallback)

---

## Installation

### Backend Setup

```powershell
# Navigate to the backend directory
cd GHOSTRADE/backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (cmd):
venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**requirements.txt contents:**
```
fastapi
uvicorn
yfinance
pandas
numpy
scikit-learn
pydantic
```

### Frontend Setup

```powershell
# Navigate to the frontend directory
cd GHOSTRADE/frontend

# Install Node dependencies
npm install
```

---

## Running the Application

Both the backend server and the frontend dev server must be running simultaneously.

### Start the Backend

```powershell
cd GHOSTRADE/backend

# Activate virtual environment if not already active
.\venv\Scripts\Activate.ps1

# Start the FastAPI server with hot reload
python main.py
```

The backend will be available at `http://localhost:8000`. The API documentation (auto-generated by FastAPI) is accessible at `http://localhost:8000/docs`.

### Start the Frontend

In a separate terminal:

```powershell
cd GHOSTRADE/frontend

npm run dev
```

The frontend development server will start at `http://localhost:5173` by default (Vite will print the exact port on startup).

Open `http://localhost:5173` in your browser to use the application.

---

## API Reference

### POST /api/analyze

Runs the full analysis pipeline for a given stock ticker.

**Request Body:**

```json
{
  "ticker": "AAPL"
}
```

**Response Body:**

```json
{
  "ticker": "AAPL",
  "result": {
    "trust_score": 72,
    "label": "Stable",
    "color": "#5DCAA5",
    "active_signals": 1,
    "volume_spike_pct": 34.2,
    "price_delta_30d": 5.8,
    "top_flag": "Volume Anomaly Index",
    "top_flag_sigma": 1.42
  },
  "chart_data": [
    {
      "date": "2025-04-01",
      "close": 172.10,
      "open": 170.50,
      "high": 173.80,
      "low": 169.90,
      "volume": 82450000,
      "is_anomaly": false,
      "VAI_z": 0.34,
      "VBS_z": -0.12,
      "PVD_z": 0.89,
      "LIP_z": 0.22
    }
  ],
  "signals": {
    "VAI": {
      "name": "Volume Anomaly Index",
      "z_score": 1.42,
      "sigma": 1.42,
      "flagged": true,
      "status": "WARNING",
      "icon": "psychology"
    },
    "VBS": { "..." : "..." },
    "PVD": { "..." : "..." },
    "LIP": { "..." : "..." }
  },
  "ohlcv": {
    "open": 170.50,
    "high": 173.80,
    "low": 169.90,
    "close": 172.10,
    "volume": 82450000,
    "avg_volume_20d": 75000000,
    "high_30d": 185.20,
    "low_30d": 165.40,
    "volatility_30d": 28.4,
    "anomaly_days": 3,
    "total_days": 252
  }
}
```

**Signal Status Thresholds:**

| Z-Score Absolute Value | Status   |
|------------------------|----------|
| > 2.5                  | CRITICAL |
| > 1.0                  | WARNING  |
| <= 1.0                 | NORMAL   |

**Error Responses:**

| HTTP Status | Condition                                          |
|-------------|----------------------------------------------------|
| 400         | Ticker not found, no data returned, or insufficient history (< 20 days) |
| 500         | Internal server error during pipeline execution    |

---

## Frontend Routes

| Route                   | Component       | Description                                                   |
|-------------------------|-----------------|---------------------------------------------------------------|
| `/`                     | LandingPage     | Hero search input, signal key cards, animated intro loader    |
| `/dashboard/:ticker`    | DashboardPage   | Full analysis dashboard with charts, signal modules, integrity log |
| `/history/:ticker`      | HistoryPage     | Historical analysis view for the given ticker                 |

### DashboardPage Sidebar Modules

The dashboard sidebar provides tabbed navigation across five analytical views:

| Tab          | Signal Key | Description                              |
|--------------|------------|------------------------------------------|
| Overview     | All        | Trust score, anomaly explainer, price/volume chart, signal cards |
| VAI Engine   | VAI        | Z-score time series for Volume Anomaly Index |
| VBS Flow     | VBS        | Z-score time series for Volatility Burst Score |
| PVD Drift    | PVD        | Z-score time series for Price-Volume Divergence |
| LIP Analysis | LIP        | Z-score time series for Liquidity Instability Proxy |

Each signal tab renders a full Plotly line chart of the Z-score over time with warning (1.0) and critical (2.5) threshold lines overlaid.

---

## Configuration

### Backend

No environment variables are required to run the backend. The yfinance library fetches data without an API key.

The data cache directory is automatically created at `backend/data/cache/`. If a yfinance request fails for any reason other than an invalid ticker, the backend falls back to the most recently cached CSV for that ticker if one exists and contains at least 20 rows.

### Frontend

The frontend reads the backend URL from the `VITE_API_URL` environment variable. If the variable is not set, it defaults to `http://localhost:8000`.

To point the frontend at a different backend, create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_URL=http://your-backend-host:8000
```

This file is excluded from version control by `.gitignore`.

---

## ESLint Configuration

The project uses ESLint 10 with a flat config (`eslint.config.js`). The current setup includes:

- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules for TypeScript files
- `eslint-plugin-react-hooks` for hooks rules
- `eslint-plugin-react-refresh` to enforce proper HMR exports

### Enabling Type-Aware Lint Rules (Recommended for Production)

To enable stricter type-checked rules, update `eslint.config.js`:

```js
import tseslint from 'typescript-eslint'

export default tseslint.config([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // or for stricter enforcement:
      // tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

### Adding React-Specific Lint Rules (Optional)

```powershell
npm install -D eslint-plugin-react-x eslint-plugin-react-dom
```

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

Run the linter:

```powershell
cd frontend
npm run lint
```

---

## Known Limitations

- **Single ticker per session.** The API analyzes one ticker per request. There is no batch or portfolio-level analysis in the current version.
- **yfinance dependency.** Data availability depends on Yahoo Finance. Tickers not available on Yahoo Finance (some OTC stocks, certain international securities) will return a 400 error.
- **Minimum history requirement.** A ticker must have at least 20 trading days of history. Very new listings may fail.
- **IsolationForest contamination.** The model uses `contamination='auto'`, which means the expected proportion of anomalies is estimated from the data. On very short or very uniform histories, this may produce no anomaly labels.
- **No authentication.** CORS is open for all origins in the current backend configuration. This is appropriate for local development but must be restricted before any public deployment.
- **Static footer ticker prices.** The prices shown in the landing page footer (TSLA, AAPL, XAU/USD) are hardcoded placeholders and do not reflect live market data.

---

## Roadmap

The following features are planned for future versions:

- Multi-ticker watchlist with batch Trust Score computation
- Historical backtesting mode with a date range picker for analyzing any past 30-day window
- Alert system with email or Telegram notification when a watched ticker crosses into Ghost Trade territory
- Portfolio-level integrity view aggregating scores across multiple holdings
- Browser extension for real-time Trust Score overlay on TradingView charts
- REST API versioning and authentication for third-party integrations

---

GHOSTRADE — Market Integrity Engine

