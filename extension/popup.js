const API_URL = 'https://ghostrade-v2.onrender.com/api/analyze';

const TICKER_MAP = {
  "NDX": "^NDX",     // Nasdaq 100
  "IXIC": "^IXIC",   // Nasdaq Composite
  "SPX": "^GSPC",    // S&P 500
  "DJI": "^DJI",     // Dow Jones
  "GOLD": "GC=F",    // Gold Futures
  "SILVER": "SI=F",  // Silver Futures
  "BTC": "BTC-USD",  // Bitcoin
  "ETH": "ETH-USD",  // Ethereum
};

async function updateUI() {
  const loader = document.getElementById('loader');
  const content = document.getElementById('content');
  const errorMsg = document.getElementById('error');

  // Get current ticker from storage
  chrome.storage.local.get(['currentTicker'], async (result) => {
    let rawTicker = result.currentTicker;
    
    if (!rawTicker) {
      document.getElementById('ticker-name').innerText = 'NO TICKER DETECTED';
      loader.style.display = 'none';
      content.style.display = 'none';
      errorMsg.style.display = 'block';
      errorMsg.innerText = 'Please open a TradingView chart tab';
      return;
    }
    
    // Map TradingView ticker to Backend/Yahoo ticker
    const ticker = TICKER_MAP[rawTicker] || rawTicker;
    
    console.log('[Ghostrade] Fetching for:', ticker);
    document.getElementById('ticker-name').innerText = rawTicker;

    loader.style.display = 'block';
    content.style.display = 'none';
    errorMsg.style.display = 'none';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ ticker })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      console.log('[Ghostrade] Received Data:', data);

      // Update trust score
      const score = data.result.trust_score || 0;
      const trustScoreEl = document.getElementById('trust-score');
      trustScoreEl.innerText = score;
      
      const badge = document.getElementById('status-badge');
      badge.innerText = data.result.label;
      
      // Reset classes
      badge.className = 'status-badge';
      if (score <= 40) {
        badge.classList.add('status-ghost');
        trustScoreEl.style.color = '#ffb4ab';
      } else if (score < 70) {
        badge.classList.add('status-suspicious');
        trustScoreEl.style.color = '#f0c040';
      } else {
        badge.classList.add('status-stable');
        trustScoreEl.style.color = '#4edea3';
      }

      // Update 4 parameters with higher precision (4 decimal places)
      document.getElementById('val-vai').innerText = (data.signals?.VAI?.z_score || 0).toFixed(4) + 'σ';
      document.getElementById('val-vbs').innerText = (data.signals?.VBS?.z_score || 0).toFixed(4) + 'σ';
      document.getElementById('val-pvd').innerText = (data.signals?.PVD?.z_score || 0).toFixed(4) + 'σ';
      document.getElementById('val-lip').innerText = (data.signals?.LIP?.z_score || 0).toFixed(4) + 'σ';

      loader.style.display = 'none';
      content.style.display = 'block';
    } catch (err) {
      console.error(err);
      loader.style.display = 'none';
      errorMsg.style.display = 'block';
      errorMsg.innerText = 'Backend disconnected or invalid ticker';
    }
  });
}

// Run on load
updateUI();

// Also update when storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.currentTicker) {
    updateUI();
  }
});
