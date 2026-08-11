import { apiClient } from './client'

export const homeWidgetsApi = {
  list: async () => {
    const { data } = await apiClient.get('/admin/home-widgets')
    return data
  },

  create: async (payload) => {
    const { data } = await apiClient.post('/admin/home-widgets', payload)
    return data
  },

  update: async (id, payload) => {
    const { data } = await apiClient.patch(`/admin/home-widgets/${id}`, payload)
    return data
  },

  remove: async (id) => {
    await apiClient.delete(`/admin/home-widgets/${id}`)
  },
}
