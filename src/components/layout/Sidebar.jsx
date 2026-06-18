import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Megaphone } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Пользователи' },
  { to: '/broadcast', icon: Megaphone, label: 'Рассылки' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-base-100 border-r border-base-300 flex flex-col">
      <div className="px-5 py-4 border-b border-base-300">
        <span className="font-semibold text-sm">CyberMate Admin</span>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'text-base-content/70 hover:bg-base-200'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
