import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Wallet, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import MoneyLegoGraph from '../components/MoneyLegoGraph';
import ExitSequence from '../components/ExitSequence';
import { GlowCard } from '../components/GlowCard';
import api from '../services/api';

/**
 * Página de Portfólio DeFi
 * Visualiza posições, Money Lego, riscos e sequência de saída
 */

const EMPTY_PORTFOLIO = { metrics: { totalValue: 0, totalDebt: 0, netValue: 0 }, positions: [] };

export function Portfolio({ wallet: walletProp }) {
  const [wallet, setWallet] = useState(walletProp || null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAirdrop, setSelectedAirdrop] = useState(null);
  const [moneyLegoGraph, setMoneyLegoGraph] = useState(null);
  const [exitSequence, setExitSequence] = useState(null);

  useEffect(() => {
    if (walletProp?.address) {
      setWallet(walletProp);
      return;
    }
    api.getWallets()
      .then((response) => {
        const firstWallet = response.data?.data?.find((item) => item.watch_enabled !== false) || response.data?.data?.[0];
        if (firstWallet) setWallet(firstWallet);
      })
      .catch(() => setWallet(null));
  }, [walletProp]);

  useEffect(() => {
    if (!wallet?.address) {
      setPortfolio(EMPTY_PORTFOLIO);
      setLoading(false);
      return;
    }
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        const [positionsResponse, metricsResponse] = await Promise.all([
          api.get(`/defi-portfolio/wallet/${wallet.address}/positions`),
          api.get(`/defi-portfolio/wallet/${wallet.address}/metrics`),
        ]);
        setPortfolio({
          positions: positionsResponse.data?.data?.tokens || [],
          metrics: metricsResponse.data?.data || EMPTY_PORTFOLIO.metrics,
        });
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        setPortfolio(EMPTY_PORTFOLIO);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolioData();
  }, [wallet]);

  useEffect(() => {
    if (!selectedAirdrop) return;
    const fetchMoneyLegoGraph = async (airdropId) => {
      try {
        const response = await api.get(`/money-lego/graph`, {
          params: { airdropId, wallet: wallet.address }
        });
        setMoneyLegoGraph(response.data?.data || null);
        const exitResp = await api.get(`/money-lego/exit`, {
          params: { airdropId, wallet: wallet.address }
        });
        setExitSequence(exitResp.data?.data || null);
      } catch (error) {
        console.error('Error fetching Money Lego graph:', error);
        setMoneyLegoGraph(null);
        setExitSequence(null);
      }
    };
    fetchMoneyLegoGraph(selectedAirdrop);
  }, [selectedAirdrop, wallet?.address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Portfólio DeFi
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Rastreie posições, Money Lego e riscos de cascata
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Valor Total"
          value={`$${portfolio?.metrics?.totalValue?.toFixed(2) || 0}`}
          icon={<Wallet className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          label="Dívida Total"
          value={`$${portfolio?.metrics?.totalDebt?.toFixed(2) || 0}`}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
        <MetricCard
          label="Valor Líquido"
          value={`$${portfolio?.metrics?.netValue?.toFixed(2) || 0}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          label="Health Score"
          value={`${portfolio?.metrics?.healthScore || 0}%`}
          icon={<Zap className="w-6 h-6" />}
          color={portfolio?.metrics?.healthScore > 70 ? 'green' : 'yellow'}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="by-airdrop">Por Airdrop</TabsTrigger>
          <TabsTrigger value="money-lego">Money Lego</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Composição do Portfólio */}
            <GlowCard className="p-6">
              <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Composição</h3>
              <div className="space-y-2">
                {portfolio?.metrics?.portfolioComposition?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {item.protocol}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${item.percentage}%`, background: 'var(--accent)' }}
                        />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>

            {/* Posições Abertas */}
            <GlowCard className="p-6">
              <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Posições Abertas</h3>
              <div className="space-y-2">
                {portfolio?.positions?.slice(0, 5).map((pos, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--surface-2)' }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{pos.protocolo}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pos.token}</p>
                    </div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>${pos.valor_usd?.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </GlowCard>
          </div>
        </TabsContent>

        {/* Por Airdrop */}
        <TabsContent value="by-airdrop" className="space-y-4">
          <GlowCard className="p-6">
            <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Selecione um Airdrop</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {portfolio?.airdrops?.map(airdrop => (
                <button
                  key={airdrop.id}
                  onClick={() => setSelectedAirdrop(airdrop.id)}
                  className="p-3 rounded-lg transition-colors"
                  style={{
                    background: selectedAirdrop === airdrop.id ? 'var(--accent)' : 'var(--surface-2)',
                    color: selectedAirdrop === airdrop.id ? '#0A0A0F' : 'var(--text-primary)',
                  }}
                >
                  <p className="text-sm font-semibold">{airdrop.name}</p>
                  <p className="text-xs opacity-75">${airdrop.total_value?.toFixed(0)}</p>
                </button>
              ))}
            </div>
          </GlowCard>

          {selectedAirdrop && (
            <GlowCard className="p-6 space-y-4">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Detalhes do Airdrop</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Investido</p>
                  <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>$1,234.56</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Valor Atual</p>
                  <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>$1,567.89</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>P&L</p>
                  <p className="font-bold text-lg" style={{ color: 'var(--success)' }}>+$333.33</p>
                </div>
              </div>
            </GlowCard>
          )}
        </TabsContent>

        {/* Money Lego */}
        <TabsContent value="money-lego" className="space-y-4">
          {selectedAirdrop && moneyLegoGraph ? (
            <>
              <GlowCard className="p-4" style={{ height: '400px' }}>
                <MoneyLegoGraph graph={moneyLegoGraph} />
              </GlowCard>

              {/* Risco Cascata */}
              {moneyLegoGraph?.riskAnalysis?.length > 0 && (
                <GlowCard className="p-4" style={{ borderColor: 'rgba(255,69,69,0.35)' }}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--danger)' }}>
                    <AlertTriangle size={18} />
                    Pontos Críticos Detectados
                  </h4>
                  <div className="space-y-2">
                    {moneyLegoGraph.riskAnalysis.map((risk, idx) => (
                      <p key={idx} className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        • {risk.message}
                      </p>
                    ))}
                  </div>
                </GlowCard>
              )}

              {/* Sequência de Saída */}
              {exitSequence && (
                <ExitSequence
                  sequence={exitSequence.sequence}
                  totalValue={moneyLegoGraph?.totalValue}
                  estimatedTime={exitSequence.timeEstimate}
                />
              )}
            </>
          ) : (
            <GlowCard className="p-6 text-center">
              <p style={{ color: 'var(--text-secondary)' }}>Selecione um airdrop para visualizar o grafo Money Lego</p>
            </GlowCard>
          )}
        </TabsContent>

        {/* Análise */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlowCard className="p-6">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Razão de Alavancagem</h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                {portfolio?.metrics?.leverageRatio?.toFixed(2)}x
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                {portfolio?.metrics?.leverageRatio < 1.2
                  ? '✓ Conservador'
                  : portfolio?.metrics?.leverageRatio < 1.5
                    ? '⚠️ Balanceado'
                    : '🔴 Alto Risco'}
              </p>
            </GlowCard>

            <GlowCard className="p-6">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Posições Abertas</h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {portfolio?.metrics?.positionCount}
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                protocolos monitorados
              </p>
            </GlowCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Componente auxiliar para métricas
 */
function MetricCard({ label, value, icon, color }) {
  const colorMap = {
    blue: { iconBg: 'rgba(255,255,255,0.04)', iconColor: 'var(--text-primary)' },
    red: { iconBg: 'rgba(255,69,69,0.08)', iconColor: 'var(--danger)' },
    green: { iconBg: 'rgba(0,230,118,0.08)', iconColor: 'var(--success)' },
    yellow: { iconBg: 'rgba(255,184,0,0.08)', iconColor: 'var(--warning)' }
  };
  const palette = colorMap[color] || colorMap.blue;

  return (
    <GlowCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
        </div>
        <div className="opacity-100 p-2 rounded-xl" style={{ background: palette.iconBg, color: palette.iconColor }}>
          {icon}
        </div>
      </div>
    </GlowCard>
  );
}

export default Portfolio;

// Mock data
function getMockPortfolioData() {
  return {
    metrics: {
      totalValue: 5234.56,
      totalDebt: 1200.00,
      netValue: 4034.56,
      healthScore: 85,
      leverageRatio: 1.3,
      positionCount: 8,
      portfolioComposition: [
        { protocol: 'Lido', value: 1500, percentage: 28.65 },
        { protocol: 'Aave', value: 1200, percentage: 22.91 },
        { protocol: 'Pendle', value: 800, percentage: 15.28 },
        { protocol: 'GMX', value: 600, percentage: 11.46 },
        { protocol: 'Uniswap', value: 400, percentage: 7.64 },
        { protocol: 'Outros', value: 734.56, percentage: 14.04 }
      ]
    },
    positions: [
      { protocolo: 'Lido', token: 'stETH', valor_usd: 1500, tipo: 'lending' },
      { protocolo: 'Aave', token: 'aUSDC', valor_usd: 1200, tipo: 'lending' },
      { protocolo: 'Pendle', token: 'PT-USDC', valor_usd: 800, tipo: 'money_lego' },
      { protocolo: 'GMX', token: 'GMX', valor_usd: 600, tipo: 'farming' }
    ],
    airdrops: [
      { id: 'arbitrum-v1', name: 'Arbitrum', total_value: 2500 },
      { id: 'optimism-v2', name: 'Optimism', total_value: 1800 },
      { id: 'base-v1', name: 'Base', total_value: 934.56 }
    ]
  };
}

function getMockMoneyLegoGraph() {
  return {
    nodes: [
      { id: 1, protocolo_destino: 'Lido', token_destino: 'stETH', valor_usd: 1500 },
      { id: 2, protocolo_destino: 'Aave', token_destino: 'aUSDC', valor_usd: 1200 },
      { id: 3, protocolo_destino: 'Pendle', token_destino: 'PT-USDC', valor_usd: 800 }
    ],
    edges: [
      { from: 1, to: 2, token: 'stETH' },
      { from: 2, to: 3, token: 'aUSDC' }
    ],
    riskAnalysis: [
      { nodeId: 2, message: 'Aave é ponto crítico: 2 protocolos dependem dela' }
    ],
    totalValue: 3500
  };
}

function getMockExitSequence() {
  return {
    sequence: [
      { step: 1, position: { protocolo: 'Pendle', token: 'PT-USDC', valor: 800 }, action: 'Withdraw PT-USDC', risco: 'LOW' },
      { step: 2, position: { protocolo: 'Aave', token: 'aUSDC', valor: 1200 }, action: 'Withdraw aUSDC', risco: 'HIGH' },
      { step: 3, position: { protocolo: 'Lido', token: 'stETH', valor: 1500 }, action: 'Unstake stETH', risco: 'LOW' }
    ],
    timeEstimate: {
      estimatedTimeMinutes: 22.5,
      estimatedTimeHours: 0.4,
      recommendation: 'Rápido para desmontar'
    }
  };
}
