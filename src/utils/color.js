export function hexToRgb(hex) {
  const normalized = hex.replace('#', '').trim()
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    return { r, g, b }
  }
  if (normalized.length !== 6) return null
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

export function parseRgba(value) {
  const match = String(value).trim().match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  )
  if (!match) return null
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  }
}

export function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbaToPickerParts(value) {
  const rgba = parseRgba(value)
  if (rgba) {
    return {
      hex: rgbToHex(rgba.r, rgba.g, rgba.b),
      alpha: Math.round(rgba.a * 100),
    }
  }
  const rgb = hexToRgb(value)
  if (rgb) {
    return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), alpha: 100 }
  }
  return { hex: '#3cc864', alpha: 85 }
}

export function pickerPartsToRgba(hex, alphaPercent) {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(60,200,100,${(alphaPercent / 100).toFixed(2)})`
  const a = Math.max(0, Math.min(100, alphaPercent)) / 100
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a.toFixed(2)})`
}

export function normalizeHexColor(value, fallback = '#06291a') {
  const trimmed = String(value).trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/)
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  const rgb = hexToRgb(trimmed)
  if (rgb) return rgbToHex(rgb.r, rgb.g, rgb.b)
  return fallback
}
