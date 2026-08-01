import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

// Apply saved UI preferences (dark mode / theme) on load
try {
  const saved = localStorage.getItem('app_settings')
  if (saved) {
    const prefs = JSON.parse(saved)
    // support legacy `darkMode` boolean and new `theme` value
    const theme = prefs.theme || (prefs.darkMode ? 'dark' : 'light')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', shouldUseDark)
  }
} catch (e) {
  // ignore
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={10}
      toastOptions={{
        duration: 3500,
        style: {
          background: '#f8fbff',
          color: '#0f172a',
          border: '1px solid #cfe1ff',
          borderRadius: '12px',
          boxShadow: '0 12px 30px -16px rgba(15, 23, 42, 0.45)',
          padding: '12px 14px',
          fontSize: '13px',
          fontWeight: 600,
          maxWidth: '420px',
        },
        success: {
          duration: 2800,
          style: {
            border: '1px solid #86efac',
            background: '#f0fdf4',
            color: '#14532d',
          },
          iconTheme: {
            primary: '#16a34a',
            secondary: '#f0fdf4',
          },
        },
        error: {
          duration: 4200,
          style: {
            border: '1px solid #fda4af',
            background: '#fff1f2',
            color: '#881337',
          },
          iconTheme: {
            primary: '#e11d48',
            secondary: '#fff1f2',
          },
        },
        loading: {
          style: {
            border: '1px solid #93c5fd',
            background: '#eff6ff',
            color: '#1e3a8a',
          },
          iconTheme: {
            primary: '#2563eb',
            secondary: '#eff6ff',
          },
        },
      }}
    />
    <App />
  </React.StrictMode>
)
