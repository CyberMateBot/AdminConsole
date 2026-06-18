import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { broadcastApi } from '@/api/broadcast'

export default function BroadcastPage() {
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('all')
  const [result, setResult] = useState(null)

  const mutation = useMutation({
    mutationFn: broadcastApi.send,
    onSuccess: data => {
      setResult(data)
      setMessage('')
    },
  })

  return (
    <div className="max-w-xl space-y-4">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-4">
          <h2 className="card-title text-base">Новая рассылка</h2>

          <label className="form-control w-full">
            <div className="label"><span className="label-text">Аудитория</span></div>
            <select
              className="select select-bordered w-full"
              value={target}
              onChange={e => setTarget(e.target.value)}
            >
              <option value="all">Все пользователи</option>
              <option value="active">Только активные (7 дней)</option>
            </select>
          </label>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Текст сообщения</span>
              <span className="label-text-alt text-base-content/40">{message.length} / 4096</span>
            </div>
            <textarea
              className="textarea textarea-bordered h-32 resize-none"
              placeholder="Введите текст рассылки... Поддерживается HTML."
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={4096}
            />
          </label>

          <button
            className="btn btn-primary w-full"
            onClick={() => mutation.mutate({ message, target, parse_mode: 'HTML' })}
            disabled={!message.trim() || mutation.isPending}
          >
            {mutation.isPending
              ? <span className="loading loading-spinner loading-sm" />
              : 'Отправить рассылку'
            }
          </button>

          {mutation.isError && (
            <div className="alert alert-error text-sm">
              Ошибка при отправке. Проверьте соединение с бэкендом.
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="alert alert-success">
          <span>Доставлено: <strong>{result.sent}</strong></span>
          {result.failed > 0 && (
            <span className="text-error">Ошибок: <strong>{result.failed}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}
