import { useState, useEffect, useCallback } from 'react'
import { Wallet, Plus, Trash2, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import api from '../services/api'
import { shortAddress, isValidAddress, timeAgo } from '../utils/helpers'

export default function Wallets() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(null)

  const fetchWallets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getWallets()
      setWallets(res.data?.data ?? [])
    } catch {
      setError('Não foi possível carregar as carteiras.')
      setWallets(getMockWallets())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWallets() }, [fetchWallets])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newAddress.trim()) return
    if (!isValidAddress(newAddress.trim())) {
      setError('Endereço inválido. Use um endereço Ethereum válido (0x...).')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.addWallet({ address: newAddress.trim(), label: newLabel.trim() || null })
      const added = res.data?.data
      if (added) {
        setWallets((prev) => [added, ...prev.filter((w) => w.address !== added.address)])
      }
      setNewAddress('')
      setNewLabel('')
      setShowForm(false)
    } catch (err) {
      setError('Falha ao adicionar carteira.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (address) => {
    try {
      const res = await api.toggleWallet(address)
      const updated = res.data?.data
      if (updated) {
        setWallets((prev) => prev.map((w) => w.address === updated.address ? updated : w))
      }
    } catch (err) {
      console.error('Failed to toggle wallet:', err)
    }
  }

  const handleDelete = async (address) => {
    try {
      await api.deleteWallet(address)
      setWallets((prev) => prev.filter((w) => w.address !== address))
    } catch (err) {
      console.error('Failed to delete wallet:', err)
    }
  }

  const handleCopy = (address) => {
    navigator.clipboard.writeText(address)
    setCopied(address)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Carteiras Monitoradas</h1>
          <p className="text-white/50 mt-1">Adicione e gerencie endereços de carteiras</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchWallets} className="btn btn-secondary flex items-center gap-2" title="Atualizar">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Add Wallet Form */}
      {showForm && (
        <GlowCard className="mt-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Nova Carteira</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Endereço (obrigatório)</label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#0f1419] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:border-electric/40 focus:outline-none transition-colors font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Label (opcional)</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Main Wallet, Cold Storage..."
                className="w-full bg-[#0f1419] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:border-electric/40 focus:outline-none transition-colors text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Adicionando...' : 'Adicionar Carteira'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </GlowCard>
      )}

      {/* Error */}
      {error && <p className="text-amber-400/90 text-sm mb-4 mt-4">{error}</p>}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-electric border-t-transparent" />
        </div>
      ) : wallets.length === 0 ? (
        /* Empty */
        <GlowCard className="mt-6">
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg">Nenhuma carteira monitorada.</p>
            <p className="text-white/30 text-sm mt-1">Adicione uma carteira para começar a monitorar airdrops.</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
              <Plus className="w-4 h-4 inline mr-1" /> Adicionar primeira carteira
            </button>
          </div>
        </GlowCard>
      ) : (
        /* Wallet List */
        <div className="space-y-3 mt-6">
          {wallets.map((w) => (
            <GlowCard key={w.address} className={`${!w.watch_enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${w.watch_enabled ? 'bg-electric/10 border border-electric/20' : 'bg-white/5 border border-white/10'}`}>
                  <Wallet className={`w-5 h-5 ${w.watch_enabled ? 'text-electric' : 'text-white/40'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {w.label && <h3 className="font-semibold text-white">{w.label}</h3>}
                    <span className="font-mono text-sm text-white/60">{shortAddress(w.address, 6)}</span>
                    <button onClick={() => handleCopy(w.address)} className="p-1 hover:bg-white/5 rounded transition-colors" title="Copiar">
                      {copied === w.address ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.watch_enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/10 text-white/40 border border-white/10'
                      }`}>
                      {w.watch_enabled ? 'Monitorando' : 'Pausado'}
                    </span>
                    <span className="text-xs text-white/30">
                      Adicionada {timeAgo(w.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(w.address)}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-electric transition-colors"
                    title={w.watch_enabled ? 'Pausar monitoramento' : 'Ativar monitoramento'}
                  >
                    {w.watch_enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(w.address)}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  )
}

function getMockWallets() {
  return [
    { address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Main Wallet', watch_enabled: true, created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
    { address: '0xabcdef1234567890abcdef1234567890abcdef12', label: 'Cold Storage', watch_enabled: true, created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
    { address: '0x9876543210fedcba9876543210fedcba98765432', label: null, watch_enabled: false, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  ]
}
