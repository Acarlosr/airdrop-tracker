import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, X, Zap, Check } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs'
import api from '../services/api'

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

const EMPTY_FORM = {
  name: '', protocol: '', chain: '', status: 'active',
  total_supply: '', snapshot_date: '', claim_start: '', claim_end: '',
  website: '', twitter: '', discord: '',
  description: '', farm_value: '', funding: '',
  potential: '', cost: '',
  categories: [], tags: [],
}

// ── Chip toggle button ────────────────────────────────────────────
function Chip({ emoji, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all ${active
          ? 'border-[rgba(59,91,255,0.45)] text-[#7a9aff]'
          : 'border-[rgba(255,255,255,0.08)] text-white/50 hover:border-[rgba(255,255,255,0.18)] hover:text-white/80'
        }`}
      style={active ? { background: 'rgba(59,91,255,0.13)' } : { background: 'rgba(255,255,255,0.03)' }}
    >
      {active && <Check className="w-2.5 h-2.5" />}
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}

// ── Add Airdrop Modal ─────────────────────────────────────────────
function AddAirdropModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [section, setSection] = useState('basic') // 'basic' | 'details' | 'tags'

  const handle = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const toggleSet = (field, id) => {
    setForm((p) => {
      const curr = new Set(p[field])
      if (curr.has(id)) curr.delete(id)
      else curr.add(id)
      return { ...p, [field]: [...curr] }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!form.chain.trim()) { setFormError('Chain é obrigatória.'); return }

    const id = slugify(form.name)
    const payload = {
      id,
      name: form.name.trim(),
      protocol: form.protocol.trim() || form.name.trim(),
      chain: form.chain.trim(),
      status: form.status,
      total_supply: form.total_supply ? Number(form.total_supply) : null,
      snapshot_date: form.snapshot_date || null,
      claim_start: form.claim_start || null,
      claim_end: form.claim_end || null,
      criteria: {
        categories: form.categories,
        tags: form.tags,
        guide: {
          description: form.description || null,
          farm_value: form.farm_value || null,
          funding: form.funding || null,
          potential: form.potential || null,
          cost: form.cost || null,
        },
      },
      links: {
        website: form.website || null,
        twitter: form.twitter || null,
        discord: form.discord || null,
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
        onAdd({ ...payload, id: `${id}-${Date.now()}` })
        onClose()
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
        style={{ background: 'var(--surface-card)', borderColor: 'rgba(59,91,255,0.20)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(59,91,255,0.15)', border: '1px solid rgba(59,91,255,0.30)' }}>
              <Plus className="w-4 h-4 text-[#7a9aff]" />
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
                  ? 'text-[#7a9aff] font-semibold'
                  : 'text-white/40 hover:text-white/70'
                }`}
              style={section === t.id ? { background: 'rgba(59,91,255,0.12)', border: '1px solid rgba(59,91,255,0.20)' } : { border: '1px solid transparent' }}
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

              {/* Chain + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Chain <span className="text-red-400">*</span></label>
                  <input name="chain" value={form.chain} onChange={handle} placeholder="Ex: arbitrum" list="chain-opts" className="input-field" required />
                  <datalist id="chain-opts">
                    {CHAIN_OPTIONS.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Status</label>
                  <select name="status" value={form.status} onChange={handle} className="input-field">
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
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
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-3">
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
              </div>

              {/* Total supply */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Total Supply (tokens)</label>
                <input type="number" name="total_supply" value={form.total_supply} onChange={handle} placeholder="Ex: 1000000000" className="input-field" min="0" />
              </div>

              {/* Links */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Links</label>
                <div className="space-y-2">
                  <input name="website" value={form.website} onChange={handle} placeholder="Website (https://...)" className="input-field" type="url" />
                  <input name="twitter" value={form.twitter} onChange={handle} placeholder="Twitter / X (https://x.com/...)" className="input-field" type="url" />
                  <input name="discord" value={form.discord} onChange={handle} placeholder="Discord (https://discord.gg/...)" className="input-field" type="url" />
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

              {/* Farm value + Funding */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Valor do farm</label>
                  <input name="farm_value" value={form.farm_value} onChange={handle} placeholder="Ex: ~$50 já vale" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Funding / Investidores</label>
                  <input name="funding" value={form.funding} onChange={handle} placeholder="Ex: Levantou $15M (a16z...)" className="input-field" />
                </div>
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
            disabled={submitting || !form.name.trim() || !form.chain.trim()}
            onClick={handleSubmit}
            className="btn btn-primary px-5 py-2 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Criar Airdrop'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Airdrops() {
  const [tab, setTab] = useState('todos')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const fetchAirdrops = useCallback(() => {
    setLoading(true)
    api.get('/airdrops', { params: { status: 'active', limit: 100 } })
      .then((res) => setList(res.data?.data ?? []))
      .catch(() => { setError('Não foi possível carregar.'); setList(getMockAirdrops()) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAirdrops() }, [fetchAirdrops])

  const filtered = filterByNetwork(list, tab)

  const handleAdd = (newItem) => {
    setList((prev) => [newItem, ...prev])
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
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Novo Airdrop
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 max-w-xs">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="mainnet">Mainnet</TabsTrigger>
          <TabsTrigger value="testnet">Testnet</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <p className="text-amber-400/80 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#3b5bff] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <GlowCard>
          <div className="text-center py-10">
            <Zap className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Nenhum airdrop encontrado.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4 text-sm">
              <Plus className="w-3.5 h-3.5" /> Adicionar primeiro
            </button>
          </div>
        </GlowCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const categories = a.criteria?.categories || []
            const tags = a.criteria?.tags || []
            return (
              <Link key={a.id} to={`/airdrops/${encodeURIComponent(a.id)}`}>
                <GlowCard hoverGlow className="h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{a.name}</h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        {a.protocol || '—'} · {a.chain || '—'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#3b5bff] shrink-0 mt-0.5" />
                  </div>

                  {/* Category chips */}
                  {categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {categories.slice(0, 3).map((catId) => {
                        const cat = CATEGORIES.find((c) => c.id === catId)
                        return cat ? (
                          <span key={catId} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(59,91,255,0.10)', color: '#7a9aff', border: '1px solid rgba(59,91,255,0.22)' }}>
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
                        : 'bg-[rgba(59,91,255,0.10)] text-[#7a9aff] border-[rgba(59,91,255,0.22)]'
                      }`}>
                      {isTestnet(a.chain) ? '🧪 Testnet' : '🌐 Mainnet'}
                    </span>
                    {a.status && (
                      <span className="text-xs text-white/30 capitalize">{a.status}</span>
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
                </GlowCard>
              </Link>
            )
          })}
        </div>
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
    { id: 'arbitrum-one', name: 'Arbitrum One', protocol: 'Arbitrum', chain: 'arbitrum', status: 'active', criteria: { categories: ['layer2', 'defi'] } },
    { id: 'optimism-mainnet', name: 'Optimism', protocol: 'Optimism', chain: 'optimism', status: 'active', criteria: { categories: ['layer2'] } },
    { id: 'base-mainnet', name: 'Base', protocol: 'Base', chain: 'base', status: 'active', criteria: { categories: ['layer2'] } },
    { id: 'arbitrum-sepolia', name: 'Arbitrum Sepolia', protocol: 'Arbitrum', chain: 'arbitrum-sepolia', status: 'active', criteria: { categories: ['testnet'] } },
    { id: 'base-sepolia', name: 'Base Sepolia', protocol: 'Base', chain: 'base-sepolia', status: 'active', criteria: { categories: ['testnet'] } },
  ]
}
