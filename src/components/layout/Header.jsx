import { useLocation } from 'react-router-dom'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

const titles = {
  '/dashboard': 'Dashboard',
  '/users': 'Пользователи',
  '/broadcast': 'Рассылки',
  '/transactions': 'Транзакции',
  '/models': 'Нейросети',
  '/home-widgets': 'Виджеты',
  '/settings': 'Настройки',
}

export default function Header() {
  const { pathname } = useLocation()
  const { admin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="topbar">
      <h3>{titles[pathname] ?? 'Admin'}</h3>
      <div className="topbar-right">
        <span className="topbar-email">{admin?.email}</span>
        <button
          type="button"
          className="topbar-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          aria-label="Переключить тему"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button type="button" className="topbar-btn" onClick={logout}>
          <LogOut size={14} />
          Выйти
        </button>
      </div>
    </header>
  )
}
