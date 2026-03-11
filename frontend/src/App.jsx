import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Airdrops from './pages/Airdrops'
import AirdropDetail from './pages/AirdropDetail'
import Portfolio from './pages/Portfolio'
import Wallets from './pages/Wallets'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import Transactions from './pages/Transactions'
import AiRobot from './pages/AiRobot'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/airdrops" element={<Airdrops />} />
        <Route path="/airdrops/:id" element={<AirdropDetail />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/ai-robot" element={<AiRobot />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
