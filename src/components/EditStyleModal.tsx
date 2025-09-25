import React, { useState, useEffect, useRef } from 'react';
import { Gender, FemaleMajorCategory, MaleMajorCategory, MinorCategory, Hairstyle } from '../types';

interface EditStyleModalProps {
  style: Hairstyle;
  onSave: (styleId: string, updates: Partial<Hairstyle>) => void;
  onClose: () => void;
}

const FEMALE_MAJOR_CATEGORIES: FemaleMajorCategory[] = [
  'A length', 'B length', 'C length', 'D length', 
  'E length', 'F length', 'G length', 'H length'
];

const MALE_MAJOR_CATEGORIES: MaleMajorCategory[] = [
  'SIDE FRINGE', 'SIDE PART', 'FRINGE UP', 'PUSHED BACK', 
  'BUZZ', 'CROP', 'MOHICAN'
];

const MINOR_CATEGORIES: MinorCategory[] = [
  'None', 'Forehead', 'Eyebrow', 'Eye', 'Cheekbone'
];

const EditStyleModal: React.FC<EditStyleModalProps> = ({ style, onSave, onClose }) => {
  const [styleName, setStyleName] = useState(style.name);
  const [gender, setGender] = useState<Gender>(style.gender || 'Female');
  const [majorCategory, setMajorCategory] = useState<FemaleMajorCategory | MaleMajorCategory>(
    style.majorCategory || (style.gender === 'Male' ? MALE_MAJOR_CATEGORIES[0] : FEMALE_MAJOR_CATEGORIES[0])
  );
  const [minorCategory, setMinorCategory] = useState<MinorCategory>(style.minorCategory || 'None');
  const [description, setDescription] = useState(style.description || '');
  const [tags, setTags] = useState<string>(style.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When gender changes, update the major category dropdown and reset its value
    if (gender === 'Female') {
      setMajorCategory(FEMALE_MAJOR_CATEGORIES[0]);
    } else {
      setMajorCategory(MALE_MAJOR_CATEGORIES[0]);
    }
  }, [gender]);

  const handleSave = async () => {
    if (!styleName.trim()) {
      setError('스타일 이름을 입력해주세요.');
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
        majorCategory,
        minorCategory,
        description: description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        updatedAt: new Date().toISOString()
      };

      onSave(style.id || style.url, updates);
    } catch (err) {
      console.error('Edit error:', err);
      setError(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.');
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
          <h2 className="text-2xl font-bold text-gray-800">스타일 편집</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving}
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
              <p className="text-sm text-gray-500 mt-2">현재 스타일 이미지</p>
            </div>

            {/* Style Name */}
            <div>
              <label htmlFor="style-name" className="block text-sm font-medium text-gray-700 mb-1">
                스타일 이름 * 
                <span className="text-xs text-gray-500 font-normal ml-1">
                  (고객에게 표시될 이름)
                </span>
              </label>
              <input
                id="style-name"
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="예: 소프트 레이어드 컷"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isSaving}
                maxLength={50}
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
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
                  여성
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
                  남성
                </button>
              </div>
            </div>
            
            {/* Categories */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="major-category" className="block text-sm font-medium text-gray-700 mb-1">
                  주요 카테고리 *
                </label>
                <select 
                  id="major-category" 
                  value={majorCategory} 
                  onChange={(e) => setMajorCategory(e.target.value as any)} 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSaving}
                >
                  {(gender === 'Female' ? FEMALE_MAJOR_CATEGORIES : MALE_MAJOR_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="minor-category" className="block text-sm font-medium text-gray-700 mb-1">
                  부가 카테고리
                </label>
                <select 
                  id="minor-category" 
                  value={minorCategory} 
                  onChange={(e) => setMinorCategory(e.target.value as MinorCategory)} 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSaving}
                >
                  {MINOR_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat === 'None' ? '없음' : cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                스타일 설명
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="스타일에 대한 간단한 설명을 입력해주세요..."
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
                태그 (쉼표로 구분)
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="웨이브, 자연스러운, 세련된"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 mt-1">
                검색에 도움이 되는 키워드를 입력해주세요
              </p>
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

            {/* Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800 text-sm">스타일 편집</h4>
                  <ul className="text-blue-700 text-xs mt-1 space-y-1">
                    <li>• 이미지는 변경할 수 없습니다</li>
                    <li>• 이름, 카테고리, 설명, 태그만 수정 가능합니다</li>
                    <li>• 변경사항은 즉시 고객에게 반영됩니다</li>
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
                저장 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                변경사항 저장
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStyleModal;
