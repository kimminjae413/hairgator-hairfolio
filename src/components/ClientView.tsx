import React, { useState, useCallback, useEffect } from 'react'
import { analyzeHairstyle, applyHairstyle } from '../services/vmodelService'
import * as localStorageService from '../services/localStorageService'
import { LoadingState, Hairstyle } from '../types'
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
  const [designerProfile, setDesignerProfile] = useState<any>(null)
  
  // State for AI processing
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  
  // Load designer data on mount
  useEffect(() => {
    try {
      const data = localStorageService.getDesignerData(designerName)
      setPortfolio(data.portfolio || [])
      setReservationUrl(data.reservationUrl || '')
      setDesignerProfile(data.profile)
      
      // Track visit
      localStorageService.trackVisit(designerName)
    } catch (error) {
      console.error('Error loading designer data:', error)
      setError('디자이너 정보를 불러올 수 없습니다.')
    }
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
    localStorageService.trackStyleView(designerName, hairstyle.url)

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
  const handleBookNow = useCallback((hairstyle: Hairstyle) => {
    // Track booking
    localStorageService.trackBooking(designerName, hairstyle.url)
    
    // Open reservation URL
    if (reservationUrl) {
      window.open(reservationUrl, '_blank', 'noopener,noreferrer')
    } else {
      alert('예약 링크가 설정되어 있지 않습니다.')
    }
  }, [designerName, reservationUrl])
  
  // Check if processing is in progress
  const isLoading = loadingState === 'analyzing' || loadingState === 'generating'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight mb-2">
            Hairfolio
          </h1>
          <p className="text-lg text-gray-600">
            <span className="font-semibold text-indigo-600">{designerName}</span>의 포트폴리오에서 헤어스타일을 체험해보세요
          </p>
          {designerProfile?.bio && (
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              {designerProfile.bio}
            </p>
          )}
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
                "{designerName}" 디자이너의 포트폴리오가 존재하지 않거나 아직 스타일이 등록되지 않았습니다.
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
                  disabled={isLoading}
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
                  disabled={!faceFile || isLoading}
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
        <footer className="text-center mt-8 space-y-2">
          {designerProfile?.location && (
            <p className="text-gray-500 text-sm">
              📍 {designerProfile.location}
            </p>
          )}
          {designerProfile?.phone && (
            <p className="text-gray-500 text-sm">
              📞 {designerProfile.phone}
            </p>
          )}
          <div className="flex justify-center space-x-4 mt-2">
            {designerProfile?.socialLinks?.instagram && (
              <a
                href={designerProfile.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:text-pink-600 text-sm"
              >
                Instagram
              </a>
            )}
            {designerProfile?.socialLinks?.website && (
              <a
                href={designerProfile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Website
              </a>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-4">Powered by VModel AI</p>
        </footer>
      </div>
    </div>
  )
}

export default ClientView
