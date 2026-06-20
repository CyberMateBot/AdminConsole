import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/hooks/useTheme'
import { settingsApi } from '@/api/settings'

function Toggle({ on, onToggle, disabled }) {
  return (
    <button
      type="button"
      className={`toggle${on ? ' on' : ''}`}
      onClick={onToggle}
      aria-pressed={on}
      disabled={disabled}
    >
      <span className="toggle-knob" />
    </button>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })

  const [registrationBonus, setRegistrationBonus] = useState(20)
  const [referralBonus, setReferralBonus] = useState(300)
  const [tokenExpiryDays, setTokenExpiryDays] = useState(60)
  const [maintenance, setMaintenance] = useState(false)
  const [yookassa, setYookassa] = useState(true)
  const [stars, setStars] = useState(true)
  const [coinRate, setCoinRate] = useState('1')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!data) return
    setRegistrationBonus(data.registration_bonus ?? 20)
    setReferralBonus(data.referral_bonus ?? 300)
    setTokenExpiryDays(data.token_expiry_days ?? 60)
    setMaintenance(Boolean(data.maintenance_mode))
    setYookassa(data.yookassa_enabled ?? true)
    setStars(data.telegram_stars_enabled ?? true)
    setCoinRate(String(data.coin_rate_rub ?? 1))
  }, [data])

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    },
  })

  const handleSave = () => {
    mutation.mutate({
      registration_bonus: Number(registrationBonus),
      referral_bonus: Number(referralBonus),
      token_expiry_days: Number(tokenExpiryDays),
      maintenance_mode: maintenance,
      yookassa_enabled: yookassa,
      telegram_stars_enabled: stars,
      coin_rate_rub: Number(coinRate),
    })
  }

  return (
    <div className="page">
      {isError && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          Не удалось загрузить настройки.
        </div>
      )}
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: 14 }}>
          Настройки сохранены
        </div>
      )}

      <div className="page-section">
        <h2 className="section-title">Общие</h2>
        <div className="settings-grid">
          <div className="setting-row">
            <div>
              <div className="setting-label">Регистрационный бонус</div>
              <div className="setting-sub">Монет при первом входе</div>
            </div>
            <div className="price-input">
              <input
                type="number"
                className="admin-input"
                value={registrationBonus}
                disabled={isLoading || mutation.isPending}
                onChange={e => setRegistrationBonus(e.target.value)}
              /> монет
            </div>
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Бонус за реферала</div>
              <div className="setting-sub">Монет при приглашении друга</div>
            </div>
            <div className="price-input">
              <input
                type="number"
                className="admin-input"
                value={referralBonus}
                disabled={isLoading || mutation.isPending}
                onChange={e => setReferralBonus(e.target.value)}
              /> монет
            </div>
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Срок действия монет</div>
              <div className="setting-sub">Дней до сгорания неактивных монет</div>
            </div>
            <div className="price-input">
              <input
                type="number"
                className="admin-input"
                value={tokenExpiryDays}
                disabled={isLoading || mutation.isPending}
                onChange={e => setTokenExpiryDays(e.target.value)}
              /> дней
            </div>
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Режим обслуживания</div>
              <div className="setting-sub">Временно закрыть доступ к боту</div>
            </div>
            <Toggle
              on={maintenance}
              disabled={isLoading || mutation.isPending}
              onToggle={() => setMaintenance(v => !v)}
            />
          </div>
        </div>
      </div>

      <div className="page-section">
        <h2 className="section-title">Оплата</h2>
        <div className="settings-grid">
          <div className="setting-row">
            <div>
              <div className="setting-label">ЮKassa</div>
              <div className="setting-sub">Оплата картой и СБП</div>
            </div>
            <Toggle
              on={yookassa}
              disabled={isLoading || mutation.isPending}
              onToggle={() => setYookassa(v => !v)}
            />
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Telegram Stars</div>
              <div className="setting-sub">Оплата через нативные звёзды Telegram</div>
            </div>
            <Toggle
              on={stars}
              disabled={isLoading || mutation.isPending}
              onToggle={() => setStars(v => !v)}
            />
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Базовый курс монеты</div>
              <div className="setting-sub">Рублей за 1 CyberCoin (розница). Пакеты могут иметь свою цену.</div>
            </div>
            <div className="price-input">
              <input
                type="number"
                className="admin-input"
                step="0.1"
                value={coinRate}
                disabled={isLoading || mutation.isPending}
                onChange={e => setCoinRate(e.target.value)}
              /> ₽
            </div>
          </div>
        </div>
      </div>

      <div className="page-section">
        <h2 className="section-title">Интерфейс</h2>
        <div className="settings-grid">
          <div className="setting-row">
            <div>
              <div className="setting-label">Тема оформления</div>
              <div className="setting-sub">Светлая или тёмная тема панели</div>
            </div>
            <select
              className="admin-select"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="dark">Тёмная</option>
              <option value="light">Светлая</option>
            </select>
          </div>
        </div>
      </div>

      <div className="page-section">
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={isLoading || mutation.isPending}
        >
          {mutation.isPending ? 'Сохранение…' : 'Сохранить настройки'}
        </button>
      </div>
    </div>
  )
}
