# Parecer — spec de "agregador de airdrops" colado em 04/08/2026

Avaliação do texto trazido de fora, comparado com o que já existe em `/Volumes/Curso/airdrop-tracker` (ClaimOS).
Este documento é um parecer, não uma decisão. Adoção de qualquer item exige aprovação humana.

---

## 1. Veredito curto

O spec é um bom **checklist de mercado** e um péssimo **plano de execução para este repositório**.

Bom: a lista de features, a taxonomia de status (rumor / points / snapshot / claimable / claimed),
o eligibility checker por colar endereço, o freemium e o ângulo LatAm.

Ruim: ele foi escrito como se o projeto estivesse em zero. Propõe Next.js 15 + NestJS quando o repo
já roda **React 18 + Vite + Tailwind** no frontend e **Fastify + TypeScript + Supabase** no backend.
Trocar isso é reescrita — proibida de ser autoautorizada pelas regras do projeto
(`EXECUTION_RULES.md`, "nunca autoautorizar rewrite") e sem ganho medido que justifique.

---

## 2. O que o spec acerta e o ClaimOS já tem

| Item do spec | Estado no repo |
|---|---|
| Sem wallet connect, só colar endereço | Já é princípio fundamental no `CLAIMOS_PRD.md` |
| Eligibility checker multi-chain | `backend/src/routes/eligibility.js` |
| Tracker pessoal com tarefas | Parcial — `001_interactions.sql` escrita, **nunca aplicada** |
| Alertas Telegram | `services/simple-bot.js`, `routes/bot.js` |
| Portfólio | `pages/Portfolio.jsx`, `routes/defi-portfolio.js` |
| Score de risco / confiabilidade | Previsto no PRD, ainda não automático |
| PT-BR / LatAm | Regra ativa do projeto (`.cursor/rules/idioma-pt-BR.mdc`) |

---

## 3. O que o spec erra

**3.1 O diferencial proposto não é diferencial.**
"Multi-wallet + points + LatAm" já está coberto de graça pelo mercado: Alpha Drops varre 200+ projetos,
SonarWatch e Earni.fi fazem paste-address sem conectar carteira, Drops.bot rastreia points programs.
Interface em português é barreira de entrada de uma tarde de trabalho, não fosso competitivo.

**3.2 Ignora o diferencial real que já está no repo.**
O `CLAIMOS_PRD.md` tem duas coisas que nenhum concorrente da lista faz:

- **Money Lego** — grafo de dependências entre posições derivadas (ETH → stETH → Aave → Pendle),
  já implementado em `components/MoneyLegoGraph.jsx` e `services/money-lego.js`.
- **Risco cascata + sequência de saída segura** (`components/ExitSequence.jsx`).

Isso responde a uma pergunta que os agregadores não respondem: *"se eu preciso sair, em que ordem
desfaço sem me liquidar?"*. É aí que está o valor pago, não em mais uma lista de airdrops.

**3.3 Superdimensiona a infra.**
Elasticsearch/Meilisearch, GraphQL, BullMQ, três provedores de RPC e Playwright antes de existir usuário
é custo fixo sem receita. Postgres com índice GIN resolve busca até dezenas de milhares de linhas.

**3.4 Erra o preço.**
US$ 9–29/mês num mercado onde o concorrente direto é gratuito. Ou o produto entrega algo que o grátis
não entrega (Money Lego, risco cascata), ou o freemium não converte.

**3.5 "Integração com DEX para claim + swap automático" é risco jurídico e de segurança.**
Exigiria assinatura de transação, o que quebra o princípio somente-leitura do PRD. Descartar.

---

## 4. O que adotar do spec (baixo custo, alto retorno)

1. **Taxonomia de status explícita**: `rumor → points → snapshot → claimable → claimed → missed`.
   Encaixa no campo de status que já existe em `airdrops`.
2. **Campo de custo estimado** (gás + capital) por airdrop — nenhum concorrente mostra bem.
3. **`lastChecked` visível** em cada listagem. Confiança é o produto.
4. **Calendário de snapshots** — casa com a tela "hoje" já combinada como próximo passo.

## 5. O que descartar

- Migração para Next.js 15 / NestJS.
- Elasticsearch, GraphQL, RainbowKit/Privy, API pública, white-label.
- Claim + swap automático.

---

## 6. Próximo passo recomendado (inalterado)

O que já estava combinado continua sendo a coisa certa a fazer, e é pré-requisito de tudo acima:

1. Aplicar `backend/migrations/001_interactions.sql`.
2. Rotas `/api/interactions`.
3. Botão de check-in em `AirdropDetail.jsx`.
4. Painel "hoje" ordenado por risco de perder streak.

Gates G1–G4 do `verification-standard.md` valem para qualquer uma dessas mudanças.

---

## 7. Fontes consultadas

- https://coincheckup.com/blog/best-airdrop-sites
- https://coincodex.com/article/3096/top-5-websites-for-airdrops/
- https://www.drops.bot/free-points-checker
- https://alphadrops.net/points-programs
- https://rankfi.com/crypto-airdrops/
