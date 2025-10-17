import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Gender, 
  ServiceMajorCategory, 
  ServiceMinorCategory, 
  Hairstyle,
  SERVICE_MAJOR_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_SUBCATEGORY_SUGGESTIONS,
  migrateLegacyToService,
  // AI Recommendations
  AIRecommendations,
  FaceShapeType,
  PersonalColorType,
  SuitabilityLevel,
  ColorTemperature,
  ColorBrightness,
  FACE_SHAPES,
  PERSONAL_COLORS,
  SUITABILITY_STARS,
  SUITABILITY_LABELS,
  // Legacy imports for backward compatibility
  FemaleMajorCategory,
  MaleMajorCategory,
  MinorCategory,
  FEMALE_MAJOR_CATEGORIES,
  MALE_MAJOR_CATEGORIES,
  MINOR_CATEGORIES
} from '../types';

interface EditStyleModalProps {
  style: Hairstyle;
  onSave: (styleId: string, updates: Partial<Hairstyle>) => void;
  onClose: () => void;
}

const EditStyleModal: React.FC<EditStyleModalProps> = ({ style, onSave, onClose }) => {
  const { t } = useTranslation();
  const [styleName, setStyleName] = useState(style.name);
  const [gender, setGender] = useState<Gender>(style.gender || 'Female');
  
  // Migrate legacy data if needed
  const migratedStyle = migrateLegacyToService(style);
  
  // NEW: Service-based categories (primary system)
  const [serviceCategory, setServiceCategory] = useState<ServiceMajorCategory>(
    migratedStyle.serviceCategory || 'cut'
  );
  const [serviceSubCategory, setServiceSubCategory] = useState<ServiceMinorCategory>(
    migratedStyle.serviceSubCategory || ''
  );
  
  // 🆕 AI 추천 시스템 상태
  const [enableAIRecommendations, setEnableAIRecommendations] = useState(
    !!style.aiRecommendations && (
      (style.aiRecommendations.cut && style.aiRecommendations.cut.faceShapes.length > 0) ||
      (style.aiRecommendations.color && style.aiRecommendations.color.personalColors.length > 0)
    )
  );
  
  // 커트 스타일 AI 추천 - 기존 데이터로 초기화
  const [selectedFaceShapes, setSelectedFaceShapes] = useState<Map<FaceShapeType, SuitabilityLevel>>(() => {
    const map = new Map<FaceShapeType, SuitabilityLevel>();
    if (style.aiRecommendations?.cut) {
      style.aiRecommendations.cut.faceShapes.forEach(fs => {
        map.set(fs.shape, fs.suitability);
      });
    }
    return map;
  });
  
  // 염색 스타일 AI 추천 - 기존 데이터로 초기화
  const [selectedPersonalColors, setSelectedPersonalColors] = useState<Map<Exclude<PersonalColorType, null>, SuitabilityLevel>>(() => {
    const map = new Map<Exclude<PersonalColorType, null>, SuitabilityLevel>();
    if (style.aiRecommendations?.color) {
      style.aiRecommendations.color.personalColors.forEach(pc => {
        map.set(pc.color, pc.suitability);
      });
    }
    return map;
  });
  
  const [colorTemperature, setColorTemperature] = useState<ColorTemperature>(
    style.aiRecommendations?.color?.colorProperties?.temperature || 'neutral'
  );
  const [colorBrightness, setColorBrightness] = useState<ColorBrightness>(
    style.aiRecommendations?.color?.colorProperties?.brightness || 'medium'
  );
  const [isVibrant, setIsVibrant] = useState(
    style.aiRecommendations?.color?.colorProperties?.vibrant || false
  );
  
  const [description, setDescription] = useState(style.description || '');
  const [tags, setTags] = useState<string>(style.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // 서비스 카테고리가 변경될 때 처리
  useEffect(() => {
    if (serviceCategory !== migratedStyle.serviceCategory) {
      setServiceSubCategory('');
      // 카테고리 변경 시 AI 추천 초기화
      setEnableAIRecommendations(false);
      setSelectedFaceShapes(new Map());
      setSelectedPersonalColors(new Map());
    }
  }, [serviceCategory, migratedStyle.serviceCategory]);

  // 🆕 얼굴형 선택/해제 토글
  const toggleFaceShape = (shape: FaceShapeType, level: SuitabilityLevel) => {
    setSelectedFaceShapes(prev => {
      const newMap = new Map(prev);
      if (newMap.get(shape) === level) {
        newMap.delete(shape);
      } else {
        newMap.set(shape, level);
      }
      return newMap;
    });
  };

  // 🆕 퍼스널 컬러 선택/해제 토글
  const togglePersonalColor = (color: Exclude<PersonalColorType, null>, level: SuitabilityLevel) => {
    setSelectedPersonalColors(prev => {
      const newMap = new Map(prev);
      if (newMap.get(color) === level) {
        newMap.delete(color);
      } else {
        newMap.set(color, level);
      }
      return newMap;
    });
  };

  // 🆕 AI 추천 데이터 생성
  const buildAIRecommendations = (): AIRecommendations | undefined => {
    if (!enableAIRecommendations) return undefined;

    const recommendations: AIRecommendations = {};

    // 커트 스타일 추천
    if (serviceCategory === 'cut' && selectedFaceShapes.size > 0) {
      recommendations.cut = {
        faceShapes: Array.from(selectedFaceShapes.entries()).map(([shape, suitability]) => ({
          shape,
          suitability
        }))
      };
    }

    // 염색 스타일 추천
    if (serviceCategory === 'color' && selectedPersonalColors.size > 0) {
      recommendations.color = {
        personalColors: Array.from(selectedPersonalColors.entries()).map(([color, suitability]) => ({
          color,
          suitability
        })),
        colorProperties: {
          temperature: colorTemperature,
          brightness: colorBrightness,
          vibrant: isVibrant
        }
      };
    }

    return Object.keys(recommendations).length > 0 ? recommendations : undefined;
  };

  const handleSave = async () => {
    if (!styleName.trim()) {
      setError(t('edit.styleNameRequired'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const aiRecommendations = buildAIRecommendations();

      const updates = {
        name: styleName.trim(),
        gender,
        serviceCategory,
        serviceSubCategory: serviceSubCategory.trim() || undefined,
        aiRecommendations, // 🆕 AI 추천 정보 포함
        description: description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        updatedAt: new Date().toISOString()
      };

      onSave(style.id || style.url, updates);
    } catch (err) {
      console.error('Edit error:', err);
      setError(err instanceof Error ? err.message : t('edit.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const isFormValid = styleName.trim() && !isSaving;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={handleModalClick}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">{t('edit.editStyle')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving}
            aria-label={t('common.close')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            
            {/* Style Preview */}
            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-gray-100 shadow-md">
                <img 
                  src={style.url} 
                  alt={style.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik02NCA0NEw4NCA4NEg0NEw2NCA0NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHR0ZXh0IHg9IjY0IiB5PSIxMDQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5Q0EzQUYiPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+Cjwvc3ZnPg==';
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{t('edit.currentStyleImage')}</p>
            </div>

            {/* Style Name */}
            <div>
              <label htmlFor="style-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.styleName')} *
              </label>
              <input
                id="style-name"
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder={t('edit.styleNamePlaceholder')}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isSaving}
                maxLength={50}
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('edit.gender')} *</label>
              <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                <button 
                  type="button"
                  onClick={() => setGender('Female')} 
                  disabled={isSaving}
                  className={`flex-1 py-2 text-center font-semibold rounded-md transition-colors ${
                    gender === 'Female' 
                      ? 'bg-white text-indigo-600 shadow' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {t('edit.female')}
                </button>
                <button 
                  type="button"
                  onClick={() => setGender('Male')} 
                  disabled={isSaving}
                  className={`flex-1 py-2 text-center font-semibold rounded-md transition-colors ${
                    gender === 'Male' 
                      ? 'bg-white text-indigo-600 shadow' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {t('edit.male')}
                </button>
              </div>
            </div>
            
            {/* Service Categories */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="service-category" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('edit.serviceCategory')} *
                </label>
                <select 
                  id="service-category" 
                  value={serviceCategory} 
                  onChange={(e) => setServiceCategory(e.target.value as ServiceMajorCategory)} 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSaving}
                >
                  {SERVICE_MAJOR_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {t(`edit.services.${cat}`, SERVICE_CATEGORY_LABELS[cat])}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="service-subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('edit.serviceSubCategory')} ({t('edit.optional')})
                </label>
                <input
                  id="service-subcategory"
                  type="text"
                  value={serviceSubCategory}
                  onChange={(e) => setServiceSubCategory(e.target.value)}
                  placeholder={t('edit.serviceSubCategoryPlaceholder')}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isSaving}
                  maxLength={30}
                  list="subcategory-suggestions"
                />
                <datalist id="subcategory-suggestions">
                  {SERVICE_SUBCATEGORY_SUGGESTIONS[serviceCategory]?.map(suggestion => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
                <div className="text-xs text-gray-500 mt-1">
                  {t('edit.serviceSubCategoryHint')}
                </div>
              </div>
            </div>

            {/* Legacy Categories Info (if migrated) */}
            {style.majorCategory && !style.serviceCategory && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-amber-800 text-sm">카테고리 시스템 업데이트</h4>
                    <p className="text-amber-700 text-xs mt-1">
                      기존 카테고리 "{style.majorCategory}"에서 새로운 서비스 기반 시스템으로 자동 변환되었습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 🆕 AI 추천 시스템 섹션 */}
            {(serviceCategory === 'cut' || serviceCategory === 'color') && (
              <div className="border border-indigo-200 rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">AI 스마트 추천 설정</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableAIRecommendations(!enableAIRecommendations)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enableAIRecommendations ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableAIRecommendations ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <p className="text-xs text-gray-600 mb-3">
                  {serviceCategory === 'cut' 
                    ? '어떤 얼굴형에 잘 어울리는 스타일인지 설정하면 고객에게 자동으로 추천됩니다'
                    : '어떤 퍼스널 컬러에 잘 어울리는 색상인지 설정하면 고객에게 자동으로 추천됩니다'
                  }
                </p>

                {enableAIRecommendations && (
                  <div className="space-y-4 mt-4">
                    {/* 커트 스타일 - 얼굴형 선택 */}
                    {serviceCategory === 'cut' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          추천 얼굴형 선택
                        </label>
                        <div className="space-y-2">
                          {FACE_SHAPES.filter(shape => shape !== '알 수 없음').map(shape => (
                            <div key={shape} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-800">{shape}</span>
                              </div>
                              <div className="flex gap-2">
                                {(['excellent', 'good', 'fair'] as SuitabilityLevel[]).map(level => (
                                  <button
                                    key={level}
                                    type="button"
                                    onClick={() => toggleFaceShape(shape, level)}
                                    className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                                      selectedFaceShapes.get(shape) === level
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    <div>{SUITABILITY_STARS[level]}</div>
                                    <div className="mt-1">{SUITABILITY_LABELS[level]}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {selectedFaceShapes.size === 0 && (
                          <p className="text-xs text-amber-600 mt-2">최소 1개 이상의 얼굴형을 선택해주세요</p>
                        )}
                      </div>
                    )}

                    {/* 염색 스타일 - 퍼스널 컬러 선택 */}
                    {serviceCategory === 'color' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            추천 퍼스널 컬러 선택
                          </label>
                          <div className="space-y-2">
                            {PERSONAL_COLORS.map(color => (
                              <div key={color} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800">{color}</span>
                                </div>
                                <div className="flex gap-2">
                                  {(['excellent', 'good', 'fair'] as SuitabilityLevel[]).map(level => (
                                    <button
                                      key={level}
                                      type="button"
                                      onClick={() => togglePersonalColor(color, level)}
                                      className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                                        selectedPersonalColors.get(color) === level
                                          ? 'bg-indigo-600 text-white shadow-md'
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                    >
                                      <div>{SUITABILITY_STARS[level]}</div>
                                      <div className="mt-1">{SUITABILITY_LABELS[level]}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {selectedPersonalColors.size === 0 && (
                            <p className="text-xs text-amber-600 mt-2">최소 1개 이상의 퍼스널 컬러를 선택해주세요</p>
                          )}
                        </div>

                        {/* 색상 속성 */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-3">
                          <h4 className="font-medium text-gray-800 text-sm">색상 속성 (선택사항)</h4>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">색상 온도</label>
                            <div className="flex gap-2">
                              {(['warm', 'neutral', 'cool'] as ColorTemperature[]).map(temp => (
                                <button
                                  key={temp}
                                  type="button"
                                  onClick={() => setColorTemperature(temp)}
                                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                                    colorTemperature === temp
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {temp === 'warm' ? '🔥 웜톤' : temp === 'cool' ? '❄️ 쿨톤' : '⚖️ 중성'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">색상 명도</label>
                            <div className="flex gap-2">
                              {(['light', 'medium', 'dark'] as ColorBrightness[]).map(bright => (
                                <button
                                  key={bright}
                                  type="button"
                                  onClick={() => setColorBrightness(bright)}
                                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                                    colorBrightness === bright
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {bright === 'light' ? '☀️ 밝음' : bright === 'medium' ? '🌤️ 중간' : '🌙 어두움'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isVibrant}
                                onChange={(e) => setIsVibrant(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="ml-2 text-xs text-gray-700">✨ 선명하고 비비드한 색상</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.styleDescription')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('edit.descriptionPlaceholder')}
                rows={3}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={isSaving}
                maxLength={200}
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {description.length}/200
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.tags')} ({t('edit.commaSeparated')})
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('edit.tagsPlaceholder')}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isSaving}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Service Category Guide */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800 text-sm">편집 안내</h4>
                  <ul className="text-blue-700 text-xs mt-1 space-y-1">
                    <li>• 이미지는 변경할 수 없습니다</li>
                    <li>• AI 추천 설정으로 고객 만족도가 올라갑니다</li>
                    <li>• 변경사항은 즉시 포트폴리오에 반영됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t('edit.saving')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('edit.saveChanges')}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStyleModal;
