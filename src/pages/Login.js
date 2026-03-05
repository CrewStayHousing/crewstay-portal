import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.roofIcon}>🏠</div>
          <div>
            <div style={styles.logoText}>CREWSTAY</div>
            <div style={styles.logoSub}>HOUSING</div>
          </div>
        </div>

        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.sub}>Sign in to your project manager portal</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Work Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={styles.footer}>
          Need access? Contact <a href="mailto:ops@crewstayhousing.com" style={styles.link}>ops@crewstayhousing.com</a>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', background: '#0F1E38',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Source Sans 3', sans-serif", padding: 20,
    backgroundImage: 'linear-gradient(rgba(232,136,58,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,136,58,0.03) 1px, transparent 1px)',
    backgroundSize: '60px 60px'
  },
  card: {
    background: 'white', borderRadius: 20, padding: '48px 40px',
    width: '100%', maxWidth: 420,
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 },
  roofIcon: { fontSize: 32 },
  logoText: { fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, color: '#1B2A4A', lineHeight: 1 },
  logoSub: { fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#E8883A' },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: '#1B2A4A', marginBottom: 6 },
  sub: { fontSize: 15, color: '#6B7A99', marginBottom: 28 },
  error: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7A99', marginBottom: 6 },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: 8,
    border: '2px solid #E8ECF2', fontSize: 15, fontFamily: "'Source Sans 3', sans-serif",
    color: '#1B2A4A', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  btn: {
    width: '100%', padding: '14px', borderRadius: 8,
    background: '#E8883A', color: 'white', border: 'none',
    fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700,
    textTransform: 'uppercase', cursor: 'pointer', marginTop: 8,
    letterSpacing: 0.5
  },
  footer: { textAlign: 'center', fontSize: 13, color: '#6B7A99', marginTop: 24, marginBottom: 0 },
  link: { color: '#E8883A', textDecoration: 'none' }
}
