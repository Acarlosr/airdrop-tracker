import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Coins,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Sprout,
} from 'lucide-react'
import { GlowCard } from './GlowCard'

const COLLATERAL_ASSETS = ['BTC', 'ETH', 'HYPE', 'SOL', 'HIVE', 'Outro']
const STABLECOINS = ['USDC', 'USDT', 'DAI', 'Outra']
const TARGET_ASSETS = ['BTC', 'ETH', 'HYPE', 'SOL', 'HIVE', 'Outro']
const PROTOCOLS = ['Aave', 'HyperLend', 'Kamino', 'Outro protocolo']

function numberFrom(value, fallback = 0) {
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function usd(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function pct(value) {
  return `${Math.max(0, value).toFixed(1).replace('.', ',')}%`
}

function Metric({ label, value, tone = 'neutral', helper }) {
  const colors = {
    neutral: 'text-white',
    safe: 'text-emerald-400',
    warning: 'text-amber-400',
    accent: 'text-[#f5c15e]',
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${colors[tone]}`}>{value}</p>
      {helper && <p className="mt-1 text-xs text-white/35">{helper}</p>}
    </div>
  )
}

function Step({ number, icon: Icon, title, description, last = false }) {
  return (
    <div className="relative flex gap-3">
      <div className="relative flex flex-col items-center">
        <div className="z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-[#f0a020]/30 bg-[#f0a020]/10 text-[#f5c15e]">
          <Icon className="h-4 w-4" />
        </div>
        {!last && <div className="h-full w-px bg-white/10" />}
      </div>
      <div className="pb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/30">Passo {number}</p>
        <p className="mt-0.5 text-sm font-semibold text-white/90">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/45">{description}</p>
      </div>
    </div>
  )
}

export default function MoneyLegoPlanner() {
  const [strategy, setStrategy] = useState('farm')
  const [collateralAsset, setCollateralAsset] = useState('ETH')
  const [collateralValue, setCollateralValue] = useState('10000')
  const [protocol, setProtocol] = useState('Aave')
  const [stablecoin, setStablecoin] = useState('USDC')
  const [targetAsset, setTargetAsset] = useState('BTC')
  const [ltv, setLtv] = useState(30)
  const [reserveRate, setReserveRate] = useState(15)
  const [borrowApy, setBorrowApy] = useState('6')
  const [strategyApy, setStrategyApy] = useState('12')
  const [targetRise, setTargetRise] = useState('20')

  const metrics = useMemo(() => {
    const collateral = Math.max(0, numberFrom(collateralValue))
    const debt = collateral * (ltv / 100)
    const reserve = debt * (reserveRate / 100)
    const deployable = Math.max(0, debt - reserve)
    const debtCost = debt * (Math.max(0, numberFrom(borrowApy)) / 100)
    const farmRevenue = deployable * (Math.max(0, numberFrom(strategyApy)) / 100)
    const farmNet = farmRevenue - debtCost
    const projectedTradeValue = deployable * (1 + numberFrom(targetRise) / 100)
    const projectedTradeResult = projectedTradeValue - deployable - debtCost
    const reinforcedCollateral = collateral + deployable
    const reinforcedLtv = reinforcedCollateral > 0 ? (debt / reinforcedCollateral) * 100 : 0
    const liquidationThreshold = 75
    const initialDropBuffer = collateral > 0
      ? Math.max(0, (1 - debt / (collateral * (liquidationThreshold / 100))) * 100)
      : 0

    return {
      debt,
      reserve,
      deployable,
      debtCost,
      farmNet,
      projectedTradeValue,
      projectedTradeResult,
      reinforcedLtv,
      initialDropBuffer,
    }
  }, [borrowApy, collateralValue, ltv, reserveRate, strategyApy, targetRise])

  const fieldClass = 'input-field mt-1.5 h-10'
  const isFarm = strategy === 'farm'

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#f0a020]/25 bg-gradient-to-br from-[#f0a020]/10 via-transparent to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#f0a020]/25 bg-[#f0a020]/10 px-3 py-1 text-xs font-medium text-[#f5c15e]">
              <Coins className="h-3.5 w-3.5" /> Money Lego · Mainnet
            </div>
            <h2 className="text-2xl font-bold text-white">Planeje o uso do airdrop sem vender o ativo inicial</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Simule uma garantia, um empréstimo em stablecoin e o destino do capital. O ClaimOS não conecta carteira, não executa transações e não consulta taxas ao vivo.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3 text-xs leading-5 text-amber-200/75 lg:max-w-sm">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Confirme rede, mercado, ativo aceito, LTV, liquidação, juros e liquidez diretamente no protocolo antes de qualquer operação.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setStrategy('farm')}
          className={`rounded-2xl border p-4 text-left transition-all ${isFarm ? 'border-[#f0a020]/45 bg-[#f0a020]/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
        >
          <div className="flex items-center gap-3">
            <Sprout className={`h-5 w-5 ${isFarm ? 'text-[#f5c15e]' : 'text-white/40'}`} />
            <div>
              <p className="font-semibold text-white">Farm com stablecoin</p>
              <p className="mt-0.5 text-xs text-white/40">Emprestar e buscar rendimento com parte do capital.</p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setStrategy('trade')}
          className={`rounded-2xl border p-4 text-left transition-all ${!isFarm ? 'border-[#f0a020]/45 bg-[#f0a020]/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className={`h-5 w-5 ${!isFarm ? 'text-[#f5c15e]' : 'text-white/40'}`} />
            <div>
              <p className="font-semibold text-white">Trader básico</p>
              <p className="mt-0.5 text-xs text-white/40">Comprar outro ativo e planejar venda, pagamento e lucro.</p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <GlowCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Montagem da posição</h3>
              <p className="mt-1 text-xs text-white/40">Valores manuais para comparação de cenários.</p>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400">Somente simulação</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-white/55">
              Ativo em garantia
              <select className={fieldClass} value={collateralAsset} onChange={(event) => setCollateralAsset(event.target.value)}>
                {COLLATERAL_ASSETS.map((asset) => <option key={asset}>{asset}</option>)}
              </select>
            </label>
            <label className="text-xs text-white/55">
              Valor da garantia (USD)
              <input className={fieldClass} type="number" min="0" step="100" value={collateralValue} onChange={(event) => setCollateralValue(event.target.value)} />
            </label>
            <label className="text-xs text-white/55">
              Protocolo a verificar
              <select className={fieldClass} value={protocol} onChange={(event) => setProtocol(event.target.value)}>
                {PROTOCOLS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-xs text-white/55">
              Stablecoin emprestada
              <select className={fieldClass} value={stablecoin} onChange={(event) => setStablecoin(event.target.value)}>
                {STABLECOINS.map((asset) => <option key={asset}>{asset}</option>)}
              </select>
            </label>
            <label className="text-xs text-white/55 sm:col-span-2">
              LTV planejado: <span className="font-semibold text-white/90">{ltv}%</span>
              <input className="mt-3 w-full accent-[#f0a020]" type="range" min="10" max="60" step="5" value={ltv} onChange={(event) => setLtv(Number(event.target.value))} />
              <div className="mt-1 flex justify-between text-[10px] text-white/25"><span>10% conservador</span><span>60% agressivo</span></div>
            </label>
            <label className="text-xs text-white/55">
              Reserva para juros/saída: {reserveRate}%
              <input className="mt-3 w-full accent-[#f0a020]" type="range" min="0" max="30" step="5" value={reserveRate} onChange={(event) => setReserveRate(Number(event.target.value))} />
            </label>
            <label className="text-xs text-white/55">
              Custo anual do empréstimo (%)
              <input className={fieldClass} type="number" min="0" step="0.5" value={borrowApy} onChange={(event) => setBorrowApy(event.target.value)} />
            </label>
            {isFarm ? (
              <label className="text-xs text-white/55 sm:col-span-2">
                Rendimento anual estimado do farm (%)
                <input className={fieldClass} type="number" min="0" step="0.5" value={strategyApy} onChange={(event) => setStrategyApy(event.target.value)} />
              </label>
            ) : (
              <>
                <label className="text-xs text-white/55">
                  Ativo a comprar
                  <select className={fieldClass} value={targetAsset} onChange={(event) => setTargetAsset(event.target.value)}>
                    {TARGET_ASSETS.map((asset) => <option key={asset}>{asset}</option>)}
                  </select>
                </label>
                <label className="text-xs text-white/55">
                  Cenário de alta do ativo (%)
                  <input className={fieldClass} type="number" step="1" value={targetRise} onChange={(event) => setTargetRise(event.target.value)} />
                </label>
              </>
            )}
          </div>
        </GlowCard>

        <GlowCard className="p-5 sm:p-6">
          <h3 className="font-semibold text-white">Fluxo planejado</h3>
          <p className="mt-1 text-xs text-white/40">{protocol} · garantia em {collateralAsset} · dívida em {stablecoin}</p>
          <div className="mt-5">
            <Step number="1" icon={ShieldCheck} title={`Depositar ${collateralAsset} como garantia`} description={`Valor informado: ${usd(numberFrom(collateralValue))}. Verifique se a representação do ativo é aceita na rede escolhida.`} />
            <Step number="2" icon={Landmark} title={`Tomar ${usd(metrics.debt)} em ${stablecoin}`} description={`LTV inicial de ${ltv}%, mantendo ${usd(metrics.reserve)} separado para juros, taxas ou saída.`} />
            {isFarm ? (
              <Step number="3" icon={Sprout} title={`Aplicar ${usd(metrics.deployable)} no farm`} description="Compare o rendimento líquido com o custo variável da dívida e o risco do protocolo de destino." />
            ) : (
              <Step number="3" icon={RefreshCw} title={`Trocar ${stablecoin} por ${targetAsset}`} description={`Comprar até ${usd(metrics.deployable)} e, somente se o mercado permitir, avaliar o novo ativo como garantia.`} />
            )}
            <Step
              number="4"
              icon={ArrowRight}
              title={isFarm ? 'Colher rendimento e pagar a dívida' : `Vender ${targetAsset}, pagar a dívida e retirar o excedente`}
              description="A saída deve quitar principal, juros, slippage e taxas antes de liberar a garantia original."
              last
            />
          </div>
        </GlowCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Empréstimo estimado" value={usd(metrics.debt)} tone="accent" helper={`${ltv}% da garantia`} />
        <Metric label="Capital utilizável" value={usd(metrics.deployable)} helper={`${reserveRate}% reservado`} />
        {isFarm ? (
          <Metric label="Resultado anual estimado" value={usd(metrics.farmNet)} tone={metrics.farmNet >= 0 ? 'safe' : 'warning'} helper="Rendimento menos juros; sem taxas" />
        ) : (
          <Metric label="Resultado no cenário" value={usd(metrics.projectedTradeResult)} tone={metrics.projectedTradeResult >= 0 ? 'safe' : 'warning'} helper={`Venda projetada: ${usd(metrics.projectedTradeValue)}`} />
        )}
        <Metric
          label={isFarm ? 'Folga teórica até 75% LTV' : 'LTV após reforço teórico'}
          value={isFarm ? pct(metrics.initialDropBuffer) : pct(metrics.reinforcedLtv)}
          tone={ltv <= 35 ? 'safe' : 'warning'}
          helper={isFarm ? 'Não substitui o limite real do protocolo' : 'Assume preço constante e ativo aceito'}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs leading-5 text-white/40">
        Este cálculo é educacional e não inclui variação de juros, preço, oracle, taxa de liquidação, slippage, gas, bridge, depeg ou risco de smart contract. BTC, ETH, HYPE, SOL e HIVE podem exigir versões wrapped e não são aceitos em todos os mercados.
      </div>
    </div>
  )
}
