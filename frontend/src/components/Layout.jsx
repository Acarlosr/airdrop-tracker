import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Zap,
  Wallet,
  Bell,
  Settings as SettingsIcon,
  TrendingUp,
  LogOut,
  ArrowLeftRight,
  Bot,
  SunMedium,
  MoonStar,
  Twitter,
  Instagram,
  MessageCircle,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { env } from '../lib/env.js'
import Login from '../pages/Login'

export default function Layout({ children }) {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showRefs, setShowRefs] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('airdrop-theme') || 'dark'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('airdrop-theme', theme)
  }, [theme])

  const navigation = [
    { name: 'Painel', path: '/', icon: Home },
    { name: 'Airdrops', path: '/airdrops', icon: Zap },
    { name: 'Portfólio', path: '/portfolio', icon: TrendingUp },
    { name: 'Transações', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Carteiras', path: '/wallets', icon: Wallet },
    { name: 'Alertas', path: '/alerts', icon: Bell },
    { name: 'Robô de IA', path: '/ai-robot', icon: Bot },
    { name: 'Configurações', path: '/settings', icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* ── Sidebar ── */}
      <aside
        className="fixed inset-y-0 left-0 w-64 flex flex-col z-20"
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="p-2 rounded-xl"
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--border-accent)',
            }}
          >
            <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {env.APP_NAME}
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive ? 'nav-active' : 'text-white/50 hover:text-white/80'
                }`}
                style={
                  isActive
                    ? {
                        border: '1px solid var(--sidebar-active-border)',
                      }
                    : { border: '1px solid transparent' }
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="p-4 space-y-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {user?.email && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent-bright)' }}
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
        {/* Top bar: social/theme à esquerda, login à direita */}
        <div className="fixed top-4 left-64 right-8 z-30 flex items-center justify-between px-2">
          {/* Social + referências + tema — à esquerda */}
          <div className="flex items-center gap-2">
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              title="Discord (em breve)"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              title="X.com (Twitter) (em breve)"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              title="Instagram (em breve)"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRefs((prev) => !prev)}
                className="w-8 h-8 rounded-full flex items-center justify-center border text-xs"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                title="Sites de referência"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              {showRefs && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border shadow-lg p-3 text-xs space-y-1"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Referências de pesquisa
                  </p>
                  <a
                    href="https://defillama.com"
                    target="_blank"
                    rel="noreferrer"
                    className="block hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    DefiLlama
                  </a>
                  <a
                    href="https://cryptorank.io"
                    target="_blank"
                    rel="noreferrer"
                    className="block hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    CryptoRank
                  </a>
                  <a
                    href="https://aave.com"
                    target="_blank"
                    rel="noreferrer"
                    className="block hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Aave
                  </a>
                  <a
                    href="https://app.kamino.finance"
                    target="_blank"
                    rel="noreferrer"
                    className="block hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Kamino
                  </a>
                  <a
                    href="https://app.llamalend.com"
                    target="_blank"
                    rel="noreferrer"
                    className="block hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Lend/Borrow (Loop / DeFi)
                  </a>
                </div>
              )}
            </div>
          </div>
          {/* Login / conta — à direita */}
          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="w-9 h-9 rounded-full flex items-center justify-center border text-xs"
            style={{
              background: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? (
              <SunMedium className="w-4 h-4" />
            ) : (
              <MoonStar className="w-4 h-4" />
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent-bright)' }}
              >
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <span className="text-xs max-w-[160px] truncate" style={{ color: 'var(--text-secondary)' }}>
                {user.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-[11px] px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #FFB05A, #FF8C00)',
                color: '#0A0A0F',
              }}
            >
              Entrar / Criar conta
            </button>
          )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>

      {/* Auth modal dentro do DApp */}
      {showAuth && (
        <Login embedded onClose={() => setShowAuth(false)} />
      )}
    </div>
  )
}
