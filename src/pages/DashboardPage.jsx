import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/api/stats'
import { Users, UserCheck, TrendingUp, MessageSquare } from 'lucide-react'

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-base-content/50">{label}</span>
          <Icon size={14} className="text-base-content/40" />
        </div>
        <span className="text-2xl font-semibold">
          {value?.toLocaleString('ru') ?? '—'}
        </span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.get,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="skeleton h-3 w-24 mb-3" />
              <div className="skeleton h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Всего пользователей" value={data?.total_users} icon={Users} />
      <StatCard label="Активны сегодня" value={data?.active_users_today} icon={UserCheck} />
      <StatCard label="Новые сегодня" value={data?.new_users_today} icon={TrendingUp} />
      <StatCard label="Всего сообщений" value={data?.total_messages} icon={MessageSquare} />
    </div>
  )
}
