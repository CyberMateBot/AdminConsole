export const TAG_PRESETS = [
  {
    id: 'new',
    label: 'NEW — зелёный',
    tag_text: 'NEW',
    tag_bg: 'rgba(60,200,100,0.85)',
    tag_color: '#06291a',
  },
  {
    id: 'promo',
    label: 'PROMO — оранжевый',
    tag_text: 'PROMO',
    tag_bg: 'rgba(255,150,50,0.85)',
    tag_color: '#2b1502',
  },
  {
    id: 'hot',
    label: 'HOT — синий',
    tag_text: 'HOT',
    tag_bg: 'rgba(80,160,255,0.85)',
    tag_color: '#031530',
  },
  {
    id: 'sale',
    label: 'SALE — красный',
    tag_text: 'SALE',
    tag_bg: 'rgba(255,90,90,0.85)',
    tag_color: '#3a0808',
  },
  {
    id: 'none',
    label: 'Без тега',
    tag_text: '',
    tag_bg: 'rgba(60,200,100,0.85)',
    tag_color: '#06291a',
  },
  {
    id: 'custom',
    label: 'Свой тег…',
    tag_text: '',
    tag_bg: '',
    tag_color: '',
  },
]

export function matchTagPreset(form) {
  const found = TAG_PRESETS.find(
    (p) => p.id !== 'custom' && p.id !== 'none'
      && p.tag_text === form.tag_text
      && p.tag_bg === form.tag_bg
      && p.tag_color === form.tag_color,
  )
  if (found) return found.id
  if (!form.tag_text) return 'none'
  return 'custom'
}
