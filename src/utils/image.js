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
const WIDGET_FRAME_RATIO = 3 / 4

export function compressImageFile(file, { maxWidth = 1200, quality = 0.82, aspectRatio = WIDGET_FRAME_RATIO } = {}) {
  return new Promise((resolve, reject) => {
    const declaredType = file?.type || ''
    // Some browsers/OS report an empty or generic type (e.g. after a file was
    // saved with a wrong/double extension like "image.png.bin") even though
    // the bytes are a perfectly valid image — only reject up front when we're
    // confident it's *not* an image (both the MIME type and the extension
    // disagree). The actual decode below is the real source of truth.
    if (!declaredType.startsWith('image/') && !IMAGE_EXT_RE.test(file?.name || '')) {
      reject(new Error('Выберите файл изображения'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Auto-fit: center-crop the source image to the widget frame's aspect
      // ratio before resizing, so any photo (portrait, square, panorama...)
      // automatically fills the widget card without unpredictable crops.
      let srcX = 0
      let srcY = 0
      let srcW = img.width
      let srcH = img.height
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

      const scale = srcW > maxWidth ? maxWidth / srcW : 1
      const width = Math.max(1, Math.round(srcW * scale))
      const height = Math.max(1, Math.round(srcH * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Не удалось обработать изображение'))
        return
      }
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height)

      let q = quality
      let dataUrl = canvas.toDataURL('image/jpeg', q)
      while (dataUrl.length > MAX_BYTES && q > 0.45) {
        q -= 0.08
        dataUrl = canvas.toDataURL('image/jpeg', q)
      }

      if (dataUrl.length > MAX_BYTES) {
        reject(new Error('Изображение слишком большое. Выберите файл меньше.'))
        return
      }

      resolve(dataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Не удалось прочитать изображение. Файл повреждён или в формате, который не поддерживает браузер (например HEIC) — попробуйте пересохранить его в JPG/PNG/WebP.'))
    }

    img.src = objectUrl
  })
}
