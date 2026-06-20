import { apiClient } from './client'

export const pricingApi = {
  listPlans: () => apiClient.get('/admin/billing/subscription-plans').then(r => r.data),
  updatePlans: (data) => apiClient.put('/admin/billing/subscription-plans', { data }).then(r => r.data),
  listCoinPacks: () => apiClient.get('/admin/billing/coin-packs').then(r => r.data),
  updateCoinPacks: (data) => apiClient.put('/admin/billing/coin-packs', { data }).then(r => r.data),
}
