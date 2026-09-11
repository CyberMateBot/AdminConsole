import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { cropRectToDataUrl, loadImage, WIDGET_FRAME_RATIO, WIDGET_IMAGE_WIDTH } from '@/utils/image'

const MAX_ZOOM_MULTIPLIER = 3

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// Lets the admin drag/zoom a photo before it's cropped to the widget frame
// ratio, instead of blindly center-cropping it. Auto-composed graphics
// (e.g. a poster with text baked in near the edges) need a human to decide
// what stays in frame - a blind center crop can (and does) slice into text.
export default function ImageCropperModal({ file, aspectRatio = WIDGET_FRAME_RATIO, onCancel, onConfirm }) {
  const viewportRef = useRef(null)
  const dragRef = useRef(null)

  const [img, setImg] = useState(null)
  const [error, setError] = useState(null)
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [framedFor, setFramedFor] = useState(null)

  // Decode the file once.
  useEffect(() => {
    let cancelled = false
    loadImage(file)
      .then((loaded) => {
        if (cancelled) {
          // Modal was closed/re-targeted before decode finished - nothing
          // else will ever reference this blob URL, so release it now.
          URL.revokeObjectURL(loaded.src)
          return
        }
        setImg(loaded)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Не удалось загрузить изображение')
      })
    return () => {
      cancelled = true
    }
  }, [file])

  // Release the decoded image's blob URL once it's no longer shown (either
  // a new file replaced it, or the modal unmounted).
  useEffect(() => {
    if (!img) return
    const url = img.src
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [img])

  // Measure the viewport box (fixed via CSS aspect-ratio) once it's laid out.
  useEffect(() => {
    const measure = () => {
      const el = viewportRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setViewportSize({ w: rect.width, h: rect.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const scaleMin = useMemo(() => {
    if (!img || !viewportSize.w || !viewportSize.h) return 1
    return Math.max(viewportSize.w / img.width, viewportSize.h / img.height)
  }, [img, viewportSize])

  // Initialize scale/position to match the previous blind auto-crop, so a
  // well-framed photo needs zero adjustment - dragging/zooming is optional.
  // Done as a render-phase state adjustment (React's documented pattern for
  // resetting state when a derived value changes) rather than in an effect,
  // since it only needs to run once per newly-measured image.
  const frameKey = img && viewportSize.w && viewportSize.h ? `${img.src}:${viewportSize.w}x${viewportSize.h}` : null
  if (frameKey && frameKey !== framedFor) {
    setFramedFor(frameKey)
    setScale(scaleMin)
    setPos({
      x: (viewportSize.w - img.width * scaleMin) / 2,
      y: (viewportSize.h - img.height * scaleMin) / 2,
    })
  }

  const clampPos = useCallback((nextPos, nextScale) => {
    if (!img) return nextPos
    const minX = viewportSize.w - img.width * nextScale
    const minY = viewportSize.h - img.height * nextScale
    return {
      x: clamp(nextPos.x, minX, 0),
      y: clamp(nextPos.y, minY, 0),
    }
  }, [img, viewportSize])

  const handlePointerDown = (event) => {
    if (!img) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = { startX: event.clientX, startY: event.clientY, origin: pos }
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current) return
    const { startX, startY, origin } = dragRef.current
    const next = {
      x: origin.x + (event.clientX - startX),
      y: origin.y + (event.clientY - startY),
    }
    setPos(clampPos(next, scale))
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const applyZoom = useCallback((nextScale) => {
    if (!img) return
    const clampedScale = clamp(nextScale, scaleMin, scaleMin * MAX_ZOOM_MULTIPLIER)
    // Zoom around the viewport center so the subject doesn't jump.
    const cx = viewportSize.w / 2
    const cy = viewportSize.h / 2
    const ratio = clampedScale / scale
    const next = {
      x: cx - (cx - pos.x) * ratio,
      y: cy - (cy - pos.y) * ratio,
    }
    setScale(clampedScale)
    setPos(clampPos(next, clampedScale))
  }, [img, pos, scale, scaleMin, viewportSize, clampPos])

  const handleWheel = (event) => {
    if (!img) return
    event.preventDefault()
    applyZoom(scale * (event.deltaY < 0 ? 1.08 : 1 / 1.08))
  }

  const handleReset = () => {
    if (!img || !viewportSize.w || !viewportSize.h) return
    setScale(scaleMin)
    setPos({
      x: (viewportSize.w - img.width * scaleMin) / 2,
      y: (viewportSize.h - img.height * scaleMin) / 2,
    })
  }

  const handleConfirm = () => {
    if (!img) return
    setSaving(true)
    setError(null)
    try {
      const srcX = clamp(-pos.x / scale, 0, img.width)
      const srcY = clamp(-pos.y / scale, 0, img.height)
      const srcW = Math.min(viewportSize.w / scale, img.width - srcX)
      const srcH = Math.min(viewportSize.h / scale, img.height - srcY)
      const dataUrl = cropRectToDataUrl(img, { srcX, srcY, srcW, srcH }, { maxWidth: WIDGET_IMAGE_WIDTH, quality: 0.82 })
      onConfirm(dataUrl)
    } catch (err) {
      setError(err.message || 'Не удалось обрезать изображение')
      setSaving(false)
    }
  }

  const zoomPercent = scaleMin > 0 ? Math.round((scale / scaleMin) * 100) : 100

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Кадрирование фото</h3>
            <p className="modal-sub">
              Перетащите фото и используйте зум, чтобы выбрать, что попадёт в рамку виджета (8:15, 187×360)
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        {error && <p className="login-error">{error}</p>}

        <div
          ref={viewportRef}
          className="cropper-viewport"
          style={{ aspectRatio }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          onWheel={handleWheel}
        >
          {img ? (
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="cropper-viewport__image"
              style={{
                width: img.width * scale,
                height: img.height * scale,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
              }}
            />
          ) : !error ? (
            <div className="cropper-viewport__loading">Загрузка…</div>
          ) : null}
        </div>

        {img && (
          <div className="cropper-controls">
            <button
              type="button"
              className="topbar-btn cropper-zoom-btn"
              onClick={() => applyZoom(scale / 1.15)}
              disabled={saving}
              aria-label="Уменьшить"
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              className="cropper-zoom-range"
              min={100}
              max={MAX_ZOOM_MULTIPLIER * 100}
              step={1}
              value={zoomPercent}
              disabled={saving}
              onChange={(e) => applyZoom(scaleMin * (Number(e.target.value) / 100))}
            />
            <button
              type="button"
              className="topbar-btn cropper-zoom-btn"
              onClick={() => applyZoom(scale * 1.15)}
              disabled={saving}
              aria-label="Увеличить"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={handleReset} disabled={!img || saving}>
            Сбросить
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            Отмена
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm} disabled={!img || saving}>
            {saving ? 'Сохраняем…' : 'Готово'}
          </button>
        </div>
      </div>
    </div>
  )
}
