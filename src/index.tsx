import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// i18n 초기화 (App 컴포넌트보다 먼저 import)
import './i18n'

// 다국어 로딩 중 표시할 컴포넌트
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

// Get root element
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

// Create root
const root = createRoot(container)

// Render app with error boundary and i18n suspense
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <App />
      </Suspense>
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
