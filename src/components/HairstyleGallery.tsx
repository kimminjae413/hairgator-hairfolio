import React, { useState, useMemo } from 'react';
import { Hairstyle, Gender, FemaleMajorCategory, MaleMajorCategory } from '../types';
import PlusIcon from './icons/PlusIcon';

interface HairstyleGalleryProps {
  images: Hairstyle[];
  onSelect: (hairstyle: Hairstyle) => void;
  selectedUrl: string | null;
  disabled: boolean;
  onAddImage?: () => void;
  showCategories?: boolean;
  allowMultipleSelection?: boolean;
  onDeleteImage?: (hairstyle: Hairstyle) => void;
  onEditImage?: (hairstyle: Hairstyle) => void;
  isDesignerView?: boolean;
}

type GroupedHairstyles = {
  [key in Gender]?: {
    [key in FemaleMajorCategory | MaleMajorCategory | 'Uncategorized']?: Hairstyle[];
  };
};

const HairstyleGallery: React.FC<HairstyleGalleryProps> = ({ 
  images, 
  onSelect, 
  selectedUrl, 
  disabled, 
  onAddImage, 
  showCategories = true,
  allowMultipleSelection = false,
  onDeleteImage,
  onEditImage,
  isDesignerView = false
}) => {
  const [activeTab, setActiveTab] = useState<Gender>('Female');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Create fallback image using SVG data URL
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

  // Filter images based on search term
  const filteredImages = useMemo(() => {
    if (!searchTerm) return images;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return images.filter(image => 
      image.name.toLowerCase().includes(lowercaseSearch) ||
      image.description?.toLowerCase().includes(lowercaseSearch) ||
      image.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch))
    );
  }, [images, searchTerm]);

  // Group images by gender and major category
  const groupedImages = useMemo(() => {
    return filteredImages.reduce((acc, image) => {
      const genderKey = image.gender;
      if (!genderKey || (genderKey !== 'Female' && genderKey !== 'Male')) return acc;

      const majorKey = image.majorCategory || 'Uncategorized';

      if (!acc[genderKey]) {
        acc[genderKey] = {};
      }
      if (!acc[genderKey]![majorKey]) {
        acc[genderKey]![majorKey] = [];
      }
      acc[genderKey]![majorKey]!.push(image);
      return acc;
    }, {} as GroupedHairstyles);
  }, [filteredImages]);

  const activeGenderStyles = groupedImages[activeTab];
  const activeGenderEntries = activeGenderStyles ? Object.entries(activeGenderStyles) : [];

  // Sort categories for better display order
  const sortedEntries = activeGenderEntries.sort(([a], [b]) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  const tabStyle = "flex-1 py-3 text-center font-semibold rounded-md transition-all duration-200 focus:outline-none";
  const activeTabStyle = "bg-indigo-600 text-white shadow-lg transform scale-105";
  const inactiveTabStyle = "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-102";

  const addStyleButton = onAddImage && (
    <button
      onClick={onAddImage}
      disabled={disabled}
      className={`relative aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed bg-gray-100 opacity-50'
          : 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105'
      }`}
      aria-label="새 스타일 추가"
    >
      <div className="w-8 h-8 mb-2">
        <PlusIcon />
      </div>
      <p className="text-xs font-bold text-center px-2">스타일 추가</p>
    </button>
  );

  return (
    <div className={`${disabled ? 'opacity-50' : ''} space-y-4`}>
      {/* Search Bar */}
      {images.length > 6 && (
        <div className="relative">
          <input
            type="text"
            placeholder="스타일 검색... (예: 웨이브, 짧은머리, 모던)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={disabled}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
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
          검색 결과: {filteredImages.filter(img => img.gender === activeTab).length}개
        </div>
      )}

      {/* Gallery Content */}
      <div className="relative max-h-[calc(70vh-120px)] overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
        {sortedEntries.length > 0 ? (
          sortedEntries.map(([majorCategory, hairstyles], categoryIndex) => (
            <div key={majorCategory} className="mb-8 last:mb-4">
              {/* Category Header */}
              {showCategories && (
                <div className="flex items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-700">{majorCategory}</h4>
                  <div className="flex-1 h-px bg-gray-200 ml-4"></div>
                  <span className="ml-4 text-sm text-gray-500">{hairstyles.length}개</span>
                </div>
              )}
              
              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Add Style Button - only show in first category */}
                {categoryIndex === 0 && addStyleButton}
                
                {/* Hairstyle Images */}
                {hairstyles.map((image) => (
                  <div
                    key={image.url}
                    className="relative group"
                  >
                    <button
                      onClick={() => onSelect(image)}
                      disabled={disabled}
                      className={`w-full aspect-square rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-400 ${
                        selectedUrl === image.url
                          ? 'ring-4 ring-indigo-500 shadow-lg transform scale-105'
                          : 'ring-2 ring-transparent hover:ring-indigo-300'
                      } ${
                        disabled 
                          ? 'cursor-not-allowed' 
                          : 'hover:scale-105 hover:shadow-lg cursor-pointer'
                      }`}
                    >
                      {/* Image */}
                      <img 
                        src={imageErrors.has(image.url) ? fallbackImageSvg : image.url}
                        alt={image.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => handleImageError(image.url, e)}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      
                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-bold drop-shadow-lg">{image.name}</p>
                        {image.description && (
                          <p className="text-white/80 text-xs mt-1 line-clamp-2 drop-shadow">{image.description}</p>
                        )}
                      </div>
                      
                      {/* Selection Indicator */}
                      {selectedUrl === image.url && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Tags */}
                      {image.tags && image.tags.length > 0 && (
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex flex-wrap gap-1">
                            {image.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Action Buttons - Only show in designer view */}
                    {isDesignerView && (
                      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {/* Edit Button */}
                        {onEditImage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditImage(image);
                            }}
                            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-10"
                            title="스타일 편집"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        {onDeleteImage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`"${image.name}" 스타일을 삭제하시겠습니까?`)) {
                                onDeleteImage(image);
                              }
                            }}
                            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-10"
                            title="스타일 삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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
                    {addStyleButton}
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

export default HairstyleGallery;
