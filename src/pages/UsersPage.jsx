import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { Search } from 'lucide-react'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => usersApi.list({ page, per_page: 20, search: search || undefined }),
    placeholderData: prev => prev,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => usersApi.toggleActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const totalPages = data ? Math.ceil(data.total / 20) : 0

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

      <div className="card bg-base-100 shadow-sm overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Telegram ID</th>
              <th>Статус</th>
              <th>Регистрация</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              : data?.data.map(user => (
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
                    <td>
                      <span className={`badge badge-sm ${user.is_active ? 'badge-success' : 'badge-ghost'}`}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="text-xs text-base-content/50">
                      {new Date(user.created_at).toLocaleDateString('ru')}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => toggleMutation.mutate({ id: user.id, is_active: !user.is_active })}
                        disabled={toggleMutation.isPending}
                      >
                        {user.is_active ? 'Заблокировать' : 'Активировать'}
                      </button>
                    </td>
                  </tr>
                ))
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
    </div>
  )
}
