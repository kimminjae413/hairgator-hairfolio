import React, { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { analyzeHairstyle, applyHairstyle } from '../services/vmodelService'
import { analyzeFace } from '../services/faceAnalysisService'
import * as firebaseService from '../services/firebaseService'
import { LoadingState, Hairstyle, DesignerProfile, FaceAnalysis } from '../types'
import ImageUploader from './ImageUploader'
import ResultDisplay from './ResultDisplay'
import HairstyleGallery from './HairstyleGallery'
import ColorTryOnModal from './ColorTryOnModal'
import FaceAnalysisModal from './FaceAnalysisModal'
import IntroScreen from './IntroScreen'
import LanguageSelector from './LanguageSelector'
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
  const { t } = useTranslation()
  
  // State for intro screen
  const [showIntro, setShowIntro] = useState(true)
  
  // State for uploaded face image
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [facePreview, setFacePreview] = useState<string | null>(null)
  
  // 🆕 State for face analysis
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null)
  const [isFaceAnalyzing, setIsFaceAnalyzing] = useState(false)
  const [showFaceAnalysisModal, setShowFaceAnalysisModal] = useState(false)
  
  // State for designer data
  const [portfolio, setPortfolio] = useState<Hairstyle[]>([])
  const [reservationUrl, setReservationUrl] = useState<string>('')
  const [designerProfile, setDesignerProfile] = useState<DesignerProfile | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  
  // State for AI processing (VModel)
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  
  // State for Color Try-On (Advanced AI)
  const [showColorModal, setShowColorModal] = useState(false)
  const [selectedColorStyle, setSelectedColorStyle] = useState<Hairstyle | null>(null)
  const [colorTryOnResult, setColorTryOnResult] = useState<any>(null)
  
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
        
        // 프로필 이미지가 없으면 인트로 건너뛰기
        if (!data.profile?.profileImage) {
          setShowIntro(false)
        }
      } catch (error) {
        console.error('Error loading designer data:', error)
        setError(t('client.designerDataError'))
        setShowIntro(false) // 에러 시 인트로 건너뛰기
      } finally {
        setIsDataLoading(false)
      }
    }
    
    loadDesignerData()
  }, [designerName, t])

  // Handle intro completion
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false)
  }, [])

  // 🆕 Handle face image upload with analysis
  const handleFaceFileChange = useCallback(async (file: File | null) => {
    setFaceFile(file)
    
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setFacePreview(previewUrl)
      
      // Clean up any existing error
      if (error) setError(null)
      
      // 🎭 얼굴 분석 시작
      console.log('🎭 MediaPipe 얼굴 분석 시작...')
      setIsFaceAnalyzing(true)
      setShowFaceAnalysisModal(true)
      setFaceAnalysis(null)
      
      try {
        const analysis = await analyzeFace(file)
        setFaceAnalysis(analysis)
        
        if (analysis.detected) {
          console.log('✅ 얼굴 분석 완료:', {
            faceShape: analysis.faceShape,
            personalColor: analysis.personalColor,
            confidence: `${(analysis.confidence * 100).toFixed(0)}%`
          })
        } else {
          console.warn('⚠️ 얼굴 감지 실패:', analysis.message)
        }
      } catch (err) {
        console.error('❌ 얼굴 분석 오류:', err)
        setFaceAnalysis({
          detected: false,
          faceShape: null,
          personalColor: null,
          confidence: 0,
          message: '얼굴 분석 중 오류가 발생했습니다.'
        })
      } finally {
        setIsFaceAnalyzing(false)
      }
    } else {
      // 파일 제거 시 정리
      if (facePreview) {
        URL.revokeObjectURL(facePreview)
      }
      setFacePreview(null)
      setFaceAnalysis(null)
      setShowFaceAnalysisModal(false)
    }
  }, [facePreview, error])

  // 🆕 Handle face analysis modal close
  const handleFaceAnalysisModalClose = useCallback(() => {
    setShowFaceAnalysisModal(false)
  }, [])

  // Handle regular hairstyle selection (VModel processing)
  const handleHairstyleSelect = useCallback(async (hairstyle: Hairstyle) => {
    if (!faceFile) {
      setError(t('client.uploadPhotoFirst'))
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

      // 🆕 Analyze hairstyle with face shape info
      setLoadingState('analyzing')
      const hairstyleDescription = await analyzeHairstyle(
        hairstyleFile,
        faceAnalysis?.faceShape || undefined
      )
      
      // Apply hairstyle to face
      setLoadingState('generating')
      const finalImage = await applyHairstyle(faceFile, hairstyleFile, hairstyleDescription)
      
      setGeneratedImage(finalImage)
      setLoadingState('done')

      // Track trial result - 성공한 경우에만 저장
      if (finalImage) {
        try {
          await firebaseService.trackTrialResult(designerName, {
            styleUrl: hairstyle.url,
            resultUrl: finalImage,
            styleName: hairstyle.name,
            type: 'cut',
            faceAnalysis: faceAnalysis || undefined
          })
          console.log('Trial result tracked successfully')
        } catch (trackError) {
          console.error('Error tracking trial result:', trackError)
          // 추적 실패는 사용자 경험에 영향을 주지 않음
        }
      }
    } catch (err) {
      console.error('Error processing hairstyle:', err)
      
      const errorMessage = err instanceof Error ? err.message : t('client.unknownError')
      setError(`${t('client.hairstyleApplyError')}: ${errorMessage}`)
      setLoadingState('error')
    }
  }, [faceFile, faceAnalysis, designerName, t])

  // Handle color try-on selection (Advanced AI processing)
  const handleColorTryOn = useCallback((colorStyle: Hairstyle) => {
    // 얼굴 사진이 업로드되지 않은 경우 안내
    if (!faceFile) {
      setError('먼저 얼굴 사진을 업로드해주세요.')
      return
    }

    console.log('염색 가상체험 선택:', colorStyle)
    setSelectedColorStyle(colorStyle)
    setShowColorModal(true)
    
    // Track color style view
    firebaseService.trackStyleView(designerName, colorStyle.url).catch(console.error)
  }, [designerName, faceFile])

  // Handle color try-on completion
  const handleColorTryOnComplete = useCallback((result: any) => {
    console.log('염색 가상체험 결과:', result)
    setColorTryOnResult(result)
    
    // Track color trial result
    if (result && selectedColorStyle) {
      firebaseService.trackTrialResult(designerName, {
        styleUrl: selectedColorStyle.url,
        resultUrl: result.resultImageUrl,
        styleName: selectedColorStyle.name,
        type: 'color',
        faceAnalysis: faceAnalysis || undefined
      }).catch(console.error)
    }
  }, [designerName, selectedColorStyle, faceAnalysis])

  // Handle color modal close
  const handleColorModalClose = useCallback(() => {
    setShowColorModal(false)
    setSelectedColorStyle(null)
  }, [])

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
      alert(t('client.noReservationLink'))
    }
  }, [designerName, reservationUrl, t])
  
  // Check if processing is in progress
  const isAIProcessing = loadingState === 'analyzing' || loadingState === 'generating' || isFaceAnalyzing

  // Generate designer profile image placeholder
  const getDesignerInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Get brand settings with defaults
  const brandSettings = designerProfile?.brandSettings || {}
  const salonName = brandSettings.salonName || 'Hairfolio'
  const fontFamily = brandSettings.fontFamily || 'Inter'
  const textColor = brandSettings.textColor || '#1f2937'
  const showSubtitle = brandSettings.showSubtitle !== false

  // Show intro screen if profile image exists and intro not completed
  if (showIntro && designerProfile?.profileImage && !isDataLoading) {
    return (
      <IntroScreen 
        designerProfile={designerProfile}
        onComplete={handleIntroComplete}
      />
    )
  }

  // Loading state while fetching designer data
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('client.loadingPortfolio')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header with Designer Profile */}
        <header className="text-center mb-8">
          {/* Language Selector - positioned at top right */}
          <div className="flex justify-end mb-4">
            <LanguageSelector />
          </div>

          {/* Custom Branded Title */}
          <h1 
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            style={{
              fontFamily: fontFamily,
              color: textColor
            }}
          >
            {salonName}
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
                  <span>{t('client.verifiedDesigner')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Subtitle (optional) */}
          {showSubtitle && (
            <p className="text-lg text-gray-600">
              {t('client.tryNewHairstyle')}
            </p>
          )}
        </header>

        {/* 🆕 Face Analysis Result Display */}
        {faceAnalysis?.detected && !showFaceAnalysisModal && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    얼굴형: <span className="text-indigo-600">{faceAnalysis.faceShape}</span>
                    {' • '}
                    퍼스널 컬러: <span className="text-purple-600">{faceAnalysis.personalColor}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    신뢰도 {(faceAnalysis.confidence * 100).toFixed(0)}% • AI 분석 완료
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFaceAnalysisModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                자세히 보기
              </button>
            </div>
          </div>
        )}

        {/* Color Try-On Result Display */}
        {colorTryOnResult && (
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
              염색 가상체험 결과
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <img 
                  src={colorTryOnResult.resultImageUrl} 
                  alt="염색 결과"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <p className="text-sm text-purple-700 mb-2">
                  <strong>신뢰도:</strong> {Math.round(colorTryOnResult.confidence * 100)}%
                </p>
                <p className="text-sm text-purple-700 mb-2">
                  <strong>피부톤 매칭:</strong> 
                  <span className={`ml-1 ${
                    colorTryOnResult.colorAnalysis.skinToneMatch === 'excellent' ? 'text-green-600' :
                    colorTryOnResult.colorAnalysis.skinToneMatch === 'good' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {colorTryOnResult.colorAnalysis.skinToneMatch === 'excellent' ? '매우 좋음' :
                     colorTryOnResult.colorAnalysis.skinToneMatch === 'good' ? '좋음' : '보통'}
                  </span>
                </p>
                <div className="text-xs text-purple-600">
                  {colorTryOnResult.colorAnalysis.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                    <p key={idx}>• {rec}</p>
                  ))}
                </div>
                <button
                  onClick={() => setColorTryOnResult(null)}
                  className="mt-2 text-xs text-purple-500 hover:text-purple-700"
                >
                  결과 닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
          {portfolio.length === 0 ? (
            // Empty portfolio state
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto text-gray-300 mb-4">
                <UserIcon />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">{t('client.portfolioNotFound')}</h2>
              <p className="text-gray-500">
                {t('client.portfolioNotFoundDesc', { designerName: designerProfile?.name || designerName })}
              </p>
              <button
                onClick={() => window.history.back()}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {t('common.goBack')}
              </button>
            </div>
          ) : (
            // Portfolio content
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Step 1: Face Photo Upload */}
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center lg:text-left">
                  {t('client.step1Title')}
                </h2>
                <ImageUploader
                  id="face-uploader"
                  label={t('client.uploadClearPhoto')}
                  previewSrc={facePreview}
                  onFileChange={handleFaceFileChange}
                  icon={<UserIcon />}
                  disabled={isAIProcessing}
                />
                <div className="mt-4 text-xs text-gray-500 text-center">
                  <p>• {t('client.supportedFormats')}</p>
                  <p>• {t('client.maxFileSize')}</p>
                  <p>• {t('client.privacyProtected')}</p>
                  <p className="mt-2 text-indigo-600 font-medium">• AI 얼굴 분석 자동 실행</p>
                </div>
              </div>

              {/* Step 2: Hairstyle Selection */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center lg:text-left">
                  {t('client.step2Title')}
                </h2>
                
                {/* Feature callout for color styles */}
                {portfolio.some(style => style.serviceCategory === 'color') && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                      </svg>
                      <span className="font-medium">새로운 기능: </span>
                      <span>염색 스타일은 고급 AI로 전문 분석됩니다</span>
                    </div>
                  </div>
                )}

                <HairstyleGallery 
                  images={portfolio}
                  onSelect={handleHairstyleSelect}  // VModel 처리
                  onColorTryOn={handleColorTryOn}   // Advanced AI 처리
                  selectedUrl={selectedHairstyle?.url || null}
                  disabled={!faceFile || isAIProcessing}
                />
                {!faceFile && (
                  <div className="text-center mt-6 p-4 bg-indigo-50 rounded-lg">
                    <p className="text-indigo-600 font-medium">
                      {t('client.uploadPhotoToActivate')}
                    </p>
                  </div>
                )}
                {faceFile && portfolio.length > 0 && (
                  <div className="text-center mt-4 text-sm text-gray-600">
                    <p>{t('client.clickToApplyHairstyle')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        
        {/* 🆕 Face Analysis Modal */}
        {showFaceAnalysisModal && facePreview && (
          <FaceAnalysisModal
            imageUrl={facePreview}
            analysis={faceAnalysis}
            isAnalyzing={isFaceAnalyzing}
            onClose={handleFaceAnalysisModalClose}
          />
        )}
        
        {/* VModel Result Modal */}
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

        {/* Advanced Color AI Try-On Modal */}
        {showColorModal && selectedColorStyle && (
          <ColorTryOnModal
            colorStyleImage={selectedColorStyle}
            userFaceFile={faceFile}
            userFacePreview={facePreview}
            faceAnalysis={faceAnalysis}
            onClose={handleColorModalClose}
            onComplete={handleColorTryOnComplete}
          />
        )}

        {/* Footer */}
        <footer className="text-center mt-8">
          <p className="text-gray-400 text-xs">Powered by HAIRFOLIO</p>
        </footer>
      </div>
    </div>
  )
}

export default ClientView
