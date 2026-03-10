import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [step, setStep] = useState('google'); // 'google' | 'otp'
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      setError('Falha ao obter credencial do Google.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google', { credential });
      const data = res.data;
      if (data.requireOtp) {
        setPendingUser({
          identifier: data.identifier,
          email: data.email,
          name: data.name,
          picture: data.picture,
          otpCode: data.otpCode ?? data.otpDev,
        });
        setStep('otp');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao conectar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Login com Google falhou.');
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!pendingUser || !otp.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/otp/verify', {
        identifier: pendingUser.identifier,
        code: otp.trim(),
        name: pendingUser.name,
        picture: pendingUser.picture,
      });
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const backToGoogle = () => {
    setStep('google');
    setPendingUser(null);
    setOtp('');
    setError('');
    setResendMessage('');
    setResendCooldown(0);
  };

  const handleResendOtp = async () => {
    if (!pendingUser || resendCooldown > 0) return;
    setLoading(true);
    setError('');
    setResendMessage('');
    try {
      const res = await api.post('/auth/otp/resend', { identifier: pendingUser.identifier });
      const code = res.data?.otpCode ?? res.data?.otpDev;
      setPendingUser((prev) => (prev && code ? { ...prev, otpCode: code } : prev));
      setResendMessage('Novo código enviado!');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível reenviar. Tente voltar e iniciar de novo.');
    } finally {
      setLoading(false);
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleDevRequestOtp = async (e) => {
    e.preventDefault();
    const email = e.target?.email?.value || 'dev@localhost';
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/dev/request-otp', { email, name: 'Dev User' });
      const d = res.data;
      setPendingUser({
        identifier: d.identifier,
        email: d.email,
        name: d.name,
        picture: d.picture,
        otpCode: d.otpCode ?? d.otpDev,
      });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao solicitar OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-[#161e2e] shadow-glow p-8 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-[rgba(0,212,255,0.08)] before:pointer-events-none">
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 rounded-xl bg-electric/10 border border-electric/20 mb-4">
              <Zap className="w-10 h-10 text-electric" />
            </div>
            <h1 className="text-2xl font-bold text-white">Airdrop Tracker</h1>
            <p className="text-white/50 text-sm mt-1">DApp • Conecte com Google + OTP</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 'google' && (
            <>
              <p className="text-white/70 text-sm text-center mb-6">
                Entre com sua conta Google. Em seguida, insira o código OTP enviado.
              </p>
              {clientId ? (
                <div className="flex justify-center">
                  <GoogleButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} clientId={clientId} />
                </div>
              ) : (
                <form onSubmit={handleDevRequestOtp} className="space-y-3">
                  <p className="text-amber-400/90 text-sm text-center">
                    Configure VITE_GOOGLE_CLIENT_ID no .env para login com Google. Modo dev:
                  </p>
                  <input
                    type="email"
                    name="email"
                    placeholder="email@dev.local"
                    defaultValue="dev@localhost"
                    className="w-full px-4 py-3 rounded-xl bg-[#0f1419] border border-white/10 text-white focus:border-electric focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-electric/20 text-electric border border-electric/30 hover:bg-electric/30"
                  >
                    {loading ? 'Enviando...' : 'Solicitar OTP (dev)'}
                  </button>
                </form>
              )}
              {loading && (
                <p className="text-center text-white/50 text-sm mt-4">Verificando...</p>
              )}
            </>
          )}

          {step === 'otp' && pendingUser && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <p className="text-white/70 text-sm text-center">
                Para <span className="text-electric">{pendingUser.email}</span>
              </p>
              <p className="text-amber-400/90 text-sm text-center">
                O código <strong>não é enviado por e-mail</strong>. Use o código que aparece abaixo:
              </p>
              {pendingUser.otpCode ? (
                <div className="rounded-xl bg-electric/10 border-2 border-electric/40 p-4 text-center">
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Seu código de 6 dígitos</p>
                  <p className="text-3xl font-mono font-bold text-electric tracking-[0.4em]">{pendingUser.otpCode}</p>
                </div>
              ) : (
                <p className="text-amber-400/90 text-sm text-center">
                  Carregando código… Se não aparecer, solicite um novo código abaixo.
                </p>
              )}
              {resendMessage && (
                <p className="text-center text-electric text-sm">{resendMessage}</p>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl bg-[#0f1419] border border-white/10 text-white text-center text-xl tracking-[0.5em] focus:border-electric focus:outline-none"
              />
              <p className="text-center text-sm text-white/50">
                Não recebeu?{' '}
                {resendCooldown > 0 ? (
                  <span>Solicitar novo código em {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-electric hover:underline focus:outline-none disabled:opacity-50"
                  >
                    Solicitar novo código
                  </button>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={backToGoogle}
                  className="flex-1 py-3 rounded-xl bg-[#1e293b] text-white/90 border border-white/10 hover:border-white/20"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="flex-1 py-3 rounded-xl bg-electric text-[#0f1419] font-semibold hover:shadow-glow disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente que usa o script do Google Identity Services para botão e callback com credential
function GoogleButton({ onSuccess, onError, clientId }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || window.google) {
      setScriptLoaded(!!window.google);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
    return () => {};
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google || !clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res) => {
        if (res?.credential) onSuccess({ credential: res.credential });
        else onError();
      },
    });
  }, [scriptLoaded, clientId, onSuccess, onError]);

  useEffect(() => {
    if (!scriptLoaded || !window.google || !clientId) return;
    const el = document.getElementById('google-login-btn');
    if (!el) return;
    window.google.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      width: 280,
    });
  }, [scriptLoaded, clientId]);

  return <div id="google-login-btn" className="flex justify-center" />;
}
