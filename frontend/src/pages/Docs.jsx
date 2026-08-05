import { BookOpen, Zap, Server, Database, Key, Globe, Bot } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'

export default function Docs() {
  return (
    <div className="pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <BookOpen className="w-8 h-8" style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Documentação ClaimOS</h1>
          <p className="text-white/50 text-sm mt-0.5">Guia completo do DApp de airdrops</p>
        </div>
      </div>

      <div className="space-y-8 max-w-4xl">
        <GlowCard>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-electric" />
            1. O que é o ClaimOS
          </h2>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            O <strong>ClaimOS</strong> é uma plataforma para monitorar, organizar e acompanhar airdrops de criptomoedas.
            Você cadastra airdrops, vincula carteiras, acompanha prazos (snapshot, claim, TGE) e usa o assistente de IA
            para análises e estratégias. O login é feito com conta Google (e opcionalmente OTP no backend legado).
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            O projeto tem <strong>frontend</strong> (React + Vite) e <strong>backend</strong> (Node.js + Fastify ou Express),
            com suporte a Supabase, OpenRouter (IA) e JWT para sessão.
          </p>
        </GlowCard>

        <GlowCard>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-electric" />
            2. Estrutura do repositório
          </h2>
          <ul className="text-sm text-white/80 space-y-2 list-disc list-inside">
            <li><strong>frontend/</strong> — Interface: Painel, Airdrops, Portfólio, Carteiras, Alertas, Configurações, Robô de IA.</li>
            <li><strong>backend/</strong> — API: autenticação, CRUD de airdrops, carteiras, análise com IA (OpenRouter).</li>
          </ul>
          <p className="text-white/60 text-xs mt-4">
            Frontend e backend podem ser implantados separadamente (ex.: Vercel + Railway).
          </p>
        </GlowCard>

        <GlowCard>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-electric" />
            3. Variáveis de ambiente
          </h2>
          <h3 className="text-sm font-semibold text-white mt-4 mb-2">Frontend (.env em frontend/)</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li><code className="bg-white/10 px-1 rounded">VITE_APP_NAME</code> — Nome do app (ex.: ClaimOS).</li>
            <li><code className="bg-white/10 px-1 rounded">VITE_API_URL</code> — URL do backend (ex.: http://localhost:3000).</li>
            <li><code className="bg-white/10 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> — Client ID do Google OAuth (obrigatório para login).</li>
            <li><code className="bg-white/10 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-white/10 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> — Opcional, para uso direto do Supabase no cliente.</li>
          </ul>
          <h3 className="text-sm font-semibold text-white mt-4 mb-2">Backend (.env em backend/)</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li><code className="bg-white/10 px-1 rounded">NODE_ENV</code>, <code className="bg-white/10 px-1 rounded">PORT</code>, <code className="bg-white/10 px-1 rounded">CORS_ORIGIN</code>.</li>
            <li><code className="bg-white/10 px-1 rounded">GOOGLE_CLIENT_ID</code>, <code className="bg-white/10 px-1 rounded">JWT_SECRET</code> — Autenticação.</li>
            <li><code className="bg-white/10 px-1 rounded">SUPABASE_URL</code>, <code className="bg-white/10 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> — Banco (nunca exponha a service_role no frontend).</li>
            <li><code className="bg-white/10 px-1 rounded">OPENROUTER_API_KEY</code>, <code className="bg-white/10 px-1 rounded">OPENROUTER_MODEL</code> — IA (ex.: z-ai/glm-4.5-air:free).</li>
          </ul>
        </GlowCard>

        <GlowCard>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-electric" />
            4. Como rodar localmente
          </h2>
          <p className="text-white/80 text-sm mb-4">Backend:</p>
          <pre className="text-xs text-white/80 bg-black/30 p-4 rounded-lg overflow-x-auto mb-4">
{`cd backend
npm install
cp .env.example .env   # preencha as variáveis
npm run dev`}
          </pre>
          <p className="text-white/80 text-sm mb-4">Frontend:</p>
          <pre className="text-xs text-white/80 bg-black/30 p-4 rounded-lg overflow-x-auto">
{`cd frontend
npm install
cp .env.example .env   # VITE_GOOGLE_CLIENT_ID, VITE_API_URL
npm run dev`}
          </pre>
          <p className="text-white/60 text-xs mt-4">
            Acesse <strong>http://localhost:5173</strong>. O proxy do Vite encaminha /api para o backend (ex.: porta 3000).
          </p>
        </GlowCard>

        <GlowCard>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-electric" />
            5. Deploy (produção)
          </h2>
          <p className="text-white/80 text-sm mb-4">
            <strong>Frontend (Vercel):</strong> Root Directory = <code className="bg-white/10 px-1 rounded">frontend</code>, Build = <code className="bg-white/10 px-1 rounded">npm run build</code>, Output = <code className="bg-white/10 px-1 rounded">dist</code>. Defina VITE_GOOGLE_CLIENT_ID e VITE_API_URL (URL do backend em produção) nas variáveis de ambiente do projeto.
          </p>
          <p className="text-white/80 text-sm mb-4">
            <strong>Backend (Railway / Render):</strong> Root Directory = <code className="bg-white/10 px-1 rounded">backend</code>, Start = <code className="bg-white/10 px-1 rounded">npm run start</code> (ou <code className="bg-white/10 px-1 rounded">node dist/index.js</code> se usar TypeScript). Configure no painel do provedor: GOOGLE_CLIENT_ID, JWT_SECRET, SUPABASE_*, OPENROUTER_*, etc.
          </p>
          <p className="text-white/60 text-xs">
            As chaves de produção não são preenchidas na aba Configurações do app; use sempre o painel do provedor (Environment Variables).
          </p>
        </GlowCard>

        <GlowCard>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-electric" />
            6. Abas do DApp
          </h2>
          <ul className="text-sm text-white/80 space-y-2">
            <li><strong>Painel</strong> — Resumo, métricas, gráficos P&amp;L, próximos eventos, alertas, assistente de IA.</li>
            <li><strong>Airdrops</strong> — Lista (Todos / Mainnet / Testnet), criar, editar, remover e ver detalhes de cada airdrop.</li>
            <li><strong>Portfólio</strong> — Composição, posições, Money Lego, análise de alavancagem.</li>
            <li><strong>Transações</strong> — Histórico e registro de transações.</li>
            <li><strong>Carteiras</strong> — Cadastro e gestão de endereços.</li>
            <li><strong>Alertas</strong> — Notificações e prioridade.</li>
            <li><strong>Robô de IA</strong> — Status, insights e chat com o assistente.</li>
            <li><strong>Configurações</strong> — Notificações, deploy (instruções), redes (RPC, explorer) para usar nos airdrops.</li>
          </ul>
        </GlowCard>

        <GlowCard>
          <h2 className="text-xl font-semibold text-white mb-4">7. Redes e airdrops</h2>
          <p className="text-white/80 text-sm mb-4">
            Em <strong>Configurações → Redes</strong> você cadastra redes (mainnet/testnet) com RPC e URLs do explorer.
            Ao criar um airdrop, escolhe uma rede da lista ou usa o link &quot;Adicionar nova rede&quot; para ir às configurações.
            Cada airdrop pode ter fase, datas (snapshot, claim, TGE, vesting), valor estimado e carteiras vinculadas.
          </p>
        </GlowCard>

        <p className="text-white/40 text-xs pt-4">
          Documentação gerada para o projeto ClaimOS. Para mais detalhes técnicos, consulte o README.md na raiz do repositório.
        </p>
      </div>
    </div>
  )
}
