import React, { useState, useEffect, useRef } from 'react';
import { Gender, FemaleMajorCategory, MaleMajorCategory, MinorCategory, UploadStyleFormData } from '../types';
import { uploadWithProgress, isValidImageFile, isValidFileSize } from '../services/cloudinaryService';
import UploadIcon from './icons/UploadIcon';

interface UploadStyleModalProps {
  onUpload: (data: UploadStyleFormData & { cloudinaryUrl: string }) => void;
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
  const [uploadProgress, setUploadProgress] = useState(0);
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
    if (!isValidImageFile(selectedFile)) {
      return '지원되지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드 가능합니다.';
    }

    if (!isValidFileSize(selectedFile, 10)) {
      return '파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.';
    }

    return null;
  };

  // 의미없는 파일명인지 확인하는 함수
  const isMeaninglessFileName = (fileName: string): boolean => {
    const meaninglessPatterns = [
      /^IMG_\d+$/i,           // IMG_1234
      /^DSC\d+$/i,            // DSC1234  
      /^Photo_\d+$/i,         // Photo_123
      /^KakaoTalk_\d+$/i,     // KakaoTalk_20250924
      /^\d{8}_\d{6}$/,        // 20250924_123456
      /^Screenshot_/i,        // Screenshot_xxx
      /^image_?\d*$/i,        // image1, image
      /^photo_?\d*$/i,        // photo1, photo
      /^스크린샷/i,           // 스크린샷
      /^캡처$/i,              // 캡처
      /^사진\d*$/i,           // 사진1, 사진
      /^이미지\d*$/i,         // 이미지1, 이미지
      /^\d+$/,                // 순수 숫자만
      /^IMG-\d+$/i,           // IMG-20250924
      /^PXL_\d+$/i,           // PXL_20250924 (Google Pixel)
    ];
    
    return meaninglessPatterns.some(pattern => pattern.test(fileName));
  };

  // 성별과 카테고리에 따른 추천 스타일명 생성
  const getSuggestedStyleName = (gender: Gender, majorCategory: string): string => {
    const femaleSuggestions: { [key: string]: string[] } = {
      'A length': ['픽시 컷', '짧은 단발', '보이시 컷', '크롭 헤어'],
      'B length': ['보브 컷', '턱선 보브', '웨이브 보브', '일자 보브'],
      'C length': ['어깨 레이어드', '미디엄 컷', '쇄골 컷', 'C컬 스타일'],
      'D length': ['가슴라인 컷', '롱 레이어드', '미디엄 롱', '자연 웨이브'],
      'E length': ['롱 스트레이트', '긴 웨이브', '롱 레이어', '가슴 아래 컷'],
      'F length': ['허리 길이 컷', '수퍼 롱', '긴 생머리', '롱 웨이브'],
      'G length': ['힙 라인 컷', '익스트라 롱', '극장발', '초장발'],
      'H length': ['엉덩이 아래 컷', '울트라 롱', '라푼젤 헤어', '최장발'],
    };

    const maleSuggestions: { [key: string]: string[] } = {
      'SIDE FRINGE': ['사이드 뱅', '옆머리 스타일', '사이드 프린지', '비대칭 뱅'],
      'SIDE PART': ['사이드 파트', '클래식 파트', '신사 스타일', '정통 파트'],
      'FRINGE UP': ['업뱅 스타일', '올린 앞머리', '리프트 뱅', '볼륨 업'],
      'PUSHED BACK': ['올백 스타일', '뒤로 넘긴 머리', '슬릭백', '젤 백'],
      'BUZZ': ['버즈 컷', '삭발', '군인 컷', '스포츠 컷'],
      'CROP': ['크롭 컷', '텍스처 크롭', '모던 크롭', '페이드 크롭'],
      'MOHICAN': ['모히칸', '펑크 스타일', '리젠트 컷', '언더 컷'],
    };

    const suggestions = gender === 'Female' ? femaleSuggestions : maleSuggestions;
    const categoryOptions = suggestions[majorCategory] || ['새로운 스타일'];
    
    return categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
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
      
      // 파일명에서 확장자 제거
      const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.') || '';
      
      // 의미없는 파일명인지 확인
      if (isMeaninglessFileName(nameWithoutExt)) {
        // 의미없는 파일명인 경우 빈 값으로 설정
        setStyleName('');
        
        // placeholder에 추천 스타일명 표시를 위해 input 요소 업데이트
        setTimeout(() => {
          const inputElement = document.getElementById('style-name') as HTMLInputElement;
          if (inputElement) {
            const suggestion = getSuggestedStyleName(gender, majorCategory);
            inputElement.placeholder = `예: ${suggestion}`;
          }
        }, 100);
      } else {
        // 의미있는 파일명인 경우 첫글자 대문자로 정리해서 사용
        const cleanedName = nameWithoutExt
          .replace(/[-_]/g, ' ') // 하이픈, 언더스코어를 공백으로
          .replace(/\s+/g, ' ')  // 여러 공백을 하나로
          .trim();
        
        const capitalizedName = cleanedName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
          
        setStyleName(capitalizedName);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !styleName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Cloudinary에 이미지 업로드
      const cloudinaryUrl = await uploadWithProgress(
        file,
        (progress) => setUploadProgress(progress),
        {
          folder: 'hairfolio/styles',
          tags: ['hairfolio', 'hairstyle', gender.toLowerCase()]
        }
      );

      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const uploadData = {
        file,
        name: styleName.trim(),
        gender,
        majorCategory,
        minorCategory,
        description: description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        cloudinaryUrl // Cloudinary URL 추가
      };

      onUpload(uploadData);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
      setUploadProgress(0);
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
                
                {/* Upload Progress Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-white text-center">
                      <p className="text-sm mb-2">Cloudinary에 업로드 중...</p>
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
                disabled={isUploading}
                maxLength={50}
              />
              {!styleName && file && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  의미있는 스타일 이름을 입력해주세요
                </p>
              )}
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

            {/* Style Name Tip */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-green-800 text-sm">스타일명 작성 팁</h4>
                  <ul className="text-green-700 text-xs mt-1 space-y-1">
                    <li>• 고객이 이해하기 쉬운 이름을 사용하세요</li>
                    <li>• 예: "웨이브 보브", "레이어드 컷", "픽시 컷"</li>
                    <li>• 파일명(IMG_1234) 대신 스타일의 특징을 담아주세요</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cloudinary Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800 text-sm">클라우드 저장</h4>
                  <p className="text-blue-700 text-xs mt-1">
                    이미지는 Cloudinary 클라우드에 안전하게 저장되며, 모든 디바이스에서 접근 가능합니다.
                  </p>
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
                업로드 중... ({uploadProgress}%)
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                스타일 추가
              </button>
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
