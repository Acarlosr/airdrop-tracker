import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Airdrops from './pages/Airdrops'
import Portfolio from './pages/Portfolio'
import Wallets from './pages/Wallets'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/airdrops" element={<Airdrops />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
