import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import Plot from 'react-plotly.js'
import LiquidLoader from '../components/LiquidLoader'
import type { AnalyzeResponse } from '../types'
import { API_URL } from '../config'

export default function DashboardPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyzeResponse | null>(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [searchQuery, setSearchQuery] = useState('')

  const tabMap: Record<string, string> = {
    'VAI Engine': 'VAI',
    'VBS Flow': 'VBS',
    'PVD Drift': 'PVD',
    'LIP Analysis': 'LIP'
  }

  useEffect(() => {
    if (!ticker) return
    
    let isMounted = true
    setLoading(true)
    setError(null)
    setData(null)
    setActiveTab('Overview')

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

  const handleExport = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ticker}_ghostrade_report.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center transition-opacity duration-1000">
        <LiquidLoader size={280} />
        <div className="mt-8 text-primary font-data-mono tracking-widest uppercase animate-pulse">
          Analyzing Market Structure for {ticker}...
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
          <p className="text-sm text-neutral-400 font-mono leading-relaxed mb-8 break-words">
            {error || 'Unknown error occurred'}
          </p>
          <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] text-neutral-500 font-mono hover:text-neutral-200 transition-colors tracking-widest"
          >
            ← RETURN TO HUB
          </Link>
        </div>
      </div>
    )
  }

  const plotTheme = {
    bg: 'transparent',
    text: '#e5e2e1',
    grid: 'rgba(255,255,255,0.05)',
    primary: '#4cd7f6',
    secondary: '#4edea3',
    error: '#ffb4ab'
  }

  const latestPrice = data.chart_data[data.chart_data.length - 1]?.close?.toFixed(2) || '0.00'
  const isGhostTrade = data.result.trust_score <= 40
  const isSuspicious = data.result.trust_score > 40 && data.result.trust_score < 70
  const scoreColor = isGhostTrade ? 'var(--color-error)' : isSuspicious ? '#f0c040' : 'var(--color-secondary)'
  const scoreLabelColorClass = isGhostTrade ? 'text-error' : isSuspicious ? 'text-[#f0c040]' : 'text-secondary'

  const sidebarItems = [
    { id: 'Overview', icon: 'grid_view' },
    { id: 'VAI Engine', icon: 'psychology' },
    { id: 'VBS Flow', icon: 'waves' },
    { id: 'PVD Drift', icon: 'analytics' },
    { id: 'LIP Analysis', icon: 'security' }
  ]

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 dark:bg-neutral-950 border-r border-white/5 flex flex-col z-40 shadow-2xl shadow-cyan-900/5 hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 bg-secondary rounded-full shadow-[0_0_8px_#4edea3]"></div>
            <span className="text-cyan-500 font-bold uppercase text-xs tracking-widest">INTEGRITY ENGINE</span>
          </div>
          <p className="text-[10px] text-neutral-500 font-data-mono uppercase">V2.04 ACTIVE // SYSTEM_STABLE</p>
        </div>
        
        <nav className="flex-1 py-4 flex flex-col">
          {sidebarItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-6 py-3 transition-all duration-200 ${activeTab === item.id ? 'bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-500' : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-sm">{item.icon}</span>
              <span className="font-['Inter'] uppercase text-[11px] font-bold tracking-widest">{item.id}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 mt-auto border-t border-white/5">
          <button className="w-full bg-black text-black font-label-caps text-[10px] py-3 rounded hover:bg-black transition-all active:scale-95">
            RUN DIAGNOSTICS
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="sticky top-0 z-50 flex justify-between items-center px-8 h-16 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-black tracking-tighter text-cyan-500">GHOSTRADE</Link>
            <nav className="hidden md:flex gap-6">
              <Link to={`/dashboard/${ticker || 'TSLA'}`} className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-cyan-400 border-b-2 border-cyan-500 pb-1">Dashboard</Link>
              <Link to={`/history/${ticker || 'TSLA'}`} className="font-['Inter'] tracking-tight text-sm uppercase font-semibold text-neutral-500 hover:text-neutral-200 transition-colors">History</Link>
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
          {/* Critical Alert Banner */}
          {isGhostTrade && (
            <div className="mb-8 glass-panel p-4 rounded-xl border-l-4 border-l-error border-y border-r border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-error/10 rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <div>
                  <h2 className="font-display-lg text-xl text-white leading-none">GHOST TRADE DETECTED</h2>
                  <p className="text-neutral-400 font-data-mono text-xs mt-1">ASSET: {ticker?.toUpperCase()} | STRUCTURAL ANOMALY DETECTED</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-error/20 text-error text-[10px] font-bold rounded">HIGH URGENCY</span>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-display-lg font-display-lg text-on-background">{ticker?.toUpperCase()}</h1>
                <span className="text-xl text-neutral-500 font-light">Live Analysis</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-data-mono text-secondary">
                  ${latestPrice} 
                </span>
                <span className="text-xs text-neutral-500 font-data-mono tracking-widest uppercase">
                  Real-time Data Stream Enabled
                </span>
              </div>
            </div>
            
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-cyan-500/50 rounded hover:bg-cyan-500/10 transition-all font-data-mono text-xs text-cyan-400">
              <span className="material-symbols-outlined text-sm">download</span>
              EXPORT REPORT
            </button>
          </div>

          {/* Active Tab State Render */}
          {activeTab !== 'Overview' && (() => {
            const sigKey = tabMap[activeTab]
            if (!sigKey || !data.signals || !data.signals[sigKey]) return (
              <div className="flex flex-col items-center justify-center h-full pt-32">
                <h2 className="text-2xl font-bold text-white tracking-tight">{activeTab} Module</h2>
              </div>
            )
            
            const sig = data.signals[sigKey]
            const isCrit = sig.status === 'CRITICAL'
            const isWarning = sig.status === 'WARNING'
            const textClass = isCrit ? 'text-error' : isWarning ? 'text-[#f0c040]' : 'text-secondary'

            return (
              <div className="flex flex-col h-full animate-in fade-in duration-500">
                <div className="glass-panel p-6 rounded-xl border border-white/5 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center bg-black/50 border border-white/10 ${isCrit ? 'shadow-[0_0_20px_rgba(255,180,171,0.2)]' : ''}`}>
                      <span className={`material-symbols-outlined text-4xl ${textClass}`}>{sig.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">{sig.name}</h2>
                      <div className="flex gap-4 mt-2 font-data-mono text-sm">
                        <span className="text-neutral-400">Current Z-Score: <span className={textClass}>{sig.z_score.toFixed(3)}</span></span>
                        <span className="text-neutral-400">Deviation: <span className="text-white">{sig.sigma.toFixed(2)}σ</span></span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('Overview')} className="text-neutral-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="flex-1 glass-panel rounded-xl border border-white/5 p-6 min-h-[400px]">
                   <Plot
                      data={[
                        {
                          x: data.chart_data.map((d: any) => d.date),
                          y: data.chart_data.map((d: any) => d[`${sigKey}_z`]),
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: `${sigKey} Z-Score`,
                          line: { color: isCrit ? plotTheme.error : plotTheme.primary, width: 2 },
                          marker: { size: 4 }
                        },
                        {
                          x: [data.chart_data[0]?.date, data.chart_data[data.chart_data.length-1]?.date],
                          y: [1, 1],
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Warning Threshold',
                          line: { color: '#f0c040', width: 1, dash: 'dash' }
                        },
                        {
                          x: [data.chart_data[0]?.date, data.chart_data[data.chart_data.length-1]?.date],
                          y: [-1, -1],
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Warning Threshold (-)',
                          line: { color: '#f0c040', width: 1, dash: 'dash' },
                          showlegend: false
                        },
                        {
                          x: [data.chart_data[0]?.date, data.chart_data[data.chart_data.length-1]?.date],
                          y: [2.5, 2.5],
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Critical Threshold',
                          line: { color: plotTheme.error, width: 1, dash: 'dash' }
                        },
                        {
                          x: [data.chart_data[0]?.date, data.chart_data[data.chart_data.length-1]?.date],
                          y: [-2.5, -2.5],
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Critical Threshold (-)',
                          line: { color: plotTheme.error, width: 1, dash: 'dash' },
                          showlegend: false
                        }
                      ]}
                      layout={{
                        autosize: true,
                        margin: { t: 20, b: 30, l: 40, r: 20 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: { color: '#e5e2e1', family: 'Space Grotesk' },
                        xaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.05)', color: '#869397' },
                        yaxis: { title: 'Z-Score Deviation', showgrid: true, gridcolor: 'rgba(255,255,255,0.05)', color: '#869397' },
                        hovermode: 'x unified',
                        showlegend: true,
                        legend: { orientation: 'h', y: 1.1 }
                      }}
                      useResizeHandler={true}
                      style={{ width: '100%', height: '100%' }}
                      config={{ displayModeBar: false }}
                    />
                </div>
              </div>
            )
          })()}

          {/* Dashboard Content */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Trust Score Gauge */}
              <div className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] via-transparent to-transparent pointer-events-none"
                  style={{ '--tw-gradient-from': scoreColor } as React.CSSProperties}
                ></div>
                <div className="text-neutral-500 font-label-caps text-[10px] mb-2">TRUST SCORE</div>
                <div className="text-5xl font-bold font-data-mono tracking-tighter" style={{ color: scoreColor }}>{data.result.trust_score}</div>
                <div className={`mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full border ${isGhostTrade ? 'bg-error/10 border-error/20' : isSuspicious ? 'bg-[#f0c040]/10 border-[#f0c040]/20' : 'bg-secondary/10 border-secondary/20'}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isGhostTrade ? 'bg-error animate-pulse' : isSuspicious ? 'bg-[#f0c040]' : 'bg-secondary'}`}></div>
                  <span className={`font-label-caps text-[10px] ${scoreLabelColorClass}`}>{data.result.label.toUpperCase()} CLASSIFICATION</span>
                </div>
              </div>

              {/* Anomaly Explainer */}
              <div className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`material-symbols-outlined shrink-0 ${scoreLabelColorClass}`}>analytics</span>
                    <h3 className="font-heading-md text-xl">Anomaly Explainer</h3>
                  </div>
                  <div className="p-4 bg-surface-container-low border-l-2 border-cyan-500 mb-6">
                    <p className="text-on-surface-variant font-body-main text-sm">
                      The primary signal indicator for <strong>{ticker}</strong> is currently <strong>{data.result.top_flag}</strong> reaching <strong className="text-white">{data.result.top_flag_sigma.toFixed(1)}σ</strong> deviation.
                      Internal metrics confirm a <span className="text-primary font-bold">{(data.signals?.VAI?.z_score || 0).toFixed(1)} sigma deviation</span> in volume patterns over the rolling window.
                      {isGhostTrade && (
                        <span className="block mt-2 font-bold text-error">Warning: High probability of structural manipulation or extreme algorithmic divergence. Caution advised.</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                  <div>
                    <div className="text-[10px] text-neutral-500 font-label-caps mb-1">WASH RATIO</div>
                    <div className="text-lg font-data-mono text-on-surface">{(Math.abs(data.signals?.PVD?.z_score || 0) * 10).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-label-caps mb-1">ANOMALY DETECTIONS</div>
                    <div className="text-lg font-data-mono text-on-surface">{data.ohlcv.anomaly_days} / 30 DAYS</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-label-caps mb-1">VOLUME SPIKE</div>
                    <div className={`text-lg font-data-mono ${data.result.volume_spike_pct > 50 ? 'text-error' : 'text-cyan-500'}`}>{data.result.volume_spike_pct > 0 ? '+' : ''}{data.result.volume_spike_pct.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Primary Charts */}
              <div className="col-span-12 glass-panel rounded-xl p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-500 shrink-0">show_chart</span>
                    <h3 className="font-heading-md text-lg">Integrity Performance Flow</h3>
                  </div>
                  <div className="flex gap-2 bg-surface-container-lowest rounded p-1">
                    <button className="px-3 py-1 font-label-caps text-[10px] bg-cyan-500 text-black rounded">1M</button>
                  </div>
                </div>
                
                <div className="h-80 w-full relative -ml-4">
                  <Plot
                    data={[
                      {
                        x: data.chart_data.map((d: any) => d.date),
                        y: data.chart_data.map((d: any) => d.close),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Price',
                        line: { color: plotTheme.primary, width: 2 },
                        yaxis: 'y'
                      },
                      {
                        x: data.chart_data.filter((d: any) => d.is_anomaly).map((d: any) => d.date),
                        y: data.chart_data.filter((d: any) => d.is_anomaly).map((d: any) => d.close),
                        type: 'scatter',
                        mode: 'markers',
                        name: 'Anomaly Flag',
                        marker: { color: plotTheme.error, size: 10, symbol: 'circle-open', line: { width: 2 } },
                        yaxis: 'y'
                      },
                      {
                        x: data.chart_data.filter((d: any) => !d.is_anomaly).map((d: any) => d.date),
                        y: data.chart_data.filter((d: any) => !d.is_anomaly).map((d: any) => d.volume),
                        type: 'bar',
                        name: 'Volume',
                        marker: { color: 'rgba(76, 215, 246, 0.2)' },
                        yaxis: 'y2'
                      },
                      {
                        x: data.chart_data.filter((d: any) => d.is_anomaly).map((d: any) => d.date),
                        y: data.chart_data.filter((d: any) => d.is_anomaly).map((d: any) => d.volume),
                        type: 'bar',
                        name: 'Anomalous Volume',
                        marker: { color: 'rgba(255, 180, 171, 0.6)' },
                        yaxis: 'y2'
                      }
                    ]}
                    layout={{
                      autosize: true,
                      margin: { t: 10, b: 30, l: 50, r: 50 },
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { color: plotTheme.text, family: 'Space Grotesk' },
                      xaxis: {
                        showgrid: true,
                        gridcolor: plotTheme.grid,
                        zeroline: false,
                        color: '#869397'
                      },
                      yaxis: {
                        title: 'PRICE ($)',
                        titlefont: { size: 10, family: 'Space Grotesk', color: '#869397' },
                        showgrid: true,
                        gridcolor: plotTheme.grid,
                        zeroline: false,
                        color: plotTheme.text
                      },
                      yaxis2: {
                        title: 'VOLUME',
                        titlefont: { size: 10, family: 'Space Grotesk', color: '#869397' },
                        overlaying: 'y',
                        side: 'right',
                        showgrid: false,
                        zeroline: false,
                        color: '#869397'
                      },
                      showlegend: false,
                      hovermode: 'x unified',
                      barmode: 'group'
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false }}
                  />
                </div>
              </div>

              {/* Active Signal Modules */}
              {data.signals && ['VAI', 'VBS', 'PVD', 'LIP'].map((sigKey) => {
                const sig = data.signals[sigKey]
                if (!sig) return null
                const isWarning = sig.status === 'WARNING'
                const isCrit = sig.status === 'CRITICAL'
                const borderClass = isCrit ? 'border-error/30 ring-1 ring-error/20 bg-error/5' : isWarning ? 'border-[#f0c040]/30 bg-[#f0c040]/5' : 'border-white/5 bg-black/40'
                const textClass = isCrit ? 'text-error' : isWarning ? 'text-[#f0c040]' : 'text-secondary'
                return (
                  <div key={sigKey} onClick={() => setActiveTab(Object.keys(tabMap).find(k => tabMap[k] === sigKey) || 'Overview')} className={`col-span-12 md:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col justify-between border ${borderClass} transition-all cursor-pointer hover:bg-white/5`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${textClass}`}>{sig.icon}</span>
                        <h4 className="font-label-caps text-label-caps text-white">{sigKey}</h4>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCrit ? 'bg-error/20 text-error animate-pulse' : isWarning ? 'bg-[#f0c040]/20 text-[#f0c040]' : 'bg-secondary/20 text-secondary'}`}>
                        {sig.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500 font-label-caps mb-1">{sig.name}</div>
                      <div className="flex items-end justify-between">
                        <div className={`font-data-mono text-2xl ${textClass}`}>{sig.z_score > 0 ? '+' : ''}{sig.z_score.toFixed(2)}<span className="text-sm text-neutral-500">σ</span></div>
                        <div className="w-16 h-8 flex items-center justify-center">
                           <div className="w-full bg-surface-container-highest h-1.5 rounded-full relative overflow-hidden">
                             <div className={`absolute top-0 left-1/2 h-full rounded-full ${isCrit ? 'bg-error' : isWarning ? 'bg-[#f0c040]' : 'bg-secondary'}`} style={{ width: `${Math.min(sig.sigma * 10, 50)}%`, transform: sig.z_score < 0 ? 'translateX(-100%)' : '' }}></div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Integrity Log & Correlation Grid */}
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Integrity Log */}
                <div className="glass-panel p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-heading-md text-lg">INTEGRITY LOG</h3>
                    <span className="text-[10px] font-data-mono text-neutral-500 animate-pulse">STREAMING LIVE</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[11px] font-data-mono text-cyan-400">LIVE</span>
                      <span className="text-[11px] font-data-mono text-on-surface-variant text-right">Model Synced</span>
                      <span className="text-[10px] font-label-caps px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">OK</span>
                    </div>
                    {data.signals && Object.keys(data.signals).map((k, i) => (
                      <div key={k} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[11px] font-data-mono text-neutral-500">T-{i*15 + 15}s</span>
                        <span className="text-[11px] font-data-mono text-on-surface-variant text-right max-w-[150px] truncate">{k} deviation analysis</span>
                        <span className={`text-[10px] font-label-caps px-2 py-0.5 rounded ${Math.abs(data.signals[k].z_score) > 2 ? 'bg-error-container/20 text-error-container' : 'bg-secondary/20 text-secondary'}`}>
                          {Math.abs(data.signals[k].z_score) > 2 ? 'FLAGGED' : 'STABLE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asset Correlation and Node cards removed */}
              </div>

            </div>
          )}
          
          <div className="pb-8"></div>
        </main>
      </div>
    </div>
  )
}
