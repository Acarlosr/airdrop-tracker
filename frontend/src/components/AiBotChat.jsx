import { useState, useRef, useEffect } from 'react';
import { Send, Loader, MessageCircle } from 'lucide-react';
import api from '../services/api';

export function AiBotChat({ wallet }) {
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
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-purple-500/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-4 rounded-t-lg border-b border-purple-700">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-purple-300" />
          <h2 className="text-lg font-bold text-white">Assistente de IA</h2>
        </div>
        <p className="text-xs text-purple-200">
          Peça para verificar airdrops, executar ações ou analisar oportunidades
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-sm">Olá! 👋</p>
            <p className="text-xs mt-2">Tente perguntar:</p>
            <p className="text-xs mt-1 text-purple-300">"Quais airdrops sou elegível?"</p>
            <p className="text-xs mt-3 text-gray-500">ou</p>
            <p className="text-xs mt-1 text-purple-300">"Faça claim no Arbitrum"</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg text-sm ${msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-none'
                : 'bg-gray-800 text-gray-100 border border-purple-500/30 rounded-bl-none'
                }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 text-xs space-y-1">
                  {msg.actions.map((action, i) => (
                    <div key={i} className="bg-black/30 p-2 rounded border border-yellow-500/50">
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
            <div className="bg-gray-800 border border-purple-500/30 px-4 py-3 rounded-lg rounded-bl-none">
              <Loader className="w-4 h-4 animate-spin text-purple-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-purple-500/30 p-4 bg-gray-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta ou comando..."
            className="flex-1 bg-gray-700 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
            disabled={loading || !wallet}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !wallet}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {!wallet && <p className="text-xs text-red-400 mt-2">Conecte sua wallet para usar o bot</p>}
      </form>
    </div>
  );
}
