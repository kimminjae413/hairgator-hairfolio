import React, { useState, useEffect, useRef } from 'react';
import { Gender, FemaleMajorCategory, MaleMajorCategory, MinorCategory, UploadStyleFormData } from '../types';
import UploadIcon from './icons/UploadIcon';

interface UploadStyleModalProps {
  onUpload: (data: UploadStyleFormData) => void;
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

const UploadStyleModal: React.FC<UploadStyleModalProps> = ({ onUpload, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleName, setStyleName] = useState('');
  const [gender, setGender] = useState<Gender>('Female');
  const [majorCategory, setMajorCategory] = useState<FemaleMajorCategory | MaleMajorCategory>(FEMALE_MAJOR_CATEGORIES[0]);
  const [minorCategory, setMinorCategory] = useState<MinorCategory>(MINOR_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When gender changes, update the major category dropdown and reset its value
    if (gender === 'Female') {
      setMajorCategory(FEMALE_MAJOR_CATEGORIES[0]);
    } else {
      setMajorCategory(MALE_MAJOR_CATEGORIES[0]);
    }
  }, [gender]);

  // Handle file validation
  const validateFile = (selectedFile: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(selectedFile.type)) {
      return '지원되지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드 가능합니다.';
    }

    if (selectedFile.size > maxSize) {
      return '파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.';
    }

    return null;
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
      
      // Prefill style name without extension
      const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.') || '';
      setStyleName(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!file || !styleName.trim()) return;

    setIsUploading(true);
    setError(null);

    try {
      // Simulate upload delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const uploadData: UploadStyleFormData = {
        file,
        name: styleName.trim(),
        gender,
        majorCategory,
        minorCategory,
        description: description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined
      };

      onUpload(uploadData);
    } catch (err) {
      setError('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-800">새 스타일 추가</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">스타일 이미지 *</label>
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
                  <img src={previewUrl} alt="미리보기" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    <div className="w-12 h-12 mx-auto mb-2 text-gray-400">
                      <UploadIcon />
                    </div>
                    <p className="font-medium">이미지 업로드</p>
                    <p className="text-xs mt-1">JPEG, PNG, WebP (최대 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Style Name */}
            <div>
              <label htmlFor="style-name" className="block text-sm font-medium text-gray-700 mb-1">
                스타일 이름 *
              </label>
              <input
                id="style-name"
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="예: 소프트 레이어드 컷"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isUploading}
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
                  disabled={isUploading}
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
                  disabled={isUploading}
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
                  disabled={isUploading}
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
                  disabled={isUploading}
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
                태그 (쉼표로 구분)
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="웨이브, 자연스러운, 세련된"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isUploading}
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
                <div className="spinner w-5 h-5 mr-2"></div>
                업로드 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                스타일 추가
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadStyleModal;
