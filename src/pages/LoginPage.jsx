import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import BrandMark from '@/components/BrandMark'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <BrandMark className="login-brand-mark" />
          <span>CyberMate Admin</span>
        </div>
        <p className="login-title">Вход в панель управления</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-group" style={{ marginBottom: 0 }}>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="admin-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field-group" style={{ marginBottom: 0 }}>
            <label className="field-label" htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              className="admin-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
