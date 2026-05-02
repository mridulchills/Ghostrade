import { useState, useEffect } from 'react'
import { useUser } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { API_URL } from '../config'
import LiquidLoader from '../components/LiquidLoader'
import { BackgroundLines } from '../components/ui/background-lines'

export default function WatchlistPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [tickerInput, setTickerInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [analysisData, setAnalysisData] = useState<Record<string, any>>({})
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user?.id) {
      fetchWatchlist()
    }
  }, [user?.id])

  const fetchWatchlist = async () => {
    try {
      const res = await fetch(`${API_URL}/api/watchlist/${user?.id}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setWatchlist(data)
        data.forEach(item => fetchAnalysis(item.ticker))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalysis = async (ticker: string) => {
    setAnalyzing(prev => ({ ...prev, [ticker]: true }))
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      })
      const data = await res.json()
      setAnalysisData(prev => ({ ...prev, [ticker]: data }))
    } catch (err) {
      console.error(err)
    } finally {
      setAnalyzing(prev => ({ ...prev, [ticker]: false }))
    }
  }

  const addTicker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tickerInput.trim() || watchlist.length >= 10) return

    try {
      const res = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, ticker: tickerInput.trim() })
      })
      if (res.ok) {
        const newItem = await res.json()
        setWatchlist(prev => [...prev, newItem])
        fetchAnalysis(newItem.ticker)
        setTickerInput('')
      } else {
        const err = await res.json()
        alert(err.detail || "Failed to add ticker")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteTicker = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/watchlist/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setWatchlist(prev => prev.filter(item => item.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <BackgroundLines className="bg-zinc-950 text-white font-sans selection:bg-zinc-800">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-800 rounded-full transition-colors relative z-20">
            <ArrowLeft className="w-6 h-6 text-zinc-400" />
          </button>
          <div className="flex items-center gap-3 relative z-20">
            <LiquidLoader size={40} progress={100} />
            <h1 className="text-3xl font-medium tracking-tight">Your Watchlist</h1>
          </div>
        </div>

        <form onSubmit={addTicker} className="mb-12 flex items-center gap-4 max-w-md relative z-20">
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            placeholder="Add a ticker (e.g. AAPL)"
            disabled={watchlist.length >= 10}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
          <button
            type="submit"
            disabled={watchlist.length >= 10}
            className="bg-zinc-100 text-zinc-900 px-6 py-3 rounded-xl font-medium hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20 relative z-20">
            <LiquidLoader size={120} />
          </div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl relative z-20 bg-zinc-950/50 backdrop-blur-sm">
            Your watchlist is empty. Add up to 10 tickers to monitor them here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-20">
            {watchlist.map(item => {
              const data = analysisData[item.ticker]
              const isLoading = analyzing[item.ticker]

              return (
                <div key={item.id} className="relative group">
                  <div
                    onClick={() => navigate(`/dashboard/${item.ticker}`)}
                    className="block bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/80 transition-all h-full"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">{item.ticker}</h2>
                        {data?.ohlcv && (
                          <p className="text-zinc-400 mt-1">${data.ohlcv.close.toFixed(2)}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-zinc-500 uppercase tracking-wider font-semibold mb-1">Trust Score</span>
                        <span className={`text-3xl font-light ${data?.result?.trust_score < 40 ? 'text-red-500' : data?.result?.trust_score < 70 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {data?.result?.trust_score ?? '--'}
                        </span>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center py-6">
                        <LiquidLoader size={60} />
                      </div>
                    ) : data?.signals ? (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {Object.entries(data.signals).map(([key, sig]: any) => (
                          <div key={key} className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
                            <div className="text-xs text-zinc-500 font-medium mb-1">{sig.name}</div>
                            <div className={`text-sm ${sig.flagged ? 'text-red-400' : 'text-zinc-300'}`}>
                              {sig.status} ({sig.z_score})
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500 mt-4">Failed to load data</div>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTicker(item.id);
                    }}
                    className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 z-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </BackgroundLines>
  )
}
