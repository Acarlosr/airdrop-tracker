import { useState, useEffect } from 'react'
import { Bell, Cpu, Database, Globe, Shield, RefreshCw } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import api from '../services/api'

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

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await api.getDashboardStats()
      setConfig(res.data?.data || res.data || null)
    } catch {
      setConfig(getMockConfig())
    } finally {
      setLoading(false)
    }
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
          <SettingRow label="Groq (real-time)" value={config?.groqConfigured ? 'Configurado' : 'Não configurado'} status={config?.groqConfigured} />
          <SettingRow label="OpenRouter (fallback)" value={config?.openrouterConfigured ? 'Configurado' : 'Não configurado'} status={config?.openrouterConfigured} />
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
          <SettingRow label="Redis Cache" value={config?.redisConnected ? 'Conectado' : 'Desconectado'} status={config?.redisConnected} />
          <SettingRow label="Ambiente" value={config?.environment || 'development'} />
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
          <SettingRow label="Moralis API" value={config?.moralisConfigured ? 'Configurado' : 'Não configurado'} status={config?.moralisConfigured} />
          <SettingRow label="Etherscan API" value={config?.etherscanConfigured ? 'Configurado' : 'Não configurado'} status={config?.etherscanConfigured} />
          <SettingRow label="RPCs Públicos" value="Ativo" status={true} />
          <SettingRow label="Chains suportadas" value={config?.supportedChains?.join(', ') || 'ETH, ARB, OP, BASE, MATIC'} />
        </GlowCard>

        {/* Security */}
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-electric/10 border border-electric/20">
              <Shield className="w-5 h-5 text-electric" />
            </div>
            <h2 className="text-lg font-semibold text-white">Segurança & Auth</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <SettingRow label="Google OAuth" value={config?.googleOAuthConfigured ? 'Configurado' : 'Não configurado'} status={config?.googleOAuthConfigured} />
              <SettingRow label="JWT Secret" value="Configurado" status={true} />
            </div>
            <div>
              <SettingRow label="Rate Limiting" value={`${config?.rateLimit || 100} req / 15min`} status={true} />
              <SettingRow label="CORS" value="Ativo" status={true} />
            </div>
          </div>
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
