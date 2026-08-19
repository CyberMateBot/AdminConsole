import { apiClient } from './client'

export const feedbackApi = {
  listSuggestions: async ({ page = 1, perPage = 20 } = {}) => {
    const { data } = await apiClient.get('/admin/feedback', {
      params: { page, per_page: perPage, kind: 'suggestion' },
    })
    return data
  },

  listBugs: async ({ page = 1, perPage = 20 } = {}) => {
    const { data } = await apiClient.get('/admin/feedback', {
      params: { page, per_page: perPage, kind: 'bug' },
    })
    return data
  },

  remove: async (id) => {
    await apiClient.delete(`/admin/feedback/${id}`)
  },
}
