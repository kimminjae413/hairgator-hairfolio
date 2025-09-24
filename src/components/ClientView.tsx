import React, { useState, useCallback, useEffect } from 'react'
import { analyzeHairstyle, applyHairstyle } from '../services/vmodelService'
import * as firebaseService from '../services/firebaseService'
import { LoadingState, Hairstyle, DesignerProfile } from '../types'
import ImageUploader from './ImageUploader'
import ResultDisplay from './ResultDisplay'
import HairstyleGallery from './HairstyleGallery'
import UserIcon from './icons/UserIcon'

interface ClientViewProps {
  designerName: string
}

// Helper function to convert URL to File object
const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const blob = await response.blob()
    return new File([blob], filename, { type: mimeType })
  } catch (error) {
    console.error('Error converting URL to file:', error)
    throw new Error('이미지를 불러올 수 없습니다.')
  }
}

const ClientView: React.FC<ClientViewProps> = ({ designerName }) => {
  // State for uploaded face image
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [facePreview, setFacePreview] = useState<string | null>(null)
  
  // State for designer data
  const [portfolio, setPortfolio] = useState<Hairstyle[]>([])
  const [reservationUrl, setReservationUrl] = useState<string>('')
  const [designerProfile, setDesignerProfile] = useState<DesignerProfile | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  
  // State for AI processing
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  
  // Load designer data on mount
  useEffect(() => {
    const loadDesignerData = async () => {
      try {
        setIsDataLoading(true)
        console.log('디자이너 데이터 로딩 시작:', designerName)
        
        // Firebase에서 디자이너 데이터 로드 (localStorage 폴백 포함)
        const data = await firebaseService.getDesignerData(designerName)
        console.log('로드한 데이터:', data)
        
        setPortfolio(data.portfolio || [])
        setReservationUrl(data.reservationUrl || '')
        setDesignerProfile(data.profile || null)
        
        // Track visit
        await firebaseService.trackVisit(designerName)
      } catch (error) {
        console.error('Error loading designer data:', error)
        setError('디자이너 정보를 불러올 수 없습니다.')
      } finally {
        setIsDataLoading(false)
      }
    }
    
    loadDesignerData()
  }, [designerName])

  // Handle face image upload
  const handleFaceFileChange = useCallback((file: File | null) => {
    setFaceFile(file)
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setFacePreview(previewUrl)
      
      // Clean up any existing error
      if (error) setError(null)
    } else {
      if (facePreview) {
        URL.revokeObjectURL(facePreview)
      }
      setFacePreview(null)
    }
  }, [facePreview, error])

  // Handle hairstyle selection and AI processing
  const handleHairstyleSelect = useCallback(async (hairstyle: Hairstyle) => {
    if (!faceFile) {
      setError('먼저 얼굴 사진을 업로드해주세요.')
      return
    }

    // Reset previous results
    setSelectedHairstyle(hairstyle)
    setLoadingState('analyzing')
    setError(null)
    setGeneratedImage(null)
    setIsResultModalOpen(true)

    // Track style view
    try {
      await firebaseService.trackStyleView(designerName, hairstyle.url)
    } catch (trackError) {
      console.error('Error tracking style view:', trackError)
    }

    try {
      // Convert hairstyle URL to File
      const hairstyleFile = await urlToFile(
        hairstyle.url, 
        `${hairstyle.name}.jpg`, 
        'image/jpeg'
      )

      // Analyze hairstyle characteristics
      setLoadingState('analyzing')
      const hairstyleDescription = await analyzeHairstyle(hairstyleFile)
      
      // Apply hairstyle to face
      setLoadingState('generating')
      const finalImage = await applyHairstyle(faceFile, hairstyleFile, hairstyleDescription)
      
      setGeneratedImage(finalImage)
      setLoadingState('done')
    } catch (err) {
      console.error('Error processing hairstyle:', err)
      
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(`헤어스타일 적용 실패: ${errorMessage}`)
      setLoadingState('error')
    }
  }, [faceFile, designerName])

  // Handle result modal close
  const handleCloseModal = useCallback(() => {
    setIsResultModalOpen(false)
    setGeneratedImage(null)
    setSelectedHairstyle(null)
    setLoadingState('idle')
    setError(null)
  }, [])
  
  // Handle booking
  const handleBookNow = useCallback(async (hairstyle: Hairstyle) => {
    // Track booking
    try {
      await firebaseService.trackBooking(designerName, hairstyle.url)
    } catch (trackError) {
      console.error('Error tracking booking:', trackError)
    }
    
    // Open reservation URL
    if (reservationUrl) {
      window.open(reservationUrl, '_blank', 'noopener,noreferrer')
    } else {
      alert('예약 링크가 설정되어 있지 않습니다.')
    }
  }, [designerName, reservationUrl])
  
  // Check if processing is in progress
  const isAIProcessing = loadingState === 'analyzing' || loadingState === 'generating'

  // Generate designer profile image placeholder
  const getDesignerInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Loading state while fetching designer data
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">디자이너 포트폴리오 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header with Designer Profile */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight mb-6">
            Hairfolio
          </h1>
          
          {/* Designer Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Designer Profile Picture */}
              <div className="relative">
                {designerProfile?.profileImage ? (
                  <img
                    src={designerProfile.profileImage}
                    alt={designerProfile.name || designerName}
                    className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                    onError={(e) => {
                      // Fallback to initials if profile image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.profile-fallback') as HTMLElement;
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-4 border-indigo-100 shadow-lg profile-fallback ${designerProfile?.profileImage ? 'hidden' : ''}`}>
                  {getDesignerInitials(designerProfile?.name || designerName)}
                </div>
              </div>

              {/* Designer Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {designerProfile?.name || designerName}
                </h2>
                {designerProfile?.bio && (
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {designerProfile.bio}
                  </p>
                )}
                
                {/* Quick Info */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-500">
                  {designerProfile?.location && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{designerProfile.location}</span>
                    </div>
                  )}
                  {designerProfile?.phone && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{designerProfile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(designerProfile?.socialLinks?.instagram || designerProfile?.socialLinks?.website) && (
                  <div className="flex justify-center sm:justify-start gap-3 mt-3">
                    {designerProfile.socialLinks.instagram && (
                      <a
                        href={designerProfile.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        Instagram
                      </a>
                    )}
                    {designerProfile.socialLinks.website && (
                      <a
                        href={designerProfile.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                        </svg>
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badge */}
            {designerProfile && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>검증된 헤어 디자이너</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-lg text-gray-600">
            AI로 새로운 헤어스타일을 미리 체험해보세요
          </p>
        </header>

        {/* Main Content */}
        <main className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
          {portfolio.length === 0 ? (
            // Empty portfolio state
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto text-gray-300 mb-4">
                <UserIcon />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">포트폴리오를 찾을 수 없습니다</h2>
              <p className="text-gray-500">
                "{designerProfile?.name || designerName}" 디자이너의 포트폴리오가 존재하지 않거나 아직 스타일이 등록되지 않았습니다.
              </p>
              <button
                onClick={() => window.history.back()}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                돌아가기
              </button>
            </div>
          ) : (
            // Portfolio content
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Step 1: Face Photo Upload */}
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center lg:text-left">
                  1단계: 얼굴 사진 업로드
                </h2>
                <ImageUploader
                  id="face-uploader"
                  label="정면을 바라본 선명한 얼굴 사진을 업로드하세요"
                  previewSrc={facePreview}
                  onFileChange={handleFaceFileChange}
                  icon={<UserIcon />}
                  disabled={isAIProcessing}
                />
                <div className="mt-4 text-xs text-gray-500 text-center">
                  <p>• JPG, PNG, WEBP 형식 지원</p>
                  <p>• 최대 10MB까지 업로드 가능</p>
                  <p>• 개인정보는 안전하게 보호됩니다</p>
                </div>
              </div>

              {/* Step 2: Hairstyle Selection */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center lg:text-left">
                  2단계: 헤어스타일 선택
                </h2>
                <HairstyleGallery 
                  images={portfolio}
                  onSelect={handleHairstyleSelect}
                  selectedUrl={selectedHairstyle?.url || null}
                  disabled={!faceFile || isAIProcessing}
                />
                {!faceFile && (
                  <div className="text-center mt-6 p-4 bg-indigo-50 rounded-lg">
                    <p className="text-indigo-600 font-medium">
                      ↑ 먼저 얼굴 사진을 업로드하여 갤러리를 활성화하세요
                    </p>
                  </div>
                )}
                {faceFile && portfolio.length > 0 && (
                  <div className="text-center mt-4 text-sm text-gray-600">
                    <p>원하는 헤어스타일을 클릭하면 AI가 자동으로 적용해드립니다</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        
        {/* Result Modal */}
        {isResultModalOpen && selectedHairstyle && (
          <ResultDisplay 
            beforeSrc={facePreview!}
            afterSrc={generatedImage}
            onReset={handleCloseModal}
            loadingState={loadingState}
            error={error}
            reservationUrl={reservationUrl}
            hairstyle={selectedHairstyle}
            onBookNow={handleBookNow}
          />
        )}

        {/* Footer */}
        <footer className="text-center mt-8">
          <p className="text-gray-400 text-xs">Powered by VModel AI</p>
        </footer>
      </div>
    </div>
  )
}

export default ClientView
