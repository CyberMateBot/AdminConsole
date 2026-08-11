import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import UserTokensModal from '@/components/users/UserTokensModal'
import UserSubscriptionModal from '@/components/users/UserSubscriptionModal'
import { formatDate, formatUserName, getInitials } from '@/utils/user'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [subscriptionUser, setSubscriptionUser] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => usersApi.list({ page, per_page: 20, search: search || undefined }),
    placeholderData: prev => prev,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => usersApi.toggleActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const handleSubscriptionSuccess = (result) => {
    const user = result.user ?? result
    qc.invalidateQueries({ queryKey: ['users'] })
    setSubscriptionUser(prev => (prev?.id === user.id ? { ...prev, ...user } : prev))
  }

  const handleTokensSuccess = (result) => {
    const userId = result.user_id ?? result.id
    qc.setQueryData(['users', page, search], (old) => {
      if (!old?.data) return old
      return {
        ...old,
        data: old.data.map(u =>
          u.id === userId ? { ...u, tokens: result.tokens } : u
        ),
      }
    })
    setSelectedUser(prev =>
      prev?.id === userId ? { ...prev, tokens: result.tokens } : prev
    )
  }

  const filteredUsers = useMemo(() => {
    const list = data?.data ?? []
    if (statusFilter === 'active') return list.filter(u => u.is_active)
    if (statusFilter === 'blocked') return list.filter(u => !u.is_active)
    return list
  }, [data?.data, statusFilter])

  const totalPages = data ? Math.ceil(data.total / 20) : 0

  return (
    <div className="page">
      <div className="search-row">
        <input
          type="text"
          className="admin-input"
          placeholder="Поиск по username или имени..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="admin-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Все статусы</option>
          <option value="active">Активен</option>
          <option value="blocked">Заблокирован</option>
        </select>
      </div>

      {isError && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          Не удалось загрузить пользователей. Проверьте соединение с бэкендом.
        </div>
      )}

      <div className="table-wrap">
        <table className="admin-table">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Telegram ID</th>
              <th>Токены</th>
              <th>Подписка</th>
              <th>Статус</th>
              <th>Регистрация</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="metric-skeleton" style={{ width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              : filteredUsers.length
                ? filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-sm">{getInitials(user)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className="uname">{formatUserName(user)}</div>
                          {user.username && (
                            <div className="uhandle">@{user.username}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="mono">{user.telegram_id}</td>
                    <td className="tnum">{(user.tokens ?? 0).toLocaleString('ru')}</td>
                    <td>
                      <div>{user.subscription_plan || user.subscription_plan_id || 'free'}</div>
                      {typeof user.subscription_days_left === 'number' && user.subscription_days_left > 0 ? (
                        <div className="uhandle">{user.subscription_days_left} дн.</div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-active' : 'badge-blocked'}`}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => setSelectedUser(user)}>
                          Токены
                        </button>
                        <button type="button" onClick={() => setSubscriptionUser(user)}>
                          Подписка
                        </button>
                        <button
                          type="button"
                          className={user.is_active ? 'danger' : ''}
                          onClick={() => toggleMutation.mutate({ id: user.id, is_active: !user.is_active })}
                          disabled={toggleMutation.isPending}
                        >
                          {user.is_active ? 'Блок' : 'Снять блок'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                : (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>Всего: {data?.total ?? 0}</span>
        <div className="pagination-btns">
          <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>«</button>
          <button type="button" disabled>{page} / {totalPages || 1}</button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>»</button>
        </div>
      </div>

      {selectedUser && (
        <UserTokensModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={handleTokensSuccess}
        />
      )}

      {subscriptionUser && (
        <UserSubscriptionModal
          user={subscriptionUser}
          onClose={() => setSubscriptionUser(null)}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </div>
  )
}
