# 📤 Instruções para Push no GitHub

O projeto está pronto e commitado localmente! Agora você precisa fazer o push para o GitHub.

## Opção 1: Repositório Novo

Se o repositório no GitHub está vazio ou não existe ainda:

```bash
cd /home/claude/airdrop-tracker

# Adicionar remote
git remote add origin https://github.com/Acarlosr/airdrop-tracker.git

# Renomear branch para main (opcional, recomendado)
git branch -M main

# Push inicial
git push -u origin main
```

## Opção 2: Repositório Existente

Se já existe conteúdo no repositório:

```bash
cd /home/claude/airdrop-tracker

# Adicionar remote
git remote add origin https://github.com/Acarlosr/airdrop-tracker.git

# Fazer pull primeiro (se houver conflitos)
git pull origin main --allow-unrelated-histories

# Push
git push -u origin main
```

## Opção 3: Force Push (Use com cuidado!)

Se quiser substituir completamente o que está no GitHub:

```bash
cd /home/claude/airdrop-tracker
git remote add origin https://github.com/Acarlosr/airdrop-tracker.git
git branch -M main
git push -u origin main --force
```

## Verificar Status

```bash
# Ver status do git
git status

# Ver histórico
git log --oneline

# Ver remotes configurados
git remote -v
```

## Próximos Passos Após o Push

1. ✅ Configure GitHub Actions para CI/CD (opcional)
2. ✅ Configure secrets no GitHub:
   - MORALIS_API_KEY
   - OPENROUTER_API_KEY (se usar)
   - DATABASE_URL
   - REDIS_URL (se usar)
3. ✅ Deploy:
   - Frontend: Vercel (conecte o repo)
   - Backend: Railway ou Render (conecte o repo)
4. ✅ Configure variáveis de ambiente nos serviços de deploy

## Estrutura do Commit

```
Initial commit: Airdrop Tracker low-cost setup

37 arquivos criados:
- Backend completo (Node.js + Fastify)
- Frontend completo (React + Vite)
- Serviços de AI (Ollama + OpenRouter + Groq)
- Serviços de Blockchain (Moralis + RPCs públicos)
- Docker Compose para desenvolvimento
- Scripts utilitários
- Documentação completa
```

## Troubleshooting

### Erro de autenticação
```bash
# Use SSH ao invés de HTTPS
git remote set-url origin git@github.com:Acarlosr/airdrop-tracker.git

# Ou configure token
git config credential.helper store
```

### Branch diferente
```bash
# Listar branches
git branch -a

# Mudar para main
git checkout -b main
```

## Comandos Úteis

```bash
# Ver arquivos no último commit
git show --name-only

# Ver diferenças
git diff HEAD~1

# Adicionar mais arquivos
git add .
git commit -m "Add: nova feature"
git push
```

---

🎉 **Projeto completo e pronto para deploy!**

O código está 100% funcional e seguindo as melhores práticas de low-cost architecture.
