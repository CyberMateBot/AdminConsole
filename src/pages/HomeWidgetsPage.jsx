import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { homeWidgetsApi } from '@/api/homeWidgets'
import { TAG_PRESETS, matchTagPreset } from '@/constants/homeWidgetTags'
import {
  normalizeHexColor,
  pickerPartsToRgba,
  rgbaToPickerParts,
} from '@/utils/color'
import { compressImageFile } from '@/utils/image'

const emptyForm = {
  sort_order: 0,
  tag_text: '',
  tag_bg: 'rgba(60,200,100,0.85)',
  tag_color: '#06291a',
  title: '',
  description: '',
  background_style: 'linear-gradient(135deg,#1a1030,#2a1840)',
  image_url: '',
  is_active: true,
}

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

function TagPreview({ tagText, tagBg, tagColor }) {
  if (!tagText) return null
  return (
    <span className="widget-tag-preview" style={{ background: tagBg, color: tagColor }}>
      {tagText}
    </span>
  )
}

function ColorField({ id, label, value, onChange, mode = 'hex' }) {
  if (mode === 'rgba') {
    const { hex, alpha } = rgbaToPickerParts(value)
    return (
      <div className="field-group">
        <label className="field-label" htmlFor={id}>{label}</label>
        <div className="color-field-row">
          <input
            id={id}
            type="color"
            className="color-picker-swatch"
            value={hex}
            onChange={(e) => onChange(pickerPartsToRgba(e.target.value, alpha))}
            title="Выберите цвет"
          />
          <input
            type="range"
            className="color-opacity-range"
            min={0}
            max={100}
            value={alpha}
            onChange={(e) => onChange(pickerPartsToRgba(hex, Number(e.target.value)))}
            title="Прозрачность"
          />
          <span className="color-opacity-label">{alpha}%</span>
        </div>
        <input
          className="admin-input color-field-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="rgba(60,200,100,0.85)"
        />
      </div>
    )
  }

  const pickerHex = normalizeHexColor(value)

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="color-field-row">
        <input
          id={id}
          type="color"
          className="color-picker-swatch"
          value={pickerHex}
          onChange={(e) => onChange(e.target.value)}
          title="Выберите цвет"
        />
        <input
          className="admin-input color-field-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#06291a"
        />
      </div>
    </div>
  )
}

function ImageUploadField({ value, onChange, disabled }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const dataUrl = await compressImageFile(file)
      onChange(dataUrl)
    } catch (err) {
      setUploadError(err.message || 'Не удалось загрузить фото')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isDataUrl = value?.startsWith('data:image/')

  return (
    <div className="field-group">
      <label className="field-label">Фото</label>
      <div className="image-upload">
        {value ? (
          <div className="image-upload__preview-wrap">
            <img src={value} alt="" className="image-upload__preview" />
            <button
              type="button"
              className="topbar-btn image-upload__clear"
              disabled={disabled || uploading}
              onClick={() => onChange('')}
            >
              Удалить
            </button>
          </div>
        ) : (
          <div className="image-upload__placeholder">Фото не выбрано</div>
        )}

        <div className="image-upload__actions">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="image-upload__input"
            disabled={disabled || uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className="btn-secondary"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Загрузка…' : 'Загрузить с компьютера'}
          </button>
        </div>

        <div className="field-group" style={{ marginBottom: 0, marginTop: 10 }}>
          <label className="field-label" htmlFor="widget-image-url">или URL фото</label>
          <input
            id="widget-image-url"
            className="admin-input"
            placeholder="https://..."
            value={isDataUrl ? '' : value}
            disabled={disabled || uploading || isDataUrl}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        {uploadError && <p className="login-error">{uploadError}</p>}
        <p className="field-hint">JPG, PNG, WebP до ~1 МБ. Если указано фото — оно используется вместо градиента.</p>
      </div>
    </div>
  )
}

function WidgetForm({ title, initial, submitLabel, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [tagPresetId, setTagPresetId] = useState(() => matchTagPreset(initial))

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const applyTagPreset = (presetId) => {
    setTagPresetId(presetId)
    const preset = TAG_PRESETS.find((p) => p.id === presetId)
    if (!preset || presetId === 'custom') return
    setForm((prev) => ({
      ...prev,
      tag_text: preset.tag_text,
      tag_bg: preset.tag_bg || prev.tag_bg,
      tag_color: preset.tag_color || prev.tag_color,
    }))
  }

  const showCustomTagInput = tagPresetId === 'custom'

  return (
    <div className="page-section">
      <h2 className="section-title">{title}</h2>
      <form
        className="widget-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            ...form,
            sort_order: Number(form.sort_order) || 0,
          })
        }}
      >
        <div className="widget-form__grid">
          <div className="field-group">
            <label className="field-label" htmlFor="widget-sort">Порядок</label>
            <input
              id="widget-sort"
              type="number"
              className="admin-input"
              value={form.sort_order}
              onChange={(e) => setField('sort_order', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="widget-tag-preset">Тег</label>
            <select
              id="widget-tag-preset"
              className="admin-select"
              value={tagPresetId}
              onChange={(e) => applyTagPreset(e.target.value)}
            >
              {TAG_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
            {showCustomTagInput && (
              <input
                className="admin-input"
                style={{ marginTop: 8 }}
                placeholder="Текст тега, например UPDATE"
                value={form.tag_text}
                onChange={(e) => setField('tag_text', e.target.value)}
              />
            )}
            <div style={{ marginTop: 8 }}>
              <TagPreview
                tagText={form.tag_text}
                tagBg={form.tag_bg}
                tagColor={form.tag_color}
              />
            </div>
          </div>

          <ColorField
            id="widget-tag-bg"
            label="Цвет тега (фон)"
            mode="rgba"
            value={form.tag_bg}
            onChange={(v) => {
              setTagPresetId('custom')
              setField('tag_bg', v)
            }}
          />

          <ColorField
            id="widget-tag-color"
            label="Цвет текста тега"
            mode="hex"
            value={form.tag_color}
            onChange={(v) => {
              setTagPresetId('custom')
              setField('tag_color', v)
            }}
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="widget-title">Заголовок</label>
          <input
            id="widget-title"
            className="admin-input"
            required
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="widget-desc">Описание</label>
          <textarea
            id="widget-desc"
            className="admin-textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>

        <ImageUploadField
          value={form.image_url}
          onChange={(v) => setField('image_url', v)}
          disabled={saving}
        />

        <div className="field-group">
          <label className="field-label" htmlFor="widget-bg">Фон (CSS gradient)</label>
          <input
            id="widget-bg"
            className="admin-input"
            value={form.background_style}
            onChange={(e) => setField('background_style', e.target.value)}
            disabled={Boolean(form.image_url)}
          />
          {form.image_url ? (
            <p className="field-hint">Градиент не используется, пока задано фото</p>
          ) : null}
        </div>

        <div className="widget-form__footer">
          <div className="setting-row widget-form__toggle-row">
            <div>
              <div className="setting-label">Активен</div>
              <div className="setting-sub">Показывать в карусели на главной</div>
            </div>
            <Toggle
              on={form.is_active}
              onToggle={() => setField('is_active', !form.is_active)}
              disabled={saving}
            />
          </div>

          <div className="widget-form__actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '…' : submitLabel}
            </button>
            {onCancel && (
              <button type="button" className="topbar-btn" onClick={onCancel} disabled={saving}>
                Отмена
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

function WidgetRow({ widget, onEdit, onDelete, deleting }) {
  return (
    <tr>
      <td>{widget.sort_order}</td>
      <td>
        <strong>{widget.title}</strong>
        {widget.tag_text ? (
          <div className="table-sub">
            <TagPreview
              tagText={widget.tag_text}
              tagBg={widget.tag_bg}
              tagColor={widget.tag_color}
            />
          </div>
        ) : null}
      </td>
      <td>{widget.is_active ? 'Да' : 'Нет'}</td>
      <td>
        {widget.image_url ? (
          <a href={widget.image_url} target="_blank" rel="noreferrer">Фото</a>
        ) : (
          <span className="text-muted">Градиент</span>
        )}
      </td>
      <td>
        <button type="button" className="save-link" onClick={() => onEdit(widget)}>
          Изменить
        </button>
        {' · '}
        <button
          type="button"
          className="save-link danger"
          disabled={deleting}
          onClick={() => onDelete(widget.id)}
        >
          {deleting ? '…' : 'Удалить'}
        </button>
      </td>
    </tr>
  )
}

export default function HomeWidgetsPage() {
  const qc = useQueryClient()
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['home-widgets'],
    queryFn: homeWidgetsApi.list,
  })

  const widgets = useMemo(() => {
    const items = data?.data ?? []
    return [...items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
  }, [data])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['home-widgets'] })

  const createMutation = useMutation({
    mutationFn: homeWidgetsApi.create,
    onSuccess: () => {
      invalidate()
      setCreating(false)
      setError(null)
    },
    onError: () => setError('Не удалось создать виджет'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => homeWidgetsApi.update(id, payload),
    onSuccess: () => {
      invalidate()
      setEditing(null)
      setError(null)
    },
    onError: () => setError('Не удалось сохранить виджет'),
  })

  const deleteMutation = useMutation({
    mutationFn: homeWidgetsApi.remove,
    onMutate: (id) => setDeletingId(id),
    onSuccess: () => {
      invalidate()
      setError(null)
    },
    onError: () => setError('Не удалось удалить виджет'),
    onSettled: () => setDeletingId(null),
  })

  return (
    <div className="page">
      {isError && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          Не удалось загрузить виджеты. Убедитесь, что выполнена миграция home_widgets.
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <div className="page-section page-section--toolbar">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setCreating(true)
            setEditing(null)
          }}
          disabled={creating || Boolean(editing)}
        >
          Добавить виджет
        </button>
      </div>

      {creating && (
        <WidgetForm
          key="create"
          title="Новый виджет"
          initial={emptyForm}
          submitLabel="Создать"
          saving={createMutation.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
        />
      )}

      {editing && (
        <WidgetForm
          key={editing.id}
          title="Редактирование виджета"
          initial={{
            sort_order: editing.sort_order,
            tag_text: editing.tag_text,
            tag_bg: editing.tag_bg,
            tag_color: editing.tag_color,
            title: editing.title,
            description: editing.description,
            background_style: editing.background_style,
            image_url: editing.image_url,
            is_active: editing.is_active,
          }}
          submitLabel="Сохранить"
          saving={updateMutation.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={(payload) => updateMutation.mutate({ id: editing.id, payload })}
        />
      )}

      <div className="page-section">
        <h2 className="section-title">Список виджетов</h2>
        {isLoading ? (
          <div className="metric-skeleton" style={{ height: 120 }} />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Заголовок</th>
                  <th>Активен</th>
                  <th>Фон</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {widgets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      Нет виджетов — добавьте первый или в приложении покажутся встроенные слайды.
                    </td>
                  </tr>
                ) : (
                  widgets.map((widget) => (
                    <WidgetRow
                      key={widget.id}
                      widget={widget}
                      deleting={deletingId === widget.id}
                      onEdit={(item) => {
                        setEditing(item)
                        setCreating(false)
                      }}
                      onDelete={(id) => {
                        if (window.confirm('Удалить виджет?')) {
                          deleteMutation.mutate(id)
                        }
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
