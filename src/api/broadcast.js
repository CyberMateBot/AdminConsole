import { apiClient } from './client'

export const broadcastApi = {
  send: (payload) =>
    apiClient.post('/admin/broadcast', payload).then(r => r.data),
}
