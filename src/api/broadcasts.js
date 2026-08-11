import { apiClient } from './client'

export const broadcastsApi = {
  list: (params) =>
    apiClient.get('/admin/broadcasts', { params }).then(r => r.data),
}
