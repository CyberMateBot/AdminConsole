import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { broadcastApi } from '@/api/broadcast'
import { broadcastsApi } from '@/api/broadcasts'
import { formatDateTime } from '@/utils/user'

export default function BroadcastPage() {
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('all')
  const [result, setResult] = useState(null)
  const qc = useQueryClient()

  const { data: historyData, isLoading: historyLoading, isError: historyError } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => broadcastsApi.list({ page: 1, per_page: 20 }),
  })

  const mutation = useMutation({
    mutationFn: broadcastApi.send,
    onSuccess: data => {
      setResult(data)
      setMessage('')
      qc.invalidateQueries({ queryKey: ['broadcasts'] })
    },
    onError: () => setResult(null),
  })

  const history = historyData?.data ?? []

  return (
    <div className="page">
      <div className="page-section">
        <h2 className="section-title">Новая рассылка</h2>
        <div className="broadcast-card">
          <div className="field-group">
            <label className="field-label" htmlFor="broadcast-target">Аудитория</label>
            <select
              id="broadcast-target"
              className="admin-select"
              value={target}
              onChange={e => setTarget(e.target.value)}
            >
              <option value="all">Все пользователи</option>
              <option value="active">Только активные (7 дней)</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="broadcast-message">Текст сообщения</label>
            <textarea
              id="broadcast-message"
              className="admin-textarea"
              placeholder="Введите текст рассылки... Поддерживается HTML"
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={4096}
            />
            <div className="char-count">{message.length} / 4096</div>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => mutation.mutate({ message, target, parse_mode: 'HTML' })}
            disabled={!message.trim() || mutation.isPending}
          >
            {mutation.isPending
              ? <span className="spinner" />
              : <><Send size={15} />Отправить рассылку</>}
          </button>

          {mutation.isError && (
            <div className="alert alert-error" style={{ marginTop: 14 }}>
              Ошибка при отправке. Проверьте соединение с бэкендом.
            </div>
          )}

          {result && (
            <div className="alert alert-success" style={{ marginTop: 14 }}>
              Доставлено: <strong>{result.sent}</strong>
              {result.failed > 0 && <> · Ошибок: <strong>{result.failed}</strong></>}
            </div>
          )}
        </div>
      </div>

      <div className="page-section">
        <h2 className="section-title">История рассылок</h2>
        {historyError && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}>
            Не удалось загрузить историю рассылок.
          </div>
        )}
        <div className="table-wrap">
          <table className="admin-table">
            <colgroup>
              <col style={{ width: '40%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Текст</th>
                <th>Аудитория</th>
                <th>Получили</th>
                <th>Дата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j}><div className="metric-skeleton" style={{ width: '80%' }} /></td>
                      ))}
                    </tr>
                  ))
                : history.length
                  ? history.map(item => (
                      <tr key={item.id}>
                        <td>{item.message.length > 80 ? `${item.message.slice(0, 80)}…` : item.message}</td>
                        <td>{item.target_label}</td>
                        <td>{item.sent.toLocaleString('ru')}</td>
                        <td>{formatDateTime(item.created_at)}</td>
                        <td>
                          <span className={`badge badge-${item.status === 'failed' ? 'blocked' : 'active'}`}>
                            {item.status_label}
                          </span>
                        </td>
                      </tr>
                    ))
                  : (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          Рассылок пока не было
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
