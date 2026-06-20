import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-page">
          <div className="login-card">
            <h2 className="modal-title">Ошибка интерфейса</h2>
            <p className="login-title" style={{ marginTop: 8 }}>
              Обновите страницу. Если не помогло — очистите данные сайта и войдите снова.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
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
      )
    }
    return this.props.children
  }
}
