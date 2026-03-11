# ClaimOS — Frontend

Interface web do **ClaimOS** (React + Vite): painel, airdrops, portfólio, configurações e login.

Este diretório é **independente** do backend. Pode ser implantado sozinho (ex.: Vercel) apontando a API para a URL do backend em produção.

## Desenvolvimento local

```bash
cd frontend
npm install
cp .env.example .env
# Opcional: defina VITE_GOOGLE_CLIENT_ID e VITE_API_URL no .env
npm run dev
```

Acesse `http://localhost:5173`. O proxy do Vite encaminha `/api` para `http://localhost:3000` (backend local).

## Build

```bash
npm run build
```

Saída em `dist/`.

## Deploy (ex.: Vercel)

1. No Vercel, crie um projeto conectado a este repositório.
2. **Root Directory:** `frontend` (obrigatório).
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Variáveis de ambiente** (em Settings → Environment Variables):
   - `VITE_GOOGLE_CLIENT_ID` — Client ID do Google OAuth (obrigatório para login com Google).
   - `VITE_API_URL` — URL base da API em produção (ex.: `https://seu-backend.railway.app`). Se não definir, o frontend usa caminhos relativos `/api` (funciona só com proxy/rewrite).

Após o deploy, o frontend fica em uma URL própria (ex.: `https://claimos.vercel.app`) e as chamadas à API devem ir para o backend implantado separadamente (Railway, Render, etc.).

## Estrutura relevante

- `src/` — componentes, páginas, contextos (Auth, Networks), estilos.
- `index.html` — entrada da SPA.
- `vite.config.js` — proxy `/api` em dev; build com saída em `dist`.
