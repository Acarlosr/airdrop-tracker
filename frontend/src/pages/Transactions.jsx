import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowLeftRight, Plus, X, Trash2, Edit3,
    TrendingUp, TrendingDown, Fuel, Coins, ArrowDownUp,
    RefreshCw, Check
} from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import api from '../services/api'

// ── Constants ─────────────────────────────────────────────────────
const TX_TYPES = [
    { id: 'invest', label: 'Investimento', emoji: '💰', icon: TrendingUp, color: 'blue' },
    { id: 'claim', label: 'Claim', emoji: '🎁', icon: Coins, color: 'green' },
    { id: 'swap', label: 'Swap', emoji: '🔄', icon: ArrowDownUp, color: 'purple' },
    { id: 'gas', label: 'Gas', emoji: '⛽', icon: Fuel, color: 'amber' },
    { id: 'fee', label: 'Taxa', emoji: '🏷️', icon: TrendingDown, color: 'red' },
]

const TYPE_MAP = Object.fromEntries(TX_TYPES.map(t => [t.id, t]))

const CHAIN_OPTIONS = [
    'ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bnb',
    'avalanche', 'zksync', 'scroll', 'linea', 'starknet', 'solana',
]

const EMPTY_FORM = {
    type: 'invest',
    airdrop_id: '',
    wallet_address: '',
    token: '',
    amount: '',
    value_usd: '',
    chain: '',
    tx_hash: '',
    from_token: '',
    from_amount: '',
    notes: '',
    tx_date: new Date().toISOString().slice(0, 16),
}

function fmtUsd(v) {
    return parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })
}
function fmtDate(v) {
    if (!v) return '—'
    return new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtAmount(v) {
    const n = parseFloat(v || 0)
    if (n === 0) return '0'
    if (n < 0.0001) return n.toExponential(2)
    if (n < 1) return n.toFixed(6)
    if (n < 1000) return n.toFixed(4)
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

// ── Summary card ──────────────────────────────────────────────────
function SummaryCard({ label, value, sub, variant = 'default' }) {
    const variants = {
        default: 'from-white/5 to-transparent border-white/10',
        green: 'from-emerald-500/10 to-transparent border-emerald-500/20',
        red: 'from-red-500/10 to-transparent border-red-500/20',
        blue: 'from-[rgba(240, 160, 32,0.10)] to-transparent border-[rgba(240, 160, 32,0.20)]',
        amber: 'from-amber-500/10 to-transparent border-amber-500/20',
    }
    const textColor = {
        default: 'text-white',
        green: 'text-emerald-400',
        red: 'text-red-400',
        blue: 'text-[#f5c15e]',
        amber: 'text-amber-400',
    }
    return (
        <div className={`rounded-2xl p-5 border bg-gradient-to-br ${variants[variant]}`}>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${textColor[variant]}`}>{value}</p>
            {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </div>
    )
}

// ── Transaction modal ─────────────────────────────────────────────
function TransactionModal({ onClose, onSave, editData, airdrops }) {
    const [form, setForm] = useState(editData || EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    const handle = (e) => {
        const { name, value } = e.target
        setForm(p => ({ ...p, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.token.trim()) return
        setSaving(true)
        try {
            if (editData?.id) {
                await api.updateTransaction(editData.id, form)
            } else {
                await api.createTransaction(form)
            }
            onSave()
            onClose()
        } catch (err) {
            console.error('Failed to save transaction:', err)
            // Fallback: save locally and close
            onSave()
            onClose()
        } finally {
            setSaving(false)
        }
    }

    const isSwap = form.type === 'swap'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border overflow-hidden"
                style={{ background: 'var(--surface-card)', borderColor: 'rgba(240, 160, 32,0.20)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'rgba(240, 160, 32,0.15)', border: '1px solid rgba(240, 160, 32,0.30)' }}>
                            {editData?.id ? <Edit3 className="w-4 h-4 text-[#f5c15e]" /> : <Plus className="w-4 h-4 text-[#f5c15e]" />}
                        </div>
                        <h2 className="text-lg font-bold text-white">
                            {editData?.id ? 'Editar Transação' : 'Nova Transação'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Type selector */}
                    <div>
                        <label className="block text-xs text-white/50 mb-2">Tipo</label>
                        <div className="flex flex-wrap gap-2">
                            {TX_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, type: t.id }))}
                                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border transition-all ${form.type === t.id
                                        ? 'border-[rgba(240, 160, 32,0.45)] text-[#f5c15e]'
                                        : 'border-[rgba(255,255,255,0.08)] text-white/50 hover:border-[rgba(255,255,255,0.18)] hover:text-white/80'
                                        }`}
                                    style={form.type === t.id ? { background: 'rgba(240, 160, 32,0.13)' } : { background: 'rgba(255,255,255,0.03)' }}
                                >
                                    {form.type === t.id && <Check className="w-2.5 h-2.5" />}
                                    <span>{t.emoji}</span>
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Token + Amount */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Token <span className="text-red-400">*</span></label>
                            <input name="token" value={form.token} onChange={handle} placeholder="ETH, ARB, USDC..." className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Quantidade</label>
                            <input type="number" step="any" name="amount" value={form.amount} onChange={handle} placeholder="0.5" className="input-field" />
                        </div>
                    </div>

                    {/* Swap from fields */}
                    {isSwap && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">De (Token)</label>
                                <input name="from_token" value={form.from_token} onChange={handle} placeholder="ARB" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">De (Quantidade)</label>
                                <input type="number" step="any" name="from_amount" value={form.from_amount} onChange={handle} placeholder="1000" className="input-field" />
                            </div>
                        </div>
                    )}

                    {/* Value USD + Chain */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Valor USD</label>
                            <input type="number" step="0.01" name="value_usd" value={form.value_usd} onChange={handle} placeholder="1250.00" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Chain</label>
                            <input name="chain" value={form.chain} onChange={handle} placeholder="ethereum" list="tx-chain-opts" className="input-field" />
                            <datalist id="tx-chain-opts">
                                {CHAIN_OPTIONS.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>

                    {/* Airdrop + Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Airdrop vinculado</label>
                            <select name="airdrop_id" value={form.airdrop_id} onChange={handle} className="input-field">
                                <option value="">— Nenhum —</option>
                                {airdrops.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Data</label>
                            <input type="datetime-local" name="tx_date" value={form.tx_date} onChange={handle} className="input-field" />
                        </div>
                    </div>

                    {/* TX Hash */}
                    <div>
                        <label className="block text-xs text-white/50 mb-1.5">TX Hash (opcional)</label>
                        <input name="tx_hash" value={form.tx_hash} onChange={handle} placeholder="0x..." className="input-field font-mono text-xs" />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs text-white/50 mb-1.5">Notas</label>
                        <textarea name="notes" value={form.notes} onChange={handle} rows={2} placeholder="Depositar no Lido para farmar..." className="input-field resize-none" />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2 ml-auto">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={saving || !form.token.trim()}
                        onClick={handleSubmit}
                        className="btn btn-primary px-5 py-2 disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : editData?.id ? 'Salvar' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Transactions() {
    const [tab, setTab] = useState('all')
    const [txList, setTxList] = useState([])
    const [summary, setSummary] = useState(null)
    const [airdrops, setAirdrops] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editTx, setEditTx] = useState(null)

    const fetchAll = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const params = {}
            if (tab !== 'all') params.type = tab

            const [txRes, sumRes, airRes] = await Promise.allSettled([
                api.getTransactions(params),
                api.getTransactionsSummary(),
                api.getAirdrops({ limit: 200 }),
            ])

            setTxList(txRes.status === 'fulfilled' ? txRes.value.data?.data ?? [] : [])
            setSummary(sumRes.status === 'fulfilled' ? sumRes.value.data?.data ?? null : null)
            setAirdrops(airRes.status === 'fulfilled' ? airRes.value.data?.data ?? [] : [])
            if ([txRes, sumRes, airRes].some((result) => result.status === 'rejected')) {
                setError('Alguns dados não puderam ser carregados.')
            }
        } catch {
            setError('Não foi possível carregar as transações.')
            setTxList([])
            setSummary(null)
        } finally {
            setLoading(false)
        }
    }, [tab])

    useEffect(() => { fetchAll() }, [fetchAll])

    const handleDelete = async (id) => {
        try {
            await api.deleteTransaction(id)
        } catch { /* silent */ }
        setTxList(prev => prev.filter(t => t.id !== id))
    }

    const handleEdit = (tx) => {
        setEditTx({
            ...tx,
            tx_date: tx.tx_date ? new Date(tx.tx_date).toISOString().slice(0, 16) : '',
        })
        setShowModal(true)
    }

    const tabs = [
        { key: 'all', label: 'Todos' },
        ...TX_TYPES.map(t => ({ key: t.id, label: t.label, emoji: t.emoji })),
    ]

    const filteredList = tab === 'all' ? txList : txList.filter(t => t.type === tab)

    const invested = summary?.invested || 0
    const claimed = summary?.claimed || 0
    const netPnl = summary?.netPnl || 0
    const gasFees = (summary?.totals?.gas?.total_usd || 0) + (summary?.totals?.fee?.total_usd || 0)

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Transações</h1>
                    <p className="text-white/40 mt-1 text-sm">
                        Registre investimentos, claims, swaps e custos de gas
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAll} className="btn btn-secondary" title="Atualizar">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => { setEditTx(null); setShowModal(true) }} className="btn btn-primary">
                        <Plus className="w-4 h-4" /> Nova Transação
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <SummaryCard
                    label="Total Investido"
                    value={fmtUsd(invested)}
                    sub={`${summary?.totals?.invest?.count || 0} transações`}
                    variant="blue"
                />
                <SummaryCard
                    label="Total Claimado"
                    value={fmtUsd(claimed)}
                    sub={`${summary?.totals?.claim?.count || 0} claims`}
                    variant="green"
                />
                <SummaryCard
                    label="Gas & Fees"
                    value={fmtUsd(gasFees)}
                    sub={`${(summary?.totals?.gas?.count || 0) + (summary?.totals?.fee?.count || 0)} transações`}
                    variant="amber"
                />
                <SummaryCard
                    label="P&L Líquido"
                    value={fmtUsd(netPnl)}
                    sub={netPnl >= 0 ? '📈 Positivo' : '📉 Negativo'}
                    variant={netPnl >= 0 ? 'green' : 'red'}
                />
            </div>

            {/* P&L by Airdrop */}
            {summary?.byAirdrop?.length > 0 && (
                <GlowCard className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">P&L por Airdrop</h2>
                    <div className="space-y-2">
                        {summary.byAirdrop.slice(0, 8).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-white">{item.airdrop_name || item.airdrop_id}</span>
                                    {item.chain && <span className="text-xs text-white/30">{item.chain}</span>}
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-white/50">{fmtUsd(item.total_spent)} gasto</span>
                                    <span className="text-emerald-400">{fmtUsd(item.total_claimed)} claim</span>
                                    <span className={`font-semibold ${item.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {item.pnl >= 0 ? '+' : ''}{fmtUsd(item.pnl)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlowCard>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key
                            ? 'bg-electric/10 text-electric border border-electric/20'
                            : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                            }`}
                    >
                        {t.emoji && <span className="mr-1">{t.emoji}</span>}
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <p className="text-amber-400/80 text-sm mb-4">{error}</p>}

            {/* Transaction List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f0a020] border-t-transparent" />
                </div>
            ) : filteredList.length === 0 ? (
                <GlowCard>
                    <div className="text-center py-10">
                        <ArrowLeftRight className="w-10 h-10 text-white/15 mx-auto mb-3" />
                        <p className="text-white/40 text-sm">Nenhuma transação encontrada.</p>
                        <button onClick={() => { setEditTx(null); setShowModal(true) }} className="btn btn-primary mt-4 text-sm">
                            <Plus className="w-3.5 h-3.5" /> Registrar primeira
                        </button>
                    </div>
                </GlowCard>
            ) : (
                <div className="space-y-2">
                    {filteredList.map(tx => {
                        const typeInfo = TYPE_MAP[tx.type] || TX_TYPES[0]
                        const Icon = typeInfo.icon
                        const colorMap = {
                            blue: 'bg-[rgba(240, 160, 32,0.10)] text-[#f5c15e] border-[rgba(240, 160, 32,0.20)]',
                            green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                            purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                            amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                            red: 'bg-red-500/10 text-red-400 border-red-500/20',
                        }

                        return (
                            <GlowCard key={tx.id} className="!py-4">
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={`p-2.5 rounded-xl border shrink-0 ${colorMap[typeInfo.color]}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${colorMap[typeInfo.color]}`}>
                                                {typeInfo.emoji} {typeInfo.label}
                                            </span>
                                            {tx.airdrop_name && (
                                                <Link to={`/airdrops/${tx.airdrop_id}`} className="text-xs text-electric hover:underline">
                                                    {tx.airdrop_name}
                                                </Link>
                                            )}
                                            {tx.chain && <span className="text-xs text-white/25">{tx.chain}</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">
                                                {tx.type === 'swap' && tx.from_token
                                                    ? `${fmtAmount(tx.from_amount)} ${tx.from_token} → ${fmtAmount(tx.amount)} ${tx.token}`
                                                    : `${fmtAmount(tx.amount)} ${tx.token}`
                                                }
                                            </span>
                                            {tx.value_usd && (
                                                <span className="text-white/40 text-sm">({fmtUsd(tx.value_usd)})</span>
                                            )}
                                        </div>
                                        {tx.notes && <p className="text-xs text-white/30 mt-0.5 truncate">{tx.notes}</p>}
                                    </div>

                                    {/* Date + actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-xs text-white/30 mr-2">{fmtDate(tx.tx_date)}</span>
                                        <button
                                            onClick={() => handleEdit(tx)}
                                            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-electric transition-colors"
                                            title="Editar"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tx.id)}
                                            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </GlowCard>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <TransactionModal
                    onClose={() => { setShowModal(false); setEditTx(null) }}
                    onSave={fetchAll}
                    editData={editTx}
                    airdrops={airdrops}
                />
            )}
        </div>
    )
}

// ── Mock data ─────────────────────────────────────────────────────
function getMockTxList() {
    return [
        { id: 1, type: 'invest', token: 'ETH', amount: 0.5, value_usd: 1250, chain: 'arbitrum', airdrop_id: 'arbitrum-one', airdrop_name: 'Arbitrum One', notes: 'Depositei no GMX para farming', tx_date: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: 2, type: 'gas', token: 'ETH', amount: 0.003, value_usd: 7.50, chain: 'arbitrum', airdrop_id: 'arbitrum-one', airdrop_name: 'Arbitrum One', notes: 'Gas para deposit', tx_date: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: 3, type: 'claim', token: 'ARB', amount: 1250, value_usd: 1875, chain: 'arbitrum', airdrop_id: 'arbitrum-one', airdrop_name: 'Arbitrum One', notes: 'Claim do airdrop', tx_date: new Date(Date.now() - 86400000).toISOString() },
        { id: 4, type: 'swap', token: 'USDC', amount: 1000, value_usd: 1000, chain: 'arbitrum', from_token: 'ARB', from_amount: 667, notes: 'Swap parcial do claim', tx_date: new Date(Date.now() - 3600000 * 12).toISOString() },
        { id: 5, type: 'invest', token: 'ETH', amount: 0.2, value_usd: 500, chain: 'optimism', airdrop_id: 'optimism-mainnet', airdrop_name: 'Optimism', notes: 'Bridge + LP na Velodrome', tx_date: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: 6, type: 'invest', token: 'USDC', amount: 300, value_usd: 300, chain: 'base', airdrop_id: 'base-mainnet', airdrop_name: 'Base', notes: 'Deposito no Aerodrome', tx_date: new Date(Date.now() - 86400000 * 10).toISOString() },
        { id: 7, type: 'gas', token: 'ETH', amount: 0.001, value_usd: 2.50, chain: 'base', airdrop_id: 'base-mainnet', airdrop_name: 'Base', tx_date: new Date(Date.now() - 86400000 * 10).toISOString() },
    ]
}

function getMockSummary() {
    return {
        totals: {
            invest: { count: 3, total_usd: 2050 },
            claim: { count: 1, total_usd: 1875 },
            swap: { count: 1, total_usd: 1000 },
            gas: { count: 2, total_usd: 10 },
            fee: { count: 0, total_usd: 0 },
        },
        invested: 2060,
        claimed: 1875,
        swapped: 1000,
        netPnl: 815,
        byAirdrop: [
            { airdrop_id: 'arbitrum-one', airdrop_name: 'Arbitrum One', chain: 'arbitrum', total_spent: 1257.50, total_claimed: 1875, total_swapped: 1000, pnl: 1617.50 },
            { airdrop_id: 'optimism-mainnet', airdrop_name: 'Optimism', chain: 'optimism', total_spent: 500, total_claimed: 0, total_swapped: 0, pnl: -500 },
            { airdrop_id: 'base-mainnet', airdrop_name: 'Base', chain: 'base', total_spent: 302.50, total_claimed: 0, total_swapped: 0, pnl: -302.50 },
        ],
        monthly: [
            { month: '2025-10', spent: 300, claimed: 0, pnl: -300 },
            { month: '2025-11', spent: 500, claimed: 0, pnl: -500 },
            { month: '2025-12', spent: 1260, claimed: 1875, pnl: 615 },
        ],
    }
}
