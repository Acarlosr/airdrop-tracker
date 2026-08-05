import { useState, useMemo } from 'react'
import { X, Search, Check, AlertTriangle } from 'lucide-react'
import { lookupChain, searchChains, buildExplorerTemplates } from '../lib/chainCatalog'

const EMPTY = {
  name: '',
  chainId: '',
  env: 'mainnet',
  rpcUrl: '',
  explorerUrl: '',
  explorerAddressTemplate: '',
  explorerTxTemplate: '',
  apiType: 'rpc-only',
  apiKey: '',
  nativeCurrency: 'ETH',
  isActive: true,
}

/**
 * Cadastro rápido de rede, sem sair do modal de airdrop.
 * `onCreated(network)` recebe o rascunho pronto para `addNetwork`.
 */
export default function AddNetworkModal({ onClose, onCreated, existingNetworks = [] }) {
  const [draft, setDraft] = useState(EMPTY)
  const [query, setQuery] = useState('')
  const [autofilled, setAutofilled] = useState(false)
  const [error, setError] = useState('')

  const suggestions = useMemo(() => searchChains(query), [query])

  const set = (field, value) => setDraft((p) => ({ ...p, [field]: value }))

  const applyChain = (chain) => {
    const filled = lookupChain(chain.chainId)
    if (!filled) return
    setDraft((p) => ({ ...p, ...filled, apiKey: p.apiKey, isActive: true }))
    setAutofilled(true)
    setQuery('')
    setError('')
  }

  // Digitou o Chain ID direto no campo: tenta autopreencher o resto.
  const handleChainIdBlur = () => {
    if (autofilled) return
    const filled = lookupChain(draft.chainId)
    if (filled) {
      setDraft((p) => ({ ...p, ...filled, apiKey: p.apiKey, isActive: true }))
      setAutofilled(true)
    }
  }

  // Explorer digitado à mão: deriva os templates se ainda estiverem vazios.
  const handleExplorerBlur = () => {
    if (draft.explorerAddressTemplate || draft.explorerTxTemplate) return
    const tpl = buildExplorerTemplates(draft.explorerUrl)
    if (tpl.explorerAddressTemplate) setDraft((p) => ({ ...p, ...tpl }))
  }

  const submit = (e) => {
    e.preventDefault()
    const name = draft.name.trim()
    if (!name) return setError('Dê um nome para a rede.')

    const id = Number(draft.chainId)
    if (!Number.isInteger(id) || id <= 0) return setError('Chain ID deve ser um número inteiro positivo.')

    const duplicate = existingNetworks.find((n) => Number(n.chainId) === id)
    if (duplicate) return setError(`Chain ID ${id} já está cadastrado como "${duplicate.name}".`)

    setError('')
    onCreated({ ...draft, name, chainId: id })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <h3 className="font-semibold text-white">Nova rede personalizada</h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Busca no catálogo */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Buscar rede conhecida (nome ou Chain ID)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: Polygon, Scroll, 59144…"
                className="input-field pl-9"
              />
            </div>
            {suggestions.length > 0 && (
              <ul className="mt-1.5 rounded-lg border divide-y" style={{ borderColor: 'var(--border)' }}>
                {suggestions.map((c) => (
                  <li key={c.chainId}>
                    <button
                      type="button"
                      onClick={() => applyChain(c)}
                      className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/5 flex justify-between items-center"
                    >
                      <span>
                        {c.name}{' '}
                        <span className="text-white/40">({c.env === 'mainnet' ? 'Mainnet' : 'Testnet'})</span>
                      </span>
                      <span className="text-white/30 text-xs">#{c.chainId}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-white/40 mt-1">
              Não achou? Preencha os campos abaixo à mão — qualquer rede EVM funciona.
            </p>
          </div>

          {autofilled && (
            <div
              className="flex gap-2 items-start rounded-lg border px-3 py-2 text-[11px]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span>
                Campos preenchidos a partir do catálogo local. RPCs públicos mudam com o tempo — confira
                antes de salvar.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                Nome <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Ex.: Scroll"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                Chain ID <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={draft.chainId}
                onChange={(e) => {
                  set('chainId', e.target.value)
                  setAutofilled(false)
                }}
                onBlur={handleChainIdBlur}
                placeholder="Ex.: 534352"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Ambiente</label>
              <select value={draft.env} onChange={(e) => set('env', e.target.value)} className="input-field">
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Moeda nativa</label>
              <input
                type="text"
                value={draft.nativeCurrency}
                onChange={(e) => set('nativeCurrency', e.target.value)}
                placeholder="ETH"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">RPC URL</label>
            <input
              type="text"
              value={draft.rpcUrl}
              onChange={(e) => set('rpcUrl', e.target.value)}
              placeholder="https://rpc.exemplo.io"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Explorer</label>
            <input
              type="text"
              value={draft.explorerUrl}
              onChange={(e) => set('explorerUrl', e.target.value)}
              onBlur={handleExplorerBlur}
              placeholder="https://explorer.exemplo.io"
              className="input-field"
            />
            {draft.explorerAddressTemplate && (
              <p className="text-[11px] text-white/40 mt-1 break-all">
                Endereço: {draft.explorerAddressTemplate}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Tipo de API</label>
              <select
                value={draft.apiType}
                onChange={(e) => set('apiType', e.target.value)}
                className="input-field"
              >
                <option value="rpc-only">RPC apenas</option>
                <option value="etherscan">Etherscan-like</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">API Key (opcional)</label>
              <input
                type="text"
                value={draft.apiKey}
                onChange={(e) => set('apiKey', e.target.value)}
                placeholder="deixe vazio se não tiver"
                className="input-field"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary inline-flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Salvar rede
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
