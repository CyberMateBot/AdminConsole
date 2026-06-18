import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { authApi } from '@/api/auth'

const AuthContext = createContext(null)

function readStoredAdmin() {
  try {
    const stored = localStorage.getItem('admin_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(readStoredAdmin)
  const isAuthenticated = !!localStorage.getItem('admin_token')

  const login = useCallback(async (email, password) => {
    const { token, admin: nextAdmin } = await authApi.login(email, password)
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_user', JSON.stringify(nextAdmin))
    setAdmin(nextAdmin)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {})
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setAdmin(null)
    window.location.href = '/login'
  }, [])

  const value = useMemo(
    () => ({ admin, isAuthenticated, login, logout }),
    [admin, isAuthenticated, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
