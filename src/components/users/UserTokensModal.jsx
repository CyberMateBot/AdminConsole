import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Coins, X } from 'lucide-react'
import { usersApi } from '@/api/users'
import { formatUserName } from '@/utils/user'

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Токены пользователя</h3>
            <p className="modal-sub">{formatUserName(user)}</p>
            {user.username && (
              <p className="modal-sub uhandle">@{user.username}</p>
            )}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className="balance-box">
          <Coins size={20} style={{ color: 'var(--accent-text)' }} />
          <div>
            <p className="label">Текущий баланс</p>
            <p className="value">{(user.tokens ?? 0).toLocaleString('ru')}</p>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="token-amount">Количество</label>
          <input
            id="token-amount"
            type="number"
            min="1"
            step="1"
            className="admin-input"
            style={{ width: '100%' }}
            placeholder="100"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="token-reason">
            Причина <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(необязательно)</span>
          </label>
          <input
            id="token-reason"
            type="text"
            className="admin-input"
            style={{ width: '100%' }}
            placeholder="Бонус за активность"
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={255}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          <button
            type="button"
            className="btn-success"
            onClick={() => handleSubmit('credit')}
            disabled={mutation.isPending}
          >
            {mutation.isPending && mutation.variables?.action === 'credit'
              ? <span className="spinner" />
              : 'Начислить'}
          </button>
          <button
            type="button"
            className="btn-warning"
            onClick={() => handleSubmit('debit')}
            disabled={mutation.isPending}
          >
            {mutation.isPending && mutation.variables?.action === 'debit'
              ? <span className="spinner" />
              : 'Списать'}
          </button>
        </div>
      </div>
    </div>
  )
}
