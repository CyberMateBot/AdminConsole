const MAX_BYTES = 900_000
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|heic|heif|bmp|svg)$/i

// Matches the widget card's frame in the app (the card is stretched to fill
// this ratio there via `object-fit: cover`). Cropping to the same ratio here
// means the photo you see in the admin preview is exactly what shows up in
// the app — no surprise cropping of the subject at display time.
//
// The card is a tall, narrow tile on the home screen (roughly 3:4, portrait)
// rather than a landscape frame — it takes up ~64% of the row width but has
// a fixed min-height of 332-400px, so it ends up taller than it is wide.
export const WIDGET_FRAME_RATIO = 3 / 4

// Decodes a File/Blob into an <img>, rejecting only when we're confident the
// bytes aren't actually an image (some browsers/OS report an empty or wrong
// MIME type even for valid images, so the real check is the decode itself).
//
// IMPORTANT: the resolved <img>'s `.src` is a blob: object URL that is kept
// alive on purpose (not revoked here) — callers that display it (e.g. the
// manual cropper) need it to stay valid for as long as it's rendered.
// Revoking it right after decode (as this used to do) makes the *decoded*
// Image element fine, but breaks any *other* <img> element later pointed at
// the same URL, which silently renders blank with no error. Callers own
// revoking it via `URL.revokeObjectURL(img.src)` once they're done with it.
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const declaredType = file?.type || ''
    if (!declaredType.startsWith('image/') && !IMAGE_EXT_RE.test(file?.name || '')) {
      reject(new Error('Выберите файл изображения'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Не удалось прочитать изображение. Файл повреждён или в формате, который не поддерживает браузер (например HEIC) — попробуйте пересохранить его в JPG/PNG/WebP.'))
    }

    img.src = objectUrl
  })
}

// The default centered "cover" crop rect (in source-image pixels) for the
// given target aspect ratio — the same framing compressImageFile used to
// apply blindly. Used as the initial framing in the manual cropper so
// well-behaved photos need zero adjustment.
export function computeCoverRect(sourceWidth, sourceHeight, aspectRatio) {
  let srcX = 0
  let srcY = 0
  let srcW = sourceWidth
  let srcH = sourceHeight
  const srcRatio = srcW / srcH

  if (aspectRatio && Number.isFinite(aspectRatio) && srcRatio !== aspectRatio) {
    if (srcRatio > aspectRatio) {
      // Wider than the frame — crop the sides.
      const targetW = srcH * aspectRatio
      srcX = (srcW - targetW) / 2
      srcW = targetW
    } else {
      // Taller than the frame — crop top/bottom.
      const targetH = srcW / aspectRatio
      srcY = (srcH - targetH) / 2
      srcH = targetH
    }
  }

  return { srcX, srcY, srcW, srcH }
}

// Draws the given source rect (image pixel coordinates) onto a canvas sized
// to fit `maxWidth`, then encodes as JPEG, stepping quality down until the
// result fits under MAX_BYTES.
export function cropRectToDataUrl(img, { srcX, srcY, srcW, srcH }, { maxWidth = 1200, quality = 0.82 } = {}) {
  const scale = srcW > maxWidth ? maxWidth / srcW : 1
  const width = Math.max(1, Math.round(srcW * scale))
  const height = Math.max(1, Math.round(srcH * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Не удалось обработать изображение')
  }
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height)

  let q = quality
  let dataUrl = canvas.toDataURL('image/jpeg', q)
  while (dataUrl.length > MAX_BYTES && q > 0.45) {
    q -= 0.08
    dataUrl = canvas.toDataURL('image/jpeg', q)
  }

  if (dataUrl.length > MAX_BYTES) {
    throw new Error('Изображение слишком большое. Выберите файл меньше.')
  }

  return dataUrl
}

// Convenience one-shot: decode + auto center-crop to the widget frame ratio
// + compress. Used as a fallback when the caller doesn't need the manual
// cropper (e.g. non-widget uploads).
export async function compressImageFile(file, { maxWidth = 1200, quality = 0.82, aspectRatio = WIDGET_FRAME_RATIO } = {}) {
  const img = await loadImage(file)
  try {
    const rect = computeCoverRect(img.width, img.height, aspectRatio)
    return cropRectToDataUrl(img, rect, { maxWidth, quality })
  } finally {
    URL.revokeObjectURL(img.src)
  }
}

// Re-downloads an already-set widget photo (a saved data: URL or an external
// http(s) link) so it can be re-opened in the manual cropper, or re-cropped
// on its own. Lets admins fix photos that were uploaded before the crop
// ratio changed (or before auto-cropping existed at all) without
// re-uploading from disk.
export async function refetchImageAsFile(url) {
  const trimmed = (url || '').trim()
  if (!trimmed) {
    throw new Error('Фото не задано')
  }

  let response
  try {
    response = await fetch(trimmed)
  } catch {
    throw new Error('Не удалось загрузить фото по ссылке (возможно, блокирует CORS)')
  }
  if (!response.ok) {
    throw new Error('Не удалось загрузить фото по ссылке')
  }

  const blob = await response.blob()
  // Force an image/* type + a recognizable extension so loadImage's type
  // check passes even if the server didn't send a useful Content-Type.
  return new File([blob], 'refit.jpg', { type: blob.type || 'image/jpeg' })
}

export async function refetchAndCompressImage(url, options) {
  const file = await refetchImageAsFile(url)
  return compressImageFile(file, options)
}
