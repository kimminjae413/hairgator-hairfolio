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
  
  const [description, setDescription] = useState(style.description || '');
  const [tags, setTags] = useState<string>(style.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // 서비스 카테고리가 변경될 때 서브 카테고리 초기화
  useEffect(() => {
    if (serviceCategory !== migratedStyle.serviceCategory) {
      setServiceSubCategory('');
    }
  }, [serviceCategory, migratedStyle.serviceCategory]);

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

      const updates = {
        name: styleName.trim(),
        gender,
        serviceCategory,
        serviceSubCategory: serviceSubCategory.trim() || undefined,
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
                    <li>• 서비스 분류를 통해 고객이 더 쉽게 찾을 수 있어요</li>
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
