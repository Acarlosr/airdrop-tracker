import { useState, useRef, useEffect } from 'react';
import { Send, Loader, MessageCircle } from 'lucide-react';
import api from '../services/api';

export function AiBotChat({ wallet, collapsed = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!wallet?.address) return;
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/bot/history/${wallet.address}`);
        if (response.data.success && response.data.history) {
          const formattedMessages = [];
          for (let i = 0; i < response.data.history.length; i += 2) {
            if (response.data.history[i]?.role === 'user') {
              formattedMessages.push({
                role: 'user',
                content: response.data.history[i].content
              });
            }
            if (response.data.history[i + 1]?.role === 'assistant') {
              formattedMessages.push({
                role: 'assistant',
                content: response.data.history[i + 1].content
              });
            }
          }
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };
    fetchHistory();
  }, [wallet]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !wallet) return;

    const userMessage = input;
    setInput('');

    // Adicionar mensagem do usuário na UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/bot/message', {
        message: userMessage,
        wallet: wallet.address
      });

      if (response.data.success) {
        // Adicionar resposta do bot
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.response,
          actions: response.data.actions
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '❌ Erro: ' + (response.data.error || 'Algo deu errado')
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Erro ao conectar. Tente novamente.'
      }]);
    }

    setLoading(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border-accent)' }}>
      {!collapsed && (
        <>
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            <MessageCircle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Assistente de IA
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Pergunte sobre airdrops, P&amp;L ou oportunidades.
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center mt-4" style={{ color: 'var(--text-secondary)' }}>
                <p className="text-sm">Olá! 👋</p>
                <p className="text-xs mt-2">Tente perguntar:</p>
                <p className="text-xs mt-1" style={{ color: 'var(--accent-bright)' }}>"Quais airdrops sou elegível?"</p>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>ou</p>
                <p className="text-xs mt-1" style={{ color: 'var(--accent-bright)' }}>"Mostre meu P&amp;L deste mês"</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg text-sm ${msg.role === 'user'
                    ? 'rounded-br-none'
                    : 'rounded-bl-none'
                    }`}
                  style={
                    msg.role === 'user'
                      ? { background: 'var(--accent)', color: '#0A0A0F' }
                      : { background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                  }
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 text-xs space-y-1">
                      {msg.actions.map((action, i) => (
                        <div key={i} className="p-2 rounded"
                          style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--warning)' }}>
                          ⚙️ {action.type?.toUpperCase()} • {action.protocol} • {action.chain}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-lg rounded-bl-none border"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-bright)' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </>
      )}

      {/* Input (também usado no modo colapsado) */}
      <form onSubmit={handleSendMessage} className="border-t px-4 py-3"
        style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.35)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao assistente..."
            className="flex-1 rounded-lg px-3 py-2 text-sm"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            disabled={loading || !wallet}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !wallet}
            className="rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#0A0A0F' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {!wallet && (
          <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>
            Conecte sua wallet para usar o bot.
          </p>
        )}
      </form>
    </div>
  );
}
