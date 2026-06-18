import { useState, useCallback } from 'react'
import { authApi } from '@/api/auth'

export function useAuth() {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('admin_user')
    return stored ? JSON.parse(stored) : null
  })

  const isAuthenticated = !!localStorage.getItem('admin_token')

  const login = useCallback(async (email, password) => {
    const { token, admin } = await authApi.login(email, password)
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_user', JSON.stringify(admin))
    setAdmin(admin)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {})
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setAdmin(null)
    window.location.href = '/login'
  }, [])

  return { admin, isAuthenticated, login, logout }
}
