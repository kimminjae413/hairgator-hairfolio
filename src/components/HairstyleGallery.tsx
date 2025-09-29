import React, { useState, useMemo } from 'react';

// 타입 정의
interface Hairstyle {
  name: string;
  url: string;
  gender: 'Female' | 'Male';
  majorCategory?: string;
  minorCategory?: string;
  description?: string;
  tags?: string[];
}

interface HairstyleGalleryProps {
  images: Hairstyle[];
  onSelect: (hairstyle: Hairstyle) => void;
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
  selectedUrl, 
  disabled, 
  onAddImage, 
  showCategories = true,
  onDeleteImage,
  onEditImage,
  isDesignerView = false
}) => {
  const [activeTab, setActiveTab] = useState<'Female' | 'Male'>('Female');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Fallback image
  const fallbackImageSvg = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#e5e7eb"/>
      <text x="200" y="200" text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif" font-size="24" fill="#9ca3af" font-weight="bold">
        이미지 없음
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

  // Handle image load
  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages(prev => new Set([...prev, imageUrl]));
  };

  // Filter images
  const filteredImages = useMemo(() => {
    let filtered = images.filter(img => img.gender === activeTab);
    
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(image => 
        image.name.toLowerCase().includes(lowercaseSearch) ||
        image.description?.toLowerCase().includes(lowercaseSearch) ||
        image.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch))
      );
    }
    
    return filtered;
  }, [images, activeTab, searchTerm]);

  // Group by category
  const groupedImages = useMemo(() => {
    if (!showCategories) return { 'All Styles': filteredImages };
    
    return filteredImages.reduce((acc, image) => {
      const category = image.majorCategory || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(image);
      return acc;
    }, {} as Record<string, Hairstyle[]>);
  }, [filteredImages, showCategories]);

  const sortedCategories = Object.entries(groupedImages).sort(([a], [b]) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  const tabStyle = "flex-1 py-3 text-center font-semibold rounded-md transition-all duration-200 focus:outline-none";
  const activeTabStyle = "bg-indigo-600 text-white shadow-lg";
  const inactiveTabStyle = "bg-gray-200 text-gray-700 hover:bg-gray-300";

  return (
    <div className={`${disabled ? 'opacity-50' : ''} space-y-4`}>
      {/* Search Bar */}
      {images.length > 6 && (
        <div className="relative">
          <input
            type="text"
            placeholder="스타일 검색..."
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
          여성 스타일
        </button>
        <button
          onClick={() => setActiveTab('Male')}
          className={`${tabStyle} ${activeTab === 'Male' ? activeTabStyle : inactiveTabStyle}`}
          disabled={disabled}
        >
          남성 스타일
        </button>
      </div>

      {/* Results Count */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          검색 결과: {filteredImages.length}개
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
                {/* Add Style Button - only in first category */}
                {categoryIndex === 0 && onAddImage && (
                  <button
                    onClick={onAddImage}
                    disabled={disabled}
                    className={`w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 transition-all duration-200 mb-2 break-inside-avoid ${
                      disabled
                        ? 'cursor-not-allowed bg-gray-100 opacity-50'
                        : 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-500'
                    }`}
                  >
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-xs font-bold">스타일 추가</p>
                  </button>
                )}
                
                {/* Hairstyle Images */}
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
                      onClick={() => onSelect(image)}
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
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <p className="text-white font-bold text-sm mb-1">{image.name}</p>
                        {image.description && (
                          <p className="text-gray-200 text-xs line-clamp-2">{image.description}</p>
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
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                            title="편집"
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
                              if (window.confirm('이 스타일을 삭제하시겠습니까?')) {
                                onDeleteImage(image);
                              }
                            }}
                            className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                            title="삭제"
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
            {searchTerm ? (
              <div>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-500 mb-4">
                  "{searchTerm}"에 대한 '{activeTab}' 스타일을 찾을 수 없습니다.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  전체 보기
                </button>
              </div>
            ) : (
              <div>
                {onAddImage ? (
                  <div className="space-y-4">
                    <div className="text-4xl">💇‍♀️</div>
                    <h3 className="text-lg font-semibold text-gray-700">아직 등록된 스타일이 없습니다</h3>
                    <p className="text-gray-500 mb-6">첫 번째 '{activeTab}' 스타일을 추가해보세요!</p>
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
                        <p className="text-xs font-bold">스타일 추가</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-4">😊</div>
                    <p className="text-gray-500">'{activeTab}' 카테고리에 스타일이 없습니다.</p>
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

// Demo with sample data
const MasonryDemo = () => {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  
  const sampleImages: Hairstyle[] = [
    {
      name: '웨이브 보브',
      url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=600&fit=crop',
      gender: 'Female',
      majorCategory: 'B length',
      description: '자연스러운 웨이브',
      tags: ['웨이브', '보브']
    },
    {
      name: '롱 스트레이트',
      url: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=500&fit=crop',
      gender: 'Female',
      majorCategory: 'G length',
      description: '긴 생머리',
      tags: ['롱헤어', '스트레이트']
    },
    {
      name: '픽시 컷',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=550&fit=crop',
      gender: 'Female',
      majorCategory: 'A length',
      description: '짧은 픽시',
      tags: ['픽시', '짧은머리']
    },
    {
      name: '컬리 미디움',
      url: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&h=650&fit=crop',
      gender: 'Female',
      majorCategory: 'D length',
      description: '자연스러운 컬',
      tags: ['컬', '미디움']
    },
    {
      name: '레이어드 컷',
      url: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400&h=500&fit=crop',
      gender: 'Female',
      majorCategory: 'C length',
      description: '층진 레이어',
      tags: ['레이어', '볼륨']
    },
    {
      name: '앞머리 보브',
      url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop',
      gender: 'Female',
      majorCategory: 'B length',
      description: '귀여운 앞머리',
      tags: ['보브', '앞머리']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">        
        <HairstyleGallery
          images={sampleImages}
          onSelect={(hairstyle) => setSelectedUrl(hairstyle.url)}
          selectedUrl={selectedUrl}
          disabled={false}
          showCategories={true}
        />
        
        {selectedUrl && (
          <div className="mt-6 p-4 bg-white rounded-xl shadow-md text-center">
            <p className="text-gray-700 text-sm font-medium">
              선택됨: {sampleImages.find(img => img.url === selectedUrl)?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasonryDemo;
