import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <div className="card bg-white shadow max-w-md w-full">
            <div className="card-body gap-3">
              <h2 className="font-semibold text-base">Ошибка интерфейса</h2>
              <p className="text-sm text-gray-600">
                Обновите страницу. Если не помогло — очистите данные сайта (localStorage) и войдите снова.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  localStorage.removeItem('admin_token')
                  localStorage.removeItem('admin_user')
                  window.location.href = '/login'
                }}
              >
                Сбросить и на login
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
