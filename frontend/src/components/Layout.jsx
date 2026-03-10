import { Link, useLocation } from 'react-router-dom'
import { Home, Zap, Wallet, Bell, Settings, TrendingUp, LogOut, ArrowLeftRight, Bot } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Airdrops', path: '/airdrops', icon: Zap },
    { name: 'Portfólio', path: '/portfolio', icon: TrendingUp },
    { name: 'Transações', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Wallets', path: '/wallets', icon: Wallet },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'AI Robot', path: '/ai-robot', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      {/* ── Sidebar ── */}
      <aside
        className="fixed inset-y-0 left-0 w-64 flex flex-col z-20"
        style={{
          background: 'var(--surface-card)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="p-2 rounded-xl"
            style={{
              background: 'rgba(59,91,255,0.15)',
              border: '1px solid rgba(59,91,255,0.30)',
            }}
          >
            <Zap className="w-5 h-5" style={{ color: '#7a9aff' }} />
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            Airdrop Tracker
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${isActive ? '' : 'text-white/50 hover:text-white/80'
                  }`}
                style={
                  isActive
                    ? {
                      background: 'rgba(59,91,255,0.12)',
                      color: '#7a9aff',
                      border: '1px solid rgba(59,91,255,0.22)',
                    }
                    : { border: '1px solid transparent' }
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#3b5bff' }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="p-4 space-y-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {user?.email && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(59,91,255,0.20)', color: '#7a9aff' }}
              >
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <p className="text-xs text-white/40 truncate" title={user.email}>
                {user.email}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="ml-64 min-h-screen relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
