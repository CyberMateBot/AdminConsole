import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { Coins, X } from 'lucide-react'

function formatUserName(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return name || user.username || `ID ${user.id}`
}

export default function UserTokensModal({ user, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: ({ action, amount, reason }) =>
      action === 'credit'
        ? usersApi.creditTokens(user.id, { amount, reason: reason || undefined })
        : usersApi.debitTokens(user.id, { amount, reason: reason || undefined }),
    onSuccess: (data) => {
      setAmount('')
      setReason('')
      setError('')
      onSuccess(data)
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.message
      setError(msg || 'Не удалось выполнить операцию')
    },
  })

  const trimmedAmount = amount.trim()
  const parsedAmount = Number.parseInt(trimmedAmount, 10)
  const isValidAmount = /^\d+$/.test(trimmedAmount) && parsedAmount > 0

  const handleSubmit = (action) => {
    if (!isValidAmount) {
      setError('Введите целое положительное число')
      return
    }
    setError('')
    mutation.mutate({ action, amount: parsedAmount, reason })
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-base">Токены пользователя</h3>
            <p className="text-sm text-base-content/60 mt-1">{formatUserName(user)}</p>
            {user.username && (
              <p className="text-xs text-base-content/50">@{user.username}</p>
            )}
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-base-200 mb-4">
          <Coins size={18} className="text-primary" />
          <div>
            <p className="text-xs text-base-content/50">Текущий баланс</p>
            <p className="text-xl font-semibold">
              {(user.tokens ?? 0).toLocaleString('ru')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="form-control w-full">
            <div className="label"><span className="label-text">Количество</span></div>
            <input
              type="number"
              min="1"
              step="1"
              className="input input-bordered w-full"
              placeholder="100"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </label>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Причина</span>
              <span className="label-text-alt text-base-content/40">необязательно</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Бонус за активность"
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={255}
            />
          </label>

          {error && <p className="text-error text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              className="btn btn-success flex-1"
              onClick={() => handleSubmit('credit')}
              disabled={mutation.isPending}
            >
              {mutation.isPending && mutation.variables?.action === 'credit'
                ? <span className="loading loading-spinner loading-sm" />
                : 'Начислить'}
            </button>
            <button
              className="btn btn-warning flex-1"
              onClick={() => handleSubmit('debit')}
              disabled={mutation.isPending}
            >
              {mutation.isPending && mutation.variables?.action === 'debit'
                ? <span className="loading loading-spinner loading-sm" />
                : 'Списать'}
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button type="button">close</button>
      </form>
    </dialog>
  )
}
