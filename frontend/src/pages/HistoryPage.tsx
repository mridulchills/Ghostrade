import { Link, useParams, useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import Plot from 'react-plotly.js'
import { useState, useEffect } from 'react'
import type { AnalyzeResponse } from '../types'
import { API_URL } from '../config'

export default function HistoryPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyzeResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRangeOpen, setIsRangeOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState('LAST 30 DAYS')

  useEffect(() => {
    if (!ticker) return

    let isMounted = true
    setLoading(true)
    setError(null)
    setData(null)

    fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker })
    })
      .then(res => res.json().then(json => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!isMounted) return
        if (!ok) throw new Error(json.detail || 'Failed to fetch data')
        setData(json)
      })
      .catch(err => {
        if (isMounted) setError(err.message)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [ticker])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/dashboard/${searchQuery.trim().toUpperCase()}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
          <span className="text-primary font-data-mono tracking-widest uppercase">Fetching Historical Data for {ticker}...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-black border border-white/[0.06] shadow-[0_0_60px_rgba(255,100,100,0.04)] p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-6 rounded-xl flex items-center justify-center bg-error/10 border border-error/20">
            <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Analysis Failed</h2>
          <p className="text-sm text-neutral-400 leading-relaxed mb-8 break-words">
            {error || 'Unknown error occurred'}
          </p>
          <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] text-neutral-500 hover:text-neutral-200 transition-colors tracking-widest"
          >
            ← RETURN TO HUB
          </Link>
        </div>
      </div>
    )
  }

  // Filter data based on selected range
  let filteredChartData = data.chart_data
  if (selectedRange === 'LAST 7 DAYS') {
    filteredChartData = data.chart_data.slice(-7)
  } else if (selectedRange === 'LAST 30 DAYS') {
    filteredChartData = data.chart_data.slice(-30)
  } else if (selectedRange === 'LAST 90 DAYS') {
    filteredChartData = data.chart_data.slice(-90)
  }

  // Derive dynamic stats from filtered data
  const anomalies = filteredChartData.filter(d => d.is_anomaly)

  // Find "Major Event" (highest VBS_z or PVD_z)
  const majorEvent = anomalies.length > 0
    ? anomalies.reduce((max, current) => {
      const currentZ = Math.abs(current.VBS_z || 0) + Math.abs(current.VAI_z || 0) + Math.abs(current.PVD_z || 0)
      const maxZ = Math.abs(max.VBS_z || 0) + Math.abs(max.VAI_z || 0) + Math.abs(max.PVD_z || 0)
      return currentZ > maxZ ? current : max
    })
    : null

  // Approximate historical trust (starts at 100, drops on anomalies)
  let currentTrust = 100
  const trustTimelineX: string[] = []
  const trustTimelineY: number[] = []

  filteredChartData.forEach(d => {
    trustTimelineX.push(d.date)
    if (d.is_anomaly) {
      currentTrust = Math.max(10, currentTrust - Math.abs((d.VBS_z || 2) * 5))
    } else {
      currentTrust = Math.min(100, currentTrust + 2) // recovers slowly
    }
    trustTimelineY.push(currentTrust)
  })

  const avgTrust = trustTimelineY.length > 0 ? (trustTimelineY.reduce((a, b) => a + b, 0) / trustTimelineY.length).toFixed(1) : '100.0'

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <div className="flex-1 flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="sticky top-0 z-50 flex justify-between items-center px-8 h-16 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-black tracking-tighter text-white-500">GHOSTRADE</Link>
            <nav className="hidden md:flex gap-6">
              <Link to={`/dashboard/${ticker || 'TSLA'}`} className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-neutral-500 hover:text-neutral-200 transition-colors">Dashboard</Link>
              <Link to={`/history/${ticker || 'TSLA'}`} className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-white-400 border-b-2 border-white-500 pb-1">History</Link>
              <Link to="/watchlist" className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-neutral-500 hover:text-neutral-200 transition-colors">Watchlist</Link>
              <Link to="/alerts" className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-neutral-500 hover:text-neutral-200 transition-colors">Alerts</Link>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <form onSubmit={handleSearch} className="hidden lg:flex items-center bg-surface-container-low border border-white/5 px-3 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-neutral-500 text-sm">search</span>
              <input
                type="text"
                className="bg-transparent border-none focus:ring-0 text-xs font-data-mono w-48 placeholder:text-neutral-600 outline-none ml-2"
                placeholder="Search NVDA, AAPL, BTC..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </form>
            {/* User icons removed */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-display-lg font-display-lg text-on-background mb-2">Historical Analysis: {ticker?.toUpperCase()}</h1>
              <div className="flex items-center gap-4 text-data-mono">
                <span className="text-neutral-500 uppercase">Analysis Window:</span>
                <span className="text-white-400">{selectedRange}</span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsRangeOpen(!isRangeOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-white-500/50 rounded hover:bg-white-500/10 transition-all font-data-mono text-xs"
              >
                <span className="material-symbols-outlined text-sm">date_range</span>
                SELECT RANGE
              </button>
              {isRangeOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-low border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                  {['LAST 7 DAYS', 'LAST 30 DAYS', 'LAST 90 DAYS'].map(range => (
                    <button
                      key={range}
                      onClick={() => { setSelectedRange(range); setIsRangeOpen(false) }}
                      className="block w-full text-left px-4 py-3 text-xs font-data-mono hover:bg-white-500/10 text-neutral-300 hover:text-white-400 transition-colors border-b border-white/5 last:border-0"
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-neutral-500 font-label-caps mb-1">TOTAL EVENTS LOGGED</div>
                <div className="text-3xl font-data-mono">{filteredChartData.length}</div>
              </div>
              <span className="material-symbols-outlined text-4xl text-neutral-700">history</span>
            </div>
            <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-neutral-500 font-label-caps mb-1">CRITICAL ANOMALIES</div>
                <div className={`text-3xl font-data-mono ${anomalies.length > 0 ? 'text-error' : 'text-secondary'}`}>{anomalies.length}</div>
              </div>
              <span className={`material-symbols-outlined text-4xl ${anomalies.length > 0 ? 'text-error/30' : 'text-secondary/30'}`}>{anomalies.length > 0 ? 'warning' : 'security'}</span>
            </div>
            <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-neutral-500 font-label-caps mb-1">AVERAGE INTEGRITY SCORE</div>
                <div className="text-3xl font-data-mono text-secondary">{avgTrust}</div>
              </div>
              <span className="material-symbols-outlined text-4xl text-secondary/30">check_circle</span>
            </div>
          </div>

          {/* Comparative Scoring Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={`glass-panel p-8 rounded-xl border-l-4 ${majorEvent ? 'border-l-error' : 'border-l-secondary'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-heading-md text-xl mb-1">{majorEvent ? 'Major Event: Structural Deviation' : 'System Stable: No Major Events'}</h3>
                  <div className="text-xs text-neutral-500 font-data-mono">TIMESTAMP: {majorEvent ? majorEvent.date : new Date().toISOString().split('T')[0]}</div>
                </div>
                {majorEvent && <div className="px-3 py-1 bg-error/20 text-error rounded font-label-caps text-[10px]">ANOMALY FLAG</div>}
              </div>

              {majorEvent ? (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-[10px] text-neutral-500 font-label-caps mb-1">VOLUME DEVIATION</div>
                      <div className="text-2xl font-data-mono text-error">+{Math.abs(majorEvent.VAI_z || 0).toFixed(2)}σ</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 font-label-caps mb-1">VOLATILITY SHIFT</div>
                      <div className="text-2xl font-data-mono text-error">+{Math.abs(majorEvent.VBS_z || 0).toFixed(2)}σ</div>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant font-body-main">
                    Sudden withdrawal of order book depth combined with volume spikes. The VAI Engine flagged structural weakness on this date with significant Z-score deviations from the 30-day mean.
                  </p>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant font-body-main mt-4">
                  The market structure for {ticker?.toUpperCase()} has remained consistently stable within normal statistical boundaries.
                </p>
              )}
            </div>

            <div className="glass-panel p-8 rounded-xl">
              <h3 className="font-heading-md text-lg mb-6">Historical Trust Timeline</h3>
              <div className="h-48 w-full">
                <Plot
                  data={[
                    {
                      x: trustTimelineX,
                      y: trustTimelineY,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Trust Score',
                      line: { color: '#4edea3', width: 2, shape: 'spline' },
                      fill: 'tozeroy',
                      fillcolor: 'rgba(78, 222, 163, 0.1)'
                    }
                  ]}
                  layout={{
                    autosize: true,
                    margin: { t: 10, b: 30, l: 30, r: 10 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#e5e2e1', family: 'Space Grotesk' },
                    xaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.05)', color: '#869397' },
                    yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.05)', color: '#869397', range: [0, 100] },
                    hovermode: 'x unified',
                    showlegend: false
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </div>
            </div>
          </div>

          {/* Event Log Table */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-heading-md text-lg">Detailed Event Log</h3>
              <button className="text-white-400 text-xs font-data-mono hover:underline">EXPORT CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-data-mono text-sm">
                <thead className="bg-white/5 text-neutral-400 text-[10px] font-label-caps uppercase">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Event Type</th>
                    <th className="p-4">Asset</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Peak Deviation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {anomalies.length > 0 ? anomalies.slice().reverse().map((a, i) => {
                    const maxZ = Math.max(Math.abs(a.VAI_z || 0), Math.abs(a.VBS_z || 0), Math.abs(a.PVD_z || 0))
                    let severity = 'INFO'
                    let sevClass = 'bg-secondary/20 text-secondary'
                    if (maxZ > 3) { severity = 'CRITICAL'; sevClass = 'bg-error/20 text-error' }
                    else if (maxZ > 2) { severity = 'WARNING'; sevClass = 'bg-[#f0c040]/20 text-[#f0c040]' }

                    return (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-neutral-300">{a.date}</td>
                        <td className="p-4 text-white">Structural Variance</td>
                        <td className="p-4">{ticker?.toUpperCase()}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] ${sevClass}`}>{severity}</span></td>
                        <td className="p-4" style={{ color: maxZ > 3 ? '#ffb4ab' : maxZ > 2 ? '#f0c040' : '#4edea3' }}>+{maxZ.toFixed(2)}σ</td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-500 font-body-main">
                        No structural anomalies detected in the current historical window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
