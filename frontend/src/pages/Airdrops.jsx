import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, X, Zap, Check, ExternalLink, Wallet, Trash2 } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs'
import api from '../services/api'
import { useNetworks, findNetworkForAirdrop } from '../context/NetworksContext'
import AddNetworkModal from '../components/AddNetworkModal'
import { useAuth } from '../context/AuthContext'
import MoneyLegoPlanner from '../components/MoneyLegoPlanner'

// ── Helpers ───────────────────────────────────────────────────────
const TESTNET_KEYWORDS = ['sepolia', 'goerli', 'testnet', 'test-', '-test']
function isTestnet(chain) {
  if (!chain) return false
  return TESTNET_KEYWORDS.some((k) => String(chain).toLowerCase().includes(k))
}
function filterByNetwork(list, tab) {
  if (tab === 'mainnet') return list.filter((a) => !isTestnet(a.chain))
  if (tab === 'testnet') return list.filter((a) => isTestnet(a.chain))
  return list
}
function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

// ── Category types ────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'mainnet', emoji: '🌐', label: 'Mainnet' },
  { id: 'testnet', emoji: '🧪', label: 'Testnet' },
  { id: 'perpdex', emoji: '📈', label: 'PerpDex' },
  { id: 'depin', emoji: '📡', label: 'DePin' },
  { id: 'defi', emoji: '🏦', label: 'DeFi' },
  { id: 'bridge', emoji: '🌉', label: 'Bridge' },
  { id: 'nft', emoji: '🖼️', label: 'NFT' },
  { id: 'layer2', emoji: '⚡', label: 'Layer 2' },
  { id: 'stablecoin', emoji: '🪙', label: 'Stablecoin' },
  { id: 'solana', emoji: '◎', label: 'Solana' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming' },
  { id: 'dao', emoji: '🏛️', label: 'DAO' },
]

// ── Tags ──────────────────────────────────────────────────────────
const ALL_TAGS = [
  { id: 'bridge', emoji: '🌉', label: 'Bridge' },
  { id: 'solana', emoji: '◎', label: 'Solana' },
  { id: 'depin', emoji: '📡', label: 'DePin' },
  { id: 'tutorial', emoji: '📋', label: 'Tutorial' },
  { id: 'snapshot', emoji: '📸', label: 'Snapshot' },
  { id: 'custo-alto', emoji: '💸', label: 'Custo Alto' },
  { id: 'custo-baixo', emoji: '💰', label: 'Custo baixo' },
  { id: 'encerrado', emoji: '❌', label: 'ENCERRADO' },
  { id: 'em-andamento', emoji: '✅', label: 'EM ANDAMENTO' },
  { id: 'testnet', emoji: '🧪', label: 'Testnet' },
  { id: 'potencial-alto', emoji: '😀', label: 'Potencial alto' },
  { id: 'potencial-medio', emoji: '😐', label: 'Potencial médio' },
  { id: 'potencial-fraco', emoji: '😕', label: 'Potencial fraco' },
  { id: 'hyperliquid', emoji: '✅', label: 'Hyperliquid' },
  { id: 'stablecoin', emoji: '🪙', label: 'Stablecoin' },
  { id: 'nft', emoji: '🖼️', label: 'NFT' },
  { id: 'defi', emoji: '🏦', label: 'DeFi' },
  { id: 'layer2', emoji: '⚡', label: 'Layer 2' },
  { id: 'confirmado', emoji: '🎯', label: 'Confirmado' },
  { id: 'gratuito', emoji: '🆓', label: 'Gratuito' },
]

const CHAIN_OPTIONS = [
  'ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bnb',
  'avalanche', 'zksync', 'scroll', 'linea', 'starknet', 'solana',
  'arbitrum-sepolia', 'base-sepolia', 'optimism-sepolia', 'sepolia',
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'upcoming', label: 'Em breve' },
  { value: 'ended', label: 'Encerrado' },
  { value: 'claiming', label: 'Claim aberto' },
]

const PHASE_OPTIONS = [
  { value: 'speculative', label: 'Especulativo' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'live', label: 'Ao vivo' },
  { value: 'claimable', label: 'Claimável' },
  { value: 'ended', label: 'Encerrado' },
]

const WALLET_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em progresso' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'skip', label: 'Pular' },
]

function getPhaseMeta(phase) {
  const map = {
    speculative: { label: 'Especulativo', className: 'bg-white/10 text-white/70 border-white/15' },
    confirmed: { label: 'Confirmado', className: 'bg-electric/15 text-electric border-electric/30' },
    live: { label: 'Ao vivo', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    claimable: { label: 'Claimável', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    ended: { label: 'Encerrado', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  }
  return map[phase] || null
}

const EMPTY_FORM = {
  name: '', protocol: '', chain: '', status: 'active',
  total_supply: '', snapshot_date: '', claim_start: '', claim_end: '',
  phase: '',
  tgeDate: '',
  vestingEndDate: '',
  estimatedValue: '',
  website: '', twitter: '', discord: '', docs: '',
  description: '', farm_value: '', funding: '',
  potential: '', cost: '',
  networkId: '',
  contractAddress: '',
  categories: [], tags: [],
  customCategories: [], // categorias digitadas pelo usuário (além das pré-definidas)
  walletIds: [],
  walletStatus: {},
}

// ── Chip toggle button ────────────────────────────────────────────
function Chip({ emoji, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all ${active
          ? 'border-[rgba(240, 160, 32,0.45)] text-[#f5c15e]'
          : 'border-[rgba(255,255,255,0.08)] text-white/50 hover:border-[rgba(255,255,255,0.18)] hover:text-white/80'
        }`}
      style={active ? { background: 'rgba(240, 160, 32,0.13)' } : { background: 'rgba(255,255,255,0.03)' }}
    >
      {active && <Check className="w-2.5 h-2.5" />}
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}

// Valor sentinela do <select>: abre o cadastro rápido de rede.
const ADD_NETWORK_OPTION = '__add_network__'

// ── Add Airdrop Modal ─────────────────────────────────────────────
function AddAirdropModal({ onClose, onAdd }) {
  const { networks, addNetwork } = useNetworks()
  const activeNetworks = networks.filter((n) => n.isActive)
  const [showAddNetwork, setShowAddNetwork] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [section, setSection] = useState('basic') // 'basic' | 'details' | 'tags'
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [walletOptions, setWalletOptions] = useState([])
  const [walletsLoading, setWalletsLoading] = useState(false)

  const addCustomCategory = () => {
    const name = newCategoryInput.trim()
    if (!name) return
    if ((form.customCategories || []).some((item) => item.toLowerCase() === name.toLowerCase())) return
    setForm((p) => ({ ...p, customCategories: [...(p.customCategories || []), name] }))
    setNewCategoryInput('')
  }

  useEffect(() => {
    let active = true
    const loadWallets = async () => {
      setWalletsLoading(true)
      try {
        const res = await api.getWallets()
        if (!active) return
        setWalletOptions(res.data?.data ?? [])
      } catch {
        if (!active) return
        setWalletOptions(getMockWalletChoices())
      } finally {
        if (active) setWalletsLoading(false)
      }
    }

    loadWallets()
    return () => {
      active = false
    }
  }, [])

  const handle = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const handleNetworkChange = (e) => {
    const networkId = e.target.value
    if (networkId === ADD_NETWORK_OPTION) {
      setShowAddNetwork(true)
      return
    }
    setForm((p) => {
      const next = { ...p, networkId }
      if (networkId && !p.chain) {
        const net = activeNetworks.find((n) => n.id === networkId)
        if (net) next.chain = net.name.toLowerCase()
      }
      return next
    })
  }

  // Cria a rede e já a deixa selecionada, sem perder nada do formulário do airdrop.
  const handleNetworkCreated = (data) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `net-${Date.now()}-${Math.random().toString(16).slice(2)}`
    addNetwork({ ...data, id })
    setForm((p) => ({ ...p, networkId: id, chain: p.chain || data.name.toLowerCase() }))
    setShowAddNetwork(false)
  }

  const toggleSet = (field, id) => {
    setForm((p) => {
      const curr = new Set(p[field])
      if (curr.has(id)) curr.delete(id)
      else curr.add(id)
      return { ...p, [field]: [...curr] }
    })
  }

  const toggleWallet = (walletId) => {
    setForm((prev) => {
      const selected = new Set(prev.walletIds || [])
      const nextStatus = { ...(prev.walletStatus || {}) }

      if (selected.has(walletId)) {
        selected.delete(walletId)
        delete nextStatus[walletId]
      } else {
        selected.add(walletId)
        nextStatus[walletId] = nextStatus[walletId] || 'pending'
      }

      return {
        ...prev,
        walletIds: [...selected],
        walletStatus: nextStatus,
      }
    })
  }

  const updateWalletStatus = (walletId, status) => {
    setForm((prev) => ({
      ...prev,
      walletStatus: {
        ...(prev.walletStatus || {}),
        [walletId]: status,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!form.chain.trim() && !form.networkId) { setFormError('Selecione uma rede ou preencha a chain.'); return }

    const id = slugify(form.name)
    const payload = {
      id,
      name: form.name.trim(),
      protocol: form.protocol.trim() || form.name.trim(),
      chain: form.chain.trim() || null,
      status: form.status,
      phase: form.phase || null,
      total_supply: form.total_supply ? Number(form.total_supply) : null,
      snapshot_date: form.snapshot_date || null,
      claim_start: form.claim_start || null,
      claim_end: form.claim_end || null,
      tgeDate: form.tgeDate || null,
      vestingEndDate: form.vestingEndDate || null,
      estimatedValue: form.estimatedValue.trim() || null,
      walletIds: (form.walletIds || []).length ? form.walletIds : null,
      walletStatus: (form.walletIds || []).length ? form.walletStatus : null,
      criteria: {
        categories: form.categories,
        tags: form.tags,
        networkId: form.networkId || null,
        guide: {
          description: form.description || null,
          farm_value: form.farm_value || null,
          funding: form.funding || null,
          potential: form.potential || null,
          cost: form.cost || null,
          contractAddress: form.contractAddress || null,
          customCategories: (form.customCategories || []).length ? form.customCategories : null,
        },
      },
      links: {
        website: form.website || null,
        twitter: form.twitter || null,
        discord: form.discord || null,
        docs: form.docs || null,
      },
    }

    setSubmitting(true)
    try {
      const res = await api.createAirdrop(payload)
      onAdd(res.data?.data || { ...payload, id: `${id}-${Date.now()}` })
      onClose()
    } catch (err) {
      if (err.response?.status === 409) {
        setFormError('Já existe um airdrop com esse nome.')
      } else if (err.response?.status >= 500) {
        // Antes isto adicionava o airdrop só na tela (fake success) e fechava o
        // modal — o usuário achava que salvou, mas o servidor recusou e o item
        // sumia ao navegar. Melhor mostrar o erro e deixar o formulário aberto.
        setFormError('O servidor não conseguiu salvar. Confira se o backend está no ar e se as migrações do banco foram aplicadas.')
      } else if (!err.response) {
        setFormError('Não foi possível falar com o servidor. Ele está rodando?')
      } else {
        setFormError(err.response?.data?.error || 'Erro ao criar airdrop.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { id: 'basic', label: '1. Básico' },
    { id: 'details', label: '2. Detalhes' },
    { id: 'tags', label: '3. Tags' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface-card)', borderColor: 'rgba(240, 160, 32,0.20)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(240, 160, 32,0.15)', border: '1px solid rgba(240, 160, 32,0.30)' }}>
              <Plus className="w-4 h-4 text-[#f5c15e]" />
            </div>
            <h2 className="text-lg font-bold text-white">Novo Airdrop</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex px-6 pt-4 gap-2 flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${section === t.id
                  ? 'text-[#f5c15e] font-semibold'
                  : 'text-white/40 hover:text-white/70'
                }`}
              style={section === t.id ? { background: 'rgba(240, 160, 32,0.12)', border: '1px solid rgba(240, 160, 32,0.20)' } : { border: '1px solid transparent' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              {formError}
            </div>
          )}

          {/* ── SECTION 1: Básico ── */}
          {section === 'basic' && (
            <div className="space-y-4">
              {/* Name + Protocol */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Nome <span className="text-red-400">*</span></label>
                  <input name="name" value={form.name} onChange={handle} placeholder="Ex: Arbitrum One" className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Protocolo</label>
                  <input name="protocol" value={form.protocol} onChange={handle} placeholder="Ex: Arbitrum" className="input-field" />
                </div>
              </div>

              {/* Rede + Status + Fase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">
                    Rede (selecionar) <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="networkId"
                    value={form.networkId}
                    onChange={handleNetworkChange}
                    className="input-field"
                  >
                    <option value="">— Escolher rede —</option>
                    {activeNetworks.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.env === 'mainnet' ? 'Mainnet' : 'Testnet'})
                      </option>
                    ))}
                    <option value={ADD_NETWORK_OPTION}>+ Nova rede personalizada…</option>
                  </select>
                  <p className="text-[11px] text-white/40 mt-1">
                    Escolha &quot;Nova rede personalizada&quot; para cadastrar sem sair daqui.
                  </p>
                  <Link
                    to="/settings"
                    onClick={onClose}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(255,140,0,0.08)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Gerenciar redes
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Status</label>
                  <select name="status" value={form.status} onChange={handle} className="input-field">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Fase</label>
                  <select name="phase" value={form.phase} onChange={handle} className="input-field">
                    <option value="">— Selecionar —</option>
                    {PHASE_OPTIONS.map((phase) => (
                      <option key={phase.value} value={phase.value}>
                        {phase.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chain + contrato (fallback manual) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Chain (texto livre)</label>
                  <input
                    name="chain"
                    value={form.chain}
                    onChange={handle}
                    placeholder="Ex: arbitrum, base-sepolia"
                    list="chain-opts"
                    className="input-field"
                  />
                  <datalist id="chain-opts">
                    {CHAIN_OPTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">
                    Endereço do contrato (opcional)
                  </label>
                  <input
                    name="contractAddress"
                    value={form.contractAddress}
                    onChange={handle}
                    placeholder="Ex: 0x7AE200168865D8eA7c277C28F7b39cD2348aF396"
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Tipo / Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Chip
                      key={cat.id}
                      emoji={cat.emoji}
                      label={cat.label}
                      active={form.categories.includes(cat.id)}
                      onClick={() => toggleSet('categories', cat.id)}
                    />
                  ))}
                  {(form.customCategories || []).map((label, i) => (
                    <span
                      key={`custom-${i}`}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border border-[rgba(240, 160, 32,0.45)] text-[#f5c15e]"
                      style={{ background: 'rgba(240, 160, 32,0.13)' }}
                    >
                      {label}
                      <button type="button" onClick={() => setForm((p) => ({ ...p, customCategories: p.customCategories.filter((_, j) => j !== i) }))} className="hover:bg-white/20 rounded p-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Nova categoria (ex.: RWA, Meme)"
                    className="input-field flex-1 text-sm"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } }}
                  />
                  <button type="button" onClick={addCustomCategory} className="btn-primary px-3 py-2 text-sm whitespace-nowrap">
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Snapshot</label>
                  <input type="date" name="snapshot_date" value={form.snapshot_date} onChange={handle} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Início Claim</label>
                  <input type="date" name="claim_start" value={form.claim_start} onChange={handle} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Fim Claim</label>
                  <input type="date" name="claim_end" value={form.claim_end} onChange={handle} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">TGE</label>
                  <input type="date" name="tgeDate" value={form.tgeDate} onChange={handle} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Fim do Vesting</label>
                  <input type="date" name="vestingEndDate" value={form.vestingEndDate} onChange={handle} className="input-field" />
                </div>
              </div>

              {/* Oferta total (fichas) */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Oferta total (fichas)</label>
                <input type="number" name="total_supply" value={form.total_supply} onChange={handle} placeholder="Ex: 1000000000" className="input-field" min="0" />
                <p className="text-[11px] text-white/40 mt-1">
                  Total de tokens do airdrop (supply da campanha; quantidade máxima de fichas que serão distribuídas).
                </p>
              </div>

              {/* Links */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Links</label>
                <div className="space-y-2">
                  <input name="website" value={form.website} onChange={handle} placeholder="Website (https://...)" className="input-field" type="url" />
                  <input name="twitter" value={form.twitter} onChange={handle} placeholder="Twitter / X (https://x.com/...)" className="input-field" type="url" />
                  <input name="discord" value={form.discord} onChange={handle} placeholder="Discord (https://discord.gg/...)" className="input-field" type="url" />
                  <input name="docs" value={form.docs} onChange={handle} placeholder="Docs (https://docs...)" className="input-field" type="url" />
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 2: Detalhes ── */}
          {section === 'details' && (
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Descrição do projeto</label>
                <textarea
                  name="description" value={form.description} onChange={handle}
                  rows={5} placeholder="O que o projeto faz, por que vale a pena participar..."
                  className="input-field resize-none"
                />
              </div>

              {/* Farm value + Estimated value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Valor do farm</label>
                  <input name="farm_value" value={form.farm_value} onChange={handle} placeholder="Ex: ~$50 já vale" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Valor estimado</label>
                  <input name="estimatedValue" value={form.estimatedValue} onChange={handle} placeholder="Ex: $50-$200" className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Funding / Investidores</label>
                <input name="funding" value={form.funding} onChange={handle} placeholder="Ex: Levantou $15M (a16z...)" className="input-field" />
              </div>

              {/* Potential + Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Potencial</label>
                  <select name="potential" value={form.potential} onChange={handle} className="input-field">
                    <option value="">— Selecionar —</option>
                    <option value="alto">😀 Alto</option>
                    <option value="médio">😐 Médio</option>
                    <option value="fraco">😕 Fraco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Custo</label>
                  <select name="cost" value={form.cost} onChange={handle} className="input-field">
                    <option value="">— Selecionar —</option>
                    <option value="gratuito">🆓 Gratuito</option>
                    <option value="baixo">💰 Baixo</option>
                    <option value="médio">💳 Médio</option>
                    <option value="alto">💸 Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-electric" />
                  <label className="block text-xs text-white/50">Wallets participantes</label>
                </div>
                <p className="text-[11px] text-white/40 mb-3">
                  Selecione as carteiras já cadastradas no sistema e defina o status individual de cada uma.
                </p>
                {walletsLoading ? (
                  <div className="text-sm text-white/40">Carregando carteiras...</div>
                ) : walletOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/40">
                    Nenhuma carteira cadastrada. Adicione em{' '}
                    <Link to="/wallets" className="text-electric hover:underline" onClick={onClose}>
                      Carteiras
                    </Link>
                    .
                  </div>
                ) : (
                  <div className="space-y-2">
                    {walletOptions.map((wallet) => {
                      const walletId = wallet.address
                      const selected = (form.walletIds || []).includes(walletId)

                      return (
                        <div
                          key={walletId}
                          className={`rounded-xl border p-3 transition-colors ${selected
                            ? 'border-electric/30 bg-electric/5'
                            : 'border-white/10 bg-white/[0.02]'
                            }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <label className="flex items-start gap-3 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleWallet(walletId)}
                                className="mt-1 accent-[#f0a020]"
                              />
                              <div className="min-w-0">
                                <p className="text-sm text-white">{wallet.label || 'Carteira sem nome'}</p>
                                <p className="text-xs text-white/40 font-mono break-all">{walletId}</p>
                              </div>
                            </label>

                            {selected && (
                              <select
                                value={form.walletStatus?.[walletId] || 'pending'}
                                onChange={(e) => updateWalletStatus(walletId, e.target.value)}
                                className="input-field md:max-w-[180px]"
                              >
                                {WALLET_STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SECTION 3: Tags ── */}
          {section === 'tags' && (
            <div className="space-y-3">
              <p className="text-xs text-white/40">Selecione todas as tags que se aplicam:</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map((t) => (
                  <Chip
                    key={t.id}
                    emoji={t.emoji}
                    label={t.label}
                    active={form.tags.includes(t.id)}
                    onClick={() => toggleSet('tags', t.id)}
                  />
                ))}
              </div>
              {form.tags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, tags: [] }))}
                  className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                >
                  Limpar tudo
                </button>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Prev / Next navigation */}
          <div className="flex gap-2 mr-auto">
            {section !== 'basic' && (
              <button
                type="button"
                onClick={() => setSection(section === 'tags' ? 'details' : 'basic')}
                className="btn btn-secondary text-xs px-3 py-2"
              >
                ← Anterior
              </button>
            )}
            {section !== 'tags' && (
              <button
                type="button"
                onClick={() => setSection(section === 'basic' ? 'details' : 'tags')}
                className="btn btn-secondary text-xs px-3 py-2"
              >
                Próximo →
              </button>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2">
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting || !form.name.trim() || (!form.chain.trim() && !form.networkId)}
            onClick={handleSubmit}
            className="btn btn-primary px-5 py-2 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Criar Airdrop'}
          </button>
        </div>
      </div>

      {showAddNetwork && (
        <AddNetworkModal
          existingNetworks={networks}
          onClose={() => setShowAddNetwork(false)}
          onCreated={handleNetworkCreated}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Airdrops() {
  const { networks } = useNetworks()
  const { isAuthenticated } = useAuth()
  const [tab, setTab] = useState('todos')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Usuário sem cadastro só pode ter 1 airdrop; logado pode ter vários
  const canAddAirdrop = isAuthenticated || list.length < 1

  const fetchAirdrops = useCallback(() => {
    setLoading(true)
    api.get('/airdrops', { params: { status: 'active', limit: 100 } })
      .then((res) => setList(res.data?.data ?? []))
      .catch(() => { setError('Não foi possível carregar os airdrops.'); setList([]) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAirdrops() }, [fetchAirdrops])

  const filtered = filterByNetwork(list, tab)

  const handleAdd = (newItem) => {
    setList((prev) => [newItem, ...prev])
  }

  const handleRemove = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Remover este airdrop da lista?')) return
    api.deleteAirdrop(id).catch(() => {})
    setList((prev) => prev.filter((x) => x.id !== id))
  }

  const openNewAirdropModal = () => {
    if (!canAddAirdrop) {
      window.alert('Você só pode cadastrar um airdrop sem estar logado. Faça login para adicionar mais.')
      return
    }
    setShowModal(true)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Airdrops ativos</h1>
          <p className="text-white/40 mt-1 text-sm">
            Separe por rede e clique para ver detalhes completos.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={openNewAirdropModal}
            className={`btn ${canAddAirdrop ? 'btn-primary' : 'opacity-60 cursor-not-allowed'}`}
            style={!canAddAirdrop ? { background: 'var(--muted)', color: 'var(--muted-foreground)' } : undefined}
            title={!canAddAirdrop ? 'Faça login para adicionar mais airdrops' : undefined}
          >
            <Plus className="w-4 h-4" /> Novo Airdrop
          </button>
          {!isAuthenticated && list.length >= 1 && (
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Limite de 1 airdrop. Entre para adicionar mais.
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-xl">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="mainnet">Mainnet</TabsTrigger>
          <TabsTrigger value="testnet">Testnet</TabsTrigger>
          <TabsTrigger value="money-lego">Money Lego</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'money-lego' ? (
        <MoneyLegoPlanner />
      ) : (
        <>
      {error && <p className="text-amber-400/80 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f0a020] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <GlowCard>
          <div className="text-center py-10">
            <Zap className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Nenhum airdrop encontrado.</p>
            <button onClick={openNewAirdropModal} className="btn btn-primary mt-4 text-sm">
              <Plus className="w-3.5 h-3.5" /> Adicionar primeiro
            </button>
          </div>
        </GlowCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const net = findNetworkForAirdrop(networks, a)
            const categories = a.criteria?.categories || []
            const tags = a.criteria?.tags || []
            const phaseMeta = getPhaseMeta(a.phase)
            return (
              <div key={a.id} className="relative group">
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, a.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  title="Remover airdrop"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link to={`/airdrops/${encodeURIComponent(a.id)}`}>
                <GlowCard hoverGlow className="h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-semibold text-white truncate">{a.name}</h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        {a.protocol || '—'} · {a.chain || net?.name || '—'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#f0a020] shrink-0 mt-0.5" />
                  </div>

                  {/* Category chips */}
                  {categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {categories.slice(0, 3).map((catId) => {
                        const cat = CATEGORIES.find((c) => c.id === catId)
                        return cat ? (
                          <span key={catId} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(240, 160, 32,0.10)', color: '#f5c15e', border: '1px solid rgba(240, 160, 32,0.22)' }}>
                            {cat.emoji} {cat.label}
                          </span>
                        ) : null
                      })}
                      {categories.length > 3 && (
                        <span className="text-xs text-white/30">+{categories.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isTestnet(a.chain)
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-[rgba(240, 160, 32,0.10)] text-[#f5c15e] border-[rgba(240, 160, 32,0.22)]'
                      }`}>
                      {isTestnet(a.chain) ? '🧪 Testnet' : '🌐 Mainnet'}
                    </span>
                    {a.status && (
                      <span className="text-xs text-white/30 capitalize">{a.status}</span>
                    )}
                    {phaseMeta && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${phaseMeta.className}`}>
                        {phaseMeta.label}
                      </span>
                    )}
                    {a.claim_start && (
                      <span className="text-xs text-white/25">
                        {new Date(a.claim_start).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {/* Tags preview */}
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags.slice(0, 2).map((tagId) => {
                        const tag = ALL_TAGS.find((t) => t.id === tagId)
                        return tag ? (
                          <span key={tagId} className="text-xs text-white/30">
                            {tag.emoji}
                          </span>
                        ) : null
                      })}
                      {tags.length > 2 && <span className="text-xs text-white/20">+{tags.length - 2} tags</span>}
                    </div>
                  )}

                  {a.estimatedValue && (
                    <p className="mt-3 text-sm text-white/70">
                      Valor estimado: <span className="text-electric font-medium">{a.estimatedValue}</span>
                    </p>
                  )}
                </GlowCard>
                </Link>
              </div>
            )
          })}
        </div>
      )}
        </>
      )}

      {showModal && (
        <AddAirdropModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}

function getMockAirdrops() {
  return [
    { id: 'arbitrum-one', name: 'Arbitrum One', protocol: 'Arbitrum', chain: 'arbitrum', status: 'active', phase: 'confirmed', estimatedValue: '$50-$150', criteria: { categories: ['layer2', 'defi'] } },
    { id: 'optimism-mainnet', name: 'Optimism', protocol: 'Optimism', chain: 'optimism', status: 'active', phase: 'live', estimatedValue: '$30-$120', criteria: { categories: ['layer2'] } },
    { id: 'base-mainnet', name: 'Base', protocol: 'Base', chain: 'base', status: 'active', phase: 'speculative', criteria: { categories: ['layer2'] } },
    { id: 'arbitrum-sepolia', name: 'Arbitrum Sepolia', protocol: 'Arbitrum', chain: 'arbitrum-sepolia', status: 'active', phase: 'live', criteria: { categories: ['testnet'] } },
    { id: 'base-sepolia', name: 'Base Sepolia', protocol: 'Base', chain: 'base-sepolia', status: 'active', phase: 'claimable', estimatedValue: '$10-$40', criteria: { categories: ['testnet'] } },
  ]
}

function getMockWalletChoices() {
  return [
    { address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Main Wallet' },
    { address: '0xabcdef1234567890abcdef1234567890abcdef12', label: 'Cold Storage' },
    { address: '0x9876543210fedcba9876543210fedcba98765432', label: 'Wallet 3' },
  ]
}
