import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/api/stats'
import { eventsApi } from '@/api/events'
import { formatDateTime } from '@/utils/user'

function MetricCard({ label, value, loading }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      {loading
        ? <div className="metric-skeleton" />
        : <div className="metric-val">{value?.toLocaleString('ru') ?? '—'}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.get,
  })

  const { data: eventsData, isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list({ limit: 20 }),
  })

  const events = eventsData?.data ?? []

  return (
    <div className="page">
      <div className="page-section">
        {isError && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}>
            Не удалось загрузить статистику. Проверьте соединение с бэкендом.
          </div>
        )}
        <div className="metric-grid">
          <MetricCard label="Всего пользователей" value={data?.total_users} loading={isLoading} />
          <MetricCard label="Активны сегодня" value={data?.active_users_today} loading={isLoading} />
          <MetricCard label="Новые сегодня" value={data?.new_users_today} loading={isLoading} />
          <MetricCard label="Всего сообщений" value={data?.total_messages} loading={isLoading} />
        </div>
      </div>

      <div className="page-section">
        <h2 className="section-title">Последние события</h2>
        {eventsError && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}>
            Не удалось загрузить журнал событий.
          </div>
        )}
        <div className="table-wrap">
          <table className="admin-table">
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '32%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Время</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Детали</th>
              </tr>
            </thead>
            <tbody>
              {eventsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j}><div className="metric-skeleton" style={{ width: '80%' }} /></td>
                      ))}
                    </tr>
                  ))
                : events.length
                  ? events.map(event => (
                      <tr key={event.id}>
                        <td>{formatDateTime(event.time)}</td>
                        <td>{event.user}</td>
                        <td>{event.action}</td>
                        <td>{event.details}</td>
                      </tr>
                    ))
                  : (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          Событий пока нет
                        </td>
                      </tr>
                    )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
