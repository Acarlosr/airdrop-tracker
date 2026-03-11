import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Zap, Wallet, DollarSign,
  ArrowLeftRight, Calendar, Clock
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '../services/api'
import { AiBotChat } from '../components/AiBotChat'
import { SocialFeed } from '../components/SocialFeed'
import { GlowCard } from '../components/GlowCard'

// ── Helpers ───────────────────────────────────────────────────────
function fmtUsd(v) {
  return parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })
}
function fmtDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
function daysUntil(date) {
  if (!date) return null
  const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

// ── Chart colors ──────────────────────────────────────────────────
const CHART_COLORS = ['#3b5bff', '#7a9aff', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#38bdf8']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 text-xs"
      style={{ background: 'var(--surface-card)', border: '1px solid rgba(59,91,255,0.25)' }}>
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmtUsd(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Summary Card ──────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, variant = 'default' }) {
  const variants = {
    default: {
      bg: 'var(--surface)',
      border: 'rgba(255,255,255,0.06)',
      iconBg: 'rgba(255,255,255,0.03)',
      iconColor: 'var(--text-secondary)',
    },
    green: {
      bg: 'var(--surface)',
      border: 'rgba(0,230,118,0.35)',
      iconBg: 'rgba(0,230,118,0.08)',
      iconColor: 'var(--success)',
    },
    red: {
      bg: 'var(--surface)',
      border: 'rgba(255,69,69,0.35)',
      iconBg: 'rgba(255,69,69,0.08)',
      iconColor: 'var(--danger)',
    },
    blue: {
      bg: 'var(--surface)',
      border: 'rgba(255,255,255,0.12)',
      iconBg: 'rgba(255,255,255,0.05)',
      iconColor: 'var(--text-primary)',
    },
    amber: {
      bg: 'var(--surface)',
      border: 'rgba(255,184,0,0.28)',
      iconBg: 'rgba(255,184,0,0.06)',
      iconColor: 'var(--warning)',
    },
  }
  const v = variants[variant]
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-150"
      style={{ background: v.bg, border: `1px solid ${v.border}` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </p>
          <p className="mt-1 text-[26px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {sub}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ background: v.iconBg }}>
          <Icon className="w-5 h-5" style={{ color: v.iconColor }} />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function Dashboard() {
  const [wallet] = useState({ address: '0x1234567890123456789012345678901234567890' })
  const [stats, setStats] = useState(null)
  const [txSummary, setTxSummary] = useState(null)
  const [airdrops, setAirdrops] = useState([])
  const [, setRecentTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [assistantExpanded, setAssistantExpanded] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, txSumRes, airRes, txRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.getTransactionsSummary(),
        api.getAirdrops({ status: 'active', limit: 20 }),
        api.getTransactions({ limit: 5 }),
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data)
      setTxSummary(txSumRes.status === 'fulfilled' ? txSumRes.value.data?.data ?? getMockTxSummary() : getMockTxSummary())
      setAirdrops(airRes.status === 'fulfilled' ? airRes.value.data?.data ?? getMockAirdrops() : getMockAirdrops())
      setRecentTx(txRes.status === 'fulfilled' ? txRes.value.data?.data ?? getMockRecentTx() : getMockRecentTx())
    } catch {
      setTxSummary(getMockTxSummary())
      setAirdrops(getMockAirdrops())
      setRecentTx(getMockRecentTx())
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-electric border-t-transparent" />
      </div>
    )
  }

  const invested = txSummary?.invested || 0
  const claimed = txSummary?.claimed || 0
  const netPnl = txSummary?.netPnl || 0
  const monthly = txSummary?.monthly || []

  // Upcoming events from airdrops with dates
  const upcomingEvents = airdrops
    .flatMap(a => {
      const events = []
      if (a.snapshot_date && daysUntil(a.snapshot_date)) {
        events.push({ name: a.name, event: 'Snapshot', date: a.snapshot_date, days: daysUntil(a.snapshot_date), type: 'snapshot' })
      }
      if (a.claim_start && daysUntil(a.claim_start)) {
        events.push({ name: a.name, event: 'Claim Abre', date: a.claim_start, days: daysUntil(a.claim_start), type: 'claim' })
      }
      if (a.claim_end && daysUntil(a.claim_end)) {
        events.push({ name: a.name, event: 'Claim Fecha', date: a.claim_end, days: daysUntil(a.claim_end), type: 'deadline' })
      }
      return events
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 5)

  // Chain distribution from tx summary
  const chainDistribution = txSummary?.byAirdrop
    ? txSummary.byAirdrop.reduce((acc, a) => {
      const chain = a.chain || 'outros'
      acc[chain] = (acc[chain] || 0) + (parseFloat(a.total_spent) || 0)
      return acc
    }, {})
    : { ethereum: 1200, arbitrum: 800, optimism: 500, base: 300 }

  const pieData = Object.entries(chainDistribution)
    .map(([name, value]) => ({ name, value: parseFloat(value) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Painel</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Visão geral financeira, progresso dos airdrops e alertas.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
          {today}
        </p>
      </div>

      {/* ── Stat Cards (linha superior) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="TOTAL INVESTIDO"
          value={fmtUsd(invested)}
          icon={DollarSign}
          variant="blue"
        />
        <StatCard
          label="TOTAL RECLAMADO"
          value={fmtUsd(claimed)}
          icon={TrendingUp}
          variant="green"
        />
        <StatCard
          label="RESULTADO (P&L)"
          value={fmtUsd(netPnl)}
          sub={netPnl >= 0 ? 'Lucro' : 'Prejuízo'}
          icon={netPnl >= 0 ? TrendingUp : TrendingDown}
          variant={netPnl >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="AIRDROPS ATIVOS"
          value={stats?.activeAirdrops || airdrops.length || 0}
          sub={`${stats?.monitoredWallets || 0} carteiras monitoradas`}
          icon={Zap}
          variant="amber"
        />
      </div>

      {/* ── Quick Actions compactas ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/airdrops">
          <GlowCard hoverGlow className="cursor-pointer flex items-center gap-3 py-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Verificar elegibilidade
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                Explore airdrops ativos e veja se sua carteira qualifica.
              </p>
            </div>
          </GlowCard>
        </Link>
        <Link to="/transactions">
          <GlowCard hoverGlow className="cursor-pointer flex items-center gap-3 py-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <ArrowLeftRight className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Registrar transação
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                Registre investimentos, claims, swaps e custos de gas.
              </p>
            </div>
          </GlowCard>
        </Link>
        <Link to="/wallets">
          <GlowCard hoverGlow className="cursor-pointer flex items-center gap-3 py-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Wallet className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Gerenciar carteiras
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                Adicione ou pause carteiras monitoradas para o tracker.
              </p>
            </div>
          </GlowCard>
        </Link>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* P&L Evolution Chart */}
        <GlowCard className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-electric" />
            Evolução Mensal P&L
          </h2>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClaimed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }} />
                <Area type="monotone" dataKey="spent" name="Gasto" stroke="#FF4545" fill="url(#colorSpent)" strokeWidth={2} />
                <Area type="monotone" dataKey="claimed" name="Claimado" stroke="#00E676" fill="url(#colorClaimed)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        {/* Chain Distribution */}
        <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-electric" />
            Por Chain
          </h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {pieData.slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-white/60 capitalize">{d.name}</span>
                </div>
                <span className="text-white/80 font-medium">{fmtUsd(d.value)}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* ── Próximos eventos + Alertas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Próximos Eventos */}
        <GlowCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-electric" />
              Próximos Eventos
            </h2>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ev.type === 'deadline' ? 'bg-red-400' : ev.type === 'claim' ? 'bg-emerald-400' : 'bg-[#3b5bff]'
                      }`} />
                    <div>
                      <p className="text-sm text-white font-medium">{ev.name}</p>
                      <p className="text-xs text-white/40">{ev.event} · {fmtDate(ev.date)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ev.days <= 3
                      ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                      : ev.days <= 7
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-[rgba(59,91,255,0.10)] text-[#7a9aff] border border-[rgba(59,91,255,0.25)]'
                    }`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {ev.days}d
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-6">
              Nenhum evento próximo. Adicione datas aos seus airdrops!
            </p>
          )}
        </GlowCard>

        {/* Alertas Recentes (Social Feed redesenhado) */}
        <GlowCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-electric" />
              Alertas Recentes
            </h2>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <SocialFeed />
          </div>
        </GlowCard>
      </div>

      {/* ── Assistente de IA (compacto e colapsável) ── */}
      <div className="mb-4">
        <GlowCard className="border" style={{ borderColor: 'var(--border-accent)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>🤖</span> Assistente de IA
            </h2>
            <button
              type="button"
              onClick={() => setAssistantExpanded((v) => !v)}
              className="text-xs btn-secondary px-3 py-1 rounded-lg"
            >
              {assistantExpanded ? 'Recolher' : 'Expandir'}
            </button>
          </div>
          <div className={assistantExpanded ? 'h-[420px]' : 'h-[88px]'}>
            {wallet && <AiBotChat wallet={wallet} collapsed={!assistantExpanded} />}
          </div>
        </GlowCard>
      </div>
    </div>
  )
}

// ── Mock data ─────────────────────────────────────────────────────
function getMockTxSummary() {
  return {
    invested: 2060,
    claimed: 1875,
    swapped: 1000,
    netPnl: 815,
    totals: {
      invest: { count: 3, total_usd: 2050 },
      claim: { count: 1, total_usd: 1875 },
      swap: { count: 1, total_usd: 1000 },
      gas: { count: 2, total_usd: 10 },
    },
    byAirdrop: [
      { airdrop_id: 'arbitrum-one', airdrop_name: 'Arbitrum', chain: 'arbitrum', total_spent: 1257, total_claimed: 1875, pnl: 618 },
      { airdrop_id: 'optimism-mainnet', airdrop_name: 'Optimism', chain: 'optimism', total_spent: 500, total_claimed: 0, pnl: -500 },
      { airdrop_id: 'base-mainnet', airdrop_name: 'Base', chain: 'base', total_spent: 302, total_claimed: 0, pnl: -302 },
    ],
    monthly: [
      { month: 'Set', spent: 0, claimed: 0, pnl: 0 },
      { month: 'Out', spent: 300, claimed: 0, pnl: -300 },
      { month: 'Nov', spent: 500, claimed: 0, pnl: -500 },
      { month: 'Dez', spent: 760, claimed: 880, pnl: 120 },
      { month: 'Jan', spent: 350, claimed: 995, pnl: 645 },
      { month: 'Fev', spent: 150, claimed: 0, pnl: -150 },
    ],
  }
}

function getMockAirdrops() {
  return [
    { id: 'scroll-v1', name: 'Scroll', chain: 'scroll', status: 'active', snapshot_date: new Date(Date.now() + 86400000 * 5).toISOString() },
    { id: 'zksync-v2', name: 'zkSync Era', chain: 'zksync', status: 'active', claim_start: new Date(Date.now() + 86400000 * 12).toISOString() },
    { id: 'linea-v1', name: 'Linea', chain: 'linea', status: 'active', claim_end: new Date(Date.now() + 86400000 * 30).toISOString() },
  ]
}

function getMockRecentTx() {
  return [
    { id: 1, type: 'claim', token: 'ARB', amount: 1250, value_usd: 1875, chain: 'arbitrum', airdrop_name: 'Arbitrum', tx_date: new Date(Date.now() - 86400000).toISOString() },
    { id: 2, type: 'swap', token: 'USDC', from_token: 'ARB', amount: 1000, value_usd: 1000, chain: 'arbitrum', tx_date: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: 3, type: 'invest', token: 'ETH', amount: 0.5, value_usd: 1250, chain: 'arbitrum', airdrop_name: 'Arbitrum', tx_date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 4, type: 'invest', token: 'ETH', amount: 0.2, value_usd: 500, chain: 'optimism', airdrop_name: 'Optimism', tx_date: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 5, type: 'gas', token: 'ETH', amount: 0.003, value_usd: 7.50, chain: 'arbitrum', airdrop_name: 'Arbitrum', tx_date: new Date(Date.now() - 86400000 * 2).toISOString() },
  ]
}
