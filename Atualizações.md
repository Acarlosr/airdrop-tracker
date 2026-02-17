Vou refazer o documento completo com a distinção de Money Lego incorporada de forma precisa e técnica.

text
# 🎯 Airdrop Tracker & Automation Bot
### Versão 3.1 — Documento de Produto Completo

---

## Visão Geral

O **Airdrop Tracker & Automation Bot** é um sistema completo para organizar,
priorizar, rastrear e automatizar airdrops (testnet e mainnet). Conecta um
dashboard web com integrações Discord/X/Telegram e um bot do Telegram que
alerta, organiza e executa tarefas de forma controlada.

O objetivo é ser o **"centro de comando"** para quem farma airdrops em escala
— substituindo planilhas soltas, bots ad‑hoc e horas assistindo YouTube por
uma solução única, confiável e extensível, preparada para ser comercializada
como produto ou SaaS.

> ⚠️ **Princípio fundamental de segurança:** O sistema NUNCA solicita
> conexão de carteira (wallet connect). Endereços são cadastrados
> manualmente. O sistema é somente leitura em relação a carteiras —
> consulta dados públicos on-chain via APIs, sem acesso a chaves
> privadas ou assinaturas.

---

## Objetivos do Projeto

- Centralizar todas as campanhas de airdrop em um único lugar com
  metadados ricos.
- Separar claramente testnet e mainnet (risco, custo, prioridade).
- Rastrear posições DeFi por airdrop: quanto foi investido, o que foi
  feito, o que ainda precisa ser devolvido.
- Detectar e visualizar cadeias de **Money Lego** (composabilidade DeFi)
  e **Looping/Leverage Farming**.
- Monitorar anúncios via Discord/X/Telegram e transformá-los em tarefas.
- Descobrir novos airdrops promissores via fontes externas (YouTube,
  Reddit, X, DeFiLlama).
- Ser confiável o suficiente para ser vendido como produto/SaaS.

---

## Público‑Alvo

- Farmers de DeFi/Web3 que perdem o controle de posições compostas em
  múltiplos protocolos.
- Usuários que dependem de YouTube/Reddit para descobrir airdrops e
  querem centralizar isso.
- Builders que querem um framework extensível para tracker + bot de
  automação.
- **Compradores do produto (SaaS):** esperam confiabilidade, auditoria
  e dados verificados.

---

## Componentes do Sistema

1. **Dashboard Web** — visualizar airdrops, portfólio, posições DeFi,
   cadeias Money Lego, tarefas e métricas.
2. **Backend/API** — regras de negócio, persistência, ingestão de
   eventos e orquestração de jobs.
3. **Banco de Dados** — airdrops, tarefas, posições, cadeias de
   composição, identidades, eventos e execuções.
4. **Bot do Telegram** — alertas, consultas rápidas e gatilho de
   automação.
5. **Módulo de Ingestão** — anúncios via Discord, X e Telegram.
6. **Módulo de Descoberta** — busca ativa de novos airdrops em fontes
   externas (YouTube, Reddit, X, DeFiLlama).
7. **Módulo de Portfólio DeFi** — rastreamento de posições, dívidas,
   stakes, looping e cadeias Money Lego.
8. **Módulo de Execução (Workers)** — tarefas automatizáveis (sem
   wallet connect).
9. **Módulo de IA/LLM** — parsing de anúncios, scoring e interface
   conversacional.
10. **Sistema de Confiabilidade** — verificação de dados, auditoria e
    selos de qualidade.

---

## Conceitos Principais

### Airdrop
Campanha de distribuição de tokens/pontos a acompanhar.

Inclui:
- Metadados: nome, descrição, site, X, Discord, Telegram.
- Chains envolvidas e categoria (L1, L2, DEX, infra, NFT, game, etc.).
- Tipo de rede: `testnet` / `mainnet` / fases distintas.
- Status: `rumor` → `confirmado` → `ativo` → `encerrado` →
  `claim aberto` → `claim feito`.
- Potencial (tier S/A/B/C), custo estimado, nível de risco.
- Datas: início, snapshot estimado, deadline.
- **Score de confiabilidade** (0–100) calculado automaticamente.
- **Origem dos dados**: fonte rastreada (Discord oficial, site, X
  verificado, entrada manual, descoberta automática).
- **Fonte de descoberta**: YouTube, Reddit, DeFiLlama, Discord, manual.

---

### Endereço de Carteira (sem wallet connect)
O sistema **não conecta carteiras**. O usuário cadastra endereços
manualmente como texto simples.

- Endereço público (EVM, Solana, etc.) inserido pelo usuário.
- Label opcional (ex: "Wallet principal", "Wallet testnet 2").
- Consulta on-chain via Moralis / DeBank API / RPCs públicos.
- **Nenhuma chave privada é armazenada, solicitada ou transmitida.**
- Para tarefas que exigem assinatura, o sistema gera o payload e
  **exibe para o usuário assinar manualmente** — nunca assina
  automaticamente.

---

### Posição DeFi
Registro de recursos alocados em um protocolo dentro do contexto de
um airdrop.

**Tipos de posição:**

| Tipo | Descrição |
|---|---|
| `lending` | Depositou tokens em protocolo de empréstimo |
| `borrowing` | Pegou emprestado (tem dívida ativa) |
| `stake` | Tokens em staking simples |
| `LP` | Posição em pool de liquidez |
| `farming` | Tokens em farm de rendimento |
| `looping` | Posição encadeada de borrow + reinvestimento |
| `money_lego` | Token derivativo recebido e usado em outro protocolo |
| `bridge` | Tokens em trânsito entre redes |

Campos comuns:
- Protocolo, token, valor USD de entrada, valor atual.
- Status: `ativa` / `parcialmente encerrada` / `encerrada`.
- Dependências: quais posições dependem desta.
- Hash da transação de entrada.
- Alertas configurados (ex: health factor < 1.3).

---

### Looping / Leverage Farming
Estratégia de **borrow circular**: depositar, pegar emprestado, e
reinvestir o mesmo ativo para amplificar exposição ou volume de
interações.

Exemplo de Looping:

Deposita 500 USDC na Aave → posição: lending
​
↓ pega emprestado
400 USDC emprestados da Aave → posição: borrowing
​
↓ reinveste
400 USDC depositados de volta → nova posição: lending
​
↓ pega emprestado novamente
300 USDC emprestados (2ª rodada) → posição: borrowing
​

Dívida total acumulada: $700 USDC
Exposição total: $1.200 USDC
Health factor: monitorado continuamente

text

O sistema rastreia cada camada do loop separadamente e calcula:
- Dívida total acumulada.
- Exposição total vs capital inicial.
- Health factor em tempo real.
- Sequência exata para desmontar o loop com segurança.

---

### Money Lego / Composabilidade DeFi
Estratégia onde o **token recebido** de um protocolo (token
derivativo/sintético/representativo) é usado diretamente em outro
protocolo — criando uma cadeia de composição entre peças independentes.

> 💡 **Diferença do Looping:** no looping você reinveste o mesmo ativo
> base. No Money Lego você recebe um **novo token** que representa sua
> posição e leva esse token para outro protocolo.

Exemplo de Money Lego:

Deposita ETH na Lido
​
↓ recebe token derivativo
stETH recebido → token: stETH
​
↓ deposita como colateral
stETH depositado na Aave → posição: lending (stETH)
​
↓ pega emprestado
USDC emprestado da Aave → posição: borrowing (USDC)
​
↓ usa em outro protocolo
USDC depositado no Pendle → posição: money_lego
​
↓ recebe token de rendimento
PT-USDC recebido do Pendle → token: PT-USDC
​
↓ usa em outro protocolo
PT-USDC em farm no Protocolo Z → posição: farming (PT-USDC)
​

text

**Campos específicos do tipo `money_lego`:**

| Campo | Descrição |
|---|---|
| `token_origem` | Token que chegou do protocolo anterior (ex: stETH) |
| `protocolo_origem` | De onde veio o token (ex: Lido) |
| `token_destino` | Token gerado nesta etapa (ex: PT-USDC) |
| `protocolo_destino` | Onde o token foi usado (ex: Pendle) |
| `posicao_anterior_id` | ID da posição que gerou este token |
| `proxima_posicao_id` | ID da próxima posição que usa o token gerado |
| `risco_cascata` | true/false — se falhar, quebra a cadeia inteira |

**Visualização no dashboard:**

O sistema exibe a cadeia completa como um **grafo de dependências**:

ETH
└─ [Lido] → stETH
└─ [Aave] → USDC (dívida: $400)
└─ [Pendle] → PT-USDC
└─ [Protocolo Z] → recompensas

text

Com indicadores em cada nó:
- 💰 Valor atual em USD
- ⚠️ Risco cascata (se algum protocolo falhar)
- 🔴 Alertas ativos (health factor, vencimento)
- ✅ / ⏳ Status da posição

---

### Risco Cascata (Money Lego)
Quando uma posição no meio da cadeia falha ou é liquidada, todas as
posições dependentes abaixo dela são afetadas.

O sistema calcula e exibe:
- **Ponto de falha crítico**: qual posição, se encerrada, derruba toda
  a cadeia.
- **Valor em risco total**: soma de tudo que depende do ponto crítico.
- **Alerta preventivo**: notifica quando qualquer nó da cadeia se
  aproxima de limite de risco.

---

### Tarefa
Ação específica ligada a um airdrop.

Inclui:
- Tipo: `on‑chain`, `Discord`, `X`, `Telegram`, `outro`.
- Frequência: `única`, `diária`, `semanal`, `mensal`.
- Status: `pendente`, `em progresso`, `feito`, `ignorada`.
- Automação: executor, nível de segurança, limites.
- Histórico: última execução, próxima prevista, logs.
- **Verificação de conclusão**: checa on-chain se a transação ocorreu.
- **Posição DeFi gerada**: se a tarefa criou uma posição, vincula ao
  módulo de portfólio e à cadeia Money Lego correspondente.

---

### Identidade
Persona de farming (módulo avançado):
- Endereços cadastrados (somente leitura).
- Perfis sociais associados.
- Regras de limite (ações por dia, janelas de horário).

---

### Evento de Origem
Mensagem capturada de Discord/X/Telegram:
- Origem com indicador de confiança da fonte.
- Conteúdo bruto + resultado de parsing.
- Status de verificação.

---

### Job de Execução
Execução pendente de tarefa automatizável:
- Referência à tarefa e identidade.
- Estado, logs e hash de transação.

---

## Funcionalidades

### Aba: Dashboard Principal
Visão geral do estado atual:
- Total de airdrops ativos (testnet / mainnet).
- Tarefas do dia pendentes.
- Valor total em posições DeFi abertas.
- Dívidas ativas (quanto precisa devolver e para qual protocolo).
- Cadeias Money Lego ativas com alertas de risco cascata.
- Alertas de prioridade alta (snapshots, health factors, deadlines).
- Novos airdrops descobertos nas últimas 24h.

---

### Aba: Airdrops
Lista e gestão de campanhas:
- Abas "Todos", "Testnet", "Mainnet".
- Filtros por chain, status, risco, potencial, tags, confiabilidade.
- Badge de verificação 🟢 / 🟡 / 🔴.
- Score de confiabilidade visível em cada card.
- Fonte de descoberta exibida.

---

### Aba: Portfólio DeFi

#### Subvisão: Por Airdrop
Para cada airdrop, exibe:
- Posições abertas vinculadas (stake, borrow, LP, money_lego).
- Total investido em USD e valor atual (P&L).
- Dívidas pendentes com valor e protocolo.
- Cadeia Money Lego visualizada como grafo.
- Indicador de risco cascata por cadeia.
- Botão **"Como sair dessa posição?"** — o sistema calcula a sequência
  correta de desmontagem, respeitando dependências.

#### Subvisão: Por Endereço
Para cada endereço cadastrado:
- Posições em todos os protocolos (lido via DeBank API).
- Saldo de tokens incluindo derivativos (stETH, aUSDC, PT-tokens).
- NFTs e posições LP.
- Elegibilidade estimada por airdrop ativo.
- Health factors ativos.

#### Subvisão: Visão Geral Financeira
- Total investido em USD.
- Total em dívida.
- Valor líquido (investido − dívida).
- ROI estimado por airdrop.
- Histórico de aportes com data, valor e protocolo.

#### Campos rastreados por posição:

| Campo | Descrição |
|---|---|
| Protocolo | Nome (Aave, Lido, Pendle, GMX, etc.) |
| Tipo | lending / borrowing / stake / LP / money_lego / looping / bridge |
| Token | ETH, stETH, USDC, PT-USDC, aUSDC, etc. |
| Token derivativo gerado | Token recebido desta posição (Money Lego) |
| Usado em | Próximo protocolo que recebeu o token derivativo |
| Valor entrada (USD) | Quanto colocou |
| Valor atual (USD) | Lido on-chain em tempo real |
| Em stake? | Sim/Não + APY atual |
| Dívida ativa? | Valor + protocolo credor |
| Health factor | Se aplicável |
| Risco cascata | Esta posição é ponto crítico de uma cadeia? |
| Data de entrada | Quando a posição foi aberta |
| Data de vencimento | Se aplicável |
| Dependências | IDs de posições dependentes |
| Status | ativa / encerrada / liquidada |
| Hash de entrada | Tx de abertura da posição |

---

### Aba: Tarefas
Rotina diária do farmer:
- Visão "Hoje": tarefas vencidas e do dia, agrupadas por airdrop.
- Filtros por rede e tipo.
- Marcar como ignorada sem perder histórico.
- Verificação automática de conclusão on-chain.
- Ao criar tarefa que gera posição, vincula ao grafo Money Lego.

---

### Aba: Descoberta de Airdrops

**Fontes monitoradas:**
- **YouTube RSS**: canais de airdrop hunters conhecidos.
- **Reddit**: r/airdrop, r/defi, r/CryptoCurrency.
- **X/Twitter**: influencers configurados + hashtags (#airdrop, #DeFi).
- **DeFiLlama**: novos protocolos com TVL crescente.
- **Discord**: canais de anúncio de projetos.
- **Airdrops.io / Earndrop.io**: feeds públicos.

**Fluxo:**
Fonte publica conteúdo
→ IA extrai: projeto, chain, critérios, links, potencial
→ Score de confiabilidade calculado
→ Score > 40: aparece na aba para revisão
→ Score > 70: alerta no Telegram
→ Usuário aprova → airdrop adicionado com fonte rastreada

text

---

### Aba: Alertas
Central de alertas configuráveis:
- Snapshot próximo.
- Claim aberto.
- Tarefas com deadline se aproximando.
- **Health factor baixo** (risco de liquidação).
- **Dívida prestes a vencer.**
- **Risco cascata detectado** em cadeia Money Lego.
- Novo airdrop descoberto com score alto.
- Airdrop com sinais de scam detectados.
- Recompensas de stake/farm prontas para claim.

---

### Bot do Telegram

Comandos:
- `/hoje` — tarefas do dia por airdrop.
- `/testnet` / `/mainnet` — filtrar por rede.
- `/status <airdrop>` — status de uma campanha.
- `/portfolio` — resumo das posições DeFi abertas.
- `/dividas` — empréstimos ativos e valores a devolver.
- `/lego <airdrop>` — exibe a cadeia Money Lego desse airdrop.
- `/risco <airdrop>` — mostra pontos de falha crítica da cadeia.
- `/check <endereço>` — elegibilidade de um endereço.
- `/verify <airdrop>` — score de confiabilidade.
- `/descobertos` — novos airdrops das últimas 24h.
- `/sair <airdrop>` — sequência calculada para encerrar posições com
  segurança, respeitando dependências Money Lego.

Alertas automáticos:
- Novo airdrop de alta confiabilidade.
- Health factor em risco.
- Risco cascata detectado em cadeia Money Lego.
- Deadline de tarefa em menos de 24h.
- Snapshot em menos de 48h.
- Recompensa disponível para claim.

---

## Sistema de Confiabilidade

### Score de Airdrop (0–100)

| Critério | Peso |
|---|---|
| Site oficial com domínio registrado há +6 meses | Alto |
| Smart contract auditado (Certik, Trail of Bits, etc.) | Alto |
| Time identificável com histórico público | Alto |
| Anúncio em canal Discord oficial | Médio |
| Conta X verificada do projeto | Médio |
| Histórico de airdrops pagos pelo mesmo time | Alto |
| Listado no DeFiLlama com TVL real | Alto |
| Mencionado por múltiplos influencers independentes | Médio |
| Sem características de scam detectadas pela IA | Médio |

**Badges:**
- 🟢 **Verificado** (70–100)
- 🟡 **Em análise** (40–69)
- 🔴 **Não verificado / risco** (0–39)

### Auditoria de Dados
- Todo dado tem origem rastreada (fonte, timestamp, quem inseriu).
- Logs imutáveis (append-only).
- Exportação CSV/JSON.
- Transações verificadas on-chain via explorer API.

---

## Arquitetura

Usuário
├── Dashboard Web (SPA React)
└── Bot Telegram

Backend/API (hub central)
├── Módulo de Ingestão (Discord / X / Telegram)
├── Módulo de Descoberta (YouTube RSS / Reddit / DeFiLlama / X)
├── Módulo de Portfólio (Moralis / DeBank API / RPCs)
├── Módulo Money Lego (grafo de dependências + risco cascata)
├── Módulo de IA/LLM (Groq + Ollama + OpenRouter)
├── Módulo de Execução (BullMQ workers)
└── Módulo de Confiabilidade (scoring + auditoria)

Infraestrutura
├── PostgreSQL (Supabase → Railway)
├── Redis / Upstash (cache + filas BullMQ)
└── GitHub Actions (cron jobs noturnos)

Externo (somente leitura)
├── Moralis API (histórico on-chain, saldos)
├── DeBank API (posições DeFi, lending, LP, derivativos)
├── DeFiLlama API (TVL, novos protocolos)
├── Etherscan / Arbiscan (verificação de transações)
├── RPCs públicos (Ethereum, Arbitrum, Optimism, Base,
│ Polygon, Hyperliquid, Solana)
├── Discord Bot API
├── Telegram Bot API
└── YouTube RSS / Reddit RSS

text

### Decisões de Arquitetura
- **API centralizada**: todos os clientes falam via backend.
- **Sem wallet connect**: endereços são strings somente leitura.
- **Grafo de dependências**: posições Money Lego armazenadas como
  grafo dirigido no banco para calcular risco cascata e sequência
  de saída.
- **Assincronia e filas (BullMQ)**: captura, processamento e execução
  desacoplados.
- **LLM como serviço auxiliar**: nunca acessa banco ou endereços.
- **Logs imutáveis**: eventos e execuções são append-only.
- **DeBank API** como fonte primária de posições DeFi (mais preciso
  para tokens derivativos, staking e lending complexo).

### Segurança
- Sem chaves privadas no sistema.
- API keys em cofre (Doppler / Railway Secrets).
- Rate limiting em todos os endpoints.
- JWT com refresh tokens para o dashboard.
- Bot Telegram restrito por `chat_id` allowlist.
- Modo somente leitura global (desabilita automação com 1 clique).
- Sanitização de inputs.
- CORS configurado por domínio.

---

## Fluxos Principais

### Fluxo: Cadastro de Endereço e Portfólio
Usuário digita endereço → validação de formato
→ DeBank API retorna posições abertas (incluindo derivativos)
→ Sistema detecta cadeias Money Lego automaticamente
→ Grafo de dependências montado
→ Dashboard exibe posições + cadeias + riscos
→ Nenhuma ação solicitada ao usuário

text

### Fluxo: Money Lego — Registro e Visualização
Usuário registra: "Depositei ETH na Lido"
→ Posição: lending (ETH) → token gerado: stETH

Usuário registra: "Usei stETH na Aave como colateral"
→ Posição: money_lego (stETH da Lido → Aave)
→ Sistema vincula automaticamente à posição anterior

Usuário registra: "Peguei emprestado USDC na Aave"
→ Posição: borrowing (USDC) → dívida ativa registrada

Usuário registra: "Usei USDC no Pendle"
→ Posição: money_lego (USDC da Aave → Pendle)
→ Token gerado: PT-USDC

Dashboard exibe:
ETH → [Lido] → stETH → [Aave] → USDC (dívida $400)
→ [Pendle] → PT-USDC
Risco cascata: se Aave for comprometida, Pendle também é afetada
Sequência de saída: 1) retirar PT-USDC do Pendle →
2) pagar USDC na Aave →
3) retirar stETH →
4) resgatar ETH no Lido

text

### Fluxo: Alerta de Risco Cascata
Health factor da posição Aave cai abaixo de 1.3
→ Sistema detecta que esta posição é ponto crítico
de uma cadeia Money Lego com 3 protocolos dependentes
→ Alerta enviado no Telegram:
"⚠️ RISCO CASCATA: Health factor Aave em 1.28
Posições em risco: stETH (Lido) + PT-USDC (Pendle)
Valor total em risco: $1.200
Ação sugerida: /sair airdrop-x"

text

### Fluxo: Descoberta de Novo Airdrop
YouTube / Reddit / DeFiLlama publica conteúdo
→ IA extrai projeto, chain, critérios, potencial
→ Score calculado
→ Score > 70: alerta no Telegram
→ Usuário aprova → adicionado à lista

text

### Fluxo: Rotina Diária
/hoje no Telegram OU acesso ao dashboard
→ Tarefas pendentes + atrasadas agrupadas por airdrop
→ Posições que precisam de atenção hoje
→ Alertas de health factor ou vencimento
→ Usuário age manualmente ou aciona automação

text

---

## Stack Tecnológica

### Backend
- Node.js + Fastify
- PostgreSQL com suporte a JSON para grafo de dependências
- Redis / Upstash (cache + BullMQ)
- Groq (IA em tempo real)
- Ollama local (análise em batch)
- OpenRouter (fallback)

### Frontend
- React + Vite
- TailwindCSS
- **React Flow** (visualização do grafo Money Lego)
- Recharts (gráficos de portfólio e P&L)

### APIs de Dados (somente leitura)
- **DeBank API** — posições DeFi, tokens derivativos, lending, LP
- **Moralis API** — histórico de transações, saldos, NFTs
- **DeFiLlama API** — TVL, novos protocolos
- **Etherscan / Arbiscan / Basescan** — verificação de transações
- **RPCs públicos** — Ethereum, Arbitrum, Optimism, Base, Polygon,
  Hyperliquid, Solana

### Integrações
- discord.js
- Telegram Bot API
- YouTube RSS / Reddit RSS
- X/Twitter RSS

### Deploy
- Frontend: Vercel
- Backend: Railway
- Cron: GitHub Actions
- Segredos: Doppler ou Railway Secrets

---

## Estrutura do Projeto

airdrop-tracker/
├── backend/
│ ├── src/
│ │ ├── services/
│ │ │ ├── ai/ # Groq, Ollama, OpenRouter
│ │ │ ├── blockchain/ # Moralis, DeBank, RPCs (read-only)
│ │ │ ├── portfolio/ # Posições DeFi, P&L
│ │ │ ├── money-lego/ # Grafo, risco cascata, saída segura
│ │ │ ├── discovery/ # YouTube, Reddit, DeFiLlama, X
│ │ │ ├── social/ # Discord, Telegram monitors
│ │ │ ├── notifications/ # Alertas Telegram
│ │ │ ├── trust/ # Score de confiabilidade
│ │ │ └── audit/ # Logs imutáveis
│ │ ├── routes/
│ │ ├── workers/ # BullMQ workers
│ │ ├── config/
│ │ └── utils/
├── frontend/
│ ├── src/
│ │ ├── pages/
│ │ │ ├── Dashboard.jsx
│ │ │ ├── Airdrops.jsx
│ │ │ ├── Portfolio.jsx # Posições + grafo Money Lego
│ │ │ ├── Tasks.jsx
│ │ │ ├── Discovery.jsx
│ │ │ ├── Alerts.jsx
│ │ │ └── Settings.jsx
│ │ ├── components/
│ │ │ ├── MoneyLegoGraph/ # Visualização React Flow
│ │ │ ├── PositionCard/
│ │ │ ├── RiskBadge/
│ │ │ └── ExitSequence/ # "Como sair" passo a passo
│ │ └── services/
├── bot/
│ ├── src/
│ │ ├── commands/
│ │ └── alerts/
├── scripts/
│ ├── batch-analyzer.js
│ ├── discovery-crawler.js
│ └── setup-db.js
├── docker-compose.yml
└── .env.example

text

---

## Roadmap

### MVP — Organização + Portfólio Básico
- Modelo: Airdrop, Tarefa, Endereço, Posição DeFi, Money Lego.
- Dashboard + abas Airdrops, Tarefas, Portfólio.
- Cadastro de endereço + consulta on-chain via DeBank.
- Registro manual de posições com vinculação Money Lego.
- Visualização básica do grafo de dependências.
- Bot: `/hoje`, `/portfolio`, `/dividas`, `/lego`, `/sair`.
- Alerta de health factor e risco cascata no Telegram.

### v1 — Automação de Portfólio + Descoberta
- Leitura automática de posições e cadeias via DeBank API.
- Detecção automática de Money Lego (tokens derivativos).
- Módulo de Descoberta: YouTube + Reddit + DeFiLlama.
- IA para parsing de anúncios (Groq).
- Score de confiabilidade.
- Conector Discord.
- Bot: `/check`, `/verify`, `/descobertos`, `/risco`.
- Dashboard: aba Descoberta + React Flow para grafo Money Lego.

### v2 — Automação + Multi-Identidade + Auditoria
- Multi-identidade com múltiplos endereços.
- Tarefas automatizáveis (workers read-only + social).
- Geração de payload para assinatura manual.
- Logs imutáveis e tela de auditoria.
- Exportação CSV/JSON.
- IA conversacional no Telegram (Groq).
- Rating histórico de airdrops.

### Produto/SaaS
- Autenticação email + 2FA.
- Planos: Free / Pro / Team.
- Landing page pública.
- Testes automatizados.
- SLA monitorado.
- API pública com autenticação por API key.

### Futuro
- IA conversacional avançada no Telegram.
- Automação social com browser profiles.
- Score de valor esperado por airdrop.
- Self-hosted com Docker Compose.
- Integração nativa Hyperliquid e Solana.
- Exportação para Koinly (relatório fiscal).

---

## Estimativa de Custos

| Fase | Custo/mês | Capacidade |
|---|---|---|
| MVP (tier gratuito) | $0 | 50 airdrops, 5 endereços |
| v1 (micro-budget) | $5–15 | 200 airdrops, 20 endereços |
| v2 (produção) | $20–40 | Ilimitado, SLA garantido |
| SaaS (multi-usuário) | $50–100 | Multi-tenant |

**ROI:** 1 airdrop de $100 = 2–6 meses de operação cobertos.

---

## Princípios de Segurança

1. **Sem wallet connect** — endereços são somente leitura.
2. **Sem chaves privadas** — jamais armazenadas ou transmitidas.
3. **Transparência total** — toda ação logada com origem e timestamp.
4. **Score público** — usuário vê o nível de verificação de cada dado.
5. **Modo somente leitura** — automação desligável globalmente.
6. **Dados verificáveis** — transações checadas on-chain.
7. **Risco cascata visível** — cadeias Money Lego com pontos críticos
   identificados e alertas proativos.

---

*Documento versão 3.1 — fevereiro de 2026.*
As principais diferenças desta versão 3.1 em relação à anterior:

Money Lego como conceito de primeira classe — com tipo de posição money_lego dedicado, campos específicos (token_origem, token_destino, protocolo_origem, posicao_anterior_id) e visualização em grafo com React Flow

Risco Cascata — o sistema identifica qual posição é o ponto crítico da cadeia e alerta proativamente antes que ocorra liquidação em efeito dominó

Distinção clara entre Looping e Money Lego — looping é reinvestir o mesmo ativo; Money Lego é receber um novo token derivativo e levá-lo para outro protocolo

Comando /lego e /risco no bot Telegram para visualizar a cadeia e os pontos de falha

Componente ExitSequence no frontend que calcula na ordem correta como desmontar uma cadeia Money Lego sem perder fundos

Grafo de dependências armazenado no banco para calcular saídas seguras automaticamente

Preparado usando Claude Sonnet 4.6 Thinking
