# 📋 Guia de Monitoramento de Airdrops - Agregador

## Objetivos

Definir um checklist e estrutura de monitoramento contínuo em X (Twitter) e Discord para protocolos com potencial de airdrop.

---

## 🎯 1. Itens para Monitorar em X (Twitter)

### Threads de Elegibilidade
**Palavras-chave:** "How to qualify", "How to be eligible", "Testnet incentives", "Points program", "Season 1/2/3"

**Informações extraídas:**
- Passo a passo de participação
- Datas de início/fim
- Data de snapshot
- Regras de pontuação

**Ação:** Criar alerta quando detectado

---

### Avisos de Manutenção e Mudanças
**Palavras-chave:** "maintenance", "RPC down", "reset", "rules updated"

**Informações extraídas:**
- Tipo de mudança (RPC, reset de pontos, novo peso)
- Duração prevista
- Impacto nas atividades

**Ação:** Alerta MEDIUM - afeta estratégia

---

### Anúncio de Integrações e Novas Chains
**Palavras-chave:** "integration", "new L2", "bridge support", "listed on"

**Informações extraídas:**
- Nova chain suportada
- Novo DEX listado
- Integração de bridge

**Ação:** Exploração de novas rotas de interação

---

### Posts Pedindo Uso de Features
**Palavras-chave:** "open positions", "provide LP", "use bridge", "vote", "stake"

**Informações extraídas:**
- Feature específica a testar
- Se está ligado a campanha
- Possível aumento de pontos

**Ação:** Registro em quests/campanhas

---

### Formulários de Feedback e Bug Bounty
**Palavras-chave:** "feedback form", "bug bounty", "Google Form", "Typeform"

**Informações extraídas:**
- Link do formulário
- Tipo de feedback (bugs, UX, ideias)
- Possível recompensa em pontos

**Ação:** Reportar bugs encontrados

---

## 💬 2. Itens para Monitorar em Discord

### Canais Principais
```
📢 #announcements       → Anúncios gerais
🧪 #testnet            → Informações de testnet
📝 #product-updates    → Atualizações
❓ #faq                → Perguntas frequentes
🗳️ #governance         → Votações
🎯 #campaigns          → Campanhas e quests
```

---

### Mensagens de Moderadores/Founders
**Sinais:**
- Detalhamento de critérios
- Mudanças de regras ("novo peso", "LP agora vale X")
- Resets de pontos
- Novas seasons

**Ação:** Atualizar regras no agregador

---

### Avisos de Snapshot
**Palavras-chave:** "snapshot", "season end", "phase end", "epoch close"

**Informações extraídas:**
- Data exata ou intervalo
- Bloco (se EVM)
- O que será congelado

**Ação:** Alerta CRITICAL - 3 dias antes

---

### Eventos Especiais e Quests
**Plataformas:** Galxe, Zealy, Layer3, Intract, QuestN

**Informações extraídas:**
- Nome da quest
- Deadline
- Requisitos (on-chain + off-chain)
- Recompensas

**Ação:** Link direto para completar

---

### Enquetes e Governance
**Sinais:**
- Votações de parâmetros
- Propostas simuladas
- Testes de governance

**Ação:** Participação = critério extra

---

### Avisos de Bugs e Rollbacks
**Palavras-chave:** "bug found", "rollback", "disable", "issue"

**Informações extraídas:**
- Qual feature/chain afetada
- Se há invalidação de transações
- Se há reset

**Ação:** Alerta MEDIUM - pode invalidar pontos

---

## 🔍 3. Padrões de Testnets com Maior Chance de Pagar

### Scoring do Protocolo

| Fator | Peso | Indicadores |
|-------|------|-------------|
| **Backing** | 25% | VCs conhecidas, L1/L2 grandes |
| **Categoria** | 20% | DEX, lending, bridge (histórico bom) |
| **Estrutura de Incentivos** | 20% | Dashboard, leaderboard, seasons |
| **Qualidade de Uso** | 20% | Uso natural vs spam |
| **Histórico** | 15% | Airdrops anteriores, comunidade |

### Score Final = Σ(Fator × Peso)

**Exemplo:**
```
Nado Exchange:
- Backing: 8.5/10 × 25% = 2.125
- Categoria: 9/10 × 20% = 1.8
- Incentivos: 8/10 × 20% = 1.6
- Qualidade: 7.5/10 × 20% = 1.5
- Histórico: 7/10 × 15% = 1.05
= 8.075/10 → ALTA PROBABILIDADE
```

---

## ⚠️ 4. Sistema de Alertas Automáticos

### Tipos de Alerta

#### 🔴 CRITICAL
- **Snapshot Detectado** (SNAPSHOT_COMING)
  - Antecedência: 3 dias, 24h, 1h antes
  
- **Mainnet/TGE** (MAINNET_TGE)
  - Transição de testnet → fase de claim
  
- **Bug Crítico** (BUG_CRITICAL)
  - Pode invalidar tudo feito

#### 🟠 HIGH
- **Regras Alteradas** (RULE_CHANGED)
  - Mudança de critérios
  
- **Nova Campanha** (QUEST_CAMPAIGN)
  - Oportunidade de pontos extras

#### 🟡 MEDIUM
- **Manutenção** (MAINTENANCE)
  - RPC down, reset temporário
  
- **Bug Menor** (BUG_ISSUE)
  - Feature específica desativada

---

## 📊 5. Checklist de Monitoramento

### Por Protocolo

```
PROTOCOLO: [Nome]
CATEGORIA: [DEX/Lending/L2/etc]

▢ Twitter Monitoring
  ▢ Threads de elegibilidade encontradas
  ▢ Avisos de manutenção
  ▢ Novas integrações
  ▢ Feature updates
  ▢ Campanhas ativas

▢ Discord Monitoring
  ▢ Canais oficiais monitorados
  ▢ Regras atualizadas
  ▢ Snapshot anunciado
  ▢ Quests/Campanhas
  ▢ Bugs reportados
  ▢ Governance votações

▢ Dados Consolidados
  ▢ Dashboard de pontos
  ▢ Seasons ativas
  ▢ Critérios conhecidos
  ▢ Links úteis
  ▢ Score de confiabilidade

▢ Status Atual
  Último update: [data]
  Alertas pendentes: [N]
  Score: [X/10]
```

---

## 🗄️ 6. Estrutura de Dados do Agregador

### Tabelas Necessárias

```sql
-- Protocolos monitorados
CREATE TABLE airdrop_protocols (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR,  -- DEX, perpDEX, lending, bridge, L2, infra
  supported_chains JSONB,
  site_url VARCHAR,
  docs_url VARCHAR,
  twitter_handle VARCHAR,
  discord_url VARCHAR,
  github_url VARCHAR,
  blog_url VARCHAR,
  backing_score DECIMAL,
  points_dashboard_url VARCHAR,
  created_at TIMESTAMP
);

-- Eventos monitora dos
CREATE TABLE airdrop_events (
  id SERIAL PRIMARY KEY,
  protocol_id INTEGER REFERENCES airdrop_protocols,
  origin VARCHAR,  -- 'twitter' ou 'discord'
  event_type VARCHAR,  -- snapshot, rule-change, quest, maintenance, bug, mainnet, etc
  content TEXT,
  source_identifier VARCHAR,  -- tweet_id, message_id, etc
  associated_links JSONB,
  metadata JSONB,
  created_at TIMESTAMP
);

-- Alertas gerados
CREATE TABLE airdrop_alerts (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES airdrop_events,
  alert_type VARCHAR,  -- SNAPSHOT_COMING, RULE_CHANGED, MAINNET_TGE, BUG_ISSUE, etc
  priority VARCHAR,  -- CRITICAL, HIGH, MEDIUM, LOW
  message TEXT,
  associated_dates JSONB,
  associated_links JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## 🤖 7. Detecção Automática de Eventos

### Algoritmo

1. **Capturar:** Monitorar Twitter/Discord em tempo real
2. **Extrair:** Usar NLP para identificar palavras-chave
3. **Classificar:** Determinar tipo de evento
4. **Extrair Datas:** Usar regex para encontrar dates
5. **Gerar Alerta:** Se tipo está em lista prioritária
6. **Notificar:** Enviar via Telegram/Discord/Email

### Palavras-chave (EN)

```javascript
{
  snapshot: ['snapshot', 'season end', 'epoch', 'phase end'],
  ruleChange: ['updated rules', 'new weighting', 'reset', 'season rules'],
  quest: ['quest', 'campaign', 'galxe', 'zealy', 'mission'],
  mainnet: ['TGE', 'token generation', 'mainnet launch', 'claim'],
  bug: ['bug', 'exploit', 'rollback', 'paused', 'issue'],
  integration: ['integration', 'new chain', 'new L2', 'bridge'],
  governance: ['governance', 'proposal', 'vote', 'poll']
}
```

### Palavras-chave (PT)

```javascript
{
  snapshot: ['snapshot', 'fim de season', 'época', 'fim da fase'],
  ruleChange: ['regras atualizadas', 'mudanças de pontos', 'novo peso'],
  quest: ['missão', 'campanha', 'desafio', 'tarefa'],
  mainnet: ['evento TGE', 'lançamento mainnet', 'distribuição airdrop'],
  bug: ['bug', 'problema', 'rollback', 'pausado'],
  integration: ['integração', 'nova chain', 'novo L2'],
  governance: ['governança', 'proposta', 'votação']
}
```

---

## 📱 8. API do Agregador

### Endpoints Implementados

```
POST   /api/monitoring/protocol
       → Criar novo protocolo para monitorar

POST   /api/monitoring/event
       → Registrar evento detectado

GET    /api/monitoring/protocol/:id/status
       → Status completo do protocolo

GET    /api/monitoring/protocol/:id/summary
       → Resumo para card

GET    /api/monitoring/protocols/pending-alerts
       → Protocolos com alertas pendentes

PATCH  /api/monitoring/alert/:id/acknowledge
       → Marcar alerta como lido

POST   /api/monitoring/detect-event-type
       → Testar detecção (debug)
```

---

## 🎨 9. Dashboard Frontend

### Componentes

- **AirdropMonitoringDashboard**
  - Filtros: Todos, Com Alertas, Ativos
  - Cards por protocolo
  - Expandível para detalhes

- **ProtocolCard**
  - Resumo de eventos
  - Checklist visual
  - Alertas com botão OK
  - Links úteis

---

## 🔄 10. Fluxo Diário de Monitoramento

### Manhã (8h)
- [ ] Verificar alertas pendentes
- [ ] Revisar snapshots anunciados
- [ ] Atualizar status de protocolos

### Meio do dia (13h)
- [ ] Verificar novas campanhas
- [ ] Atualizar regras mudadas
- [ ] Testar novas integrações

### Noite (20h)
- [ ] Compilar relatório diário
- [ ] Priorizar ações para amanhã
- [ ] Revisar bugs reportados

### Automático
- Alertas em tempo real (Telegram/Discord/Email)
- Recarregar dados a cada 5 minutos
- Backup diário de eventos

---

## 💡 11. Exemplo Prático: Nado Exchange

```
PROTOCOLO: Nado Exchange
TIPO: perpDEX
SCORE: 8.1/10

EVENTOS RECENTES:
1. ⚠️ SNAPSHOT - 2026-02-25 (3 dias)
2. 🎯 NOVA QUEST - Fornecer LP
3. 📋 REGRAS ATUALIZADAS - Volume agora 2x

CHECKLIST:
✓ Threads de elegibilidade
✓ Dashboard de pontos
✓ Twitter ativo
✓ Discord ativo
✗ Governance votações
✓ Bug reports

ALERTAS PENDENTES: 2
1. CRITICAL - Snapshot em 3 dias
2. HIGH - Nova campanha LP

AÇÕES RECOMENDADAS:
1. Começar a fornecer LP (nova quest)
2. Aumentar volume de trades (novo peso)
3. Preparar saída para snapshot
```

---

## 🚀 Deploy & Setup

### Instalação

```bash
# Backend já implementado
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Acessar
http://localhost:5173/monitoring
```

### Configuração

1. Adicionar protocolos manualmente ou via API
2. Configurar contas Twitter/Discord
3. Ativar monitoramento
4. Configurar alertas

---

**Versão:** 1.0  
**Status:** ✅ Implementado  
**Data:** Feb 17, 2026
