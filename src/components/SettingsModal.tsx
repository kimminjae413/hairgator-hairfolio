import React, { useState, useEffect } from 'react'

interface SettingsModalProps {
  currentUrl: string
  onSave: (newUrl: string) => void
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentUrl, onSave, onClose }) => {
  const [url, setUrl] = useState(currentUrl)
  const [isValidUrl, setIsValidUrl] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  // Validate URL format
  const validateUrl = (inputUrl: string): boolean => {
    if (!inputUrl.trim()) return true // Empty URL is valid (no reservation system)
    
    try {
      new URL(inputUrl)
      return inputUrl.startsWith('http://') || inputUrl.startsWith('https://')
    } catch {
      return false
    }
  }

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setIsValidUrl(validateUrl(newUrl))
  }

  // Handle save
  const handleSave = () => {
    const trimmedUrl = url.trim()
    
    if (!validateUrl(trimmedUrl)) {
      alert('올바른 URL 형식이 아닙니다. http:// 또는 https://로 시작하는 URL을 입력해주세요.')
      return
    }
    
    onSave(trimmedUrl)
  }

  // Handle test URL
  const handleTestUrl = () => {
    if (url && isValidUrl) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Popular booking platforms in Korea
  const popularPlatforms = [
    {
      name: '네이버 예약',
      baseUrl: 'https://booking.naver.com/',
      description: '네이버 예약 시스템',
      color: 'bg-green-500'
    },
    {
      name: '카카오 헤어샵',
      baseUrl: 'https://hairshop.kakao.com/',
      description: '카카오 헤어샵 예약',
      color: 'bg-yellow-500'
    },
    {
      name: '직접 입력',
      baseUrl: '',
      description: '다른 예약 시스템 또는 연락처',
      color: 'bg-blue-500'
    }
  ]

  // Close modal with escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">포트폴리오 설정</h2>
            <p className="text-indigo-100 text-sm">예약 링크 및 기본 설정을 관리하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-100 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Popular Platforms */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">인기 예약 플랫폼</h3>
            <div className="grid grid-cols-1 gap-2">
              {popularPlatforms.map((platform, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (platform.baseUrl) {
                      setUrl(platform.baseUrl)
                      setIsValidUrl(true)
                    }
                  }}
                  className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className={`w-3 h-3 ${platform.color} rounded-full mr-3`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{platform.name}</p>
                    <p className="text-sm text-gray-600">{platform.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label htmlFor="reservation-url" className="block text-sm font-medium text-gray-700 mb-2">
              예약 링크 URL
            </label>
            <div className="space-y-2">
              <input
                id="reservation-url"
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://booking.naver.com/your-salon-id"
                className={`w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 transition-colors ${
                  isValidUrl 
                    ? 'border-gray-300 focus:ring-indigo-500 focus:border-transparent' 
                    : 'border-red-300 focus:ring-red-500 bg-red-50'
                }`}
              />
              
              {!isValidUrl && url && (
                <p className="text-red-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  올바른 URL 형식이 아닙니다 (http:// 또는 https://로 시작해야 함)
                </p>
              )}

              {/* Test URL Button */}
              {url && isValidUrl && (
                <button
                  onClick={handleTestUrl}
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  링크 테스트
                </button>
              )}
            </div>
          </div>

          {/* URL Examples */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">URL 예시:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• 네이버 예약: https://booking.naver.com/booking/12/bizes/123456</p>
              <p>• 카카오 헤어샵: https://hairshop.kakao.com/salon/12345</p>
              <p>• 자체 웹사이트: https://mysalon.com/booking</p>
              <p>• 전화번호: tel:010-1234-5678</p>
            </div>
          </div>

          {/* Settings Preview */}
          {url && isValidUrl && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="font-medium text-indigo-800 mb-2">설정 미리보기</h4>
              <div className="bg-white rounded-lg p-3 border border-indigo-200">
                <p className="text-sm text-gray-600 mb-2">고객이 헤어스타일을 체험한 후 보게 될 예약 버튼:</p>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6m-6 0a2 2 0 00-2 2v3a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2m-6 0V7" />
                  </svg>
                  예약하기
                </button>
              </div>
            </div>
          )}

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.95-.833-2.72 0L4.096 15.5C3.326 16.333 4.286 18 5.826 18z" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">참고사항</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 예약 링크를 설정하지 않으면 예약 버튼이 표시되지 않습니다</li>
                  <li>• 설정한 링크는 새 탭에서 열립니다</li>
                  <li>• 전화번호를 입력하면 모바일에서 바로 전화를 걸 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row-reverse gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSave}
            disabled={url && !isValidUrl}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            저장하기
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
