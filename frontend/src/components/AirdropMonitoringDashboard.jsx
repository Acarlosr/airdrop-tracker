import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Zap, Eye, EyeOff } from 'lucide-react';

/**
 * Dashboard de Monitoramento de Airdrops
 * Visualiza protocolos, eventos e alertas
 */

export function AirdropMonitoringDashboard() {
  const [protocolos, setProtocolos] = useState([]);
  const [filtro, setFiltro] = useState('all'); // all, with-alerts, active
  const [loading, setLoading] = useState(true);
  const [expandedProtocol, setExpandedProtocol] = useState(null);

  useEffect(() => {
    fetchProtocolos();
    // Recarregar a cada 5 minutos
    const interval = setInterval(fetchProtocolos, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchProtocolos = async () => {
    try {
      setLoading(true);
      // Mock data - em produção, chamar backend real
      const mockData = getMockProtocolos();
      setProtocolos(mockData);
    } catch (error) {
      console.error('Error fetching protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProtocolos = () => {
    switch (filtro) {
      case 'with-alerts':
        return protocolos.filter(p => p.openAlerts > 0);
      case 'active':
        return protocolos.filter(p => p.summary.prontoPara.length > 0);
      default:
        return protocolos;
    }
  };

  const handleAcknowledgeAlert = (protocolId, alertId) => {
    // Em produção: PATCH /api/monitoring/alert/:id/acknowledge
    console.log(`Alert ${alertId} acknowledged for protocol ${protocolId}`);
  };

  const filteredProtocolos = filterProtocolos();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 Monitoramento de Airdrops
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe eventos, snapshots e alertas de protocolos em testnet
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltro('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${filtro === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
        >
          Todos ({protocolos.length})
        </button>
        <button
          onClick={() => setFiltro('with-alerts')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filtro === 'with-alerts'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
        >
          <AlertTriangle size={16} />
          Alertas ({protocolos.filter(p => p.openAlerts > 0).length})
        </button>
        <button
          onClick={() => setFiltro('active')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filtro === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
        >
          <Zap size={16} />
          Ativos ({protocolos.filter(p => p.summary.prontoPara.length > 0).length})
        </button>
      </div>

      {/* Cards de Protocolos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : filteredProtocolos.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-700">Nenhum protocolo encontrado com o filtro selecionado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProtocolos.map((protocolo) => (
            <ProtocolCard
              key={protocolo.id}
              protocolo={protocolo}
              expanded={expandedProtocol === protocolo.id}
              onToggleExpand={() =>
                setExpandedProtocol(expandedProtocol === protocolo.id ? null : protocolo.id)
              }
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Card de um protocolo
 */
function ProtocolCard({ protocolo, expanded, onToggleExpand, onAcknowledgeAlert }) {
  const hasAlerts = protocolo.openAlerts > 0;
  const isActive = protocolo.summary.prontoPara.length > 0;

  return (
    <div
      className={`rounded-lg border-2 transition-all ${hasAlerts
          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
          : isActive
            ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 bg-white dark:bg-gray-800'
        }`}
    >
      {/* Header Card */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-start justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex-1 text-left">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {protocolo.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded text-xs">
              {protocolo.type}
            </span>
            {protocolo.backing_score && (
              <span className="text-gray-600 dark:text-gray-400">
                VC Score: {protocolo.backing_score}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2">
          {hasAlerts && (
            <div className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              <AlertTriangle size={14} />
              {protocolo.openAlerts}
            </div>
          )}
          {expanded ? <EyeOff size={20} /> : <Eye size={20} />}
        </div>
      </button>

      {/* Conteúdo Expandido */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total de Eventos</p>
              <p className="text-xl font-bold">{protocolo.summary.total_events}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Snapshots</p>
              <p className="text-xl font-bold text-blue-600">{protocolo.summary.snapshot_count}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Mainnet</p>
              <p className="text-xl font-bold text-green-600">{protocolo.summary.mainnet_count}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Quests</p>
              <p className="text-xl font-bold text-purple-600">{protocolo.summary.quest_count}</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">Monitoramento</p>
            <div className="space-y-1 text-sm">
              {protocolo.checklist.twitterMonitoring.eligibilityThreadsFound && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <CheckCircle2 size={14} /> Threads de elegibilidade
                </div>
              )}
              {protocolo.checklist.discordMonitoring.snapshotAnnounced && (
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle size={14} /> Snapshot anunciado
                </div>
              )}
              {protocolo.checklist.discordMonitoring.campaignsFound && (
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Zap size={14} /> Campanhas ativas
                </div>
              )}
              {protocolo.checklist.discordMonitoring.rulesUpdated && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Clock size={14} /> Regras atualizadas
                </div>
              )}
            </div>
          </div>

          {/* Alertas */}
          {protocolo.alerts && protocolo.alerts.length > 0 && (
            <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 space-y-2">
              <p className="font-semibold text-sm text-red-900 dark:text-red-200">
                ⚠️ {protocolo.alerts.length} Alerta(s)
              </p>
              <div className="space-y-2">
                {protocolo.alerts.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="flex items-start justify-between gap-2 bg-white dark:bg-red-900/50 p-2 rounded text-sm"
                  >
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-200">
                        {alerta.message}
                      </p>
                      {alerta.associated_dates && alerta.associated_dates.length > 0 && (
                        <p className="text-xs text-red-700 dark:text-red-300">
                          📅 {alerta.associated_dates.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onAcknowledgeAlert(protocolo.id, alerta.id)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded whitespace-nowrap"
                    >
                      ✓ OK
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2 flex-wrap text-xs">
            {protocolo.twitter_handle && (
              <a
                href={`https://twitter.com/${protocolo.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:opacity-75"
              >
                🐦 Twitter
              </a>
            )}
            {protocolo.discord_url && (
              <a
                href={protocolo.discord_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:opacity-75"
              >
                💬 Discord
              </a>
            )}
            {protocolo.points_dashboard_url && (
              <a
                href={protocolo.points_dashboard_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:opacity-75"
              >
                📊 Dashboard
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data
function getMockProtocolos() {
  return [
    {
      id: 1,
      name: 'Nado Exchange',
      type: 'perpDEX',
      backing_score: 8.5,
      twitter_handle: 'nadoexchange',
      discord_url: 'https://discord.gg/nado',
      points_dashboard_url: 'https://nado.exchange/dashboard',
      openAlerts: 2,
      summary: {
        total_events: 15,
        snapshot_count: 1,
        mainnet_count: 0,
        quest_count: 3,
        prontoPara: ['snapshot_detected', 'campaigns_active']
      },
      checklist: {
        twitterMonitoring: { eligibilityThreadsFound: true },
        discordMonitoring: { snapshotAnnounced: true, campaignsFound: true, rulesUpdated: false }
      },
      alerts: [
        { id: 1, message: '⚠️ SNAPSHOT DETECTADO', associated_dates: ['2026-02-25'] },
        { id: 2, message: '🎯 NOVA CAMPANHA/QUEST', associated_dates: [] }
      ]
    },
    {
      id: 2,
      name: 'Arbitrum',
      type: 'L2',
      backing_score: 9.0,
      twitter_handle: 'arbitrum',
      discord_url: 'https://discord.gg/arbitrum',
      points_dashboard_url: null,
      openAlerts: 0,
      summary: {
        total_events: 8,
        snapshot_count: 0,
        mainnet_count: 0,
        quest_count: 1,
        prontoPara: ['campaigns_active']
      },
      checklist: {
        twitterMonitoring: { eligibilityThreadsFound: false },
        discordMonitoring: { snapshotAnnounced: false, campaignsFound: true, rulesUpdated: true }
      },
      alerts: []
    },
    {
      id: 3,
      name: 'Pendle Finance',
      type: 'DeFi',
      backing_score: 7.5,
      twitter_handle: 'pendle_fi',
      discord_url: 'https://discord.gg/pendle',
      points_dashboard_url: 'https://app.pendle.finance/points',
      openAlerts: 1,
      summary: {
        total_events: 12,
        snapshot_count: 1,
        mainnet_count: 1,
        quest_count: 2,
        prontoPara: ['mainnet_coming']
      },
      checklist: {
        twitterMonitoring: { eligibilityThreadsFound: true },
        discordMonitoring: { snapshotAnnounced: true, campaignsFound: true, rulesUpdated: false }
      },
      alerts: [
        { id: 3, message: '🚀 MAINNET/TGE ANUNCIADO', associated_dates: ['2026-03-15'] }
      ]
    }
  ];
}

export default AirdropMonitoringDashboard;
