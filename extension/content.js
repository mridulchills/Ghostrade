console.log('%c[Ghostrade] Content Script Active', 'color: #4cd7f6; font-weight: bold;');

function getTicker() {
  // 1. Try URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  let ticker = urlParams.get('symbol');
  
  // 2. Try Title (Format: "TICKER Chart - TradingView")
  if (!ticker) {
    const title = document.title;
    const match = title.match(/^([A-Z0-9]+)\b/);
    if (match) ticker = match[1];
  }

  // 3. Try to find any element with 'symbol' in its class or ID
  if (!ticker) {
    const symbolElement = document.querySelector('[class*="symbol"], [id*="symbol"]');
    if (symbolElement && symbolElement.innerText.length < 10) {
      ticker = symbolElement.innerText;
    }
  }

  if (ticker) {
    ticker = decodeURIComponent(ticker).trim();
    if (ticker.includes(':')) ticker = ticker.split(':')[1];
    if (ticker.includes('-')) ticker = ticker.split('-')[1];
    return ticker.toUpperCase();
  }

  return null;
}

// Update storage immediately and on interval
function syncTicker() {
  const ticker = getTicker();
  if (ticker) {
    chrome.storage.local.set({ currentTicker: ticker }, () => {
      console.log('[Ghostrade] Synced ticker:', ticker);
    });
  } else {
    console.warn('[Ghostrade] No ticker found on this page.');
  }
}

// Run every 1 second
setInterval(syncTicker, 1000);
syncTicker();
