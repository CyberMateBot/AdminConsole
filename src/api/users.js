import { apiClient } from './client'

export const usersApi = {
  list: (params) =>
    apiClient.get('/admin/users', { params }).then(r => r.data),

  getById: (id) =>
    apiClient.get(`/admin/users/${id}`).then(r => r.data),

  toggleActive: (id, is_active) =>
    apiClient.patch(`/admin/users/${id}`, { is_active }).then(r => r.data),

  creditTokens: (id, { amount, reason }) =>
    apiClient.post(`/admin/users/${id}/tokens/credit`, { amount, reason }).then(r => r.data),

  debitTokens: (id, { amount, reason }) =>
    apiClient.post(`/admin/users/${id}/tokens/debit`, { amount, reason }).then(r => r.data),

  setSubscription: (id, payload) =>
    apiClient.post(`/admin/users/${id}/subscription`, payload).then(r => r.data),

  clearSubscription: (id) =>
    apiClient.delete(`/admin/users/${id}/subscription`).then(r => r.data),

  delete: (id) => apiClient.delete(`/admin/users/${id}`),
}
