# GHOSTRADE — User Journeys

This document translates the PRD into concrete user flows so an AI IDE can understand the product behavior, intent, and edge cases more clearly. It is based on the GHOSTRADE PRD content provided earlier. fileciteturn3file0

---

## 1. Product Summary

GHOSTRADE is a real-time market integrity engine that checks whether a stock move looks structurally real or artificially manufactured. The core flow is:

1. User enters a ticker.
2. The app fetches OHLCV data.
3. The app computes VAI, VBS, PVD, and LIP.
4. The signals are normalized and scored.
5. The app returns a Trust Score and a label: Stable, Suspicious, or Ghost Trade.

The experience is designed to be fast, explainable, and visually polished.

---

## 2. Primary User Personas

### 2.1 Retail Trader
A trader who uses charts and technical setups, but wants an integrity check before entering a position. They need a quick verdict and a plain-English explanation.

### 2.2 Technical Evaluator / Hackathon Judge
A reviewer who cares about novelty, ML usage, explainability, and UI polish. They want to see a complete product story in a single demo.

### 2.3 Technical User / Developer
A user who wants to inspect the signal logic, understand the score, and possibly extend the system later.

---

## 3. Journey 1 — Quick Integrity Check Before a Trade

### Goal
Help a retail trader decide whether a ticker’s current move looks trustworthy before entering a trade.

### Trigger
The user opens GHOSTRADE because they see a breakout, spike, or unusual market move.

### Preconditions
- The app is loaded.
- The user has a valid stock ticker in mind.
- Network access is available or cached fallback data exists.

### Steps
1. The user types a ticker such as `AAPL`, `TSLA`, `GME`, or `SPY`.
2. The app validates the ticker format.
3. The app fetches 30 days of OHLCV data.
4. The signal engine computes:
   - Volume Anomaly Index
   - Volatility Burst Score
   - Price-Volume Divergence
   - Liquidity Instability Proxy
5. The values are Z-score normalized.
6. The anomaly model evaluates the feature vector.
7. The Trust Score is calculated.
8. The app renders:
   - Trust Score gauge
   - Classification label
   - Price chart
   - Volume chart
   - Stats row
   - Anomaly explainer
9. The trader reads the verdict and decides whether the move looks normal or suspicious.

### Expected Outcome
The user gets a fast, understandable answer with no need to interpret raw statistical output.

### Success Signals
- Score appears quickly.
- Label is easy to recognize.
- Explanation uses plain language.
- Charts support the verdict visually.

### Failure Paths
- Invalid ticker → show a friendly validation error.
- Network failure → use offline fallback if available, otherwise show a clean error.
- Insufficient data → tell the user why the score could not be produced.

---

## 4. Journey 2 — Evaluator Reviews the Product in a Demo

### Goal
Show that the product is meaningful, technical, and presentation-ready.

### Trigger
A hackathon judge, recruiter, or reviewer opens the app during a live demo.

### Preconditions
- The app is already styled in dark mode.
- A known ticker can be scored successfully.
- Charts and score components are working.

### Steps
1. The evaluator enters a recognizable ticker.
2. The app loads real market data.
3. The app computes all four signals.
4. The gauge and charts update.
5. The explainer card highlights what caused the score.
6. The evaluator checks whether the product is:
   - data-driven
   - explainable
   - visually consistent
   - not a black box

### Expected Outcome
The evaluator sees a polished, coherent product that combines real data, ML, and explainability.

### Success Signals
- The UI looks finished.
- The score is backed by actual data.
- The explanation feels specific, not generic.
- The product can be screenshotted for a deck.

---

## 5. Journey 3 — Technical User Inspects the Signal Logic

### Goal
Let a technical user verify how the score is derived.

### Trigger
The user wants to understand whether the model is making sense.

### Preconditions
- A score has already been generated.
- The user can inspect the charts and explanations.

### Steps
1. The user opens the score view.
2. The user reads the signal explanation.
3. The user inspects the four signals and their interpretation.
4. The user compares the charts with the label.
5. The user checks whether the score matches the market behavior shown.

### Expected Outcome
The user understands the system as a structured anomaly detection pipeline instead of a vague prediction tool.

### Success Signals
- Each signal is visible or inferable.
- The explanation mentions actual sigma deviations.
- The technical architecture feels auditable.

---

## 6. Journey 4 — Invalid Ticker Entry

### Goal
Prevent bad input from breaking the experience.

### Trigger
The user types an invalid ticker such as `FAKEXYZ`.

### Preconditions
- The app is running.

### Steps
1. The user submits the invalid ticker.
2. The app validates the input.
3. The app rejects the ticker gracefully.
4. A user-friendly error message appears.

### Expected Outcome
The app does not crash and clearly tells the user the ticker is invalid or unavailable.

### Success Signals
- No stack trace is shown.
- No broken screen appears.
- The user can immediately try another ticker.

---

## 7. Journey 5 — Network Failure or API Unavailability

### Goal
Keep the app usable even when live data is unavailable.

### Trigger
The live data provider fails or times out.

### Preconditions
- A ticker has been submitted.
- Live fetch fails.

### Steps
1. The app attempts to fetch OHLCV data.
2. The request fails.
3. The app checks whether offline cached data exists.
4. If cached data exists, it uses the fallback.
5. If not, the app shows a clean error state.

### Expected Outcome
The app remains stable and communicates the problem clearly.

### Success Signals
- No crash.
- No raw exception text.
- User understands whether fallback was used.

---

## 8. Journey 6 — Historical Analysis Mode

### Goal
Let the user analyze a past 30-day window instead of only the latest session.

### Trigger
The user wants to inspect a historical event or past anomaly.

### Preconditions
- Historical mode is available.
- The user can choose a date range.

### Steps
1. The user selects a historical window.
2. The app loads the corresponding OHLCV data.
3. The signals are computed for that window.
4. The Trust Score and charts are updated.
5. The user compares the historical move with the model verdict.

### Expected Outcome
The user can reuse the same integrity engine for past events.

### Success Signals
- Historical mode behaves like live mode.
- The UI stays consistent.
- Scores can be compared across time windows.

---

## 9. Journey 7 — User Interprets a Suspicious or Ghost Trade Result

### Goal
Help the user understand why the score is warning them.

### Trigger
The app returns a Suspicious or Ghost Trade label.

### Preconditions
- A score has already been computed.
- The result is not Stable.

### Steps
1. The user sees the label color and score.
2. The user reads the anomaly explanation.
3. The user checks whether volume, volatility, or spread behavior looked unusual.
4. The user decides to avoid blind trust in the move.

### Expected Outcome
The user gets enough context to act cautiously, not just a warning label.

### Success Signals
- Explanation references real computed values.
- Visuals and label match the warning.
- The user can tell which signal likely triggered the alert.

---

## 10. Journey 8 — Stable Result Review

### Goal
Reassure the user when the move looks structurally normal.

### Trigger
The app returns a Stable label.

### Preconditions
- The score is in the Stable range.

### Steps
1. The user views the score.
2. The user sees the teal/positive label.
3. The user compares the charts with the explanation.
4. The user gains confidence that the move is not obviously manipulated.

### Expected Outcome
The user gets a calm, trustworthy signal that the market action looks consistent with historical behavior.

### Success Signals
- Score is clearly within the Stable band.
- Explanation does not overstate certainty.
- User sees the score as a check, not a prediction.

---

## 11. Journey 9 — Presenter Walkthrough During a Demo

### Goal
Support a live explanation of the product in under a minute.

### Trigger
The user is presenting the product to someone else.

### Preconditions
- The app is already open.
- A demo ticker is ready.

### Steps
1. The presenter types a ticker.
2. The app returns a score.
3. The presenter points to the gauge first.
4. The presenter points to the chart next.
5. The presenter explains the anomaly card in plain English.
6. The presenter finishes by explaining the product’s core value: structural integrity, not price prediction.

### Expected Outcome
The product is easy to demo and explain without needing technical deep-dives.

### Success Signals
- A non-technical audience can follow the flow.
- The UI supports narration naturally.
- The product message lands clearly.

---

## 12. Journey 10 — Developer Extends the Product Later

### Goal
Make the system easy to expand in future versions.

### Trigger
A developer wants to add more features later.

### Preconditions
- The codebase is modular.
- The signal engine is separated from UI logic.

### Steps
1. The developer inspects the file structure.
2. The developer identifies where fetch, signals, anomaly scoring, and UI live.
3. The developer adds a new feature or signal.
4. The developer tests whether the Trust Score still works.
5. The developer updates the UI if needed.

### Expected Outcome
The product stays maintainable and extensible.

### Success Signals
- Logic is modular.
- Components are reusable.
- Future changes do not require rewriting the whole app.

---

## 13. Cross-Journey Product Principles

These rules should remain true across all journeys:

- The app should always feel fast.
- Errors should be graceful and understandable.
- The Trust Score should always come from actual computed values.
- The visual state should match the classification state.
- Explanations should be plain-English, not math-heavy.
- The UI should remain dark, polished, and consistent.
- The product should analyze market structure, not predict direction.

---

## 14. Edge Cases to Handle

- Empty input
- Invalid ticker format
- Delisted or unknown ticker
- Network timeout
- Missing OHLCV data
- Fewer than 20 data points
- NaN values in computed signals
- Offline fallback not available
- ML model instability on thin data

---

## 15. Recommended Implementation Order

1. Ticker input and validation
2. OHLCV data fetch and fallback
3. Signal computation
4. Trust Score synthesis
5. Classification labels
6. Explanation card
7. Charts and gauge
8. Error states
9. Historical mode
10. Demo polish

---

## 16. One-Sentence Product Story

GHOSTRADE helps a trader quickly tell whether a stock move looks statistically real or structurally suspicious.
