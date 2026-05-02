import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Show } from '@clerk/react'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import AuthPage from './pages/AuthPage'
import SSOCallback from './pages/SSOCallback'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <Show when="signed-out">
              <Navigate to="/auth" replace />
            </Show>
            <Show when="signed-in">
              <LandingPage />
            </Show>
          </>
        } />
        <Route path="/auth" element={
          <>
            <Show when="signed-in">
              <Navigate to="/" replace />
            </Show>
            <Show when="signed-out">
              <AuthPage />
            </Show>
          </>
        } />
        <Route path="/dashboard/:ticker" element={
          <Show when="signed-in" fallback={<Navigate to="/" replace />}>
            <DashboardPage />
          </Show>
        } />
        <Route path="/history/:ticker" element={
          <Show when="signed-in" fallback={<Navigate to="/" replace />}>
            <HistoryPage />
          </Show>
        } />
        <Route path="/sso-callback" element={<SSOCallback />} />
      </Routes>
    </BrowserRouter>
  )
}
