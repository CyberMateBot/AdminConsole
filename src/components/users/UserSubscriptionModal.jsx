import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Crown, X } from 'lucide-react'
import { usersApi } from '@/api/users'
import { pricingApi } from '@/api/pricing'
import { formatDate, formatUserName } from '@/utils/user'

const PLAN_OPTIONS = [
  { id: 'free', label: 'Старт (free)' },
  { id: 'basic', label: 'Базовый' },
  { id: 'pro', label: 'Про' },
  { id: 'max', label: 'Максимум' },
  { id: 'ultra', label: 'Бизнес' },
]

function toLocalInputValue(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInputValue(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export default function UserSubscriptionModal({ user, onClose, onSuccess }) {
  const [planId, setPlanId] = useState(user.subscription_plan_id || 'basic')
  const [durationMode, setDurationMode] = useState('days')
  const [durationDays, setDurationDays] = useState('30')
  const [expiresAtLocal, setExpiresAtLocal] = useState(toLocalInputValue(user.subscription_expires))
  const [noExpiry, setNoExpiry] = useState(false)
  const [grantCoins, setGrantCoins] = useState(false)
  const [error, setError] = useState('')

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => pricingApi.listPlans(),
  })

  const planCoins = useMemo(() => {
    const plans = plansData?.data ?? []
    const match = plans.find((item) => item.id === planId)
    return match?.coins ?? 0
  }, [plansData, planId])

  useEffect(() => {
    if (user.subscription_plan_id) {
      setPlanId(user.subscription_plan_id)
    }
    if (user.subscription_expires) {
      setExpiresAtLocal(toLocalInputValue(user.subscription_expires))
      setDurationMode('datetime')
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: (payload) => usersApi.setSubscription(user.id, payload),
    onSuccess: (data) => {
      setError('')
      onSuccess(data)
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.message
      setError(msg || 'Не удалось изменить подписку')
    },
  })

  const clearMutation = useMutation({
    mutationFn: () => usersApi.clearSubscription(user.id),
    onSuccess: (data) => {
      setError('')
      onSuccess(data)
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.message
      setError(msg || 'Не удалось сбросить подписку')
    },
  })

  const handleSubmit = () => {
    setError('')

    if (planId === 'free') {
      clearMutation.mutate()
      return
    }

    const payload = {
      plan_id: planId,
      grant_coins: grantCoins,
      no_expiry: noExpiry,
    }

    if (!noExpiry) {
      if (durationMode === 'datetime') {
        const iso = fromLocalInputValue(expiresAtLocal)
        if (!iso) {
          setError('Укажите дату окончания подписки')
          return
        }
        payload.expires_at = iso
      } else {
        const days = Number.parseInt(String(durationDays).trim(), 10)
        if (!Number.isFinite(days) || days <= 0) {
          setError('Укажите количество дней')
          return
        }
        payload.duration_days = days
      }
    }

    mutation.mutate(payload)
  }

  const busy = mutation.isPending || clearMutation.isPending

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Подписка пользователя</h3>
            <p className="modal-sub">{formatUserName(user)}</p>
            {user.username && <p className="modal-sub uhandle">@{user.username}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className="balance-box">
          <Crown size={20} style={{ color: 'var(--accent-text)' }} />
          <div>
            <p className="label">Текущий план</p>
            <p className="value">{user.subscription_plan || user.subscription_plan_id || 'free'}</p>
            {user.subscription_expires ? (
              <p className="modal-sub">до {formatDate(user.subscription_expires)}</p>
            ) : null}
            {typeof user.subscription_days_left === 'number' && user.subscription_days_left >= 0 ? (
              <p className="modal-sub">осталось {user.subscription_days_left} дн.</p>
            ) : null}
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="sub-plan">План</label>
          <select
            id="sub-plan"
            className="admin-select"
            style={{ width: '100%' }}
            value={planId}
            onChange={e => setPlanId(e.target.value)}
          >
            {PLAN_OPTIONS.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>

        {planId !== 'free' ? (
          <>
            <div className="field-group">
              <label className="field-label">Срок действия</label>
              <div className="modal-radio-row">
                <label><input type="radio" name="durationMode" checked={durationMode === 'days'} onChange={() => setDurationMode('days')} /> По дням</label>
                <label><input type="radio" name="durationMode" checked={durationMode === 'datetime'} onChange={() => setDurationMode('datetime')} /> Точная дата</label>
              </div>
            </div>

            {durationMode === 'days' ? (
              <div className="field-group">
                <label className="field-label" htmlFor="sub-days">Количество дней</label>
                <input
                  id="sub-days"
                  type="number"
                  min="1"
                  max="3650"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={durationDays}
                  onChange={e => setDurationDays(e.target.value)}
                  placeholder="30"
                />
              </div>
            ) : (
              <div className="field-group">
                <label className="field-label" htmlFor="sub-expires">Дата и время окончания</label>
                <input
                  id="sub-expires"
                  type="datetime-local"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={expiresAtLocal}
                  onChange={e => setExpiresAtLocal(e.target.value)}
                />
              </div>
            )}

            <div className="field-group">
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={noExpiry}
                  onChange={e => setNoExpiry(e.target.checked)}
                />
                {' '}Без срока (бессрочно)
              </label>
            </div>

            <div className="field-group">
              <label className="field-label">
                <input
                  type="checkbox"
                  checked={grantCoins}
                  onChange={e => setGrantCoins(e.target.checked)}
                />
                {' '}Начислить монеты плана ({planCoins.toLocaleString('ru')})
              </label>
            </div>
          </>
        ) : (
          <p className="modal-sub">Выбор «Старт (free)» сбросит подписку пользователя.</p>
        )}

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={busy}>
            {busy ? <span className="spinner" /> : (planId === 'free' ? 'Сбросить подписку' : 'Сохранить')}
          </button>
        </div>
      </div>
    </div>
  )
}
