import { useState } from 'react';
import { Twitter, MessageCircle, Search, RefreshCw, Zap } from 'lucide-react';

const SAMPLE_POSTS = [
  {
    id: '1',
    source: 'twitter',
    author: '@OptimismGov',
    content: '🎉 Airdrop Phase 2 aberto! Claim agora se você tiver 10+ transações. Snapshot: 2024-02-20',
    timestamp: new Date(Date.now() - 3600000),
    url: '#',
    urgent: true
  },
  {
    id: '2',
    source: 'discord',
    author: 'ArbitrumBot',
    content: '⚡ Snapshot elegibilidade: Se você tiver 10+ transações, você pode estar elegível para o airdrop!',
    timestamp: new Date(Date.now() - 7200000),
    url: '#',
    urgent: false
  },
  {
    id: '3',
    source: 'twitter',
    author: '@BaseProtocol',
    content: 'Base airdrop snapshot: 2024-02-20. Prepare sua wallet! Verifique sua elegibilidade em https://base.org/airdrop',
    timestamp: new Date(Date.now() - 10800000),
    url: '#',
    urgent: true
  },
  {
    id: '4',
    source: 'discord',
    author: 'Polygon Team',
    content: 'Novo protocolo no Polygon! POL token distribuição começando. Visite nosso site para mais detalhes.',
    timestamp: new Date(Date.now() - 14400000),
    url: '#',
    urgent: false
  }
];

export function SocialFeed() {
  const [posts] = useState(SAMPLE_POSTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const handleRefresh = async () => {
    setLoading(true);

    try {
      // Simular fetch (trocar por API real depois)
      await new Promise(r => setTimeout(r, 1000));

      // Aqui você chamaria:
      // const response = await fetch('/api/social/feed');
      // const data = await response.json();
      // setPosts(data.posts);

      console.log('Feed atualizado');
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const filteredPosts = posts.filter(post => {
    // Filtro por fonte
    if (filter === 'twitter' && post.source !== 'twitter') return false;
    if (filter === 'discord' && post.source !== 'discord') return false;

    // Filtro por busca
    if (search && !post.content.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-3">
      {/* Filtros / busca compactos */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Filtrar por palavra-chave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-xs"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn-primary px-3 py-2 rounded-lg text-xs flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filtro de origem */}
      <div className="flex gap-2 mb-2 text-[11px]">
        {['all', 'twitter', 'discord'].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2.5 py-1 rounded-full border transition ${
              filter === key
                ? 'text-[var(--accent-bright)]'
                : 'text-[var(--text-secondary)]'
            }`}
            style={{
              background:
                filter === key ? 'var(--accent-subtle)' : 'var(--surface-2)',
              borderColor:
                filter === key ? 'var(--border-accent)' : 'var(--border)',
            }}
          >
            {key === 'all' ? 'Todos' : key === 'twitter' ? 'Twitter' : 'Discord'}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Carregando alertas...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Nenhum alerta encontrado{search ? ` para "${search}"` : ''}.
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isTwitter = post.source === 'twitter'
            const accentColor = isTwitter ? '#1DA1F2' : '#5865F2'
            return (
              <a
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl p-3 text-sm transition-colors"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${accentColor}`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {isTwitter ? (
                      <Twitter className="w-4 h-4" style={{ color: accentColor }} />
                    ) : (
                      <MessageCircle className="w-4 h-4" style={{ color: accentColor }} />
                    )}
                    <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>
                      {post.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.urgent && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{
                          background: 'var(--danger-muted)',
                          color: 'var(--danger)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        <Zap className="w-3 h-3" /> Urgente
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {post.timestamp.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <p className="text-xs mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  {post.content}
                </p>

                <div className="text-[10px]" style={{ color: accentColor }}>
                  {isTwitter ? '→ Ver no Twitter' : '→ Ver no Discord'}
                </div>
              </a>
            )
          })
        )}
      </div>
    </div>
  );
}
