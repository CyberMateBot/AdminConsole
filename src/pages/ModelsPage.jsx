import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { modelsApi } from '@/api/models'

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

function ModelRow({ model, onSave, saving }) {
  const [enabled, setEnabled] = useState(model.enabled)
  const [priceValue, setPriceValue] = useState(String(model.price))

  return (
    <tr>
      <td>{model.name}</td>
      <td>{model.provider}</td>
      <td>
        <div className="price-input">
          <input
            type="number"
            className="admin-input"
            min="0"
            value={priceValue}
            onChange={e => setPriceValue(e.target.value)}
          />
          {' '}монет
        </div>
      </td>
      <td>
        <Toggle on={enabled} onToggle={() => setEnabled(v => !v)} disabled={saving} />
      </td>
      <td>
        <button
          type="button"
          className="save-link"
          disabled={saving}
          onClick={() => onSave({
            id: model.id,
            price: Number(priceValue),
            enabled,
          })}
        >
          {saving ? '…' : 'Сохранить'}
        </button>
      </td>
    </tr>
  )
}

function ModelsTable({ title, models, savingId, onSave }) {
  if (!models.length) {
    return null
  }

  return (
    <div className="page-section">
      <h2 className="section-title">{title}</h2>
      <div className="table-wrap">
        <table className="admin-table">
          <colgroup>
            <col style={{ width: '34%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Модель</th>
              <th>Провайдер</th>
              <th>Цена за запрос</th>
              <th>Включена</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <ModelRow
                key={model.id}
                model={model}
                saving={savingId === model.id}
                onSave={onSave}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ModelsPage() {
  const qc = useQueryClient()
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['models'],
    queryFn: modelsApi.list,
  })

  const mutation = useMutation({
    mutationFn: ({ id, price, enabled }) => modelsApi.update(id, { price, enabled }),
    onMutate: ({ id }) => {
      setSavingId(id)
      setError(null)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
    },
    onError: () => {
      setError('Не удалось сохранить модель')
    },
    onSettled: () => {
      setSavingId(null)
    },
  })

  const models = data?.data ?? []
  const textModels = useMemo(() => models.filter(m => m.category === 'text'), [models])
  const mediaModels = useMemo(() => models.filter(m => m.category !== 'text'), [models])

  return (
    <div className="page">
      {isError && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          Не удалось загрузить модели.
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      {isLoading
        ? <div className="metric-skeleton" style={{ height: 120 }} />
        : (
          <>
            <ModelsTable
              title="Чат и текст"
              models={textModels}
              savingId={savingId}
              onSave={mutation.mutate}
            />
            <ModelsTable
              title="Изображения, видео и аудио"
              models={mediaModels}
              savingId={savingId}
              onSave={mutation.mutate}
            />
          </>
        )}
    </div>
  )
}
