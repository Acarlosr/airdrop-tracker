import { useState, useEffect, useCallback } from 'react'
import { Bell, Trash2, CheckCircle, AlertTriangle, Info, XCircle, RefreshCw } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import api from '../services/api'
import { timeAgo, priorityColor, priorityLabel } from '../utils/helpers'

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'critical', label: 'Crítico' },
  { key: 'high', label: 'Alto' },
  { key: 'normal', label: 'Normal' },
]

const PRIORITY_ICON = {
  critical: XCircle,
  high: AlertTriangle,
  normal: Info,
  low: Info,
}

export default function Alerts() {
  const [tab, setTab] = useState('all')
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (tab !== 'all') params.priority = tab
      const res = await api.getAlerts(params)
      setAlerts(res.data?.data ?? [])
    } catch {
      setError('Não foi possível carregar os alertas.')
      setAlerts(getMockAlerts())
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const handleMarkRead = async (id) => {
    try {
      await api.markAlertRead(id)
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, notified: true } : a))
    } catch (err) {
      console.error('Failed to mark alert as read:', err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteAlert(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Failed to delete alert:', err)
    }
  }

  const unreadCount = alerts.filter((a) => !a.notified).length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Alertas & Notificações</h1>
          <p className="text-white/50 mt-1">
            Atualizações críticas e alertas de airdrops
            {unreadCount > 0 && (
              <span className="ml-2 badge badge-electric">{unreadCount} não lido{unreadCount > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <button onClick={fetchAlerts} className="btn btn-secondary flex items-center gap-2" title="Atualizar">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-6 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key
                ? 'bg-electric/10 text-electric border border-electric/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-amber-400/90 text-sm mb-4">{error}</p>}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-electric border-t-transparent" />
        </div>
      ) : alerts.length === 0 ? (
        /* Empty */
        <GlowCard>
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg">Nenhum alerta{tab !== 'all' ? ` com prioridade "${priorityLabel(tab)}"` : ''}.</p>
            <p className="text-white/30 text-sm mt-1">Novos alertas aparecerão aqui automaticamente.</p>
          </div>
        </GlowCard>
      ) : (
        /* Alert List */
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = PRIORITY_ICON[alert.priority] || Info
            return (
              <GlowCard key={alert.id} className={`${alert.notified ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${alert.priority === 'critical' ? 'bg-red-500/10' :
                      alert.priority === 'high' ? 'bg-amber-500/10' : 'bg-electric/10'
                    }`}>
                    <Icon className={`w-5 h-5 ${alert.priority === 'critical' ? 'text-red-400' :
                        alert.priority === 'high' ? 'text-amber-400' : 'text-electric'
                      }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{alert.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(alert.priority)}`}>
                        {priorityLabel(alert.priority)}
                      </span>
                      {alert.notified && (
                        <span className="text-xs text-white/30">lido</span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {alert.source && (
                        <span className="text-xs text-white/40">{alert.source}</span>
                      )}
                      <span className="text-xs text-white/30">{timeAgo(alert.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!alert.notified && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-emerald-400 transition-colors"
                        title="Marcar como lido"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlowCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getMockAlerts() {
  return [
    { id: 1, priority: 'critical', title: 'Snapshot Arbitrum em 24h', message: 'O snapshot do Arbitrum STIP será tirado amanhã. Verifique sua elegibilidade agora.', source: 'Twitter', notified: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, priority: 'high', title: 'Novo airdrop Base detectado', message: 'Post no Twitter menciona possível airdrop para usuários ativos na Base. Critérios: 10+ transações.', source: 'AI Analysis', notified: false, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, priority: 'normal', title: 'Optimism Round 4 anunciado', message: 'A Optimism Foundation anunciou a quarta rodada de RetroPGF. Prazo para inscrição em março.', source: 'Discord', notified: true, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, priority: 'low', title: 'Atualização semanal de protocolos', message: 'Resumo semanal: 3 novos protocolos monitorados, 12 posts analisados, 2 airdrops em andamento.', source: 'System', notified: true, created_at: new Date(Date.now() - 172800000).toISOString() },
  ]
}
