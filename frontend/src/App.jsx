import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Today from './pages/Today'
import Airdrops from './pages/Airdrops'
import AirdropDetail from './pages/AirdropDetail'
import Portfolio from './pages/Portfolio'
import Wallets from './pages/Wallets'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import Transactions from './pages/Transactions'
import AiRobot from './pages/AiRobot'
import Docs from './pages/Docs'
import Login from './pages/Login'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--text-secondary)' }}>Validando sessão…</div>
  }
  if (!isAuthenticated) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hoje" element={<Today />} />
        <Route path="/airdrops" element={<Airdrops />} />
        <Route path="/airdrops/:id" element={<AirdropDetail />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/ai-robot" element={<AiRobot />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
