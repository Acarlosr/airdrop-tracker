import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { env } from '../lib/env.js'
import { ClaimOSLogo } from '../components/ClaimOSLogo'

export default function Login() {
  const { login } = useAuth()
  const [pendingUser, setPendingUser] = useState(null)
  const [email, setEmail] = useState('dev@localhost')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const finishLogin = (data) => {
    if (!data?.token) throw new Error('O backend não retornou uma sessão válida.')
    login(data.token, data.user)
  }

  const handleGoogleSuccess = async ({ credential }) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/google', { credential })
      finishLogin(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Não foi possível entrar com Google.')
    } finally {
      setLoading(false)
    }
  }

  const requestDevOtp = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/dev/request-otp', { email, name: 'Operador local' })
      setPendingUser(response.data)
      setOtp(response.data?.otpCode || '')
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível iniciar a sessão local.')
    } finally {
      setLoading(false)
    }
  }

  const verifyDevOtp = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/otp/verify', {
        identifier: pendingUser.identifier,
        code: otp,
      })
      finishLogin(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <section className="w-full max-w-md rounded-2xl border p-7 shadow-2xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex justify-center mb-5" style={{ color: 'var(--primary)' }}>
          <ClaimOSLogo size={58} />
        </div>
        <h1 className="text-2xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>{env.APP_NAME}</h1>
        <p className="text-sm text-center mt-2 mb-6" style={{ color: 'var(--text-secondary)' }}>
          Painel privado e somente leitura para acompanhar carteiras e oportunidades.
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(248,113,113,.35)', background: 'rgba(248,113,113,.08)' }}>
            {error}
          </div>
        )}

        {env.GOOGLE_CLIENT_ID ? (
          <GoogleButton clientId={env.GOOGLE_CLIENT_ID} onSuccess={handleGoogleSuccess} onError={() => setError('Login com Google cancelado ou indisponível.')} />
        ) : !import.meta.env.DEV ? (
          <div className="rounded-xl border px-4 py-4 text-sm" style={{ color: 'var(--warning)', borderColor: 'rgba(251,191,36,.3)', background: 'rgba(251,191,36,.06)' }}>
            Login indisponível. Configure <code>VITE_GOOGLE_CLIENT_ID</code> no ambiente de produção.
          </div>
        ) : pendingUser ? (
          <form onSubmit={verifyDevOtp} className="space-y-4">
            <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Código local</p>
              <p className="mt-1 text-2xl font-mono font-bold tracking-[0.3em]" style={{ color: 'var(--primary)' }}>{pendingUser.otpCode}</p>
            </div>
            <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
              Código de 6 dígitos
              <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input-field mt-2 text-center text-lg tracking-[0.3em]" inputMode="numeric" autoFocus />
            </label>
            <button className="btn btn-primary w-full" disabled={loading || otp.length !== 6}>{loading ? 'Validando…' : 'Entrar no painel'}</button>
          </form>
        ) : (
          <form onSubmit={requestDevOtp} className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--success)' }} />
              Modo local de desenvolvimento. Nenhuma wallet será conectada.
            </div>
            <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
              E-mail local
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field mt-2" required />
            </label>
            <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Gerando código…' : 'Gerar acesso local'}</button>
          </form>
        )}

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          O ClaimOS armazena apenas endereços públicos. Nunca informe seed phrase ou chave privada.
        </p>
      </section>
    </main>
  )
}

function GoogleButton({ clientId, onSuccess, onError }) {
  const [ready, setReady] = useState(Boolean(window.google))

  useEffect(() => {
    if (window.google) return
    const existing = document.querySelector('script[data-claimos-google]')
    if (existing) {
      existing.addEventListener('load', () => setReady(true), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.dataset.claimosGoogle = 'true'
    script.addEventListener('load', () => setReady(true), { once: true })
    script.addEventListener('error', onError, { once: true })
    document.head.appendChild(script)
  }, [onError])

  useEffect(() => {
    if (!ready || !window.google) return
    window.google.accounts.id.initialize({ client_id: clientId, callback: onSuccess })
    const container = document.getElementById('claimos-google-login')
    if (container) {
      container.replaceChildren()
      window.google.accounts.id.renderButton(container, { theme: 'filled_black', size: 'large', text: 'continue_with', width: 330 })
    }
  }, [clientId, onSuccess, ready])

  return <div id="claimos-google-login" className="min-h-11 flex items-center justify-center">{!ready && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Carregando login seguro…</span>}</div>
}
