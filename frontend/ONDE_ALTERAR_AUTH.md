# Onde alterar — Login, Auth e Env (mapeamento)

Este projeto usa **JavaScript (JSX)**, não TypeScript. Abaixo está o mapeamento entre os pontos que você citou e os **arquivos reais** no frontend.

---

## Mapeamento: referência → arquivo no projeto

| Você pediu (exemplo em TS) | No projeto ClaimOS (onde alterar) |
|----------------------------|-------------------------------------|
| `src/pages/Login.tsx` ou `src/routes/Login.tsx` | **`src/pages/Login.jsx`** |
| `src/components/auth/GoogleLoginButton.tsx` | **Não existe.** O botão Google e o fluxo OTP estão **dentro de `src/pages/Login.jsx`**. Para separar: crie `src/components/auth/GoogleLoginButton.jsx` e use em `Login.jsx`. |
| `src/services/auth.ts` | **Não existe.** Chamadas de auth estão em: **`src/context/AuthContext.jsx`** (login/logout/persistência) e **`src/services/api.js`** (axios + interceptor com token). Para centralizar: crie `src/services/auth.js` e mova chamadas `/auth/*` para lá. |
| `src/contexts/AuthContext.tsx` ou `src/stores/authStore.ts` | **`src/context/AuthContext.jsx`** (pasta é `context`, não `contexts`) |
| `src/lib/env.ts` | **Não existe.** Uso de env hoje: **`src/pages/Login.jsx`** (`import.meta.env.VITE_GOOGLE_CLIENT_ID`) e **`src/pages/Settings.jsx`** (texto de ajuda). Para centralizar: crie `src/lib/env.js` e exporte variáveis (ex.: `VITE_GOOGLE_CLIENT_ID`, `VITE_API_URL`). |

---

## Resumo rápido — arquivos que existem

| O que alterar | Arquivo |
|---------------|---------|
| Tela de login, abas (Google OTP / Criar conta), fluxo OTP, UI do botão Google | **`src/pages/Login.jsx`** |
| Estado global de autenticação (user, token, login, logout), persistência, validação do token | **`src/context/AuthContext.jsx`** |
| Base URL da API, interceptors, chamadas HTTP (incl. `/auth/google`, `/auth/otp/verify`) | **`src/services/api.js`** |
| Variáveis de ambiente (onde são usadas hoje) | **`src/pages/Login.jsx`** (e texto em **`src/pages/Settings.jsx`**) |

---

## Opcionais (para ficar igual ao desenho TS)

- **Botão Google em componente próprio:** criar **`src/components/auth/GoogleLoginButton.jsx`** e importar em `Login.jsx`.
- **Serviço de auth dedicado:** criar **`src/services/auth.js`** com funções `loginWithGoogle(credential)`, `verifyOtp(identifier, code)`, etc., e usar em `AuthContext.jsx` e `Login.jsx`.
- **Centralizar env:** criar **`src/lib/env.js`** exportando `env.VITE_GOOGLE_CLIENT_ID`, `env.VITE_API_URL`, e usar esse módulo em `Login.jsx`, `api.js` e onde precisar.

Assim você sabe exatamente **onde alterar** cada ponto no frontend.
