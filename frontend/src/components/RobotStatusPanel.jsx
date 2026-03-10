import { useState } from 'react'
import { Power, RefreshCw, Activity, Clock, Bell, Eye } from 'lucide-react'
import api from '../services/api'

function formatUptime(seconds) {
    if (!seconds) return '—'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

function formatTime(date) {
    if (!date) return 'Nunca'
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
    })
}

export function RobotStatusPanel({ status, onRefresh, onToggle }) {
    const [analyzing, setAnalyzing] = useState(false)
    const [toggling, setToggling] = useState(false)

    const isEnabled = status?.enabled ?? true

    const handleAnalyze = async () => {
        setAnalyzing(true)
        try {
            await api.triggerRobotAnalysis()
            onRefresh?.()
        } catch (e) {
            console.error('Analyze error:', e)
        }
        setAnalyzing(false)
    }

    const handleToggle = async () => {
        setToggling(true)
        try {
            await api.toggleRobot()
            onToggle?.()
        } catch (e) {
            console.error('Toggle error:', e)
        }
        setToggling(false)
    }

    return (
        <div className="rounded-2xl p-6 relative overflow-hidden"
            style={{ background: 'var(--surface-card)', border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Active pulse animation */}
            {isEnabled && (
                <div className="absolute top-4 right-4">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ background: '#34d399' }} />
                        <span className="relative inline-flex rounded-full h-3 w-3"
                            style={{ background: '#34d399' }} />
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl"
                    style={{
                        background: isEnabled ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                        border: `1px solid ${isEnabled ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
                    }}>
                    <span className="text-xl">🤖</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">AI Robot</h2>
                    <p className="text-xs" style={{ color: isEnabled ? '#34d399' : '#f87171' }}>
                        {isEnabled ? '● Monitoramento Ativo' : '○ Desativado'}
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <MetricBox icon={Eye} label="Total Scans" value={status?.totalScans || 0} />
                <MetricBox icon={Activity} label="Insights" value={status?.insightsCount || 0} />
                <MetricBox icon={Bell} label="Alertas" value={status?.totalAlerts || 0} />
                <MetricBox icon={Clock} label="Uptime" value={formatUptime(status?.uptime)} />
            </div>

            {/* Last activity */}
            <div className="space-y-1.5 mb-5">
                <InfoRow label="Último Scan" value={formatTime(status?.lastScan)} />
                <InfoRow label="Última Estratégia" value={formatTime(status?.lastStrategy)} />
                <InfoRow label="Último Lembrete" value={formatTime(status?.lastReminder)} />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button onClick={handleAnalyze} disabled={analyzing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{ background: 'rgba(59,91,255,0.15)', color: '#7a9aff', border: '1px solid rgba(59,91,255,0.30)' }}>
                    <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                    {analyzing ? 'Analisando...' : 'Analisar Agora'}
                </button>
                <button onClick={handleToggle} disabled={toggling}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{
                        background: isEnabled ? 'rgba(248,113,113,0.10)' : 'rgba(52,211,153,0.10)',
                        color: isEnabled ? '#f87171' : '#34d399',
                        border: `1px solid ${isEnabled ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.25)'}`,
                    }}>
                    <Power className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

function MetricBox({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-white font-bold text-lg">{value}</p>
        </div>
    )
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">{label}</span>
            <span className="text-white/70">{value}</span>
        </div>
    )
}
