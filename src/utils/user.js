export function getInitials(user) {
  const first = user.first_name?.trim()
  const last = user.last_name?.trim()
  if (first && last) return (first[0] + last[0]).toUpperCase()
  if (first) return first.slice(0, 2).toUpperCase()
  if (user.username) return user.username.slice(0, 2).toUpperCase()
  return '?'
}

export function formatUserName(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return name || user.username || `ID ${user.id}`
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru')
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
