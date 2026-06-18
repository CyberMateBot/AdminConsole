import { useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const titles = {
  '/dashboard': 'Dashboard',
  '/users': 'Пользователи',
  '/broadcast': 'Рассылки',
}

export default function Header() {
  const { pathname } = useLocation()
  const { admin, logout } = useAuth()

  return (
    <header className="bg-base-100 border-b border-base-300 px-6 py-3 flex items-center justify-between">
      <h1 className="text-sm font-medium">{titles[pathname] ?? 'Admin'}</h1>
      <div className="flex items-center gap-3">
        <span className="text-xs text-base-content/50">{admin?.email}</span>
        <button className="btn btn-ghost btn-xs gap-1.5" onClick={logout}>
          <LogOut size={13} />
          Выйти
        </button>
      </div>
    </header>
  )
}
