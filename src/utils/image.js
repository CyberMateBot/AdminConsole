const MAX_BYTES = 900_000

export function compressImageFile(file, { maxWidth = 1200, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Выберите файл изображения'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Не удалось обработать изображение'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

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
      reject(new Error('Не удалось прочитать изображение'))
    }

    img.src = objectUrl
  })
}
