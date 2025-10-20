// src/components/ClientHomeView.tsx - 일반 사용자 메인 화면 (전체 포트폴리오 통합)
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeHairstyle, applyHairstyle } from '../services/vmodelService';
import { analyzeFace } from '../services/faceAnalysisService';
import * as firebaseService from '../services/firebaseService';
import { 
  LoadingState, 
  Hairstyle, 
  FaceAnalysis, 
  FaceShapeType,
  Gender,
  ServiceMajorCategory,
  getRecommendationScore
} from '../types';
import ImageUploader from './ImageUploader';
import ResultDisplay from './ResultDisplay';
import FaceAnalysisModal from './FaceAnalysisModal';
import LanguageSelector from './LanguageSelector';
import UserIcon from './icons/UserIcon';

interface ClientHomeViewProps {
  userId: string;
  userName: string;
  onLogout: () => void;
}

interface PortfolioItem {
  designerId: string;
  designerName: string;
  designerProfile?: any;
  style: Hairstyle;
}

const ClientHomeView: React.FC<ClientHomeViewProps> = ({ userId, userName, onLogout }) => {
  const { t } = useTranslation();
  
  // 얼굴 이미지 & 분석
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [isFaceAnalyzing, setIsFaceAnalyzing] = useState(false);
  const [showFaceAnalysisModal, setShowFaceAnalysisModal] = useState(false);
  
  // 전체 포트폴리오 데이터
  const [allPortfolios, setAllPortfolios] = useState<PortfolioItem[]>([]);
  const [filteredPortfolios, setFilteredPortfolios] = useState<PortfolioItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // 필터
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<Gender | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ServiceMajorCategory | 'all'>('all');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'recommended'>('latest');
  
  // AI 가상체험
  const [selectedStyle, setSelectedStyle] = useState<PortfolioItem | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  
  // 찜하기
  const [favorites, setFavorites] = useState<string[]>([]);

  // 전체 포트폴리오 로드
  useEffect(() => {
    const loadAllPortfolios = async () => {
      try {
        setIsDataLoading(true);
        console.log('📂 전체 포트폴리오 로딩 시작...');
        
        const portfolios = await firebaseService.getAllPortfolios();
        console.log('✅ 로드된 디자이너 수:', portfolios.length);
        
        // 평탄화: 모든 스타일을 하나의 배열로
        const allStyles: PortfolioItem[] = [];
        portfolios.forEach(portfolio => {
          portfolio.data.portfolio.forEach(style => {
            allStyles.push({
              designerId: portfolio.designerId,
              designerName: portfolio.designerName,
              designerProfile: portfolio.data.profile,
              style: style
            });
          });
        });
        
        console.log('✅ 전체 스타일 수:', allStyles.length);
        setAllPortfolios(allStyles);
        setFilteredPortfolios(allStyles);
        
      } catch (error) {
        console.error('❌ 포트폴리오 로드 실패:', error);
        setError('포트폴리오를 불러오는데 실패했습니다.');
      } finally {
        setIsDataLoading(false);
      }
    };
    
    loadAllPortfolios();
  }, []);

  // 찜하기 로드
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const userFavorites = await firebaseService.getFavorites(userId);
        setFavorites(userFavorites.map(fav => fav.styleId));
      } catch (error) {
        console.error('찜하기 로드 실패:', error);
      }
    };
    
    loadFavorites();
  }, [userId]);

  // 필터링 로직
  useEffect(() => {
    let filtered = [...allPortfolios];
    
    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.style.name.toLowerCase().includes(query) ||
        item.designerName.toLowerCase().includes(query) ||
        item.style.description?.toLowerCase().includes(query) ||
        item.style.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 성별 필터
    if (selectedGender !== 'all') {
      filtered = filtered.filter(item => item.style.gender === selectedGender);
    }
    
    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.style.serviceCategory === selectedCategory);
    }
    
    // 추천 필터 (얼굴형 분석 결과 기반)
    if (showRecommendedOnly && faceAnalysis?.detected) {
      filtered = filtered.filter(item => {
        const score = getRecommendationScore(item.style, faceAnalysis);
        return score >= 2; // good 이상만 표시
      });
    }
    
    // 정렬
    if (sortBy === 'recommended' && faceAnalysis?.detected) {
      filtered.sort((a, b) => {
        const scoreA = getRecommendationScore(a.style, faceAnalysis);
        const scoreB = getRecommendationScore(b.style, faceAnalysis);
        return scoreB - scoreA;
      });
    } else {
      // 최신순 (기본)
      filtered.sort((a, b) => {
        const dateA = new Date(a.style.createdAt || 0).getTime();
        const dateB = new Date(b.style.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }
    
    setFilteredPortfolios(filtered);
  }, [allPortfolios, searchQuery, selectedGender, selectedCategory, showRecommendedOnly, sortBy, faceAnalysis]);

  // 얼굴 이미지 업로드 & 분석
  const handleFaceFileChange = useCallback(async (file: File | null) => {
    setFaceFile(file);
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFacePreview(previewUrl);
      
      if (error) setError(null);
      
      console.log('🎭 얼굴 분석 시작...');
      setIsFaceAnalyzing(true);
      setShowFaceAnalysisModal(true);
      setFaceAnalysis(null);
      
      try {
        const analysis = await analyzeFace(file);
        setFaceAnalysis(analysis);
        
        if (analysis.detected) {
          console.log('✅ 얼굴 분석 완료:', {
            faceShape: analysis.faceShape,
            personalColor: analysis.personalColor,
            confidence: `${(analysis.confidence * 100).toFixed(0)}%`
          });
          
          // 분석 완료 후 자동으로 추천 필터 활성화
          setShowRecommendedOnly(true);
          setSortBy('recommended');
        } else {
          console.warn('⚠️ 얼굴 감지 실패:', analysis.message);
        }
      } catch (err) {
        console.error('❌ 얼굴 분석 오류:', err);
        setFaceAnalysis({
          detected: false,
          faceShape: null,
          personalColor: null,
          confidence: 0,
          message: '얼굴 분석 중 오류가 발생했습니다.'
        });
      } finally {
        setIsFaceAnalyzing(false);
      }
    } else {
      if (facePreview) {
        URL.revokeObjectURL(facePreview);
      }
      setFacePreview(null);
      setFaceAnalysis(null);
      setShowFaceAnalysisModal(false);
      setShowRecommendedOnly(false);
    }
  }, [facePreview, error]);

  // 스타일 선택 & AI 가상체험
  const handleStyleSelect = useCallback(async (item: PortfolioItem) => {
    if (!faceFile) {
      setError('먼저 얼굴 사진을 업로드해주세요.');
      return;
    }

    setSelectedStyle(item);
    setLoadingState('analyzing');
    setError(null);
    setGeneratedImage(null);
    setIsResultModalOpen(true);

    try {
      // 스타일 이미지 URL을 File로 변환
      const response = await fetch(item.style.url);
      const blob = await response.blob();
      const styleFile = new File([blob], `${item.style.name}.jpg`, { type: 'image/jpeg' });

      // AI 분석 & 적용
      setLoadingState('analyzing');
      const hairstyleDescription = await analyzeHairstyle(
        styleFile,
        faceAnalysis?.faceShape || undefined
      );
      
      setLoadingState('generating');
      const finalImage = await applyHairstyle(faceFile, styleFile, hairstyleDescription);
      
      setGeneratedImage(finalImage);
      setLoadingState('done');

      // 체험 기록 저장
      if (finalImage) {
        await firebaseService.saveTryOnHistory({
          userId,
          designerId: item.designerId,
          designerName: item.designerName,
          styleId: item.style.id || '',
          styleName: item.style.name,
          originalImageUrl: facePreview || '',
          resultImageUrl: finalImage,
          faceAnalysis: faceAnalysis || undefined
        });
      }
    } catch (err) {
      console.error('가상체험 실패:', err);
      setError('가상체험 중 오류가 발생했습니다.');
      setLoadingState('error');
    }
  }, [faceFile, facePreview, faceAnalysis, userId]);

  // 찜하기 토글
  const handleToggleFavorite = useCallback(async (item: PortfolioItem) => {
    const styleId = item.style.id || '';
    const isFavorited = favorites.includes(styleId);
    
    try {
      if (isFavorited) {
        // 찜하기 해제
        const userFavorites = await firebaseService.getFavorites(userId);
        const targetFavorite = userFavorites.find(fav => fav.styleId === styleId);
        if (targetFavorite) {
          await firebaseService.removeFavorite(targetFavorite.id, userId);
          setFavorites(prev => prev.filter(id => id !== styleId));
        }
      } else {
        // 찜하기 추가
        await firebaseService.addFavorite({
          userId,
          designerId: item.designerId,
          designerName: item.designerName,
          styleId,
          styleName: item.style.name,
          styleImageUrl: item.style.url
        });
        setFavorites(prev => [...prev, styleId]);
      }
    } catch (error) {
      console.error('찜하기 실패:', error);
      alert('찜하기에 실패했습니다.');
    }
  }, [userId, favorites]);

  const handleCloseModal = useCallback(() => {
    setIsResultModalOpen(false);
    setGeneratedImage(null);
    setSelectedStyle(null);
    setLoadingState('idle');
    setError(null);
  }, []);

  const isAIProcessing = loadingState === 'analyzing' || loadingState === 'generating' || isFaceAnalyzing;

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">포트폴리오 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-indigo-600">Hairfolio</h1>
              <span className="text-sm text-gray-500">전체 포트폴리오</span>
            </div>
            
            <div className="flex items-center gap-4">
              <LanguageSelector />
              
              {/* 사용자 정보 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{userName}</span>
              </div>
              
              <button
                onClick={onLogout}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 얼굴 분석 결과 */}
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
                    신뢰도 {(faceAnalysis.confidence * 100).toFixed(0)}% • 맞춤 추천 활성화됨
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽: 얼굴 업로드 & 필터 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 얼굴 업로드 */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4">내 얼굴 분석</h2>
              <ImageUploader
                id="face-uploader"
                label="얼굴 사진 업로드"
                previewSrc={facePreview}
                onFileChange={handleFaceFileChange}
                icon={<UserIcon />}
                disabled={isAIProcessing}
              />
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>• AI 얼굴형 분석</p>
                <p>• 퍼스널 컬러 진단</p>
                <p>• 맞춤 스타일 추천</p>
              </div>
            </div>

            {/* 필터 */}
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
              <h3 className="font-bold text-gray-800">필터</h3>
              
              {/* 검색 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="스타일, 디자이너 검색..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 성별 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value as Gender | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">전체</option>
                  <option value="Female">여성</option>
                  <option value="Male">남성</option>
                </select>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ServiceMajorCategory | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">전체</option>
                  <option value="cut">커트</option>
                  <option value="color">염색</option>
                  <option value="perm">펌</option>
                  <option value="styling">스타일링</option>
                  <option value="treatment">트리트먼트</option>
                  <option value="other">기타</option>
                </select>
              </div>

              {/* 추천 필터 */}
              {faceAnalysis?.detected && (
                <div className="pt-4 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRecommendedOnly}
                      onChange={(e) => setShowRecommendedOnly(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">내게 어울리는 스타일만</span>
                  </label>
                </div>
              )}

              {/* 정렬 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'latest' | 'recommended')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  disabled={!faceAnalysis?.detected && sortBy === 'recommended'}
                >
                  <option value="latest">최신순</option>
                  {faceAnalysis?.detected && <option value="recommended">추천순</option>}
                </select>
              </div>
            </div>
          </div>

          {/* 오른쪽: 포트폴리오 갤러리 */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  전체 스타일 ({filteredPortfolios.length})
                </h2>
              </div>

              {filteredPortfolios.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredPortfolios.map((item, index) => {
                    const isFavorited = favorites.includes(item.style.id || '');
                    const score = faceAnalysis ? getRecommendationScore(item.style, faceAnalysis) : 0;
                    
                    return (
                      <div key={`${item.designerId}-${item.style.id || index}`} className="group relative">
                        {/* 추천 배지 */}
                        {score >= 2 && faceAnalysis?.detected && (
                          <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            추천 {score === 3 ? '⭐⭐⭐' : '⭐⭐'}
                          </div>
                        )}
                        
                        {/* 찜하기 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(item);
                          }}
                          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          {isFavorited ? (
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                        </button>

                        {/* 이미지 */}
                        <div 
                          onClick={() => handleStyleSelect(item)}
                          className="cursor-pointer"
                        >
                          <img
                            src={item.style.url}
                            alt={item.style.name}
                            className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                          />
                          <div className="mt-2">
                            <h3 className="font-semibold text-sm text-gray-800 truncate">{item.style.name}</h3>
                            <p className="text-xs text-gray-500 truncate">{item.designerName}</p>
                            {item.style.serviceCategory && (
                              <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                {item.style.serviceCategory}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 얼굴 분석 모달 */}
      {showFaceAnalysisModal && facePreview && (
        <FaceAnalysisModal
          imageUrl={facePreview}
          analysis={faceAnalysis}
          isAnalyzing={isFaceAnalyzing}
          onClose={() => setShowFaceAnalysisModal(false)}
        />
      )}

      {/* 가상체험 결과 모달 */}
      {isResultModalOpen && selectedStyle && (
        <ResultDisplay
          beforeSrc={facePreview!}
          afterSrc={generatedImage}
          onReset={handleCloseModal}
          loadingState={loadingState}
          error={error}
          reservationUrl=""
          hairstyle={selectedStyle.style}
          onBookNow={() => {}}
        />
      )}
    </div>
  );
};

export default ClientHomeView;
