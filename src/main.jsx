import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'

const storedTheme = localStorage.getItem('admin_theme')
if (storedTheme === 'light' || storedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', storedTheme)
} else {
  document.documentElement.setAttribute(
    'data-theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
