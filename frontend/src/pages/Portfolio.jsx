import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Wallet, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import MoneyLegoGraph from '../components/MoneyLegoGraph';
import ExitSequence from '../components/ExitSequence';
import api from '../services/api';

/**
 * Página de Portfólio DeFi
 * Visualiza posições, Money Lego, riscos e sequência de saída
 */

const defaultWallet = { address: '0x1234567890123456789012345678901234567890' };

export function Portfolio({ wallet: walletProp }) {
  const wallet = walletProp || defaultWallet;
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAirdrop, setSelectedAirdrop] = useState(null);
  const [moneyLegoGraph, setMoneyLegoGraph] = useState(null);
  const [exitSequence, setExitSequence] = useState(null);

  useEffect(() => {
    if (!wallet?.address) return;
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/portfolio/${wallet.address}`).catch(() => ({
          data: {
            success: false,
            data: getMockPortfolioData()
          }
        }));
        setPortfolio(response.data.data || getMockPortfolioData());
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        setPortfolio(getMockPortfolioData());
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
        }).catch(() => ({
          data: { graph: getMockMoneyLegoGraph() }
        }));
        setMoneyLegoGraph(response.data.graph || getMockMoneyLegoGraph());
        const exitResp = await api.get(`/money-lego/exit-sequence`, {
          params: { airdropId, wallet: wallet.address }
        }).catch(() => ({
          data: { sequence: getMockExitSequence() }
        }));
        setExitSequence(exitResp.data.sequence || getMockExitSequence());
      } catch (error) {
        console.error('Error fetching Money Lego graph:', error);
      }
    };
    fetchMoneyLegoGraph(selectedAirdrop);
  }, [selectedAirdrop, wallet.address]);

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Portfólio DeFi
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-4">Composição</h3>
              <div className="space-y-2">
                {portfolio?.metrics?.portfolioComposition?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.protocol}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Posições Abertas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-4">Posições Abertas</h3>
              <div className="space-y-2">
                {portfolio?.positions?.slice(0, 5).map((pos, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div>
                      <p className="font-semibold text-sm">{pos.protocolo}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{pos.token}</p>
                    </div>
                    <p className="font-semibold">${pos.valor_usd?.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Por Airdrop */}
        <TabsContent value="by-airdrop" className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="font-semibold text-lg mb-4">Selecione um Airdrop</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {portfolio?.airdrops?.map(airdrop => (
                <button
                  key={airdrop.id}
                  onClick={() => setSelectedAirdrop(airdrop.id)}
                  className={`p-3 rounded-lg transition-colors ${selectedAirdrop === airdrop.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <p className="text-sm font-semibold">{airdrop.name}</p>
                  <p className="text-xs opacity-75">${airdrop.total_value?.toFixed(0)}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedAirdrop && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow space-y-4">
              <h3 className="font-semibold text-lg">Detalhes do Airdrop</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Investido</p>
                  <p className="font-bold text-lg">$1,234.56</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Valor Atual</p>
                  <p className="font-bold text-lg">$1,567.89</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">P&L</p>
                  <p className="font-bold text-lg text-green-600">+$333.33</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Money Lego */}
        <TabsContent value="money-lego" className="space-y-4">
          {selectedAirdrop && moneyLegoGraph ? (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow" style={{ height: '400px' }}>
                <MoneyLegoGraph graph={moneyLegoGraph} />
              </div>

              {/* Risco Cascata */}
              {moneyLegoGraph?.riskAnalysis?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Pontos Críticos Detectados
                  </h4>
                  <div className="space-y-2">
                    {moneyLegoGraph.riskAnalysis.map((risk, idx) => (
                      <p key={idx} className="text-sm text-red-800 dark:text-red-300">
                        • {risk.message}
                      </p>
                    ))}
                  </div>
                </div>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-700">Selecione um airdrop para visualizar o grafo Money Lego</p>
            </div>
          )}
        </TabsContent>

        {/* Análise */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-4">Razão de Alavancagem</h3>
              <p className="text-3xl font-bold text-purple-600">
                {portfolio?.metrics?.leverageRatio?.toFixed(2)}x
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {portfolio?.metrics?.leverageRatio < 1.2
                  ? '✓ Conservador'
                  : portfolio?.metrics?.leverageRatio < 1.5
                    ? '⚠️ Balanceado'
                    : '🔴 Alto Risco'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-4">Posições Abertas</h3>
              <p className="text-3xl font-bold text-blue-600">
                {portfolio?.metrics?.positionCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                protocolos monitorados
              </p>
            </div>
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
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'
  };

  return (
    <div className={`${colorMap[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
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
