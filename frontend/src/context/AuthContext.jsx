import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'airdrop_token';
const USER_KEY = 'airdrop_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  // Não bloquear a tela: sempre mostrar conteúdo (login ou app) e validar token em background
  const [loading, setLoading] = useState(false);

  const persistAuth = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) localStorage.setItem(TOKEN_KEY, newToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (newUser) localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    else localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!cancelled) {
          setUser(res.data?.user || JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
        }
      })
      .catch((err) => {
        // Só desloga se o token for realmente inválido/expirado.
        // Erro de rede / backend reiniciando não deve derrubar a sessão no preview.
        const status = err?.response?.status;
        if (!cancelled && (status === 401 || status === 403)) {
          persistAuth(null, null);
        }
      })
      .finally(() => {
        // Sem isto a tela fica presa em "Validando sessão…": o cleanup do effect
        // só roda quando o token muda ou o componente desmonta.
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; setLoading(false); };
  }, [token, persistAuth]);

  useEffect(() => {
    const handleUnauthorized = () => persistAuth(null, null);
    window.addEventListener('claimos:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('claimos:unauthorized', handleUnauthorized);
  }, [persistAuth]);

  const login = useCallback((newToken, newUser) => {
    persistAuth(newToken, newUser);
  }, [persistAuth]);

  const logout = useCallback(() => {
    persistAuth(null, null);
  }, [persistAuth]);

  // Para não "voltar" para o OTP por falta de user em memória, autenticação depende do token.
  const value = { user, token, loading, login, logout, isAuthenticated: !!token };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
