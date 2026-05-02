import { useState, useEffect } from 'react'
import { useUser } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Loader2, Bell } from 'lucide-react'
import { API_URL } from '../config'

export default function AlertsPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [ticker, setTicker] = useState('')
  const [cutoff, setCutoff] = useState('50')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchAlerts()
    }
  }, [user?.id])

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts/${user?.id}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setAlerts(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim() || !phone.trim() || !cutoff) return

    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          ticker: ticker.trim().toUpperCase(),
          trust_score_cutoff: parseFloat(cutoff),
          phone_number: phone.trim()
        })
      })
      if (res.ok) {
        const newItem = await res.json()
        setAlerts(prev => [...prev, newItem])
        setTicker('')
        setCutoff('50')
        setPhone('')
      } else {
        const err = await res.json()
        alert(err.detail || "Failed to add alert")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteAlert = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/alerts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAlerts(prev => prev.filter(item => item.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-zinc-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-zinc-400" />
          </button>
          <h1 className="text-3xl font-medium tracking-tight">Active Alerts</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-zinc-400" />
            Set Up New Alert
          </h2>
          <form onSubmit={addAlert} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Ticker Symbol</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="AAPL"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Trust Score Cutoff</label>
              <input
                type="number"
                value={cutoff}
                onChange={(e) => setCutoff(e.target.value)}
                placeholder="50"
                min="0"
                max="100"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+18777804236"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-zinc-100 text-zinc-900 px-6 py-3 rounded-xl font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 h-[50px]"
              >
                <Plus className="w-5 h-5" />
                Create Alert
              </button>
            </div>
          </form>
          <p className="text-xs text-zinc-500 mt-4">
            You will receive an SMS message via Twilio if the Trust Score drops below the cutoff.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            You don't have any active alerts.
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(item => (
              <div key={item.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-zinc-950 rounded-lg flex items-center justify-center border border-zinc-800">
                    <span className="text-xl font-bold">{item.ticker}</span>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">Alert when Trust Score is {"<="} <span className="text-white font-medium">{item.trust_score_cutoff}</span></div>
                    <div className="text-sm text-zinc-500 flex items-center gap-2">
                      <span>Sending to:</span>
                      <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded text-xs tracking-wider">{item.phone_number}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(item.id)}
                  className="p-3 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                  title="Delete Alert"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

}
