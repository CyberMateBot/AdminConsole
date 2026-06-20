import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pricingApi } from '@/api/pricing'

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

function emptyPlan(index = 0) {
  return {
    id: '',
    name: '',
    badge: '',
    badge_class: 'free',
    price_rub: 0,
    price_sub: '/ месяц',
    coins: 0,
    features: [''],
    locked: [],
    popular: false,
    enabled: true,
    sort_order: index + 1,
  }
}

function emptyPack(index = 0) {
  return {
    id: '',
    name: '',
    coins: 100,
    price_rub: 99,
    badge: '',
    enabled: true,
    sort_order: index + 1,
  }
}

function PlanEditor({ plan, index, onChange, onRemove, disabled }) {
  const update = (patch) => onChange(index, { ...plan, ...patch })

  const updateFeature = (featureIndex, value) => {
    const features = [...(plan.features ?? [])]
    features[featureIndex] = value
    update({ features })
  }

  const addFeature = () => update({ features: [...(plan.features ?? []), ''] })
  const removeFeature = (featureIndex) => {
    update({ features: (plan.features ?? []).filter((_, i) => i !== featureIndex) })
  }

  return (
    <article className="widget-form pricing-card">
      <div className="widget-form__grid">
        <div className="field-group">
          <label className="field-label">ID</label>
          <input className="admin-input" value={plan.id} disabled={disabled} onChange={e => update({ id: e.target.value })} />
        </div>
        <div className="field-group">
          <label className="field-label">Название</label>
          <input className="admin-input" value={plan.name} disabled={disabled} onChange={e => update({ name: e.target.value })} />
        </div>
        <div className="field-group">
          <label className="field-label">Бейдж</label>
          <input className="admin-input" value={plan.badge} disabled={disabled} onChange={e => update({ badge: e.target.value })} />
        </div>
        <div className="field-group">
          <label className="field-label">Класс бейджа</label>
          <select className="admin-select" value={plan.badge_class} disabled={disabled} onChange={e => update({ badge_class: e.target.value })}>
            <option value="free">free</option>
            <option value="basic">basic</option>
            <option value="popular">popular</option>
            <option value="max">max</option>
            <option value="biz">biz</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Цена, ₽</label>
          <input type="number" min="0" className="admin-input" value={plan.price_rub} disabled={disabled} onChange={e => update({ price_rub: Number(e.target.value) })} />
        </div>
        <div className="field-group">
          <label className="field-label">Подпись цены</label>
          <input className="admin-input" value={plan.price_sub} disabled={disabled} onChange={e => update({ price_sub: e.target.value })} />
        </div>
        <div className="field-group">
          <label className="field-label">Монет / месяц</label>
          <input type="number" min="0" className="admin-input" value={plan.coins} disabled={disabled} onChange={e => update({ coins: Number(e.target.value) })} />
        </div>
        <div className="field-group">
          <label className="field-label">Порядок</label>
          <input type="number" min="1" className="admin-input" value={plan.sort_order} disabled={disabled} onChange={e => update({ sort_order: Number(e.target.value) })} />
        </div>
      </div>

      <div className="field-group" style={{ marginTop: 12 }}>
        <label className="field-label">Возможности</label>
        {(plan.features ?? []).map((feature, featureIndex) => (
          <div key={featureIndex} className="pricing-inline-row">
            <input
              className="admin-input"
              value={feature}
              disabled={disabled}
              onChange={e => updateFeature(featureIndex, e.target.value)}
            />
            <button type="button" className="btn-ghost" disabled={disabled} onClick={() => removeFeature(featureIndex)}>×</button>
          </div>
        ))}
        <button type="button" className="btn-ghost" disabled={disabled} onClick={addFeature}>+ пункт</button>
      </div>

      <div className="widget-form__footer">
        <label className="widget-form__toggle-row">
          <span>Популярный</span>
          <Toggle on={plan.popular} disabled={disabled} onToggle={() => update({ popular: !plan.popular })} />
        </label>
        <label className="widget-form__toggle-row">
          <span>Активен</span>
          <Toggle on={plan.enabled} disabled={disabled} onToggle={() => update({ enabled: !plan.enabled })} />
        </label>
        <button type="button" className="btn-ghost" disabled={disabled} onClick={() => onRemove(index)}>Удалить план</button>
      </div>
    </article>
  )
}

function PackEditor({ pack, index, onChange, onRemove, disabled }) {
  const update = (patch) => onChange(index, { ...pack, ...patch })
  const rate = pack.coins > 0 ? (pack.price_rub / pack.coins).toFixed(2) : '—'

  return (
    <article className="widget-form pricing-card">
      <div className="widget-form__grid">
        <div className="field-group">
          <label className="field-label">ID</label>
          <input className="admin-input" value={pack.id} disabled={disabled} onChange={e => update({ id: e.target.value })} />
        </div>
        <div className="field-group">
          <label className="field-label">Название</label>
          <input className="admin-input" value={pack.name} disabled={disabled} onChange={e => update({ name: e.target.value })} />
        </div>
        <div className="field-group">
          <label className="field-label">Монет</label>
          <input type="number" min="1" className="admin-input" value={pack.coins} disabled={disabled} onChange={e => update({ coins: Number(e.target.value) })} />
        </div>
        <div className="field-group">
          <label className="field-label">Цена, ₽</label>
          <input type="number" min="1" className="admin-input" value={pack.price_rub} disabled={disabled} onChange={e => update({ price_rub: Number(e.target.value) })} />
        </div>
        <div className="field-group">
          <label className="field-label">Бейдж скидки</label>
          <input className="admin-input" value={pack.badge ?? ''} disabled={disabled} onChange={e => update({ badge: e.target.value })} placeholder="−20%" />
        </div>
        <div className="field-group">
          <label className="field-label">Порядок</label>
          <input type="number" min="1" className="admin-input" value={pack.sort_order} disabled={disabled} onChange={e => update({ sort_order: Number(e.target.value) })} />
        </div>
      </div>
      <p className="field-hint">Эффективный курс: {rate} ₽ / монета</p>
      <div className="widget-form__footer">
        <label className="widget-form__toggle-row">
          <span>Активен</span>
          <Toggle on={pack.enabled} disabled={disabled} onToggle={() => update({ enabled: !pack.enabled })} />
        </label>
        <button type="button" className="btn-ghost" disabled={disabled} onClick={() => onRemove(index)}>Удалить пакет</button>
      </div>
    </article>
  )
}

export default function PricingPage() {
  const qc = useQueryClient()
  const [plans, setPlans] = useState([])
  const [packs, setPacks] = useState([])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const plansQuery = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: pricingApi.listPlans,
  })

  const packsQuery = useQuery({
    queryKey: ['pricing-packs'],
    queryFn: pricingApi.listCoinPacks,
  })

  useEffect(() => {
    if (plansQuery.data?.data) {
      setPlans(plansQuery.data.data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) && plan.features.length ? plan.features : [''],
        locked: plan.locked ?? [],
      })))
    }
  }, [plansQuery.data])

  useEffect(() => {
    if (packsQuery.data?.data) {
      setPacks(packsQuery.data.data)
    }
  }, [packsQuery.data])

  const savePlans = useMutation({
    mutationFn: () => pricingApi.updatePlans(plans.map(plan => ({
      ...plan,
      features: (plan.features ?? []).map(f => f.trim()).filter(Boolean),
      locked: (plan.locked ?? []).map(f => f.trim()).filter(Boolean),
    }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-plans'] })
      setSaved(true)
      setError(null)
      window.setTimeout(() => setSaved(false), 2500)
    },
    onError: () => setError('Не удалось сохранить планы подписки'),
  })

  const savePacks = useMutation({
    mutationFn: () => pricingApi.updateCoinPacks(packs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-packs'] })
      setSaved(true)
      setError(null)
      window.setTimeout(() => setSaved(false), 2500)
    },
    onError: () => setError('Не удалось сохранить пакеты монет'),
  })

  const isLoading = plansQuery.isLoading || packsQuery.isLoading
  const isSaving = savePlans.isPending || savePacks.isPending

  return (
    <div className="page">
      {(plansQuery.isError || packsQuery.isError) && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          Не удалось загрузить тарифы.
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: 14 }}>
          Сохранено
        </div>
      )}

      <div className="page-section">
        <h2 className="section-title">Планы подписки</h2>
        <p className="text-muted" style={{ marginBottom: 12 }}>
          Отображаются в приложении на экране «Подписка». Цены в рублях, монеты начисляются ежемесячно.
        </p>
        {isLoading ? <div className="metric-skeleton" style={{ height: 120 }} /> : (
          <div className="pricing-stack">
            {plans.map((plan, index) => (
              <PlanEditor
                key={`${plan.id}-${index}`}
                plan={plan}
                index={index}
                disabled={isSaving}
                onChange={(i, next) => setPlans(prev => prev.map((item, idx) => (idx === i ? next : item)))}
                onRemove={(i) => setPlans(prev => prev.filter((_, idx) => idx !== i))}
              />
            ))}
            <button type="button" className="btn-ghost" disabled={isSaving} onClick={() => setPlans(prev => [...prev, emptyPlan(prev.length)])}>
              + Добавить план
            </button>
            <button type="button" className="btn-primary" disabled={isSaving || !plans.length} onClick={() => savePlans.mutate()}>
              {savePlans.isPending ? 'Сохранение…' : 'Сохранить планы'}
            </button>
          </div>
        )}
      </div>

      <div className="page-section">
        <h2 className="section-title">Пакеты монет</h2>
        <p className="text-muted" style={{ marginBottom: 12 }}>
          Разовая покупка CyberCoins. Базовый курс задаётся в «Настройки → Курс монеты» (1 монета = 1 ₽).
        </p>
        {isLoading ? <div className="metric-skeleton" style={{ height: 120 }} /> : (
          <div className="pricing-stack">
            {packs.map((pack, index) => (
              <PackEditor
                key={`${pack.id}-${index}`}
                pack={pack}
                index={index}
                disabled={isSaving}
                onChange={(i, next) => setPacks(prev => prev.map((item, idx) => (idx === i ? next : item)))}
                onRemove={(i) => setPacks(prev => prev.filter((_, idx) => idx !== i))}
              />
            ))}
            <button type="button" className="btn-ghost" disabled={isSaving} onClick={() => setPacks(prev => [...prev, emptyPack(prev.length)])}>
              + Добавить пакет
            </button>
            <button type="button" className="btn-primary" disabled={isSaving || !packs.length} onClick={() => savePacks.mutate()}>
              {savePacks.isPending ? 'Сохранение…' : 'Сохранить пакеты'}
            </button>
          </div>
        )}
      </div>

      <div className="page-section">
        <h2 className="section-title">Цены моделей</h2>
        <p className="text-muted">
          Стоимость одного запроса к каждой нейросети настраивается на странице «Нейросети».
        </p>
      </div>
    </div>
  )
}
