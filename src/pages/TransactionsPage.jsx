import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionsApi } from '@/api/transactions'
import { formatDate } from '@/utils/user'

const TYPE_OPTIONS = [
  { value: 'all', label: 'Все типы' },
  { value: 'credit', label: 'Начисления' },
  { value: 'debit', label: 'Списания' },
]

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', page, typeFilter],
    queryFn: () => transactionsApi.list({
      page,
      per_page: 20,
      operation: typeFilter === 'all' ? undefined : typeFilter,
    }),
    placeholderData: prev => prev,
  })

  const stats = data?.stats
  const rows = data?.data ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1

  return (
    <div className="page">
      <div className="page-section">
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">Начислено за месяц</div>
            <div className="metric-val">{stats ? stats.credits_month.toLocaleString('ru') : '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Списано за месяц</div>
            <div className="metric-val">{stats ? stats.debits_month.toLocaleString('ru') : '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Операций за месяц</div>
            <div className="metric-val">{stats ? stats.operations_month.toLocaleString('ru') : '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Средняя сумма</div>
            <div className="metric-val">{stats ? stats.avg_amount.toLocaleString('ru') : '—'}</div>
          </div>
        </div>
      </div>

      <div className="page-section">
        {isError && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}>
            Не удалось загрузить транзакции.
          </div>
        )}

        <div className="search-row">
          <select
            className="admin-select"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          >
            {TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <colgroup>
              <col style={{ width: '24%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Тип</th>
                <th>Сумма</th>
                <th>Метод</th>
                <th>Дата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j}><div className="metric-skeleton" style={{ width: '80%' }} /></td>
                      ))}
                    </tr>
                  ))
                : rows.length
                  ? rows.map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.user}</td>
                        <td>{tx.type_label}</td>
                        <td className={tx.type === 'credit' ? 'tx-amount-in' : 'tx-amount-out'}>{tx.amount_label}</td>
                        <td><span className="method-badge">{tx.method_label}</span></td>
                        <td>{formatDate(tx.created_at)}</td>
                        <td>
                          <span className="badge badge-active">{tx.status_label}</span>
                        </td>
                      </tr>
                    ))
                  : (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          Транзакций пока нет
                        </td>
                      </tr>
                    )}
            </tbody>
          </table>
        </div>

        <div className="pagination" style={{ marginTop: 14 }}>
          <span>Всего: {data?.total ?? 0}</span>
          <div className="pagination-btns">
            <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>«</button>
            <button type="button" disabled>{page} / {totalPages}</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>»</button>
          </div>
        </div>
      </div>
    </div>
  )
}
