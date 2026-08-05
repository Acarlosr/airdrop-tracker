# 🎯 ClaimOS — Documento de Produto
### Versão 3.1 — Fevereiro 2026

---

## 1. Visão Geral

**ClaimOS** é uma plataforma de monitoramento, análise e automação de airdrops com IA.
Centraliza descoberta de oportunidades, monitoramento social, análise multi-chain,
checagem de carteiras e alertas inteligentes em uma única experiência.

> ⚠️ **Princípio fundamental:** O sistema NUNCA solicita conexão de carteira.
> Endereços são cadastrados manualmente. O sistema é somente leitura.

---

## 2. Público-Alvo

- Farmers de DeFi/Web3 que perdem o controle de posições compostas
- Usuários que dependem de YouTube/Reddit para descobrir airdrops
- Builders que querem um framework extensível para tracker + bot
- Compradores do produto (SaaS): esperam confiabilidade e dados verificados

---

## 3. Componentes do Sistema

1. Dashboard Web — airdrops, portfólio, posições DeFi, cadeias Money Lego
2. Backend/API — regras de negócio, persistência, ingestão de eventos
3. Banco de Dados — airdrops, tarefas, posições, cadeias de composição
4. Bot do Telegram — alertas, consultas rápidas, gatilho de automação
5. Módulo de Ingestão — anúncios via Discord, X e Telegram
6. Módulo de Descoberta — busca ativa (YouTube, Reddit, X, DeFiLlama)
7. Módulo de Portfólio DeFi — posições, dívidas, stakes, looping, Money Lego
8. Módulo de Execução (Workers) — tarefas automatizáveis
9. Módulo de IA/LLM — parsing de anúncios, scoring, chat
10. Sistema de Confiabilidade — verificação de dados, auditoria

---

## 4. Conceitos Principais

### Airdrop
Campanha de distribuição de tokens/pontos a acompanhar.
- Metadados, chains, categoria (L1, L2, DEX, infra, NFT)
- Status: rumor → confirmado → ativo → encerrado → claim aberto → claim feito
- Potencial (tier S/A/B/C), custo estimado, risco
- Score de confiabilidade (0–100)

### Endereço de Carteira (sem wallet connect)
- Endereço público inserido manualmente
- Consulta on-chain via Moralis / DeBank API / RPCs públicos
- Nenhuma chave privada armazenada

### Posição DeFi
Tipos: lending, borrowing, stake, LP, farming, looping, money_lego, bridge

### Money Lego (DIFERENCIAL)
Token derivativo recebido de um protocolo e usado em outro.
Ex: ETH → [Lido] → stETH → [Aave] → USDC → [Pendle] → PT-USDC

O sistema constrói grafo de dependências, identifica risco cascata
e calcula sequência de saída segura.

### Risco Cascata
Quando uma posição no meio da cadeia falha, todas as dependentes são afetadas.
O sistema calcula ponto crítico, valor em risco e alerta preventivamente.

---

## 5. Funcionalidades

- Dashboard com métricas de airdrops ativos
- CRUD de airdrops com filtros (testnet/mainnet, chain, status)
- Cadastro de wallets (somente leitura)
- Verificação de elegibilidade multi-chain
- Money Lego — grafo de dependências (React Flow)
- Risco cascata com alertas
- Sequência de saída segura (topological sort)
- IA Conversacional (Groq) no dashboard
- Social Feed (Twitter/Discord)
- Bot Telegram com 12+ comandos
- Monitoramento de protocolos
- Descoberta de novos airdrops
- Score de confiabilidade (0–100)

---

## 6. Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + TailwindCSS + React Flow + Recharts |
| Backend | Node.js + Fastify (JavaScript ESM + TypeScript) |
| Database | PostgreSQL (Supabase) |
| Cache/Fila | Redis (Upstash) + BullMQ |
| IA | Groq (real-time) + Ollama (batch) + OpenRouter (fallback) |
| Blockchain | Moralis API + DeBank API + RPCs públicos |
| Social | Discord.js + Twitter API v2 + RSS |
| Notificações | Telegram Bot API |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## 7. Roadmap

### MVP ✓
- Dashboard + abas Airdrops, Tarefas, Portfólio
- Cadastro de endereço + consulta on-chain
- Money Lego com grafo de dependências
- Bot Telegram com comandos principais
- IA conversacional (Groq)

### v1 (próximo)
- Leitura automática de posições via DeBank API
- Detecção automática de Money Lego
- Módulo de Descoberta (YouTube + Reddit + DeFiLlama)
- Score de confiabilidade automático
- Conector Discord

### v2 (futuro)
- Multi-identidade
- Tarefas automatizáveis (workers read-only)
- Logs imutáveis e auditoria
- Exportação CSV/JSON

### SaaS (futuro)
- Autenticação email + 2FA
- Planos: Free / Pro / Team
- Landing page pública
- API pública com API key

---

## 8. Segurança

1. Sem wallet connect — endereços são somente leitura
2. Sem chaves privadas — jamais armazenadas ou transmitidas
3. Transparência total — toda ação logada com origem e timestamp
4. Modo somente leitura — automação desligável globalmente
5. Dados verificáveis — transações checadas on-chain
6. Risco cascata visível — pontos críticos identificados

---

*Consolida documentos: PROJETO_RESUMO.md, Atualizações.md, MELHORIAS_IMPLEMENTADAS.md, AI_BOT_IMPLEMENTATION.md*
