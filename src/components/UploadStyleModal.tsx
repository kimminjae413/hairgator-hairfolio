import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Gender, 
  ServiceMajorCategory, 
  ServiceMinorCategory, 
  UploadStyleFormData,
  SERVICE_MAJOR_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_SUBCATEGORY_SUGGESTIONS,
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
import { uploadWithProgress, isValidImageFile, isValidFileSize } from '../services/cloudinaryService';
import UploadIcon from './icons/UploadIcon';

interface UploadStyleModalProps {
  onUpload: (data: UploadStyleFormData & { cloudinaryUrl: string }) => void;
  onClose: () => void;
}

const UploadStyleModal: React.FC<UploadStyleModalProps> = ({ onUpload, onClose }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleName, setStyleName] = useState('');
  const [gender, setGender] = useState<Gender>('Female');
  
  // NEW: Service-based categories (primary system)
  const [serviceCategory, setServiceCategory] = useState<ServiceMajorCategory>('cut');
  const [serviceSubCategory, setServiceSubCategory] = useState<ServiceMinorCategory>('');
  
  // 🆕 AI 추천 시스템 상태
  const [enableAIRecommendations, setEnableAIRecommendations] = useState(false);
  
  // 커트 스타일 AI 추천
  const [selectedFaceShapes, setSelectedFaceShapes] = useState<Map<FaceShapeType, SuitabilityLevel>>(new Map());
  
  // 염색 스타일 AI 추천
  const [selectedPersonalColors, setSelectedPersonalColors] = useState<Map<Exclude<PersonalColorType, null>, SuitabilityLevel>>(new Map());
  const [colorTemperature, setColorTemperature] = useState<ColorTemperature>('neutral');
  const [colorBrightness, setColorBrightness] = useState<ColorBrightness>('medium');
  const [isVibrant, setIsVibrant] = useState(false);
  
  // LEGACY: Keep for backward compatibility (hidden from UI)
  const [majorCategory] = useState<FemaleMajorCategory | MaleMajorCategory>(FEMALE_MAJOR_CATEGORIES[0]);
  const [minorCategory] = useState<MinorCategory>(MINOR_CATEGORIES[0]);
  
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle file validation
  const validateFile = (selectedFile: File): string | null => {
    if (!isValidImageFile(selectedFile)) {
      return t('upload.invalidFileFormat');
    }

    if (!isValidFileSize(selectedFile, 10)) {
      return t('upload.fileTooLarge');
    }

    return null;
  };

  // 의미없는 파일명인지 확인하는 함수
  const isMeaninglessFileName = (fileName: string): boolean => {
    const meaninglessPatterns = [
      /^IMG_\d+$/i,
      /^DSC\d+$/i,
      /^Photo_\d+$/i,
      /^KakaoTalk_\d+$/i,
      /^\d{8}_\d{6}$/,
      /^Screenshot_/i,
      /^image_?\d*$/i,
      /^photo_?\d*$/i,
      /^스크린샷/i,
      /^캡처$/i,
      /^사진\d*$/i,
      /^이미지\d*$/i,
      /^\d+$/,
      /^IMG-\d+$/i,
      /^PXL_\d+$/i,
    ];
    
    return meaninglessPatterns.some(pattern => pattern.test(fileName));
  };

  // 서비스 카테고리에 따른 추천 스타일명 생성
  const getSuggestedStyleName = (gender: Gender, serviceCategory: ServiceMajorCategory): string => {
    const suggestions = SERVICE_SUBCATEGORY_SUGGESTIONS[serviceCategory];
    if (!suggestions || suggestions.length === 0) {
      return t('upload.newStyle');
    }
    
    const genderAppropriate = suggestions.filter(style => {
      if (gender === 'Male') {
        const maleStyles = ['Buzz Cut', 'Fade Cut', 'Undercut', 'Crew Cut', 'Pompadour'];
        return maleStyles.some(maleStyle => style.includes(maleStyle.split(' ')[0]));
      }
      return true;
    });
    
    const targetSuggestions = genderAppropriate.length > 0 ? genderAppropriate : suggestions;
    return targetSuggestions[Math.floor(Math.random() * targetSuggestions.length)];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      
      const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.') || '';
      
      if (isMeaninglessFileName(nameWithoutExt)) {
        setStyleName('');
        setTimeout(() => {
          const inputElement = document.getElementById('style-name') as HTMLInputElement;
          if (inputElement) {
            const suggestion = getSuggestedStyleName(gender, serviceCategory);
            inputElement.placeholder = `${t('upload.example')}: ${suggestion}`;
          }
        }, 100);
      } else {
        const cleanedName = nameWithoutExt
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const capitalizedName = cleanedName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
          
        setStyleName(capitalizedName);
      }
    }
  };

  // 🆕 얼굴형 선택/해제 토글
  const toggleFaceShape = (shape: FaceShapeType, level: SuitabilityLevel) => {
    setSelectedFaceShapes(prev => {
      const newMap = new Map(prev);
      if (newMap.get(shape) === level) {
        newMap.delete(shape); // 같은 레벨 클릭 시 해제
      } else {
        newMap.set(shape, level); // 새 레벨 설정
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

  const handleUpload = async () => {
    if (!file || !styleName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const cloudinaryUrl = await uploadWithProgress(
        file,
        (progress) => setUploadProgress(progress),
        {
          folder: 'hairfolio/styles',
          tags: ['hairfolio', 'hairstyle', gender.toLowerCase(), serviceCategory]
        }
      );

      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const aiRecommendations = buildAIRecommendations();

      const uploadData = {
        file,
        name: styleName.trim(),
        gender,
        serviceCategory,
        serviceSubCategory: serviceSubCategory.trim() || undefined,
        aiRecommendations, // 🆕 AI 추천 정보 포함
        majorCategory,
        minorCategory,
        description: description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        cloudinaryUrl
      };

      onUpload(uploadData);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : t('upload.uploadFailed'));
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // 서비스 카테고리가 변경될 때 초기화
  useEffect(() => {
    setServiceSubCategory('');
    setEnableAIRecommendations(false);
    setSelectedFaceShapes(new Map());
    setSelectedPersonalColors(new Map());
  }, [serviceCategory]);

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const isFormValid = file && styleName.trim() && !isUploading;

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
          <h2 className="text-2xl font-bold text-gray-800">{t('upload.addNewStyle')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('upload.styleImage')} *</label>
              <div
                onClick={() => !isUploading && inputRef.current?.click()}
                className={`relative w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all duration-200 ${
                  isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50'
                }`}
              >
                <input 
                  ref={inputRef} 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    <div className="w-12 h-12 mx-auto mb-2 text-gray-400">
                      <UploadIcon />
                    </div>
                    <p className="font-medium">{t('upload.selectImage')}</p>
                    <p className="text-xs mt-1">{t('upload.supportedFormats')}</p>
                  </div>
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-white text-center">
                      <p className="text-sm mb-2">{t('upload.uploading')}</p>
                      <div className="w-48 bg-gray-300 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1">{uploadProgress}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Style Name */}
            <div>
              <label htmlFor="style-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('upload.styleName')} *
              </label>
              <input
                id="style-name"
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder={`${t('upload.example')}: ${getSuggestedStyleName(gender, serviceCategory)}`}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isUploading}
                maxLength={50}
              />
              {!styleName && file && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  의미있는 스타일명을 입력해주세요
                </p>
              )}
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('upload.gender')} *</label>
              <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                <button 
                  type="button"
                  onClick={() => setGender('Female')} 
                  disabled={isUploading}
                  className={`flex-1 py-2 text-center font-semibold rounded-md transition-colors ${
                    gender === 'Female' 
                      ? 'bg-white text-indigo-600 shadow' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {t('upload.female')}
                </button>
                <button 
                  type="button"
                  onClick={() => setGender('Male')} 
                  disabled={isUploading}
                  className={`flex-1 py-2 text-center font-semibold rounded-md transition-colors ${
                    gender === 'Male' 
                      ? 'bg-white text-indigo-600 shadow' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {t('upload.male')}
                </button>
              </div>
            </div>
            
            {/* Service Categories */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="service-category" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('upload.serviceCategory')} *
                </label>
                <select 
                  id="service-category" 
                  value={serviceCategory} 
                  onChange={(e) => setServiceCategory(e.target.value as ServiceMajorCategory)} 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isUploading}
                >
                  {SERVICE_MAJOR_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {t(`upload.services.${cat}`, SERVICE_CATEGORY_LABELS[cat])}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="service-subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('upload.serviceSubCategory')} ({t('upload.optional')})
                </label>
                <input
                  id="service-subcategory"
                  type="text"
                  value={serviceSubCategory}
                  onChange={(e) => setServiceSubCategory(e.target.value)}
                  placeholder={t('upload.serviceSubCategoryPlaceholder')}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isUploading}
                  maxLength={30}
                  list="subcategory-suggestions"
                />
                <datalist id="subcategory-suggestions">
                  {SERVICE_SUBCATEGORY_SUGGESTIONS[serviceCategory]?.map(suggestion => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
                <div className="text-xs text-gray-500 mt-1">
                  {t('upload.serviceSubCategoryHint')}
                </div>
              </div>
            </div>

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
                {t('upload.styleDescription')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('upload.descriptionPlaceholder')}
                rows={3}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={isUploading}
                maxLength={200}
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {description.length}/200
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                {t('upload.tags')} ({t('upload.commaSeparated')})
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('upload.tagsPlaceholder')}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isUploading}
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
                  <h4 className="font-medium text-blue-800 text-sm">서비스 분류 가이드</h4>
                  <ul className="text-blue-700 text-xs mt-1 space-y-1">
                    <li>• <strong>커트:</strong> 헤어 커팅, 층내기, 스타일 컷</li>
                    <li>• <strong>염색:</strong> 전체염색, 하이라이트, 옴브레 등</li>
                    <li>• <strong>펌:</strong> 웨이브펌, 볼륨펌, 일자펌 등</li>
                    <li>• <strong>스타일링:</strong> 드라이, 세팅, 업스타일</li>
                    <li>• <strong>트리트먼트:</strong> 케어, 영양공급, 손상복구</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleUpload}
            disabled={!isFormValid}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t('upload.uploading')} ({uploadProgress}%)
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {t('upload.addStyle')}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadStyleModal;
