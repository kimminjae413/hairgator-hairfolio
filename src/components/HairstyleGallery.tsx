import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// 서비스 카테고리 타입 정의
type ServiceCategory = 'cut' | 'color' | 'perm' | 'styling' | 'treatment';

// 서비스 카테고리 라벨 매핑
const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  cut: '커트',
  color: '염색',
  perm: '펌',
  styling: '스타일링',
  treatment: '트리트먼트'
};

// 서비스 카테고리별 색상 테마
const SERVICE_CATEGORY_COLORS: Record<ServiceCategory, string> = {
  cut: 'bg-blue-100 text-blue-800 border-blue-200',
  color: 'bg-purple-100 text-purple-800 border-purple-200',
  perm: 'bg-green-100 text-green-800 border-green-200',
  styling: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  treatment: 'bg-pink-100 text-pink-800 border-pink-200'
};

// 업데이트된 타입 정의
interface Hairstyle {
  name: string;
  url: string;
  gender: 'Female' | 'Male';
  // 새로운 서비스 카테고리 필드
  serviceCategory?: ServiceCategory;
  serviceSubCategory?: string;
  // 레거시 필드들 (하위 호환성)
  majorCategory?: string;
  minorCategory?: string;
  description?: string;
  tags?: string[];
}

interface HairstyleGalleryProps {
  images: Hairstyle[];
  onSelect: (hairstyle: Hairstyle) => void;
  onColorTryOn?: (hairstyle: Hairstyle) => void; // 염색 가상체험 콜백 추가
  selectedUrl: string | null;
  disabled: boolean;
  onAddImage?: () => void;
  showCategories?: boolean;
  onDeleteImage?: (hairstyle: Hairstyle) => void;
  onEditImage?: (hairstyle: Hairstyle) => void;
  isDesignerView?: boolean;
}

const HairstyleGallery: React.FC<HairstyleGalleryProps> = ({ 
  images, 
  onSelect, 
  onColorTryOn,
  selectedUrl, 
  disabled, 
  onAddImage, 
  showCategories = true,
  onDeleteImage,
  onEditImage,
  isDesignerView = false
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'Female' | 'Male'>('Female');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<ServiceCategory | 'all'>('all');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Fallback image with translation
  const fallbackImageSvg = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#e5e7eb"/>
      <text x="200" y="200" text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif" font-size="24" fill="#9ca3af" font-weight="bold">
        ${t('gallery.noImage', '이미지 없음')}
      </text>
    </svg>
  `)}`;

  // Handle image error
  const handleImageError = (imageUrl: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (!imageErrors.has(imageUrl)) {
      setImageErrors(prev => new Set([...prev, imageUrl]));
      target.src = fallbackImageSvg;
    }
  };

  // Handle image load - 누락된 함수 추가
  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages(prev => new Set([...prev, imageUrl]));
  };

  // 스타일 선택 처리 - 서비스 카테고리별 분기 (핵심 기능)
  const handleStyleSelect = (image: Hairstyle) => {
    if (image.serviceCategory === 'color' && onColorTryOn) {
      // 염색 카테고리: Gemini 가상체험
      onColorTryOn(image);
    } else {
      // 기타 카테고리: 기존 VModel 선택
      onSelect(image);
    }
  };

  // Filter images by gender, service category, and search term
  const filteredImages = useMemo(() => {
    let filtered = images.filter(img => img.gender === activeTab);
    
    // 서비스 카테고리 필터링
    if (selectedServiceCategory !== 'all') {
      filtered = filtered.filter(image => image.serviceCategory === selectedServiceCategory);
    }
    
    // 검색어 필터링
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(image => 
        image.name.toLowerCase().includes(lowercaseSearch) ||
        image.description?.toLowerCase().includes(lowercaseSearch) ||
        image.serviceSubCategory?.toLowerCase().includes(lowercaseSearch) ||
        image.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch))
      );
    }
    
    return filtered;
  }, [images, activeTab, selectedServiceCategory, searchTerm]);

  // Group by service category
  const groupedImages = useMemo(() => {
    if (!showCategories) return { [t('gallery.allStyles', 'All Styles')]: filteredImages };
    
    return filteredImages.reduce((acc, image) => {
      // 서비스 카테고리 우선, 없으면 레거시 majorCategory 사용
      const category = image.serviceCategory 
        ? SERVICE_CATEGORY_LABELS[image.serviceCategory]
        : image.majorCategory || t('gallery.uncategorized', 'Uncategorized');
      
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(image);
      return acc;
    }, {} as Record<string, Hairstyle[]>);
  }, [filteredImages, showCategories, t]);

  // 서비스 카테고리별 정렬 (커트 > 염색 > 펌 > 스타일링 > 트리트먼트 순)
  const categoryOrder = ['커트', '염색', '펌', '스타일링', '트리트먼트'];
  const sortedCategories = Object.entries(groupedImages).sort(([a], [b]) => {
    const uncategorized = t('gallery.uncategorized', 'Uncategorized');
    if (a === uncategorized) return 1;
    if (b === uncategorized) return -1;
    
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    return a.localeCompare(b);
  });

  // 사용 가능한 서비스 카테고리들 추출
  const availableServiceCategories = useMemo(() => {
    const categories = new Set<ServiceCategory>();
    images
      .filter(img => img.gender === activeTab && img.serviceCategory)
      .forEach(img => categories.add(img.serviceCategory!));
    return Array.from(categories);
  }, [images, activeTab]);

  const tabStyle = "flex-1 py-3 text-center font-semibold rounded-md transition-all duration-200 focus:outline-none";
  const activeTabStyle = "bg-indigo-600 text-white shadow-lg";
  const inactiveTabStyle = "bg-gray-200 text-gray-700 hover:bg-gray-300";

  return (
    <div className={`${disabled ? 'opacity-50' : ''} space-y-4`}>
      {/* Add Style Button - Fixed at top for designer view */}
      {isDesignerView && onAddImage && (
        <div className="mb-4">
          <button
            onClick={onAddImage}
            disabled={disabled}
            className={`w-full py-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 flex items-center justify-center text-indigo-600 transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-100 ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold">{t('gallery.addStyle', '스타일 추가')}</span>
          </button>
        </div>
      )}

      {/* Search Bar */}
      {images.length > 6 && (
        <div className="relative">
          <input
            type="text"
            placeholder={t('gallery.searchPlaceholder', '스타일 검색...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={disabled}
          />
          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}

      {/* Gender Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('Female')}
          className={`${tabStyle} ${activeTab === 'Female' ? activeTabStyle : inactiveTabStyle}`}
          disabled={disabled}
        >
          {t('gallery.femaleStyles', '여성 스타일')}
        </button>
        <button
          onClick={() => setActiveTab('Male')}
          className={`${tabStyle} ${activeTab === 'Male' ? activeTabStyle : inactiveTabStyle}`}
          disabled={disabled}
        >
          {t('gallery.maleStyles', '남성 스타일')}
        </button>
      </div>

      {/* Service Category Filter */}
      {availableServiceCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedServiceCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              selectedServiceCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={disabled}
          >
            전체
          </button>
          {availableServiceCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedServiceCategory(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                selectedServiceCategory === category
                  ? SERVICE_CATEGORY_COLORS[category]
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
              disabled={disabled}
            >
              {SERVICE_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      )}

      {/* Results Count */}
      {(searchTerm || selectedServiceCategory !== 'all') && (
        <div className="text-sm text-gray-600">
          {t('gallery.searchResults', '검색 결과: {{count}}개', { count: filteredImages.length })}
        </div>
      )}

      {/* Masonry Gallery */}
      <div className="relative max-h-[70vh] overflow-y-auto p-2">
        {sortedCategories.length > 0 ? (
          sortedCategories.map(([category, hairstyles], categoryIndex) => (
            <div key={category} className="mb-6 last:mb-0">
              {/* Category Header */}
              {showCategories && (
                <div className="flex items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">{category}</h4>
                  <div className="flex-1 h-px bg-gray-200 ml-3"></div>
                  <span className="ml-3 text-xs text-gray-500">{hairstyles.length}</span>
                </div>
              )}
              
              {/* True Masonry Grid with CSS Columns */}
              <div className="columns-2 gap-2">
                {hairstyles.map((image, index) => {
                  // Pinterest style: vary heights for zigzag effect
                  const heightVariants = ['h-48', 'h-56', 'h-64', 'h-52', 'h-60'];
                  const randomHeight = heightVariants[index % heightVariants.length];
                  
                  return (
                  <div
                    key={image.url}
                    className="relative group mb-2 break-inside-avoid"
                  >
                    <button
                      onClick={() => handleStyleSelect(image)}
                      disabled={disabled}
                      className={`w-full ${randomHeight} block rounded-xl overflow-hidden transition-all duration-300 ${
                        selectedUrl === image.url
                          ? 'ring-4 ring-indigo-500 shadow-xl'
                          : 'ring-2 ring-transparent hover:ring-indigo-300'
                      } ${
                        disabled 
                          ? 'cursor-not-allowed' 
                          : 'hover:scale-[1.02] cursor-pointer'
                      }`}
                    >
                      {/* Loading skeleton */}
                      {!loadedImages.has(image.url) && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                      )}
                      
                      {/* Image covering the fixed height */}
                      <img 
                        src={imageErrors.has(image.url) ? fallbackImageSvg : image.url}
                        alt={image.name}
                        onError={(e) => handleImageError(image.url, e)}
                        onLoad={() => handleImageLoad(image.url)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Service Category Badge */}
                      {image.serviceCategory && (
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${SERVICE_CATEGORY_COLORS[image.serviceCategory]}`}>
                            {SERVICE_CATEGORY_LABELS[image.serviceCategory]}
                          </span>
                        </div>
                      )}
                      
                      {/* Special Color Badge for color category - Gemini AI 특별 표시 */}
                      {image.serviceCategory === 'color' && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                            </svg>
                            AI 체험
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <p className="text-white font-bold text-sm mb-1">{image.name}</p>
                        {image.serviceSubCategory && (
                          <p className="text-gray-200 text-xs mb-1">{image.serviceSubCategory}</p>
                        )}
                        {image.description && (
                          <p className="text-gray-200 text-xs line-clamp-2">{image.description}</p>
                        )}
                        {/* Color category special message */}
                        {image.serviceCategory === 'color' && (
                          <div className="mt-2 bg-purple-600/80 rounded-lg px-2 py-1">
                            <p className="text-white text-xs font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9.5 14.25l-5.584 2.718L5 13.25C5.001 6.52 7.51 4 9.5 4S14 6.52 14 13.25L15.084 16.968 9.5 14.25z"/>
                              </svg>
                              Gemini AI 분석 체험
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Selected indicator */}
                      {selectedUrl === image.url && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Tags */}
                      {image.tags && image.tags.length > 0 && (
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex flex-wrap gap-1">
                            {image.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Action Buttons - Designer View */}
                    {isDesignerView && (
                      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                        {onEditImage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditImage(image);
                            }}
                            className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                            title={t('gallery.edit', '편집')}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {onDeleteImage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(t('gallery.deleteConfirm', '이 스타일을 삭제하시겠습니까?'))) {
                                onDeleteImage(image);
                              }
                            }}
                            className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                            title={t('gallery.delete', '삭제')}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="py-16 text-center">
            {searchTerm || selectedServiceCategory !== 'all' ? (
              <div>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('gallery.noSearchResults', '검색 결과가 없습니다')}</h3>
                <p className="text-gray-500 mb-4">
                  조건에 맞는 {activeTab === 'Female' ? '여성' : '남성'} 스타일을 찾을 수 없습니다.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedServiceCategory('all');
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {t('gallery.showAll', '전체 보기')}
                </button>
              </div>
            ) : (
              <div>
                {onAddImage && isDesignerView ? (
                  <div className="space-y-4">
                    <div className="text-4xl">💇‍♀️</div>
                    <h3 className="text-lg font-semibold text-gray-700">{t('gallery.noStylesYet', '아직 등록된 스타일이 없습니다')}</h3>
                    <p className="text-gray-500 mb-6">
                      첫 번째 {activeTab === 'Female' ? '여성' : '남성'} 스타일을 추가해보세요!
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={onAddImage}
                        disabled={disabled}
                        className={`w-48 aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 transition-all duration-200 ${
                          disabled
                            ? 'cursor-not-allowed bg-gray-100 opacity-50'
                            : 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-500'
                        }`}
                      >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-xs font-bold">{t('gallery.addStyle', '스타일 추가')}</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-4">😊</div>
                    <p className="text-gray-500">
                      {activeTab === 'Female' ? '여성' : '남성'} 카테고리에 스타일이 없습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HairstyleGallery;
