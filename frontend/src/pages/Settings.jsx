import { useState, useEffect } from 'react'
import { Bell, Cpu, Database, Globe, Shield, RefreshCw, Plus, Trash2, Edit3, Check, X, Bot, Send, ExternalLink } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import api from '../services/api'
import { useNetworks } from '../context/NetworksContext'

function BotSettingsCard() {
  const [settings, setSettings] = useState(null)
  const [models, setModels] = useState([])
  const [modelsWarning, setModelsWarning] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({
    telegramBotToken: '',
    telegramChatId: '',
    openrouterApiKey: '',
    openrouterModel: '',
    dailyBriefEnabled: false,
  })

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      try {
        const [settingsRes, modelsRes] = await Promise.all([
          api.getUserSettings(),
          api.getFreeOpenRouterModels(),
        ])
        if (!alive) return
        const s = settingsRes.data
        setSettings(s)
        setForm((prev) => ({
          ...prev,
          telegramChatId: s.telegramChatId || '',
          openrouterModel: s.openrouterModel || 'z-ai/glm-4.5-air:free',
          dailyBriefEnabled: !!s.dailyBriefEnabled,
        }))
        setModels(modelsRes.data?.models || [])
        setModelsWarning(modelsRes.data?.warning || '')
      } catch {
        setMessage({ type: 'error', text: 'Não consegui carregar suas configurações. Confira se você está logado.' })
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        telegramChatId: form.telegramChatId,
        openrouterModel: form.openrouterModel,
        dailyBriefEnabled: form.dailyBriefEnabled,
      }
      // Só envia os segredos se o usuário digitou algo novo — campo vazio mantém o que já está salvo.
      if (form.telegramBotToken.trim()) payload.telegramBotToken = form.telegramBotToken.trim()
      if (form.openrouterApiKey.trim()) payload.openrouterApiKey = form.openrouterApiKey.trim()

      const res = await api.saveUserSettings(payload)
      setSettings(res.data)
      setForm((prev) => ({ ...prev, telegramBotToken: '', openrouterApiKey: '' }))
      setMessage({ type: 'success', text: 'Configurações salvas.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Não consegui salvar. Tente de novo.' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)
    try {
      const res = await api.testTelegramSettings()
      setMessage(
        res.data?.sent
          ? { type: 'success', text: 'Mensagem de teste enviada — confira seu Telegram.' }
          : { type: 'error', text: 'Não consegui enviar. Confira token e chat_id.' },
      )
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Falha ao testar o Telegram. Salve as credenciais primeiro.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <GlowCard className="lg:col-span-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
          <Bot className="w-5 h-5 text-electric" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Meu robô (Telegram + IA)</h2>
          <p className="text-xs text-white/50">Cada usuário configura o seu — token e chave ficam cifrados no banco.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-electric border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5 text-sm">
          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-xs ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Telegram */}
          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Telegram</h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${settings?.telegramConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                {settings?.telegramConfigured ? 'Configurado' : 'Não configurado'}
              </span>
            </div>

            <ol className="text-xs text-white/60 space-y-1 list-decimal list-inside">
              <li>No Telegram, procure <strong className="text-white/80">@BotFather</strong> e mande <code className="text-electric">/newbot</code>. Escolha um nome e um username terminado em "bot".</li>
              <li>Ele devolve um token — cole abaixo em "Token do bot".</li>
              <li>Mande qualquer mensagem para o seu bot novo (ex: "oi").</li>
              <li>
                Abra no navegador <code className="text-electric">api.telegram.org/bot&lt;SEU_TOKEN&gt;/getUpdates</code>{' '}
                (troque <code className="text-electric">&lt;SEU_TOKEN&gt;</code> pelo token do seu bot) e copie o número em{' '}
                <code className="text-electric">"chat":&#123;"id": ...&#125;</code>.
              </li>
            </ol>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Token do bot</label>
                <input
                  type="password"
                  className="input-field"
                  value={form.telegramBotToken}
                  onChange={(e) => setForm((p) => ({ ...p, telegramBotToken: e.target.value }))}
                  placeholder={settings?.telegramTokenPreview || '123456:ABC-...'}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Chat ID</label>
                <input
                  className="input-field"
                  value={form.telegramChatId}
                  onChange={(e) => setForm((p) => ({ ...p, telegramChatId: e.target.value }))}
                  placeholder="Ex: 123456789"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={form.dailyBriefEnabled}
                onChange={(e) => setForm((p) => ({ ...p, dailyBriefEnabled: e.target.checked }))}
                className="rounded border-white/30 bg-transparent"
              />
              Enviar resumo diário automaticamente (todo dia, no horário configurado no servidor)
            </label>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="btn btn-secondary flex items-center gap-2 text-xs px-3 py-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {testing ? 'Enviando...' : 'Enviar mensagem de teste'}
            </button>
          </div>

          {/* OpenRouter */}
          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">OpenRouter (IA gratuita)</h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${settings?.openrouterConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                {settings?.openrouterConfigured ? 'Configurado' : 'Não configurado'}
              </span>
            </div>

            <ol className="text-xs text-white/60 space-y-1 list-decimal list-inside">
              <li>
                Crie uma conta grátis em{' '}
                <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-electric hover:underline inline-flex items-center gap-1">
                  openrouter.ai <ExternalLink className="w-3 h-3" />
                </a>{' '}
                e gere uma chave em <strong className="text-white/80">Keys</strong>.
              </li>
              <li>Cole a chave abaixo.</li>
              <li>Escolha um modelo — a lista já mostra só os <strong className="text-white/80">gratuitos</strong> (termina em <code className="text-electric">:free</code>), buscada ao vivo do OpenRouter.</li>
            </ol>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Chave da API</label>
                <input
                  type="password"
                  className="input-field"
                  value={form.openrouterApiKey}
                  onChange={(e) => setForm((p) => ({ ...p, openrouterApiKey: e.target.value }))}
                  placeholder={settings?.openrouterKeyPreview || 'sk-or-v1-...'}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Modelo (gratuito)</label>
                <select
                  className="input-field"
                  value={form.openrouterModel}
                  onChange={(e) => setForm((p) => ({ ...p, openrouterModel: e.target.value }))}
                >
                  {models.length === 0 && <option value={form.openrouterModel}>{form.openrouterModel}</option>}
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {modelsWarning && <p className="text-[11px] text-amber-400/80">{modelsWarning}</p>}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2 text-xs px-4 py-2">
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </form>
      )}
    </GlowCard>
  )
}

function StatusDot({ ok }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
  )
}

function SettingRow({ label, value, status }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        {status !== undefined && <StatusDot ok={status} />}
        <span className="text-sm text-white font-medium">{value || '—'}</span>
      </div>
    </div>
  )
}

export default function Settings() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const { networks, addNetwork, updateNetwork, removeNetwork } = useNetworks()
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await api.getDashboardStats()
      setConfig(res.data?.data || res.data || null)
    } catch {
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }

  const startNewNetwork = () => {
    setEditingId('new')
    setDraft({
      name: '',
      chainId: '',
      env: 'testnet',
      rpcUrl: '',
      explorerUrl: '',
      explorerAddressTemplate: '',
      explorerTxTemplate: '',
      apiType: 'rpc-only',
      apiKey: '',
      nativeCurrency: 'ETH',
      isActive: true,
    })
  }

  const startEditNetwork = (net) => {
    setEditingId(net.id)
    setDraft({
      ...net,
      chainId: String(net.chainId ?? ''),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(null)
  }

  const saveNetwork = (e) => {
    e.preventDefault()
    if (!draft?.name?.trim()) return
    if (editingId === 'new') {
      addNetwork(draft)
    } else if (editingId) {
      updateNetwork(editingId, draft)
    }
    cancelEdit()
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-white/50 mb-6">Preferências e integrações</p>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-electric border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="text-white/50 mt-1">Preferências e integrações</p>
        </div>
        <button onClick={fetchConfig} className="btn btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <BotSettingsCard />

        {/* Notifications */}
        <GlowCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
              <Bell className="w-5 h-5 text-electric" />
            </div>
            <h2 className="text-lg font-semibold text-white">Notificações</h2>
          </div>
          <SettingRow label="Telegram Bot" value={config?.telegramConfigured ? 'Configurado' : 'Não configurado'} status={config?.telegramConfigured} />
          <SettingRow label="Discord Webhook" value={config?.discordConfigured ? 'Configurado' : 'Não configurado'} status={config?.discordConfigured} />
          <SettingRow label="Alertas críticos" value="Ativo" status={true} />
          <SettingRow label="Resumo diário" value={config?.batchEnabled ? 'Ativo' : 'Desativado'} status={config?.batchEnabled} />
        </GlowCard>

        {/* AI Provider */}
        <GlowCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
              <Cpu className="w-5 h-5 text-electric" />
            </div>
            <h2 className="text-lg font-semibold text-white">Provedor de IA</h2>
          </div>
          <SettingRow label="Provedor principal" value={config?.aiProvider || 'Ollama (local)'} status={true} />
          <SettingRow label="Modelo" value={config?.aiModel || 'llama3.1:8b'} />
          <SettingRow label="Ollama (local)" value={config?.ollamaEnabled ? 'Conectado' : 'Desconectado'} status={config?.ollamaEnabled} />
          <SettingRow label="Groq (tempo real)" value={config?.groqConfigured ? 'Configurado' : 'Não configurado'} status={config?.groqConfigured} />
          <SettingRow label="OpenRouter (reserva)" value={config?.openrouterConfigured ? 'Configurado' : 'Não configurado'} status={config?.openrouterConfigured} />
        </GlowCard>

        {/* Infrastructure */}
        <GlowCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
              <Database className="w-5 h-5 text-electric" />
            </div>
            <h2 className="text-lg font-semibold text-white">Infraestrutura</h2>
          </div>
          <SettingRow label="PostgreSQL" value={config?.databaseConnected ? 'Conectado' : 'Desconectado'} status={config?.databaseConnected} />
          <SettingRow label="Cache Redis" value={config?.redisConnected ? 'Conectado' : 'Desconectado'} status={config?.redisConnected} />
          <SettingRow label="Ambiente" value={config?.environment === 'development' ? 'desenvolvimento' : config?.environment || 'desenvolvimento'} />
          <SettingRow label="Versão" value={config?.version || '1.0.0'} />
        </GlowCard>

        {/* Blockchain APIs */}
        <GlowCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
              <Globe className="w-5 h-5 text-electric" />
            </div>
            <h2 className="text-lg font-semibold text-white">APIs Blockchain</h2>
          </div>
          <SettingRow label="API da Moralis" value={config?.moralisConfigured ? 'Configurado' : 'Não configurado'} status={config?.moralisConfigured} />
          <SettingRow label="API do Etherscan" value={config?.etherscanConfigured ? 'Configurado' : 'Não configurado'} status={config?.etherscanConfigured} />
          <SettingRow label="RPCs Públicos" value="Ativo" status={true} />
          <SettingRow label="Redes suportadas" value={config?.supportedChains?.join(', ') || 'ETH, ARB, OP, BASE, MATIC'} />
        </GlowCard>

        {/* Security */}
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
              <Shield className="w-5 h-5 text-electric" />
            </div>
            <h2 className="text-lg font-semibold text-white">Segurança e autenticação</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <SettingRow label="Google OAuth" value={config?.googleOAuthConfigured ? 'Configurado' : 'Não configurado'} status={config?.googleOAuthConfigured} />
              <SettingRow label="Segredo JWT" value="Configurado" status={true} />
            </div>
            <div>
              <SettingRow label="Limite de taxa" value={`${config?.rateLimit || 100} req / 15min`} status={true} />
              <SettingRow label="CORS" value="Ativo" status={true} />
            </div>
          </div>
        </GlowCard>

        {/* Deploy */}
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
              <Globe className="w-5 h-5 text-electric" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Como configurar para deploy</h2>
              <p className="text-sm text-white/70 mt-1">
                Instruções para quando você for publicar o app: defina as variáveis de ambiente no painel do provedor (Vercel no frontend, Railway/Render no backend). Esta aba serve para ver status e cadastrar redes; as chaves de produção não são preenchidas aqui.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Frontend na Vercel</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li><strong className="text-white">Obrigatório:</strong> `VITE_GOOGLE_CLIENT_ID`</li>
                <li><strong className="text-white">Opcional:</strong> `VITE_API_URL` se você não usar proxy/local</li>
                <li><strong className="text-white">Build command:</strong> `npm run build` dentro de `frontend`</li>
                <li><strong className="text-white">Output directory:</strong> `dist`</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Backend (Railway / Render / outro)</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li><strong className="text-white">Obrigatórios:</strong> `GOOGLE_CLIENT_ID`, `JWT_SECRET`</li>
                <li><strong className="text-white">Recomendados:</strong> `DATABASE_URL`, `REDIS_URL`</li>
                <li><strong className="text-white">Se usar IA:</strong> `GROQ_API_KEY` e/ou `OPENROUTER_API_KEY`</li>
                <li><strong className="text-white">Se usar alertas:</strong> Telegram / Discord / Twitter conforme necessário</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/80">
              Resumo: a aba <strong>Configurações</strong> serve para você ver o status e cadastrar <strong>redes</strong>.
              As chaves de produção para Vercel e backend não são preenchidas aqui dentro da interface; elas devem ser
              cadastradas no painel do provedor em <strong>Environment Variables</strong>.
            </p>
          </div>
        </GlowCard>

        {/* Networks */}
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
                <Globe className="w-5 h-5 text-electric" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Redes</h2>
                <p className="text-xs text-white/50">
                  Configure redes mainnet/testnet, RPC e explorer para usar nos airdrops.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startNewNetwork}
              className="btn btn-primary flex items-center gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              Nova rede
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {networks.length === 0 && (
              <p className="text-sm text-white/50">
                Nenhuma rede cadastrada ainda. Clique em <strong>Nova rede</strong> para começar.
              </p>
            )}
            {networks.map((net) => (
              <div
                key={net.id}
                className="flex items-start justify-between gap-3 px-3 py-2 rounded-xl border border-white/10 bg-white/5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white truncate max-w-xs">
                      {net.name} ({net.chainId || '—'})
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 uppercase">
                      {net.env === 'mainnet' ? 'Mainnet' : 'Testnet'}
                    </span>
                    {!net.isActive && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        Inativa
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50 truncate">
                    RPC: {net.rpcUrl || '—'}
                  </p>
                  <p className="text-[11px] text-white/50 truncate">
                    Explorer: {net.explorerUrl || '—'}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditNetwork(net)}
                    className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Remover esta rede?')) removeNetwork(net.id)
                    }}
                    className="p-1.5 rounded-md text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingId && draft && (
            <form onSubmit={saveNetwork} className="mt-4 pt-4 border-t border-white/10 space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Nome</label>
                  <input
                    className="input-field"
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Arc Testnet"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Chain ID</label>
                  <input
                    type="number"
                    className="input-field"
                    value={draft.chainId}
                    onChange={(e) => setDraft((p) => ({ ...p, chainId: e.target.value }))}
                    placeholder="Ex: 8453"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Ambiente</label>
                  <select
                    className="input-field"
                    value={draft.env}
                    onChange={(e) => setDraft((p) => ({ ...p, env: e.target.value }))}
                  >
                    <option value="mainnet">Mainnet</option>
                    <option value="testnet">Testnet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">RPC URL</label>
                  <input
                    className="input-field"
                    value={draft.rpcUrl}
                    onChange={(e) => setDraft((p) => ({ ...p, rpcUrl: e.target.value }))}
                    placeholder="https://rpc.arcscan.app"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">URL do Explorer</label>
                  <input
                    className="input-field"
                    value={draft.explorerUrl}
                    onChange={(e) => setDraft((p) => ({ ...p, explorerUrl: e.target.value }))}
                    placeholder="https://testnet.arcscan.app"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Template endereço</label>
                  <input
                    className="input-field"
                    value={draft.explorerAddressTemplate}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, explorerAddressTemplate: e.target.value }))
                    }
                    placeholder="https://testnet.arcscan.app/address/{wallet}"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Template tx</label>
                  <input
                    className="input-field"
                    value={draft.explorerTxTemplate}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, explorerTxTemplate: e.target.value }))
                    }
                    placeholder="https://testnet.arcscan.app/tx/{hash}"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Tipo de API</label>
                  <select
                    className="input-field"
                    value={draft.apiType}
                    onChange={(e) => setDraft((p) => ({ ...p, apiType: e.target.value }))}
                  >
                    <option value="rpc-only">RPC apenas</option>
                    <option value="etherscan">Etherscan-like</option>
                    <option value="blockscout">Blockscout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">API Key (opcional)</label>
                  <input
                    className="input-field"
                    value={draft.apiKey}
                    onChange={(e) => setDraft((p) => ({ ...p, apiKey: e.target.value }))}
                    placeholder="chave da API do explorer, se precisar"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Moeda nativa</label>
                  <input
                    className="input-field"
                    value={draft.nativeCurrency}
                    onChange={(e) => setDraft((p) => ({ ...p, nativeCurrency: e.target.value }))}
                    placeholder="Ex: ETH, ARC"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => setDraft((p) => ({ ...p, isActive: e.target.checked }))}
                    className="rounded border-white/30 bg-transparent"
                  />
                  Rede ativa
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs"
                  >
                    <X className="w-3 h-3" /> Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex items-center gap-1 px-3 py-1.5 text-xs"
                  >
                    <Check className="w-3 h-3" /> Salvar
                  </button>
                </div>
              </div>
            </form>
          )}
        </GlowCard>
      </div>
    </div>
  )
}

function getMockConfig() {
  return {
    telegramConfigured: false,
    discordConfigured: false,
    batchEnabled: true,
    aiProvider: 'Ollama (local)',
    aiModel: 'llama3.1:8b',
    ollamaEnabled: true,
    groqConfigured: false,
    openrouterConfigured: false,
    databaseConnected: false,
    redisConnected: false,
    environment: 'development',
    version: '1.0.0',
    moralisConfigured: false,
    etherscanConfigured: false,
    supportedChains: ['ETH', 'ARB', 'OP', 'BASE', 'MATIC'],
    googleOAuthConfigured: false,
    rateLimit: 100,
  }
}
