import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Check, Zap, Flame, AlertTriangle, RefreshCw, Send } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import api from '../services/api'

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Risco de perder o streak: só existe se há streak em andamento
 * e o check-in de hoje ainda não foi feito. Quanto maior o streak,
 * mais caro é perder.
 */
function riskLevel(item) {
  if (item.checkedInToday || item.streak === 0) return null
  if (item.streak >= 7) return { label: 'Alto risco', className: 'text-red-400 bg-red-500/10 border-red-500/20' }
  if (item.streak >= 3) return { label: 'Médio risco', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
  return { label: 'Baixo risco', className: 'text-white/60 bg-white/5 border-white/10' }
}

function StatCard({ label, value, tone = 'default' }) {
  const toneClass = {
    default: 'text-white',
    danger: 'text-red-400',
    success: 'text-green-400',
  }[tone]
  return (
    <GlowCard hoverGlow={false}>
      <p className="text-sm text-white/50">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </GlowCard>
  )
}

// ── Linha de airdrop ──────────────────────────────────────────────

function TodayRow({ item, onCheckedIn }) {
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const risk = riskLevel(item)

  const handleCheckIn = async () => {
    setSaving(true)
    setFailed(false)
    try {
      await api.createInteraction({ airdrop_id: item.airdrop_id, kind: 'check-in' })
      onCheckedIn(item.airdrop_id)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <Link
          to={`/airdrops/${encodeURIComponent(item.airdrop_id)}`}
          className="text-white hover:text-electric transition-colors font-medium"
        >
          {item.name}
        </Link>
        <p className="text-xs text-white/40 mt-0.5">
          {item.network || 'rede não informada'}
          {item.phase ? ` · ${item.phase}` : ''}
          {item.lastCheckIn ? ` · último check-in ${item.lastCheckIn}` : ' · nenhum check-in ainda'}
        </p>
      </div>

      {item.streak > 0 && (
        <span className="inline-flex items-center gap-1.5 text-sm text-white/70">
          <Flame className="w-4 h-4 text-amber-400" />
          {item.streak}d
        </span>
      )}

      {risk && (
        <span className={`text-xs px-2 py-1 rounded-full border ${risk.className}`}>
          {risk.label}
        </span>
      )}

      <button
        onClick={handleCheckIn}
        disabled={saving || item.checkedInToday}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
          item.checkedInToday
            ? 'bg-green-500/10 text-green-400 border-green-500/20 cursor-default'
            : 'bg-electric/10 text-electric border-electric/30 hover:bg-electric/20'
        }`}
      >
        <Check className="w-4 h-4" />
        {item.checkedInToday ? 'Feito' : saving ? 'Salvando…' : 'Check-in'}
      </button>

      {failed && <span className="text-xs text-amber-400/80 w-full">Falhou — tente de novo.</span>}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────

export default function Today() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [briefStatus, setBriefStatus] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    return api
      .getTodayPanel()
      .then((res) => setItems(res.data?.items ?? []))
      .catch(() => setError('Não foi possível carregar o painel. Verifique se o backend está no ar.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCheckedIn = (airdropId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.airdrop_id === airdropId
          ? { ...i, checkedInToday: true, streak: i.streak + 1, lastCheckIn: new Date().toISOString().slice(0, 10) }
          : i,
      ),
    )
  }

  const handleSendBrief = async () => {
    setBriefStatus('enviando')
    try {
      const res = await api.sendBrief()
      setBriefStatus(res.data?.sent ? 'enviado' : 'falhou')
    } catch {
      setBriefStatus('falhou')
    }
  }

  const pending = items.filter((i) => !i.checkedInToday)
  const done = items.filter((i) => i.checkedInToday)
  const atRisk = pending.filter((i) => i.streak >= 3).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Hoje</h1>
          <p className="text-white/50 text-sm mt-1">
            O que ainda falta fazer, ordenado por risco de perder o streak.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
          <button
            onClick={handleSendBrief}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-electric/30 bg-electric/10 text-electric hover:bg-electric/20 transition-colors"
          >
            <Send className="w-4 h-4" />
            {briefStatus === 'enviando' ? 'Enviando…' : 'Enviar resumo no Telegram'}
          </button>
        </div>
      </div>

      {briefStatus === 'enviado' && (
        <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
          Resumo enviado para o Telegram.
        </p>
      )}
      {briefStatus === 'falhou' && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
          Não foi possível enviar. Confira TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no .env do backend.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pendentes hoje" value={pending.length} tone={pending.length > 0 ? 'danger' : 'success'} />
        <StatCard label="Streak em risco" value={atRisk} tone={atRisk > 0 ? 'danger' : 'default'} />
        <StatCard label="Feitos hoje" value={done.length} tone="success" />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-electric border-t-transparent" />
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <GlowCard>
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-electric mx-auto mb-3" />
            <p className="text-white/70">Nenhum airdrop cadastrado ainda.</p>
            <Link to="/airdrops" className="text-electric hover:underline text-sm mt-2 inline-block">
              Cadastrar o primeiro
            </Link>
          </div>
        </GlowCard>
      )}

      {!loading && !error && pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Pendentes ({pending.length})</h2>
          <GlowCard className="!p-0 overflow-hidden" hoverGlow={false}>
            {pending.map((item) => (
              <TodayRow key={item.airdrop_id} item={item} onCheckedIn={handleCheckedIn} />
            ))}
          </GlowCard>
        </div>
      )}

      {!loading && !error && done.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white/60 mb-3">Feitos hoje ({done.length})</h2>
          <GlowCard className="!p-0 overflow-hidden opacity-60" hoverGlow={false}>
            {done.map((item) => (
              <TodayRow key={item.airdrop_id} item={item} onCheckedIn={handleCheckedIn} />
            ))}
          </GlowCard>
        </div>
      )}
    </div>
  )
}
