import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { RobotStatusPanel } from '../components/RobotStatusPanel'
import { RobotActivityFeed } from '../components/RobotActivityFeed'
import { RobotChat } from '../components/RobotChat'
import api from '../services/api'

export default function AiRobot() {
    const [status, setStatus] = useState(null)
    const [insights, setInsights] = useState([])
    const [reminders, setReminders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all') // all | insights | reminders

    const fetchData = useCallback(async () => {
        try {
            const [statusRes, insightsRes, remindersRes] = await Promise.allSettled([
                api.getRobotStatus(),
                api.getRobotInsights(),
                api.getRobotReminders(),
            ])

            if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data?.data)
            if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data?.data || [])
            if (remindersRes.status === 'fulfilled') setReminders(remindersRes.value.data?.data || [])
        } catch (e) {
            console.error('Fetch error:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [fetchData])

    const handleRefresh = () => {
        setLoading(true)
        fetchData()
    }

    const handleToggle = () => {
        setTimeout(fetchData, 500)
    }

    const tabs = [
        { id: 'all', label: 'Todos', count: insights.length + reminders.length },
        { id: 'insights', label: '🔍 Insights', count: insights.length },
        { id: 'reminders', label: '⏰ Lembretes', count: reminders.length },
    ]

    if (loading && !status) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">🤖 AI Robot</h1>
                <p className="text-white/50 mb-6">Monitoramento autônomo com OpenRouter LLM</p>
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent"
                        style={{ borderColor: '#f0a020', borderTopColor: 'transparent' }} />
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">🤖 AI Robot</h1>
                    <p className="text-white/50 mt-1">
                        Monitoramento autônomo com OpenRouter LLM
                    </p>
                </div>
                <button onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Top row: Status + Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1">
                    <RobotStatusPanel
                        status={status}
                        onRefresh={handleRefresh}
                        onToggle={handleToggle}
                    />
                </div>
                <div className="lg:col-span-2" style={{ height: 420 }}>
                    <RobotChat />
                </div>
            </div>

            {/* Activity Feed */}
            <div className="rounded-2xl p-6"
                style={{ background: 'var(--surface-card)', border: '1px solid rgba(255,255,255,0.06)' }}>

                {/* Tab bar */}
                <div className="flex items-center gap-1 mb-5">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={activeTab === tab.id ? {
                                background: 'rgba(240, 160, 32,0.12)',
                                color: '#f5c15e',
                                border: '1px solid rgba(240, 160, 32,0.22)',
                            } : {
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.4)',
                                border: '1px solid transparent',
                            }}>
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                <RobotActivityFeed
                    insights={activeTab === 'reminders' ? [] : insights}
                    reminders={activeTab === 'insights' ? [] : reminders}
                />
            </div>
        </div>
    )
}
