import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

// ── Types ─────────────────────────────────────────────────────────────────
interface SignalInfo {
  name: string
  z_score: number
  sigma: number
  flagged: boolean
  status: 'NORMAL' | 'WARNING' | 'CRITICAL'
  icon: string
}

interface WatchlistItem {
  ticker: string
  trust_score?: number
  label?: string
  close?: number
  change_pct?: number
  volume_spike_pct?: number
  price_delta_30d?: number
  anomaly_days?: number
  active_signals?: number
  top_flag?: string
  top_flag_sigma?: number
  signals?: Record<string, SignalInfo>
  error?: string
  loading?: boolean
}

type SortKey = 'ticker' | 'trust_score' | 'close' | 'change_pct' | 'anomaly_days'

// ── Helpers ───────────────────────────────────────────────────────────────
const scoreColor = (score?: number) => {
  if (score == null) return '#869397'
  if (score <= 40) return '#ffb4ab'
  if (score <= 69) return '#f0c040'
  return '#4edea3'
}

const scoreLabel = (label?: string) => label?.toUpperCase() ?? '—'

const statusBadge = (status: string) => {
  if (status === 'CRITICAL') return 'bg-red-500/20 text-red-400'
  if (status === 'WARNING')  return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-emerald-500/20 text-emerald-400'
}

const DEFAULT_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL']

// ── Component ─────────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const navigate = useNavigate()
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<string, WatchlistItem>>({})
  const [analyzing, setAnalyzing] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('ticker')
  const [sortAsc, setSortAsc] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const addTicker = () => {
    const raw = input.trim().toUpperCase()
    if (!raw || tickers.includes(raw) || tickers.length >= 20) return
    setTickers(prev => [...prev, raw])
    setInput('')
  }

  const removeTicker = (t: string) => {
    setTickers(prev => prev.filter(x => x !== t))
    setResults(prev => { const n = { ...prev }; delete n[t]; return n })
  }

  const analyzeAll = useCallback(async () => {
    if (!tickers.length) return
    setAnalyzing(true)
    // set all to loading
    const loadingState: Record<string, WatchlistItem> = {}
    tickers.forEach(t => { loadingState[t] = { ticker: t, loading: true } })
    setResults(loadingState)

    try {
      const res = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      })
      const data = await res.json()
      const mapped: Record<string, WatchlistItem> = {}
      ;(data.results as WatchlistItem[]).forEach(r => { mapped[r.ticker] = { ...r, loading: false } })
      setResults(mapped)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      const errState: Record<string, WatchlistItem> = {}
      tickers.forEach(t => { errState[t] = { ticker: t, error: 'Network error', loading: false } })
      setResults(errState)
    } finally {
      setAnalyzing(false)
    }
  }, [tickers])

  const sortedTickers = [...tickers].sort((a, b) => {
    const ra = results[a], rb = results[b]
    let va: number | string = a, vb: number | string = b
    if (sortKey === 'trust_score') { va = ra?.trust_score ?? -1; vb = rb?.trust_score ?? -1 }
    else if (sortKey === 'close') { va = ra?.close ?? 0; vb = rb?.close ?? 0 }
    else if (sortKey === 'change_pct') { va = ra?.change_pct ?? 0; vb = rb?.change_pct ?? 0 }
    else if (sortKey === 'anomaly_days') { va = ra?.anomaly_days ?? 0; vb = rb?.anomaly_days ?? 0 }
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
    return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p)
    else { setSortKey(key); setSortAsc(true) }
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 text-[10px]" style={{ opacity: sortKey === k ? 1 : 0.3 }}>
      {sortKey === k ? (sortAsc ? '▲' : '▼') : '⇅'}
    </span>
  )

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <div className="flex-1 flex flex-col min-h-screen">

        {/* TopBar */}
        <header className="sticky top-0 z-50 flex justify-between items-center px-8 h-16 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-black tracking-tighter text-cyan-500">GHOSTRADE</Link>
            <nav className="hidden md:flex gap-6">
              <Link to="/dashboard/AAPL" className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-neutral-500 hover:text-neutral-200 transition-colors">Dashboard</Link>
              <Link to="/history/AAPL"  className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-neutral-500 hover:text-neutral-200 transition-colors">History</Link>
              <span className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-cyan-400 border-b-2 border-cyan-500 pb-1">Watchlist</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] font-data-mono text-neutral-500 hidden lg:block">
                UPDATED {lastUpdated}
              </span>
            )}
            <button
              onClick={analyzeAll}
              disabled={analyzing || tickers.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold rounded transition-all active:scale-95"
            >
              <span className={`material-symbols-outlined text-sm ${analyzing ? 'animate-spin' : ''}`}>
                {analyzing ? 'sync' : 'play_arrow'}
              </span>
              {analyzing ? 'ANALYZING...' : 'ANALYZE ALL'}
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {/* Page Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-cyan-500">bookmark</span>
              <h1 className="text-3xl font-black tracking-tight text-white">WATCHLIST</h1>
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded">
                {tickers.length}/20
              </span>
            </div>
            <p className="text-neutral-500 text-sm font-data-mono">
              Monitor up to 20 assets — trust scores & integrity signals in one panel
            </p>
          </div>

          {/* Add Ticker Row */}
          <div className="glass-panel rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px] bg-surface-container-low border border-white/5 px-3 py-2 rounded-lg">
              <span className="material-symbols-outlined text-neutral-500 text-sm">add_circle</span>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && addTicker()}
                placeholder="Add ticker… NVDA, MSFT, BTC-USD"
                className="bg-transparent outline-none text-sm font-data-mono flex-1 placeholder:text-neutral-600"
              />
            </div>
            <button
              onClick={addTicker}
              disabled={!input.trim() || tickers.length >= 20}
              className="px-4 py-2 border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + ADD
            </button>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex flex-wrap gap-2">
              {tickers.map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-1 bg-surface-container-highest rounded text-xs font-data-mono text-neutral-300">
                  {t}
                  <button onClick={() => removeTicker(t)} className="text-neutral-600 hover:text-red-400 transition-colors ml-1">×</button>
                </span>
              ))}
            </div>
            {tickers.length > 0 && (
              <button
                onClick={() => { setTickers([]); setResults({}) }}
                className="text-neutral-600 hover:text-red-400 text-xs font-data-mono transition-colors"
              >
                CLEAR ALL
              </button>
            )}
          </div>

          {/* Watchlist Table */}
          {tickers.length === 0 ? (
            <div className="glass-panel rounded-xl p-16 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-5xl text-neutral-700 mb-4">playlist_add</span>
              <h3 className="text-white font-bold mb-2">Your watchlist is empty</h3>
              <p className="text-neutral-500 text-sm">Add tickers above and click ANALYZE ALL to begin monitoring.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1.5fr_1fr_1.2fr_1fr_2fr_1fr_auto] gap-0 px-4 py-3 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-white/5">
                <button onClick={() => handleSort('ticker')} className="text-left flex items-center hover:text-neutral-200 transition-colors">TICKER<SortIcon k="ticker"/></button>
                <button onClick={() => handleSort('trust_score')} className="text-left flex items-center hover:text-neutral-200 transition-colors">TRUST<SortIcon k="trust_score"/></button>
                <button onClick={() => handleSort('close')} className="text-left flex items-center hover:text-neutral-200 transition-colors">PRICE<SortIcon k="close"/></button>
                <button onClick={() => handleSort('change_pct')} className="text-left flex items-center hover:text-neutral-200 transition-colors">CHG%<SortIcon k="change_pct"/></button>
                <span>SIGNALS — VAI · VBS · PVD · LIP</span>
                <button onClick={() => handleSort('anomaly_days')} className="text-left flex items-center hover:text-neutral-200 transition-colors">FLAGS<SortIcon k="anomaly_days"/></button>
                <span>ACTION</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                {sortedTickers.map(t => {
                  const r = results[t]
                  const isLoading = r?.loading
                  const hasError = r?.error
                  const sc = scoreColor(r?.trust_score)

                  return (
                    <div
                      key={t}
                      className="grid grid-cols-[1.5fr_1fr_1.2fr_1fr_2fr_1fr_auto] gap-0 px-4 py-4 items-center hover:bg-white/5 transition-colors group"
                    >
                      {/* Ticker */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-[10px] font-black text-cyan-400">
                          {t.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{t}</div>
                          {r?.top_flag && !isLoading && (
                            <div className="text-[10px] text-neutral-600 truncate max-w-[100px]">{r.top_flag}</div>
                          )}
                        </div>
                      </div>

                      {/* Trust Score */}
                      <div>
                        {isLoading ? (
                          <div className="h-5 w-16 bg-surface-container-highest animate-pulse rounded" />
                        ) : hasError ? (
                          <span className="text-error text-xs font-data-mono">ERROR</span>
                        ) : (
                          <div>
                            <div className="font-bold font-data-mono text-lg" style={{ color: sc }}>
                              {r?.trust_score ?? '—'}
                            </div>
                            <div className="text-[10px]" style={{ color: sc }}>{scoreLabel(r?.label)}</div>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div>
                        {isLoading ? (
                          <div className="h-5 w-20 bg-surface-container-highest animate-pulse rounded" />
                        ) : (
                          <span className="font-data-mono text-sm text-white">
                            {r?.close != null ? `$${r.close.toFixed(2)}` : '—'}
                          </span>
                        )}
                      </div>

                      {/* Change % */}
                      <div>
                        {isLoading ? (
                          <div className="h-4 w-12 bg-surface-container-highest animate-pulse rounded" />
                        ) : r?.change_pct != null ? (
                          <span className={`font-data-mono text-sm font-bold ${r.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.change_pct >= 0 ? '+' : ''}{r.change_pct.toFixed(2)}%
                          </span>
                        ) : <span className="text-neutral-600">—</span>}
                      </div>

                      {/* Signal Badges */}
                      <div className="flex gap-1 flex-wrap">
                        {isLoading ? (
                          <>
                            {['VAI','VBS','PVD','LIP'].map(s => (
                              <div key={s} className="h-6 w-14 bg-surface-container-highest animate-pulse rounded" />
                            ))}
                          </>
                        ) : r?.signals ? (
                          ['VAI','VBS','PVD','LIP'].map(key => {
                            const sig = r.signals![key]
                            if (!sig) return null
                            return (
                              <span
                                key={key}
                                title={`${sig.name}: ${sig.z_score > 0 ? '+' : ''}${sig.z_score.toFixed(2)}σ`}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge(sig.status)}`}
                              >
                                {key} {sig.z_score > 0 ? '+' : ''}{sig.z_score.toFixed(1)}σ
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-neutral-600 text-xs font-data-mono">
                            {hasError ? hasError.slice(0, 40) : 'Run analysis'}
                          </span>
                        )}
                      </div>

                      {/* Anomaly Days */}
                      <div>
                        {isLoading ? (
                          <div className="h-4 w-8 bg-surface-container-highest animate-pulse rounded" />
                        ) : r?.anomaly_days != null ? (
                          <span className={`font-data-mono text-sm font-bold ${r.anomaly_days > 5 ? 'text-red-400' : r.anomaly_days > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {r.anomaly_days}d
                          </span>
                        ) : <span className="text-neutral-600">—</span>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/dashboard/${t}`)}
                          title="Open Dashboard"
                          className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                        <button
                          onClick={() => removeTicker(t)}
                          title="Remove"
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/30 text-red-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary Cards (shown after analysis) */}
          {Object.keys(results).length > 0 && !analyzing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                {
                  label: 'GHOST TRADES',
                  icon: 'warning',
                  color: '#ffb4ab',
                  value: Object.values(results).filter(r => !r.error && r.trust_score != null && r.trust_score <= 40).length,
                },
                {
                  label: 'SUSPICIOUS',
                  icon: 'visibility',
                  color: '#f0c040',
                  value: Object.values(results).filter(r => !r.error && r.trust_score != null && r.trust_score > 40 && r.trust_score <= 69).length,
                },
                {
                  label: 'STABLE',
                  icon: 'check_circle',
                  color: '#4edea3',
                  value: Object.values(results).filter(r => !r.error && r.trust_score != null && r.trust_score > 69).length,
                },
                {
                  label: 'ERRORS',
                  icon: 'error',
                  color: '#869397',
                  value: Object.values(results).filter(r => !!r.error).length,
                },
              ].map(card => (
                <div key={card.label} className="glass-panel rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-500 font-label-caps mb-1">{card.label}</div>
                    <div className="text-3xl font-data-mono font-bold" style={{ color: card.color }}>{card.value}</div>
                  </div>
                  <span className="material-symbols-outlined text-3xl" style={{ color: card.color, opacity: 0.3 }}>
                    {card.icon}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-6 text-[10px] font-data-mono text-neutral-600">
            GHOSTRADE WATCHLIST · UP TO 20 ASSETS · DATA VIA YFINANCE
          </div>
        </main>
      </div>
    </div>
  )
}
