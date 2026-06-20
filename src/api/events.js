import { apiClient } from './client'

export const eventsApi = {
  list: (params) =>
    apiClient.get('/admin/events', { params }).then(r => r.data),
}
