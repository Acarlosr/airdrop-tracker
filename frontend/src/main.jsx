import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function showError(root, title, err) {
  const msg = err?.message || String(err)
  const stack = err?.stack || ''
  root.innerHTML = '<div style="min-height:100vh;background:#0f1419;color:#fff;padding:24px;font-family:system-ui">' +
    '<h1 style="color:#00d4ff">' + (title || 'Erro') + '</h1>' +
    '<pre style="color:#f87171;overflow:auto;font-size:14px">' + (msg + '\n\n' + stack).replace(/</g, '&lt;') + '</pre>' +
    '</div>'
}

window.onerror = (msg, _url, _line, _col, error) => {
  const root = document.getElementById('root')
  if (root) showError(root, 'Erro na página', error || new Error(String(msg)))
}
window.addEventListener('unhandledrejection', (e) => {
  const root = document.getElementById('root')
  if (root) showError(root, 'Erro (promise)', e.reason)
})

// eslint-disable-next-line react-refresh/only-export-components
function Bootstrap() {
  const [Ready, setReady] = React.useState(null)
  const [err, setErr] = React.useState(null)

  React.useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      if (cancelled) return
      setErr(new Error('Demorou demais. Abra o Console (F12) para ver erros.'))
    }, 12000)
    Promise.all([
      import('react-router-dom'),
      import('./context/AuthContext'),
      import('./App.jsx'),
    ])
      .then(([router, auth, app]) => {
        if (cancelled) return
        clearTimeout(t)
        const Router = router.BrowserRouter
        const AuthProvider = auth.AuthProvider
        const App = app.default
        const Wrapper = () => (
          <Router>
            <AuthProvider>
              <App />
            </AuthProvider>
          </Router>
        )
        setReady(() => Wrapper)
      })
      .catch((e) => {
        if (!cancelled) {
          clearTimeout(t)
          setErr(e)
        }
      })
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  if (err) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1419', color: '#fff', padding: 24, fontFamily: 'system-ui' }}>
        <h1 style={{ color: '#00d4ff' }}>Erro ao carregar</h1>
        <pre style={{ color: '#f87171', overflow: 'auto' }}>{err?.message}</pre>
      </div>
    )
  }
  if (Ready) return <Ready />
  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid #00d4ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p>Carregando…</p>
      </div>
    </div>
  )
}

const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<div style="padding:20px;color:red">#root não encontrado</div>'
} else {
  const style = document.createElement('style')
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(style)

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Bootstrap />
    </React.StrictMode>,
  )
}
