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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">📢 Feed Social</h2>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded transition text-sm font-medium ${filter === 'all'
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-white hover:bg-blue-700'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('twitter')}
            className={`px-4 py-2 rounded flex items-center gap-2 transition text-sm font-medium ${filter === 'twitter'
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-white hover:bg-blue-700'
              }`}
          >
            <Twitter className="w-4 h-4" /> Twitter
          </button>
          <button
            onClick={() => setFilter('discord')}
            className={`px-4 py-2 rounded flex items-center gap-2 transition text-sm font-medium ${filter === 'discord'
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-white hover:bg-blue-700'
              }`}
          >
            <MessageCircle className="w-4 h-4" /> Discord
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar (airdrop, claim, etc)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-blue-800/50 border border-blue-700 rounded pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-white text-sm"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Carregando...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Nenhum post encontrado{search ? ` para "${search}"` : ''}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-4 rounded-lg border transition hover:shadow-lg ${post.urgent
                  ? 'bg-red-900/30 border-red-500/50 hover:bg-red-900/50'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {post.source === 'twitter' && (
                    <Twitter className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  )}
                  {post.source === 'discord' && (
                    <MessageCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  )}
                  <span className="text-xs text-gray-400 font-semibold truncate">
                    {post.author}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {post.urgent && (
                    <div className="flex items-center gap-1 bg-red-600 px-2 py-1 rounded text-xs whitespace-nowrap">
                      <Zap className="w-3 h-3" /> URGENTE
                    </div>
                  )}
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {post.timestamp.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <p className="text-white text-sm line-clamp-3 mb-2">{post.content}</p>

              <div className={`text-xs ${post.source === 'twitter' ? 'text-blue-400' : 'text-purple-400'}`}>
                {post.source === 'twitter' && '→ Ver no Twitter'}
                {post.source === 'discord' && '→ Ver no Discord'}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
