import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Link as LinkIcon, ExternalLink, DollarSign,
  BookOpen, ListOrdered, Lightbulb, HelpCircle, Zap, Tag, Edit3, Wallet,
  Save, X, Check, ArrowLeftRight, Plus, Trash2, Image as ImageIcon, Upload,
} from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import api from '../services/api'
import { useNetworks, findNetworkForAirdrop } from '../context/NetworksContext'

// ── Helpers ───────────────────────────────────────────────────────
const TESTNET_KEYWORDS = ['sepolia', 'goerli', 'testnet', 'test-', '-test']
function isTestnet(chain) {
  if (!chain) return false
  return TESTNET_KEYWORDS.some((k) => String(chain).toLowerCase().includes(k))
}
function formatDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('pt-BR', { dateStyle: 'medium' })
}

function getPhaseMeta(phase) {
  const map = {
    speculative: { label: 'Especulativo', variant: 'default' },
    confirmed: { label: 'Confirmado', variant: 'electric' },
    live: { label: 'Ao vivo', variant: 'green' },
    claimable: { label: 'Claimável', variant: 'amber' },
    ended: { label: 'Encerrado', variant: 'red' },
  }
  return map[phase] || null
}

function getWalletStatusMeta(status) {
  const map = {
    pending: { label: 'Pendente', variant: 'default' },
    in_progress: { label: 'Em progresso', variant: 'electric' },
    claimed: { label: 'Claimed', variant: 'green' },
    skip: { label: 'Pular', variant: 'red' },
  }
  return map[status] || { label: status || '—', variant: 'default' }
}

function buildExplorerAddressUrl(network, walletAddress) {
  if (!walletAddress) return null
  if (network?.explorerAddressTemplate) {
    return network.explorerAddressTemplate.replace('{wallet}', walletAddress)
  }
  if (network?.explorerUrl) {
    return `${network.explorerUrl.replace(/\/$/, '')}/address/${walletAddress}`
  }
  return null
}

// ── Available tags (like the screenshot) ─────────────────────────
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
  { id: 'airdrop-confirmado', emoji: '🎯', label: 'Confirmado' },
  { id: 'gratuito', emoji: '🆓', label: 'Gratuito' },
]

function Badge({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-white/10 text-white/80 border-white/20',
    electric: 'bg-electric/20 text-electric border-electric/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border ${styles[variant] || styles.default}`}>
      {children}
    </span>
  )
}

// ── Tags Panel ────────────────────────────────────────────────────
function TagsPanel({ activeTags = [], onChange }) {
  const [open, setOpen] = useState(false)
  const active = new Set(activeTags)

  const toggle = (id) => {
    const next = new Set(active)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  return (
    <GlowCard>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-electric" />
          Tags
          {active.size > 0 && (
            <span className="ml-1 text-xs bg-electric text-[#0f1419] rounded-full px-2 py-0.5 font-bold">
              {active.size}
            </span>
          )}
        </h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-electric hover:underline"
        >
          {open ? 'Fechar' : 'Editar tags'}
        </button>
      </div>

      {/* Active tags display */}
      {active.size === 0 && !open && (
        <p className="text-white/40 text-sm">Nenhuma tag selecionada.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.filter((t) => active.has(t.id)).map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-electric/15 text-electric border border-electric/30"
          >
            <span>{t.emoji}</span> {t.label}
          </span>
        ))}
      </div>

      {/* Tag picker */}
      {open && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">Selecionar tags</p>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((t) => {
              const on = active.has(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all ${on
                    ? 'bg-electric/20 text-electric border-electric/40'
                    : 'bg-white/5 text-white/60 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                >
                  {on && <Check className="w-3 h-3" />}
                  <span>{t.emoji}</span> {t.label}
                </button>
              )
            })}
          </div>
          {active.size > 0 && (
            <button
              onClick={() => onChange([])}
              className="mt-3 text-xs text-red-400 hover:underline"
            >
              Limpar tudo
            </button>
          )}
        </div>
      )}
    </GlowCard>
  )
}

// ── Check-in Panel ────────────────────────────────────────────────
function CheckInPanel({ airdropId }) {
  const [streak, setStreak] = useState(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    api.getStreak(airdropId)
      .then((res) => { if (active) setStreak(res.data) })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [airdropId])

  const handleCheckIn = async () => {
    setSaving(true)
    try {
      await api.createInteraction({ airdrop_id: airdropId, kind: 'check-in' })
      const res = await api.getStreak(airdropId)
      setStreak(res.data)
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  if (failed && !streak) return null

  const done = streak?.checkedInToday
  return (
    <div className="flex items-center gap-3">
      {streak && (
        <span className="inline-flex items-center gap-1.5 text-sm text-white/70">
          <Zap className="w-4 h-4 text-electric" />
          Streak: <span className="text-white font-semibold">{streak.streak}d</span>
        </span>
      )}
      <button
        onClick={handleCheckIn}
        disabled={saving || done}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          done
            ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default'
            : 'bg-electric/10 text-electric border border-electric/30 hover:bg-electric/20'
        }`}
      >
        <Check className="w-4 h-4" />
        {done ? 'Check-in feito hoje' : saving ? 'Salvando…' : 'Check-in de hoje'}
      </button>
      {failed && streak && (
        <span className="text-xs text-amber-400/80">Falha ao salvar — tente de novo</span>
      )}
    </div>
  )
}

// ── Transactions / Interactions Panel ─────────────────────────────
const INTERACTION_KIND_OPTIONS = [
  { value: 'check-in', label: 'Check-in' },
  { value: 'register', label: 'Cadastro' },
  { value: 'mint', label: 'Mint' },
  { value: 'swap', label: 'Swap' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'stake', label: 'Stake' },
  { value: 'claim', label: 'Claim' },
  { value: 'referral', label: 'Indicação' },
  { value: 'ai-task', label: 'Tarefa de IA' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'social', label: 'Social' },
  { value: 'outro', label: 'Outro' },
]

function TransactionsPanel({ airdropId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    kind: 'swap',
    occurred_on: new Date().toISOString().slice(0, 10),
    network: '',
    tx_hash: '',
    gas_cost: '',
    note: '',
  })

  const load = () => {
    setLoading(true)
    api.getInteractions(airdropId)
      .then((res) => setItems(res.data?.interactions ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [airdropId])

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await api.createInteraction({
        airdrop_id: airdropId,
        kind: form.kind,
        occurred_on: form.occurred_on || undefined,
        network: form.network || null,
        tx_hash: form.tx_hash || null,
        gas_cost: form.gas_cost ? Number(form.gas_cost) : null,
        note: form.note || null,
      })
      setForm((p) => ({ ...p, network: '', tx_hash: '', gas_cost: '', note: '' }))
      load()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Não consegui salvar. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlowCard>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-electric" />
          Minhas transações / interações
          {items.length > 0 && (
            <span className="ml-1 text-xs bg-electric text-[#0f1419] rounded-full px-2 py-0.5 font-bold">
              {items.length}
            </span>
          )}
        </h2>
        <button onClick={() => setOpen((v) => !v)} className="text-xs text-electric hover:underline inline-flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> {open ? 'Fechar' : 'Adicionar'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select name="kind" value={form.kind} onChange={handle} className="input-field text-sm">
              {INTERACTION_KIND_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
            <input type="date" name="occurred_on" value={form.occurred_on} onChange={handle} className="input-field text-sm" />
            <input name="network" value={form.network} onChange={handle} placeholder="Rede (ex: base)" className="input-field text-sm" />
            <input name="gas_cost" value={form.gas_cost} onChange={handle} placeholder="Custo de gas (USD)" type="number" step="0.01" className="input-field text-sm" />
          </div>
          <input name="tx_hash" value={form.tx_hash} onChange={handle} placeholder="Hash da transação (opcional)" className="input-field text-sm font-mono" />
          <textarea name="note" value={form.note} onChange={handle} placeholder="Nota (o que você fez)" rows={2} className="input-field text-sm resize-none" />
          <button type="submit" disabled={saving} className="btn btn-primary text-xs px-4 py-2">
            {saving ? 'Salvando...' : 'Registrar'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-white/40 text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-white/40 text-sm">Nenhuma transação registrada ainda.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {items.map((it) => {
            const kindLabel = INTERACTION_KIND_OPTIONS.find((k) => k.value === it.kind)?.label || it.kind
            return (
              <div key={it.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-white font-medium">{kindLabel}</span>
                  <span className="text-white/40 text-xs">{formatDate(it.occurred_on)}</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/50">
                  {it.network && <span>Rede: {it.network}</span>}
                  {it.gas_cost && <span>Gas: ${it.gas_cost}</span>}
                  {it.tx_hash && <span className="font-mono truncate max-w-[220px]" title={it.tx_hash}>Tx: {it.tx_hash}</span>}
                </div>
                {it.note && <p className="text-white/70 text-xs mt-1.5">{it.note}</p>}
              </div>
            )
          })}
        </div>
      )}
    </GlowCard>
  )
}

// ── Images / Screenshots Panel ────────────────────────────────────
function ImagesPanel({ airdropId }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.getAirdropImages(airdropId)
      .then((res) => setImages(res.data?.images ?? []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [airdropId])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setUploading(true)
    try {
      await api.uploadAirdropImage(airdropId, file)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao enviar a imagem (PNG, JPG, WEBP ou GIF, até 8MB).')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId) => {
    if (!window.confirm('Remover este print?')) return
    setImages((prev) => prev.filter((i) => i.id !== imageId))
    try {
      await api.deleteAirdropImage(airdropId, imageId)
    } catch {
      load()
    }
  }

  return (
    <GlowCard>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-electric" />
          Prints / imagens
          {images.length > 0 && (
            <span className="ml-1 text-xs bg-electric text-[#0f1419] rounded-full px-2 py-0.5 font-bold">
              {images.length}
            </span>
          )}
        </h2>
        <label className="text-xs text-electric hover:underline inline-flex items-center gap-1 cursor-pointer">
          <Upload className="w-3.5 h-3.5" /> {uploading ? 'Enviando...' : 'Enviar print'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      {loading ? (
        <p className="text-white/40 text-sm">Carregando...</p>
      ) : images.length === 0 ? (
        <p className="text-white/40 text-sm">Nenhum print adicionado ainda.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
              {img.url ? (
                <a href={img.url} target="_blank" rel="noreferrer">
                  <img src={img.url} alt={img.caption || 'Print'} className="w-full h-32 object-cover" />
                </a>
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-white/20 text-xs">Indisponível</div>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white/80 hover:text-red-400"
                title="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </GlowCard>
  )
}

// ── Edit Info Panel ───────────────────────────────────────────────
function EditInfoPanel({ airdrop, onSave }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    description: airdrop?.criteria?.guide?.description || airdrop?.description || '',
    obs: airdrop?.criteria?.guide?.obs || '',
    farm_value: airdrop?.criteria?.guide?.farm_value || '',
    funding: airdrop?.criteria?.guide?.funding || '',
    potential: airdrop?.criteria?.guide?.potential || '',
    cost: airdrop?.criteria?.guide?.cost || '',
    status_label: airdrop?.criteria?.guide?.status_label || airdrop?.status || '',
    steps_text: (airdrop?.criteria?.guide?.steps || [])
      .map((s) => (typeof s === 'object' ? `${s.title ? s.title + ': ' : ''}${s.content || s.text || ''}` : s))
      .join('\n'),
    tips_text: (airdrop?.criteria?.guide?.tips || [])
      .map((t) => (typeof t === 'object' ? t.text || t.content : t))
      .join('\n'),
    website: airdrop?.links?.website || airdrop?.links?.portal || airdrop?.links?.site || '',
    twitter: airdrop?.links?.twitter || '',
    discord: airdrop?.links?.discord || '',
    docs: airdrop?.links?.docs || '',
  })

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = () => {
    const steps = form.steps_text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const colonIdx = s.indexOf(':')
        if (colonIdx > 0 && colonIdx < 60) {
          return { title: s.slice(0, colonIdx).trim(), content: s.slice(colonIdx + 1).trim() }
        }
        return { content: s }
      })
    const tips = form.tips_text.split('\n').map((t) => t.trim()).filter(Boolean)

    const updated = {
      criteria: {
        guide: {
          description: form.description,
          obs: form.obs,
          farm_value: form.farm_value,
          funding: form.funding,
          potential: form.potential,
          cost: form.cost,
          status_label: form.status_label,
          steps,
          tips,
        },
      },
      links: {
        website: form.website || null,
        twitter: form.twitter || null,
        discord: form.discord || null,
        docs: form.docs || null,
      },
    }
    onSave(updated)
    setOpen(false)
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-electric transition-colors"
      >
        <Edit3 className="w-4 h-4" />
        {open ? 'Cancelar edição' : 'Editar informações'}
      </button>

      {open && (
        <GlowCard className="mt-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-electric" /> Editar informações
          </h2>

          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Descrição do projeto</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handle}
                rows={4}
                placeholder="Descreva o projeto, o que ele faz, por que vale a pena..."
                className="input-field resize-none"
              />
            </div>

            {/* OBS */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">OBS / Observações importantes</label>
              <textarea
                name="obs"
                value={form.obs}
                onChange={handle}
                rows={2}
                placeholder="Pontos de atenção, avisos, informações críticas..."
                className="input-field resize-none"
              />
            </div>

            {/* Row: farm_value + funding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Valor do farm</label>
                <input name="farm_value" value={form.farm_value} onChange={handle}
                  placeholder="Ex: ~$50 já vale" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Funding / Investidores</label>
                <input name="funding" value={form.funding} onChange={handle}
                  placeholder="Ex: Levantou $15M (a16z...)" className="input-field" />
              </div>
            </div>

            {/* Row: potential + cost + status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Potencial</label>
                <select name="potential" value={form.potential} onChange={handle} className="input-field">
                  <option value="">—</option>
                  <option value="alto">Alto</option>
                  <option value="médio">Médio</option>
                  <option value="fraco">Fraco</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Custo</label>
                <select name="cost" value={form.cost} onChange={handle} className="input-field">
                  <option value="">—</option>
                  <option value="gratuito">Gratuito</option>
                  <option value="baixo">Baixo</option>
                  <option value="médio">Médio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Status</label>
                <select name="status_label" value={form.status_label} onChange={handle} className="input-field">
                  <option value="">—</option>
                  <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                  <option value="ENCERRADO">ENCERRADO</option>
                  <option value="EM BREVE">EM BREVE</option>
                  <option value="CLAIM ABERTO">CLAIM ABERTO</option>
                </select>
              </div>
            </div>

            {/* Steps */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Como participar <span className="text-white/30">(1 passo por linha; use "Título: descrição")</span>
              </label>
              <textarea
                name="steps_text"
                value={form.steps_text}
                onChange={handle}
                rows={5}
                placeholder={"Acesse o portal: Vá ao site oficial e conecte sua carteira.\nDeposite: Deposite ativos conforme instruções.\nAcumule pontos: Faça as tarefas indicadas."}
                className="input-field resize-none font-mono text-xs"
              />
            </div>

            {/* Tips */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Dicas <span className="text-white/30">(1 dica por linha)</span>
              </label>
              <textarea
                name="tips_text"
                value={form.tips_text}
                onChange={handle}
                rows={3}
                placeholder={"Seja ativo com frequência.\nDiversifique as interações.\nEvite deixar a conta parada."}
                className="input-field resize-none font-mono text-xs"
              />
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Links</label>
              <div className="space-y-2">
                <input name="website" value={form.website} onChange={handle}
                  placeholder="Website (https://...)" className="input-field" type="url" />
                <input name="twitter" value={form.twitter} onChange={handle}
                  placeholder="Twitter (https://x.com/...)" className="input-field" type="url" />
                <input name="discord" value={form.discord} onChange={handle}
                  placeholder="Discord (https://discord.gg/...)" className="input-field" type="url" />
                <input name="docs" value={form.docs} onChange={handle}
                  placeholder="Docs (https://docs...)" className="input-field" type="url" />
              </div>
            </div>

            {/* Save */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setOpen(false)} className="btn btn-secondary flex-1">
                <X className="w-4 h-4 inline mr-1" /> Cancelar
              </button>
              <button onClick={handleSave} className="btn btn-primary flex-1">
                <Save className="w-4 h-4 inline mr-1" /> Salvar
              </button>
            </div>
          </div>
        </GlowCard>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function AirdropDetail() {
  const { id } = useParams()
  const { networks } = useNetworks()
  const [airdrop, setAirdrop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tags, setTags] = useState([])
  const [wallets, setWallets] = useState([])
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    let active = true
    api.getWallets()
      .then((res) => {
        if (!active) return
        setWallets(res.data?.data ?? [])
      })
      .catch(() => {
        if (!active) return
        setWallets(getMockWallets())
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!id) return
    api
      .get(`/airdrops/${encodeURIComponent(id)}`)
      .then((res) => {
        const data = res.data?.data
        setAirdrop(data)
        // Load tags from criteria or localStorage
        const savedTags = data?.criteria?.tags || []
        const localTags = JSON.parse(localStorage.getItem(`airdrop-tags-${id}`) || 'null')
        setTags(localTags ?? savedTags)
      })
      .catch(() => {
        setError('Não foi possível carregar do servidor. Exibindo dados locais.')
        setAirdrop(null)
        const localTags = JSON.parse(localStorage.getItem(`airdrop-tags-${id}`) || '[]')
        setTags(localTags)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleTagsChange = (newTags) => {
    setTags(newTags)
    localStorage.setItem(`airdrop-tags-${id}`, JSON.stringify(newTags))
    // Try to persist to backend
    api.updateAirdrop(id, {
      criteria: { ...(airdrop?.criteria || {}), tags: newTags },
    }).catch(() => { }) // silent fail if DB offline
  }

  const handleInfoSave = async (updates) => {
    const previous = airdrop
    // Atualização otimista: aplica na tela antes da resposta do servidor.
    setAirdrop((prev) => ({
      ...prev,
      criteria: { ...(prev?.criteria || {}), ...updates.criteria },
      links: { ...(prev?.links || {}), ...updates.links },
    }))
    try {
      await api.updateAirdrop(id, updates)
      setSaveError(null)
    } catch {
      // Antes isto falhava em silêncio: a tela mostrava a edição, mas nada
      // era salvo — ao recarregar, tudo sumia. Agora desfaz e avisa.
      setAirdrop(previous)
      setSaveError('Não foi possível salvar. Confira se o backend está no ar e tente de novo.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-electric border-t-transparent" />
      </div>
    )
  }

  if (!airdrop) {
    return (
      <div>
        <Link to="/airdrops" className="inline-flex items-center gap-2 text-electric hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar aos airdrops
        </Link>
        <p className="text-white/70">Airdrop não encontrado.</p>
      </div>
    )
  }

  const a = airdrop
  const criteria = a.criteria || {}
  const guide = criteria.guide || {}
  const links = a.links || {}
  const network = findNetworkForAirdrop(networks, a)

  const farmValue = guide.farm_value || a.farm_value
  const funding = guide.funding || a.funding
  const description = guide.description || a.description
  const obs = guide.obs || criteria.obs
  const steps = Array.isArray(guide.steps) ? guide.steps : []
  const tips = Array.isArray(guide.tips) ? guide.tips : []
  const faq = Array.isArray(guide.faq) ? guide.faq : []
  const potential = guide.potential || criteria.potential
  const cost = guide.cost || criteria.cost
  const statusLabel = guide.status_label || a.status
  const phaseMeta = getPhaseMeta(a.phase)
  const estimatedValue = a.estimatedValue || guide.estimatedValue || null
  const walletIds = Array.isArray(a.walletIds) ? a.walletIds : []
  const walletStatus = a.walletStatus || {}
  const walletMap = new Map(wallets.map((wallet) => [wallet.address, wallet]))
  const timelineItems = [
    { key: 'snapshot', label: 'Snapshot', value: a.snapshot_date },
    { key: 'claim-start', label: 'Início do claim', value: a.claim_start },
    { key: 'claim-end', label: 'Fim do claim', value: a.claim_end },
    { key: 'tge', label: 'TGE', value: a.tgeDate },
    { key: 'vesting-end', label: 'Fim do vesting', value: a.vestingEndDate },
  ].filter((item) => item.value)

  // Build link list
  const linkList = Object.entries(links).filter(([, v]) => v && typeof v === 'string' && v.startsWith('http'))

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/airdrops" className="inline-flex items-center gap-2 text-electric hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar aos airdrops
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">{a.name || id}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant={isTestnet(a.chain) ? 'amber' : 'electric'}>
              {isTestnet(a.chain) ? 'Testnet' : 'Mainnet'}
            </Badge>
            {a.chain && <Badge>{a.chain}</Badge>}
            {phaseMeta && <Badge variant={phaseMeta.variant}>{phaseMeta.label}</Badge>}
            {statusLabel && (
              <Badge variant={
                String(statusLabel).toLowerCase().includes('andamento') ? 'green' :
                  String(statusLabel).toLowerCase().includes('encerrado') ? 'red' : 'default'
              }>
                {statusLabel}
              </Badge>
            )}
            {cost && <Badge>Custo {cost}</Badge>}
            {potential && <Badge variant="electric">Potencial {potential}</Badge>}
            {estimatedValue && <Badge variant="electric">Estimado {estimatedValue}</Badge>}
          </div>
          {(a.protocol || a.chain) && (
            <p className="text-white/50 mt-2 text-sm">
              Protocolo: {a.protocol || '—'} · Rede: {a.chain || '—'}
            </p>
          )}
          <div className="mt-3">
            <CheckInPanel airdropId={id} />
          </div>
        </div>
        <EditInfoPanel airdrop={a} onSave={handleInfoSave} />
      </div>

      {error && (
        <p className="text-amber-400/80 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      {saveError && (
        <p className="text-red-400/90 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {saveError}
        </p>
      )}

      {/* Tags */}
      <TagsPanel activeTags={tags} onChange={handleTagsChange} />

      {/* Transações + Prints */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionsPanel airdropId={id} />
        <ImagesPanel airdropId={id} />
      </div>

      {/* Summary cards */}
      {(farmValue || estimatedValue || a.chain || funding) && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {farmValue && (
            <GlowCard>
              <div className="flex items-center gap-2 text-electric mb-1">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold text-white text-sm">Valor do farm</span>
              </div>
              <p className="text-white/80 text-sm">{farmValue}</p>
            </GlowCard>
          )}
          {estimatedValue && (
            <GlowCard>
              <div className="flex items-center gap-2 text-electric mb-1">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold text-white text-sm">Valor estimado</span>
              </div>
              <p className="text-white/80 text-sm">{estimatedValue}</p>
            </GlowCard>
          )}
          {a.chain && (
            <GlowCard>
              <div className="flex items-center gap-2 text-electric mb-1">
                <Zap className="w-5 h-5" />
                <span className="font-semibold text-white text-sm">Rede</span>
              </div>
              <p className="text-white/80 text-sm">{a.chain}</p>
            </GlowCard>
          )}
          {funding && (
            <GlowCard>
              <div className="flex items-center gap-2 text-electric mb-1">
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold text-white text-sm">Funding</span>
              </div>
              <p className="text-white/80 text-sm">{funding}</p>
            </GlowCard>
          )}
        </div>
      )}

      {/* Description */}
      {description ? (
        <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-electric" /> Sobre o projeto
          </h2>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{description}</p>
        </GlowCard>
      ) : (
        <GlowCard className="border-dashed border-white/10">
          <p className="text-white/30 text-sm text-center py-4">
            Nenhuma descrição ainda. Clique em "Editar informações" para adicionar.
          </p>
        </GlowCard>
      )}

      {/* OBS */}
      {obs && (
        <GlowCard className="border-amber-500/20">
          <h2 className="text-lg font-semibold text-amber-400 mb-3">⚠️ OBS</h2>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{obs}</p>
        </GlowCard>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-electric" /> Como participar
          </h2>
          <ol className="space-y-4">
            {steps.map((step, i) => {
              const title = typeof step === 'object' ? step.title || step.name : null
              const content = typeof step === 'object' ? step.content || step.text : step
              return (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-electric/20 text-electric flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <div>
                    {title && <p className="font-medium text-white mb-1">{title}</p>}
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{content}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </GlowCard>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-electric" /> Dicas para maximizar o airdrop
          </h2>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                <span className="text-electric mt-0.5">✓</span>
                <span>{typeof tip === 'object' ? tip.text || tip.content : tip}</span>
              </li>
            ))}
          </ul>
        </GlowCard>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-electric" /> Dúvidas frequentes
          </h2>
          <ul className="space-y-4">
            {faq.map((item, i) => {
              const q = typeof item === 'object' ? item.question || item.pergunta : item
              const ans = typeof item === 'object' ? item.answer || item.resposta : ''
              return (
                <li key={i}>
                  <p className="font-medium text-white text-sm mb-1">{q}</p>
                  <p className="text-white/70 text-sm">{ans}</p>
                </li>
              )
            })}
          </ul>
        </GlowCard>
      )}

      {/* Dates + Wallets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-electric" /> Datas
          </h2>
          {timelineItems.length > 0 ? (
            <div className="space-y-4">
              {timelineItems.map((item, index) => (
                <div key={item.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-3 h-3 rounded-full bg-electric shadow-glow" />
                    {index < timelineItems.length - 1 && (
                      <span className="w-px flex-1 bg-electric/20 mt-2 min-h-[28px]" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm text-white">{item.label}</p>
                    <p className="text-sm text-white/55">{formatDate(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm">Nenhuma data adicional cadastrada.</p>
          )}

          <ul className="space-y-2 text-sm mt-5 pt-5 border-t border-white/10">
            {a.total_supply != null && (
              <li className="flex justify-between">
                <span className="text-white/60">Oferta total</span>
                <span className="text-white">{Number(a.total_supply).toLocaleString('pt-BR')}</span>
              </li>
            )}
          </ul>
        </GlowCard>

        <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-electric" /> Wallets participantes
          </h2>
          {walletIds.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma wallet vinculada a este airdrop.</p>
          ) : (
            <div className="space-y-3">
              {walletIds.map((walletId) => {
                const wallet = walletMap.get(walletId)
                const statusMeta = getWalletStatusMeta(walletStatus?.[walletId] || 'pending')
                const explorerUrl = buildExplorerAddressUrl(network, walletId)

                return (
                  <div key={walletId} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-white">{wallet?.label || 'Carteira sem nome'}</p>
                        <p className="text-xs text-white/40 font-mono break-all">{walletId}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                        {explorerUrl && (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-electric hover:underline"
                          >
                            Ver no explorer <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GlowCard>
      </div>

      {/* Links */}
      <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-electric" /> Links
          </h2>
          {linkList.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhum link cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {linkList.map(([label, url]) => (
                <li key={label}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-electric hover:underline inline-flex items-center gap-1 text-sm capitalize"
                  >
                    {label} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
      </GlowCard>

      {/* Raw criteria (fallback) */}
      {!guide.description && Object.keys(criteria).filter((k) => !['guide', 'tags'].includes(k)).length > 0 && (
        <GlowCard>
          <h2 className="text-lg font-semibold text-white mb-4">Critérios de elegibilidade</h2>
          <ul className="space-y-2 text-sm text-white/80">
            {Object.entries(criteria)
              .filter(([k]) => !['guide', 'tags'].includes(k))
              .map(([key, value]) => (
                <li key={key}>
                  <strong className="text-white/90">{key}:</strong>{' '}
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </li>
              ))}
          </ul>
        </GlowCard>
      )}
    </div>
  )
}

// ── Mock data ─────────────────────────────────────────────────────
function getMockDetail(id) {
  const names = {
    'arbitrum-one': 'Arbitrum One',
    'optimism-mainnet': 'Optimism',
    'base-mainnet': 'Base',
    'nado': 'Nado',
    'konnex-testnet': 'KONNEX TESTNET',
  }
  const chainMap = {
    'arbitrum-one': 'arbitrum',
    'optimism-mainnet': 'optimism',
    'base-mainnet': 'base',
    'nado': 'Ink (EVM)',
    'konnex-testnet': 'Ethereum / EVM',
  }
  const base = {
    id,
    name: names[id] || id,
    protocol: id.split('-')[0],
    chain: chainMap[id] || 'ethereum',
    status: 'active',
    phase: 'confirmed',
    snapshot_date: null,
    claim_start: null,
    claim_end: null,
    tgeDate: null,
    vestingEndDate: null,
    estimatedValue: '$50-$200',
    walletIds: ['0x1234567890abcdef1234567890abcdef12345678', '0xabcdef1234567890abcdef1234567890abcdef12'],
    walletStatus: {
      '0x1234567890abcdef1234567890abcdef12345678': 'in_progress',
      '0xabcdef1234567890abcdef1234567890abcdef12': 'pending',
    },
    links: { site: 'https://example.com', docs: 'https://docs.example.com' },
  }
  if (id === 'nado' || id === 'konnex-testnet') {
    base.criteria = {
      guide: {
        farm_value: id === 'nado' ? 'Pouco: em torno de $50 já vale.' : 'Gratuito.',
        funding: id === 'nado'
          ? 'Projeto desenvolvido pelo time por trás da Kraken.'
          : 'Levantou US$15M (Cogitent Ventures, Liquid Capital, entre outros).',
        description: id === 'nado'
          ? 'Nado é uma PerpDEX com order book (CLOB) na blockchain Ink. Focada em traders profissionais, unifica spot e perpetuals com margem única e múltiplas posições.'
          : 'Konnex é uma rede DePIN descentralizada para robótica e automação: máquinas autônomas negociam contratos, executam tarefas e recebem pagamentos em stablecoins.',
        obs: id === 'nado'
          ? 'Sistema de pontos na fase Private Alpha; Nado Points serão convertidos em $INK antes do TGE.'
          : 'O airdrop usa Konnex Points (KP); acumular mais pontos antes do TGE pode aumentar a alocação.',
        steps: [
          { title: 'Acesse o portal', content: 'Vá ao hub oficial do airdrop/points e use o link oficial.' },
          { title: 'Conecte sua carteira', content: 'Clique em "Connect Wallet" e conecte uma carteira EVM.' },
          { title: 'Deposite e participe', content: 'Deposite ativos conforme as instruções oficiais.' },
          { title: 'Acumule pontos', content: 'Faça as tarefas indicadas. A atividade gera pontos no dashboard.' },
        ],
        tips: [
          'Seja ativo com frequência, não apenas uma interação isolada.',
          'Diversifique: spot e perps quando fizer sentido.',
          'Evite deixar a conta parada após depositar.',
        ],
        faq: [
          { question: 'Airdrop foi confirmado?', answer: 'Sim, pontos convertem em token antes do TGE.' },
          { question: 'Preciso de tokens reais?', answer: 'Depende do projeto; alguns são gratuitos.' },
        ],
        potential: 'alto',
        cost: 'baixo',
        status_label: 'EM ANDAMENTO',
      },
    }
    base.tgeDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    base.vestingEndDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString()
    base.links = { portal: 'https://app.example.com', twitter: 'https://x.com/projeto', docs: 'https://docs.example.com' }
  } else {
    base.criteria = { minTx: '5+ transações', interação: 'Bridge ou swap na rede' }
  }
  return base
}

function getMockWallets() {
  return [
    { address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Main Wallet' },
    { address: '0xabcdef1234567890abcdef1234567890abcdef12', label: 'Cold Storage' },
    { address: '0x9876543210fedcba9876543210fedcba98765432', label: 'Wallet 3' },
  ]
}
