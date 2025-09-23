import React, { useState, useEffect } from 'react'
import { LoadingState, Hairstyle } from '../types'
import SparklesIcon from './icons/SparklesIcon'

interface ResultDisplayProps {
  beforeSrc: string
  afterSrc: string | null
  onReset: () => void
  loadingState: LoadingState
  error: string | null
  reservationUrl?: string
  hairstyle?: Hairstyle
  onBookNow?: (hairstyle: Hairstyle) => void
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  beforeSrc,
  afterSrc,
  onReset,
  loadingState,
  error,
  reservationUrl,
  hairstyle,
  onBookNow
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const isLoading = loadingState === 'analyzing' || loadingState === 'generating'
  const isSuccess = loadingState === 'done' && afterSrc

  // Loading messages for different states
  const loadingMessages: { [key in LoadingState]?: { title: string; subtitle: string } } = {
    analyzing: {
      title: '헤어스타일 분석 중...',
      subtitle: '업로드된 스타일의 특징을 분석하고 있습니다'
    },
    generating: {
      title: 'AI 변환 처리 중...',
      subtitle: '얼굴에 새로운 헤어스타일을 적용하고 있습니다'
    }
  }

  // Handle booking click
  const handleBookNowClick = () => {
    if (hairstyle && onBookNow) {
      onBookNow(hairstyle)
    }
  }

  // Handle image download
  const handleDownload = () => {
    if (afterSrc) {
      const link = document.createElement('a')
      link.href = afterSrc
      link.download = `hairfolio-${hairstyle?.name || 'style'}-result.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle image share (Web Share API)
  const handleShare = async () => {
    if (!afterSrc) return

    try {
      // Convert base64 to blob
      const response = await fetch(afterSrc)
      const blob = await response.blob()
      const file = new File([blob], `hairfolio-result.jpg`, { type: 'image/jpeg' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Hairfolio - ${hairstyle?.name} 스타일`,
          text: `Hairfolio에서 ${hairstyle?.name} 스타일을 체험해봤어요!`,
          files: [file]
        })
      } else {
        // Fallback to copying image URL
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(window.location.href)
          alert('링크가 클립보드에 복사되었습니다!')
        } else {
          alert('공유 기능을 지원하지 않는 브라우저입니다.')
        }
      }
    } catch (error) {
      console.error('Share failed:', error)
      // Fallback to download
      handleDownload()
    }
  }

  // Close modal with escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onReset()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onReset])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onReset}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="result-title" className="text-2xl font-bold text-gray-800">
              {isLoading ? '처리중...' : isSuccess ? '변환 완료!' : '오류 발생'}
            </h2>
            {hairstyle && (
              <p className="text-sm text-gray-600 mt-1">
                {hairstyle.name} 스타일 적용
              </p>
            )}
          </div>
          <button
            onClick={onReset}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                {/* Main spinner */}
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-6"></div>
                
                {/* Progress indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {loadingMessages[loadingState]?.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {loadingMessages[loadingState]?.subtitle}
                </p>
                
                {/* Progress steps */}
                <div className="flex items-center justify-center space-x-4 mt-6">
                  <div className={`flex items-center space-x-2 ${loadingState === 'analyzing' ? 'text-indigo-600' : 'text-green-600'}`}>
                    <div className={`w-4 h-4 rounded-full ${loadingState === 'analyzing' ? 'bg-indigo-600 animate-pulse' : 'bg-green-600'} flex items-center justify-center`}>
                      {loadingState !== 'analyzing' && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">분석</span>
                  </div>
                  
                  <div className={`w-8 h-0.5 ${loadingState === 'generating' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                  
                  <div className={`flex items-center space-x-2 ${loadingState === 'generating' ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full ${loadingState === 'generating' ? 'bg-indigo-600 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium">변환</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-4">
                  잠시만 기다려주세요. 보통 30초 정도 소요됩니다.
                </p>
              </div>
            </div>
          )}
        
          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-red-600 mb-4">처리 중 오류가 발생했습니다</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={onReset}
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    다시 시도하기
                  </button>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• 얼굴이 명확히 보이는 사진을 사용해주세요</p>
                    <p>• 인터넷 연결 상태를 확인해주세요</p>
                    <p>• 문제가 계속되면 다른 사진으로 시도해보세요</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {isSuccess && afterSrc && (
            <div className="space-y-6">
              {/* Before/After Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-700 text-center">변환 전</h3>
                  <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md">
                    <img 
                      src={beforeSrc} 
                      alt="원본 사진" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* After */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-700 text-center">변환 후</h3>
                  <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md">
                    {afterSrc && (
                      <img 
                        src={afterSrc} 
                        alt={`${hairstyle?.name} 스타일 적용 결과`}
                        className="w-full h-full object-cover"
                        onLoad={() => setImageLoaded(true)}
                      />
                    )}
                    
                    {/* Success badge */}
                    <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <SparklesIcon />
                      <span>완료</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Style Info */}
              {hairstyle && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                      <img src={hairstyle.url} alt={hairstyle.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{hairstyle.name}</h4>
                      {hairstyle.description && (
                        <p className="text-sm text-gray-600">{hairstyle.description}</p>
                      )}
                      {hairstyle.tags && hairstyle.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {hairstyle.tags.slice(0, 4).map((tag, index) => (
                            <span key={index} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Book Now */}
                {reservationUrl && hairstyle && onBookNow && (
                  <button
                    onClick={handleBookNowClick}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6m-6 0a2 2 0 00-2 2v3a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2m-6 0V7" />
                    </svg>
                    예약하기
                  </button>
                )}

                {/* Download */}
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  다운로드
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  공유
                </button>

                {/* Try Another */}
                <button
                  onClick={onReset}
                  className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  다른 스타일
                </button>
              </div>

              {/* Tips */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-800 mb-2">💡 결과가 마음에 드시나요?</h4>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• 이 스타일이 마음에 드시면 예약 버튼을 눌러보세요</li>
                  <li>• 결과 이미지를 저장하여 미용실에서 보여주세요</li>
                  <li>• 다른 스타일도 체험해보고 비교해보세요</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultDisplay
