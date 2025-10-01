import React, { useRef, useState } from 'react';
import { validateUploadConfig } from '../services/cloudinaryService';

interface ImageUploaderProps {
  id: string;
  label: string;
  previewSrc: string | null;
  onFileChange: (file: File | null) => void;
  icon: React.ReactNode;
  disabled?: boolean;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  id, 
  label, 
  previewSrc, 
  onFileChange, 
  icon, 
  disabled = false,
  maxSizeMB = 5,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/webp']
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cloudinary 설정 체크
  const { isValid: isCloudinaryValid, errors: cloudinaryErrors } = validateUploadConfig();

  const validateFile = (file: File): string | null => {
    // 파일 형식 체크
    if (!acceptedFormats.includes(file.type)) {
      return `지원되지 않는 파일 형식입니다. (${acceptedFormats.join(', ')})`;
    }

    // 파일 크기 체크
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `파일 크기가 ${maxSizeMB}MB를 초과합니다.`;
    }

    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError(null);

    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        // 입력 필드 초기화
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }
    }

    onFileChange(file);
  };

  const handleContainerClick = () => {
    if (!disabled && isCloudinaryValid) {
      inputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && isCloudinaryValid) {
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);

    if (disabled || !isCloudinaryValid) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      onFileChange(file);
    }
  };

  // Cloudinary 설정이 잘못된 경우
  if (!isCloudinaryValid) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-sm text-gray-600 mb-2 text-center">{label}</p>
        <div className="relative w-full max-w-sm mx-auto aspect-square bg-red-50 rounded-lg border-2 border-dashed border-red-300 flex items-center justify-center overflow-hidden">
          <div className="text-center text-red-500 p-4">
            <div className="w-16 h-16 mx-auto mb-2">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="font-medium text-sm">설정 오류</p>
            <p className="text-xs mt-1">Cloudinary 환경변수를 확인하세요</p>
            {cloudinaryErrors.length > 0 && (
              <ul className="text-xs mt-2 space-y-1">
                {cloudinaryErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm text-gray-600 mb-2 text-center">{label}</p>
      <div
        onClick={handleContainerClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full max-w-sm mx-auto aspect-square rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300 ${
          !disabled && isCloudinaryValid
            ? `cursor-pointer ${
                dragOver 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
              }`
            : 'cursor-not-allowed bg-gray-200 border-gray-300'
        } ${error ? 'border-red-300 bg-red-50' : 'bg-gray-100'}`}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={acceptedFormats.join(', ')}
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || !isCloudinaryValid}
        />
        {previewSrc ? (
          <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className={`text-center p-4 ${error ? 'text-red-500' : 'text-gray-500'}`}>
            <div className="w-16 h-16 mx-auto mb-2 text-gray-400">
              {icon}
            </div>
            <p className="font-medium">
              {error ? '업로드 실패' : dragOver ? '파일을 놓으세요' : 'Click to upload'}
            </p>
            <p className="text-xs">
              {error ? error : `PNG, JPG, WEBP (최대 ${maxSizeMB}MB)`}
            </p>
          </div>
        )}
      </div>

      {/* 디버그 정보 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          <p>Cloudinary: {isCloudinaryValid ? '✅ 설정됨' : '❌ 설정 안됨'}</p>
          <p>환경: {import.meta.env.MODE}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
