import { useState, useRef, useEffect } from 'react'
import { Send, Loader } from 'lucide-react'
import api from '../services/api'

export function RobotChat() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const endRef = useRef(null)

    const suggestions = [
        'Qual é a melhor estratégia agora?',
        'Quais airdrops estão com snapshot próximo?',
        'Analise as redes sociais dos projetos',
        'Quais projetos devo interagir hoje?',
    ]

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (text) => {
        const msg = text || input.trim()
        if (!msg) return
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: msg }])
        setLoading(true)

        try {
            const res = await api.sendRobotChat({ message: msg, userId: 'default' })
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.data?.data?.response || 'Sem resposta do robô.',
                offline: res.data?.data?.offline,
            }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Erro ao comunicar com o robô. Tente novamente.',
            }])
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col h-full rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface-card)', border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Header */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <span className="text-lg">💬</span> Chat com o Robô
                </h3>
                <p className="text-xs text-white/40 mt-1">Pergunte sobre projetos, estratégias e status</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ minHeight: 200 }}>
                {messages.length === 0 && (
                    <div className="text-center py-6">
                        <p className="text-white/30 text-sm mb-4">🤖 Pergunte qualquer coisa sobre seus airdrops</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => handleSend(s)}
                                    className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
                                    style={{
                                        background: 'rgba(240, 160, 32,0.10)',
                                        color: '#f5c15e',
                                        border: '1px solid rgba(240, 160, 32,0.20)',
                                    }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user'
                            ? 'rounded-br-md text-white'
                            : 'rounded-bl-md text-white/90'
                            }`} style={{
                                background: msg.role === 'user'
                                    ? 'rgba(240, 160, 32,0.25)'
                                    : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${msg.role === 'user' ? 'rgba(240, 160, 32,0.35)' : 'rgba(255,255,255,0.08)'}`,
                            }}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            {msg.offline && (
                                <p className="text-xs text-amber-400/70 mt-2 flex items-center gap-1">
                                    ⚠️ Modo offline
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Loader className="w-4 h-4 animate-spin" style={{ color: '#f5c15e' }} />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte ao robô..."
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 bg-transparent outline-none"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <button type="submit" disabled={loading || !input.trim()}
                        className="px-4 py-2.5 rounded-xl transition-all disabled:opacity-30"
                        style={{ background: 'rgba(240, 160, 32,0.20)', color: '#f5c15e', border: '1px solid rgba(240, 160, 32,0.30)' }}>
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    )
}
