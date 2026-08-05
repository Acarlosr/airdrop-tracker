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
  Twitter,
  Instagram,
  MessageCircle,
  BookOpen,
  CalendarCheck,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { env } from '../lib/env.js'
import Login from '../pages/Login'
import { ClaimOSLogo } from './ClaimOSLogo'

const THEME_KEY = 'claimos-theme'

export default function Layout({ children }) {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showRefs, setShowRefs] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem(THEME_KEY) || 'dark'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const navigation = [
    { name: 'Painel', path: '/', icon: Home },
    { name: 'Hoje', path: '/hoje', icon: CalendarCheck },
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
        className="fixed inset-y-0 left-0 w-64 hidden lg:flex flex-col z-20"
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
          <div className="flex items-center justify-center" style={{ color: 'var(--primary)' }}>
            <ClaimOSLogo size={28} />
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
      <main className="lg:ml-64 min-h-screen relative z-10 pb-20 lg:pb-0">
        {/* Top bar: social/theme à esquerda, login à direita */}
        <div className="fixed top-3 lg:top-8 left-3 lg:left-64 right-3 lg:right-8 z-30 flex items-center justify-between px-2">
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
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
              className="rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors hover:opacity-90"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderColor: 'var(--ring)',
              }}
            >
              Entrar
            </button>
          )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-14 pb-8">
          {children}
        </div>

        {/* Rodapé */}
        <footer
          className="max-w-7xl mx-auto px-8 py-6 border-t flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} ClaimOS
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Construído com React, Vite, Fastify, Supabase
          </span>
          <Link
            to="/docs"
            className="text-xs inline-flex items-center gap-1 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Documentação
          </Link>
        </footer>
      </main>

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex overflow-x-auto px-2 py-2"
        style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border)' }}
        aria-label="Navegação móvel"
      >
        {navigation.map((item) => {
          const Icon = item.icon
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className="min-w-[72px] flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px]"
              style={{ color: active ? 'var(--accent-bright)' : 'var(--text-muted)', background: active ? 'var(--accent-subtle)' : 'transparent' }}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Auth modal dentro do DApp */}
      {showAuth && (
        <Login embedded onClose={() => setShowAuth(false)} />
      )}
    </div>
  )
}
