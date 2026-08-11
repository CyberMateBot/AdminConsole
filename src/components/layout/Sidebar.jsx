import { NavLink } from 'react-router-dom'
import BrandMark from '@/components/BrandMark'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Coins,
  CreditCard,
  LayoutGrid,
  Home,
  Settings,
} from 'lucide-react'

const overviewNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Пользователи' },
  { to: '/broadcast', icon: Megaphone, label: 'Рассылки' },
]

const manageNav = [
  { to: '/transactions', icon: Coins, label: 'Транзакции' },
  { to: '/pricing', icon: CreditCard, label: 'Тарифы' },
  { to: '/models', icon: LayoutGrid, label: 'Нейросети' },
  { to: '/home-widgets', icon: Home, label: 'Виджеты' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <BrandMark className="sidebar-brand-mark" />
        <span className="label">CyberMate</span>
      </div>

      <nav className="nav">
        <div className="nav-section-label label">Обзор</div>
        {overviewNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} strokeWidth={2} />
            <span className="label">{label}</span>
          </NavLink>
        ))}

        <div className="nav-section-label label nav-section-spacer">Управление</div>
        {manageNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} strokeWidth={2} />
            <span className="label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className="dot" />
        <span className="label">v1.4.2 · prod online</span>
      </div>
    </aside>
  )
}
