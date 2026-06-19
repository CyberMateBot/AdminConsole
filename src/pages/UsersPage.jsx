import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import UserTokensModal from '@/components/users/UserTokensModal'
import { Search } from 'lucide-react'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
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

  const totalPages = data ? Math.ceil(data.total / 20) : 0

  function formatDate(value) {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru')
  }

  return (
    <div className="space-y-4">
      <label className="input input-bordered flex items-center gap-2 max-w-sm">
        <Search size={14} className="text-base-content/40" />
        <input
          type="text"
          placeholder="Поиск по username или имени..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="grow"
        />
      </label>

      {isError && (
        <div className="alert alert-error text-sm">
          Не удалось загрузить пользователей. Проверьте соединение с бэкендом.
        </div>
      )}

      <div className="card bg-base-100 shadow-sm overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Telegram ID</th>
              <th>Токены</th>
              <th>Статус</th>
              <th>Регистрация</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              : data?.data?.length
                ? data.data.map(user => (
                  <tr key={user.id} className="hover">
                    <td>
                      <div className="font-medium text-sm">
                        {user.first_name} {user.last_name}
                      </div>
                      {user.username && (
                        <div className="text-xs text-base-content/50">@{user.username}</div>
                      )}
                    </td>
                    <td className="text-sm text-base-content/60">{user.telegram_id}</td>
                    <td className="text-sm font-medium tabular-nums">
                      {(user.tokens ?? 0).toLocaleString('ru')}
                    </td>
                    <td>
                      <span className={`badge badge-sm ${user.is_active ? 'badge-success' : 'badge-ghost'}`}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="text-xs text-base-content/50">
                      {formatDate(user.created_at)}
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => setSelectedUser(user)}
                        >
                          Токены
                        </button>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => toggleMutation.mutate({ id: user.id, is_active: !user.is_active })}
                          disabled={toggleMutation.isPending}
                        >
                          {user.is_active ? 'Заблокировать' : 'Активировать'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                : !isLoading && (
                  <tr>
                    <td colSpan={6} className="text-center text-sm text-base-content/50 py-6">
                      Пользователи не найдены
                    </td>
                  </tr>
                )
            }
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-base-content/50">
        <span>Всего: {data?.total ?? 0}</span>
        <div className="join">
          <button
            className="join-item btn btn-sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            «
          </button>
          <button className="join-item btn btn-sm btn-disabled">
            {page} / {totalPages || 1}
          </button>
          <button
            className="join-item btn btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            »
          </button>
        </div>
      </div>

      {selectedUser && (
        <UserTokensModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={handleTokensSuccess}
        />
      )}
    </div>
  )
}
