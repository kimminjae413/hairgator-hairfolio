import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Get root element
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

// Create root
const root = createRoot(container)

// Render app with error boundary
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

// Service Worker 등록 제거 - sw.js 파일이 없어서 에러 발생하므로 비활성화
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration)
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError)
//       })
//   })
// }

// Hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept()
}
