// RobotActivityFeed

const PRIORITY_STYLES = {
    critical: { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.20)', dot: '#f87171' },
    high: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.20)', dot: '#fbbf24' },
    medium: { bg: 'rgba(59,91,255,0.08)', border: 'rgba(59,91,255,0.20)', dot: '#7a9aff' },
    low: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', dot: 'rgba(255,255,255,0.30)' },
}

const TYPE_ICONS = {
    scan: '🔍',
    change_detected: '🔄',
    strategy: '🎯',
    social_analysis: '📢',
    snapshot_reminder: '📸',
    claim_reminder: '🎁',
    deadline_reminder: '🚨',
    interaction_reminder: '💡',
}

function timeAgo(date) {
    if (!date) return ''
    const s = Math.floor((new Date() - new Date(date)) / 1000)
    if (s < 60) return 'agora'
    if (s < 3600) return `${Math.floor(s / 60)}min atrás`
    if (s < 86400) return `${Math.floor(s / 3600)}h atrás`
    return `${Math.floor(s / 86400)}d atrás`
}

export function RobotActivityFeed({ insights = [], reminders = [] }) {
    const items = [
        ...insights.map(i => ({ ...i, _kind: 'insight' })),
        ...reminders.map(r => ({ ...r, _kind: 'reminder' })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    if (items.length === 0) {
        return (
            <div className="rounded-2xl p-8 text-center"
                style={{ background: 'var(--surface-card)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-white/30 text-sm">🤖 Nenhuma atividade do robô ainda.</p>
                <p className="text-white/20 text-xs mt-2">Clique em "Analisar Agora" para iniciar.</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {items.slice(0, 30).map((item) => {
                const ps = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low
                const icon = TYPE_ICONS[item.type] || '📋'

                return (
                    <details key={item.id || Math.random()} className="group rounded-2xl overflow-hidden transition-all"
                        style={{ background: ps.bg, border: `1px solid ${ps.border}` }}>
                        <summary className="flex items-start gap-3 px-4 py-3 cursor-pointer list-none select-none">
                            {/* Priority dot */}
                            <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: ps.dot }} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm text-white font-medium truncate">
                                        {icon} {item.title}
                                    </p>
                                    <span className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(item.timestamp)}</span>
                                </div>
                                {item.airdrop && (
                                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(59,91,255,0.12)', color: '#7a9aff', border: '1px solid rgba(59,91,255,0.20)' }}>
                                        {item.airdrop}
                                    </span>
                                )}
                            </div>
                            {/* Expand indicator */}
                            <span className="text-white/20 text-xs mt-1 transition-transform group-open:rotate-180">▼</span>
                        </summary>
                        <div className="px-4 pb-4 pt-1">
                            <div className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap"
                                style={{ borderTop: `1px solid ${ps.border}`, paddingTop: '0.75rem' }}>
                                {item.summary || item.message || 'Sem detalhes adicionais.'}
                            </div>
                            {item.changes && item.changes.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {item.changes.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                                            <span className="w-1 h-1 rounded-full" style={{ background: ps.dot }} />
                                            <span className="font-medium text-white/70">{c.name}:</span>
                                            <span>{c.change}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </details>
                )
            })}
        </div>
    )
}
