import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorTryOn, ColorTryOnRequest } from '../services/geminiColorService';

interface ColorTryOnModalProps {
  colorStyleImage: {
    name: string;
    url: string;
    serviceSubCategory?: string;
    description?: string;
  };
  userFaceFile?: File | null; // 기존 얼굴 사진 파일
  userFacePreview?: string | null; // 기존 얼굴 사진 미리보기
  onClose: () => void;
  onComplete: (result: any) => void;
}

const ColorTryOnModal: React.FC<ColorTryOnModalProps> = ({
  colorStyleImage,
  userFaceFile: initialFaceFile,
  userFacePreview: initialFacePreview,
  onClose,
  onComplete
}) => {
  const { t } = useTranslation();
  
  // 얼굴 사진 상태 - 초기값으로 전달받은 파일 사용
  const [userPhoto, setUserPhoto] = useState<File | null>(initialFaceFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialFacePreview || null);
  
  const [colorType, setColorType] = useState<'highlight' | 'full-color' | 'ombre' | 'balayage'>('full-color');
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'bold'>('medium');
  const [currentStep, setCurrentStep] = useState<'upload' | 'options' | 'processing' | 'result'>(
    // 이미 얼굴 사진이 있으면 옵션 단계로 바로 이동
    initialFaceFile ? 'options' : 'upload'
  );
  
  const { isProcessing, result, error, tryOnColor } = useColorTryOn();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하만 가능합니다.');
        return;
      }

      setUserPhoto(file);
      // 기존 미리보기 URL 정리
      if (previewUrl && previewUrl !== initialFacePreview) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
      setCurrentStep('options');
    }
  };

  const handleStartTryOn = async () => {
    if (!userPhoto) return;

    setCurrentStep('processing');

    // 사용자 사진을 URL로 변환 (File일 경우)
    const userPhotoUrl = previewUrl || URL.createObjectURL(userPhoto);

    const request: ColorTryOnRequest = {
      userPhotoUrl,
      colorStyleUrl: colorStyleImage.url,
      colorType,
      intensity,
      colorName: colorStyleImage.name
    };

    try {
      await tryOnColor(request);
      setCurrentStep('result');
    } catch (err) {
      console.error('Color try-on failed:', err);
      setCurrentStep('options');
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const colorTypeLabels = {
    'full-color': '전체 염색',
    'highlight': '하이라이트',
    'ombre': '옴브레',
    'balayage': '발레아쥬'
  };

  const intensityLabels = {
    'light': '은은하게',
    'medium': '자연스럽게', 
    'bold': '진하게'
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={handleModalClick}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
              스마트 염색 체험
            </h2>
            <p className="text-sm text-gray-600 mt-1">{colorStyleImage.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Upload Photo (기존 사진이 없을 때만 표시) */}
          {currentStep === 'upload' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">얼굴 사진을 업로드해주세요</h3>
                <p className="text-gray-600 text-sm mb-6">
                  선명하고 정면을 향한 사진일수록 더 정확한 결과를 얻을 수 있습니다.
                </p>
              </div>

              {/* Reference Style Image */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">체험할 염색 스타일</h4>
                <div className="flex gap-4">
                  <img 
                    src={colorStyleImage.url} 
                    alt={colorStyleImage.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium">{colorStyleImage.name}</h5>
                    {colorStyleImage.serviceSubCategory && (
                      <p className="text-sm text-gray-600">{colorStyleImage.serviceSubCategory}</p>
                    )}
                    {colorStyleImage.description && (
                      <p className="text-xs text-gray-500 mt-1">{colorStyleImage.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium text-gray-700 mb-2">사진 선택하기</p>
                <p className="text-sm text-gray-500">JPG, PNG 파일 (최대 10MB)</p>
              </div>

              {/* Guidelines */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📷 좋은 결과를 위한 팁</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 밝은 조명에서 촬영된 사진을 사용하세요</li>
                  <li>• 얼굴과 머리카락이 선명하게 보이는 사진이 좋습니다</li>
                  <li>• 정면을 향하고 있는 사진을 권장합니다</li>
                  <li>• 모자나 액세서리로 머리카락이 가려지지 않은 사진을 선택하세요</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Options */}
          {currentStep === 'options' && (
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      {initialFaceFile ? '업로드된 사진' : '선택된 사진'}
                    </h3>
                    {initialFaceFile && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        기존 사진 사용
                      </span>
                    )}
                  </div>
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    다른 사진 선택하기
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Options */}
                <div>
                  <h3 className="font-semibold mb-4">염색 옵션</h3>
                  
                  {/* Color Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">염색 방식</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(colorTypeLabels).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setColorType(value as any)}
                          className={`p-3 text-sm rounded-lg border transition-colors ${
                            colorType === value
                              ? 'bg-purple-100 border-purple-400 text-purple-800'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intensity */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">색상 강도</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(intensityLabels).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setIntensity(value as any)}
                          className={`p-2 text-sm rounded-lg border transition-colors ${
                            intensity === value
                              ? 'bg-purple-100 border-purple-400 text-purple-800'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStartTryOn}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
                  >
                    스마트 염색 시작하기
                  </button>

                  {/* Info */}
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-700">
                      ⏱️ 처리 시간은 약 30-60초 소요됩니다. 
                      AI가 얼굴형과 피부톤을 분석하여 가장 어울리는 결과를 만들어드립니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {currentStep === 'processing' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-3">AI가 염색을 진행중입니다...</h3>
                <p className="text-gray-600 mb-6">
                  고급 AI가 얼굴형, 피부톤, 헤어 스타일을 분석하여<br />
                  가장 어울리는 염색 결과를 만들고 있습니다.
                </p>

                {/* Processing Steps */}
                <div className="text-left max-w-md mx-auto space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">얼굴 및 헤어 영역 분석 완료</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">피부톤 매칭 분석 완료</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-gray-700">염색 효과 적용 중...</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    <span>최종 결과 생성 대기 중</span>
                  </div>
                </div>

                <div className="mt-8 text-xs text-gray-500">
                  잠시만 기다려주세요. 고품질 결과를 위해 신중히 처리하고 있습니다.
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {currentStep === 'result' && (
            <div className="p-6">
              {error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">처리 중 오류가 발생했습니다</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={() => setCurrentStep('options')}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    다시 시도하기
                  </button>
                </div>
              ) : result ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-center flex items-center justify-center gap-2">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                    </svg>
                    스마트 염색 체험 결과
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Before */}
                    <div>
                      <h4 className="font-medium mb-2">변환 전</h4>
                      <img 
                        src={previewUrl!} 
                        alt="Before"
                        className="w-full h-64 object-cover rounded-lg border"
                      />
                    </div>
                    
                    {/* After */}
                    <div>
                      <h4 className="font-medium mb-2">변환 후</h4>
                      <img 
                        src={result.resultImageUrl} 
                        alt="After"
                        className="w-full h-64 object-cover rounded-lg border"
                      />
                    </div>
                  </div>

                  {/* Analysis Results */}
                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium mb-2">AI 분석 결과</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">신뢰도:</span>
                          <span className="ml-2 font-medium">{Math.round(result.confidence * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">피부톤 매칭:</span>
                          <span className={`ml-2 font-medium ${
                            result.colorAnalysis.skinToneMatch === 'excellent' ? 'text-green-600' :
                            result.colorAnalysis.skinToneMatch === 'good' ? 'text-blue-600' :
                            result.colorAnalysis.skinToneMatch === 'fair' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {result.colorAnalysis.skinToneMatch === 'excellent' ? '매우 좋음' :
                             result.colorAnalysis.skinToneMatch === 'good' ? '좋음' :
                             result.colorAnalysis.skinToneMatch === 'fair' ? '보통' : '개선 필요'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {result.colorAnalysis.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium mb-2 text-blue-800">💡 전문가 추천사항</h5>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {result.colorAnalysis.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onComplete(result);
                        onClose();
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                    >
                      이 결과로 예약하기
                    </button>
                    <button
                      onClick={() => setCurrentStep('upload')}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorTryOnModal;
