export interface Signal {
  name: string
  z_score: number
  sigma: number
  flagged: boolean
  status: 'NORMAL' | 'WARNING' | 'CRITICAL'
  icon: string
}

export interface OHLCVStats {
  open: number
  high: number
  low: number
  close: number
  volume: number
  avg_volume_20d: number
  high_30d: number
  low_30d: number
  volatility_30d: number
  anomaly_days: number
  total_days: number
}

export interface ChartDataPoint {
  date: string
  close: number
  open: number
  high: number
  low: number
  volume: number
  is_anomaly: boolean
  VAI_z: number
  VBS_z: number
  PVD_z: number
  LIP_z: number
}

export interface AnalysisResult {
  trust_score: number
  label: string
  top_flag: string
  top_flag_sigma: number
  active_signals: number
  volume_spike_pct: number
  price_delta_30d: number
}

export interface AnalyzeResponse {
  ticker: string
  result: AnalysisResult
  chart_data: ChartDataPoint[]
  signals: Record<string, Signal>
  ohlcv: OHLCVStats
}
