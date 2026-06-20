import { apiClient } from './client'

export const transactionsApi = {
  list: (params) =>
    apiClient.get('/admin/transactions', { params }).then(r => r.data),
}
