import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Show, UserButton } from '@clerk/react'
import LiquidLoader from '../components/LiquidLoader'
import ColourfulText from '../components/ui/colourful-text'
import { BackgroundLines } from '../components/ui/background-lines'

export default function LandingPage() {
  const [ticker, setTicker] = useState('')
  const [isIntroLoading, setIsIntroLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticker.trim()) {
      navigate(`/dashboard/${ticker.trim().toUpperCase()}`)
    }
  }

  if (isIntroLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center transition-opacity duration-1000">
        <LiquidLoader size={320} />
        <div className="mt-8 text-primary font-data-mono tracking-widest uppercase animate-pulse">
          Initializing Integrity Engine...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-on-background font-body-main selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* Top Navigation */}
      <nav className="sticky top-0 flex justify-between items-center w-full px-8 h-16 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-none">
        <div className="text-primary font-black tracking-tighter text-2xl">GHOSTRADE</div>
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <Link to="/auth" className="px-4 py-1.5 text-[10px] font-label-caps text-neutral-300 border border-white/10 rounded hover:bg-white/5 transition-all tracking-widest">
              SIGN IN
            </Link>
            <Link to="/auth" className="px-4 py-1.5 text-[10px] font-label-caps text-black bg-primary rounded hover:bg-primary/90 transition-all tracking-widest">
              GET ACCESS
            </Link>
          </Show>
          <Show when="signed-in">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </Show>
        </div>
      </nav>

      {/* Main Hero Content */}
      <main className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        <BackgroundLines className="flex flex-col items-center w-full pb-24 pt-xl">
          <div className="relative z-10 w-full max-w-7xl px-margin flex flex-col items-center text-center">
            
            {/* Branding & Headline */}
            <div className="mb-lg mt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-md border border-primary/20 rounded-full bg-primary/5">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shrink-0"></span>
                <span className="font-label-caps text-label-caps text-primary uppercase">System Status: Integrity Active</span>
              </div>

              <div className="mb-8 flex justify-center">
                <LiquidLoader size={80} />
              </div>

              <h1 className="font-display-lg text-display-lg text-white mb-xs tracking-tighter">
                Real-Time Market <ColourfulText text="Integrity Engine" />
              </h1>
              <p className="font-body-main text-body-main text-on-surface-variant max-w-2xl mx-auto">
                Institutional-grade surveillance for the modern trader. Identify hidden liquidity flows and algorithmic anomalies across global markets.
              </p>
            </div>

            {/* Search Bar Terminal */}
            <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-lg group">
              <div className="glass-surface p-base rounded-xl transition-all duration-500 glow-border">
                <div className="flex items-center gap-sm px-md py-sm bg-black/40 rounded-lg">
                  <span className="material-symbols-outlined text-primary shrink-0">search</span>
                  <input
                    className="w-full bg-transparent border-none focus:ring-0 text-white font-data-mono text-body-main placeholder:text-neutral-500 outline-none uppercase"
                    placeholder="Enter Ticker (e.g., NVDA, BTC, SPY)"
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    autoFocus
                  />
                  <button type="submit" className="hidden sm:flex items-center gap-1 font-label-caps text-[10px] text-black bg-primary px-3 py-1.5 rounded hover:bg-primary/90 font-bold transition-all shrink-0">
                    AUDIT
                  </button>
                </div>
              </div>
            </form>

            {/* Signal Keys */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter w-full max-w-4xl mb-xl">
              {[
                { id: 'VAI', name: 'Volumetric AI Inference', icon: 'psychology', color: 'text-primary' },
                { id: 'VBS', name: 'Velocity Block Scanning', icon: 'waves', color: 'text-secondary' },
                { id: 'PVD', name: 'Predictive Volatility Drift', icon: 'analytics', color: 'text-tertiary' },
                { id: 'LIP', name: 'Liquidity Integrity Pulse', icon: 'security', color: 'text-primary/80' }
              ].map((sig) => (
                <div key={sig.id} className="glass-surface p-md rounded-lg text-left group hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-sm shrink-0 ${sig.color}`}>{sig.icon}</span>
                    <h3 className="font-label-caps text-label-caps text-white truncate">{sig.id}</h3>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight uppercase font-medium">{sig.name}</p>
                </div>
              ))}
            </div>
          </div>
        </BackgroundLines>
      </main>
      
      {/* Footer Stats Ticker */}
      <footer className="fixed bottom-0 w-full h-10 glass-surface border-t-0 flex items-center px-8 z-50">
        <div className="flex items-center gap-margin overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-data-mono text-[10px] text-neutral-400 uppercase tracking-widest">NETWORK: ACTIVE</span>
          </div>
          <div className="flex gap-gutter font-data-mono text-[10px]">
            <span className="text-neutral-500">TSLA: <span className="text-white">$172.10</span></span>
            <span className="text-neutral-500">AAPL: <span className="text-white">$189.43</span></span>
            <span className="text-neutral-500">XAU/USD: <span className="text-white">2,164.20</span></span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="font-data-mono text-[10px] text-neutral-500 uppercase">V2.04 ACTIVE</span>
        </div>
      </footer>
    </div>
  )
}
