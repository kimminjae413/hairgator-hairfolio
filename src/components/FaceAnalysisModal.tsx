import React, { useEffect, useState, useRef } from 'react';
import { FaceAnalysis } from '../services/faceAnalysisService';

interface FaceAnalysisModalProps {
  imageUrl: string;
  analysis: FaceAnalysis | null;
  isAnalyzing: boolean;
  onClose: () => void;
}

const FaceAnalysisModal: React.FC<FaceAnalysisModalProps> = ({
  imageUrl,
  analysis,
  isAnalyzing,
  onClose
}) => {
  const [landmarkProgress, setLandmarkProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'detecting' | 'analyzing' | 'complete'>('detecting');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 468개 랜드마크 감지 애니메이션
  useEffect(() => {
    if (!isAnalyzing) return;

    // Phase 1: 랜드마크 감지 (0-468)
    const landmarkInterval = setInterval(() => {
      setLandmarkProgress(prev => {
        if (prev >= 468) {
          clearInterval(landmarkInterval);
          setCurrentPhase('analyzing');
          return 468;
        }
        return prev + Math.floor(Math.random() * 30) + 10; // 10-40개씩 증가
      });
    }, 100);

    return () => clearInterval(landmarkInterval);
  }, [isAnalyzing]);

  // Canvas에 랜드마크 그리기
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !analysis?.landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx || !img.complete) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 이미지 그리기
    ctx.drawImage(img, 0, 0);

    // 랜드마크 그리기
    const landmarks = analysis.landmarks.slice(0, landmarkProgress);
    
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      // 주요 윤곽선 포인트는 크게 표시
      const isKeyPoint = [10, 152, 234, 454, 172, 397].includes(index);
      const radius = isKeyPoint ? 3 : 1.5;
      const color = isKeyPoint ? '#FF6B6B' : '#4ECDC4';

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // 연결선 그리기 (얼굴 윤곽)
      if (index > 0 && index < 17) {
        const prevLandmark = landmarks[index - 1];
        ctx.beginPath();
        ctx.moveTo(prevLandmark.x * canvas.width, prevLandmark.y * canvas.height);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [landmarkProgress, analysis]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">AI 얼굴 분석</h2>
                <p className="text-sm text-indigo-100">MediaPipe Face Mesh 기술</p>
              </div>
            </div>
            {!isAnalyzing && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 이미지 및 랜드마크 표시 */}
          <div className="relative mb-6">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Face Analysis"
              className="w-full rounded-lg shadow-lg"
              style={{ display: analysis?.landmarks ? 'none' : 'block' }}
            />
            {analysis?.landmarks && (
              <canvas
                ref={canvasRef}
                className="w-full rounded-lg shadow-lg"
              />
            )}
            
            {/* 분석 중 오버레이 */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-lg font-semibold mb-2">
                    {currentPhase === 'detecting' && '얼굴 감지 중...'}
                    {currentPhase === 'analyzing' && '데이터 분석 중...'}
                  </p>
                  {currentPhase === 'detecting' && (
                    <p className="text-sm text-gray-200">
                      랜드마크: {Math.min(landmarkProgress, 468)} / 468
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 분석 진행 상태 */}
          {isAnalyzing && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  landmarkProgress > 0 ? 'bg-green-500' : 'bg-gray-300 animate-pulse'
                }`}></div>
                <span className={landmarkProgress > 0 ? 'text-gray-700' : 'text-gray-400'}>
                  468개 얼굴 랜드마크 감지
                </span>
                {landmarkProgress > 0 && landmarkProgress < 468 && (
                  <span className="ml-2 text-indigo-600 font-semibold">
                    {Math.min(landmarkProgress, 468)}/468
                  </span>
                )}
                {landmarkProgress >= 468 && (
                  <svg className="w-5 h-5 text-green-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  currentPhase === 'analyzing' || currentPhase === 'complete' ? 'bg-green-500' : 'bg-gray-300 animate-pulse'
                }`}></div>
                <span className={currentPhase === 'analyzing' || currentPhase === 'complete' ? 'text-gray-700' : 'text-gray-400'}>
                  얼굴형 분석
                </span>
                {currentPhase === 'analyzing' && (
                  <span className="ml-2 text-indigo-600">처리 중...</span>
                )}
              </div>

              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  currentPhase === 'complete' && analysis ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className={currentPhase === 'complete' && analysis ? 'text-gray-700' : 'text-gray-400'}>
                  퍼스널 컬러 분석
                </span>
              </div>
            </div>
          )}

          {/* 분석 결과 표시 */}
          {!isAnalyzing && analysis?.detected && (
            <div className="space-y-4">
              {/* 얼굴형 결과 */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">얼굴형</h3>
                    <p className="text-2xl font-bold text-indigo-600">{analysis.faceShape}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {getFaceShapeDescription(analysis.faceShape || '')}
                </p>
              </div>

              {/* 퍼스널 컬러 결과 */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                    background: analysis.skinTone?.hex || '#E5E7EB'
                  }}>
                    <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">퍼스널 컬러</h3>
                    <p className="text-2xl font-bold text-purple-600">{analysis.personalColor}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {getPersonalColorDescription(analysis.personalColor || '')}
                </p>
              </div>

              {/* 신뢰도 */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>분석 신뢰도: <strong>{(analysis.confidence * 100).toFixed(0)}%</strong></span>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {!isAnalyzing && !analysis?.detected && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">얼굴을 감지하지 못했습니다</h3>
              <p className="text-gray-600 text-sm">{analysis?.message || '다른 사진으로 다시 시도해주세요.'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isAnalyzing && analysis?.detected && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              스타일 선택하러 가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getFaceShapeDescription = (faceShape: string): string => {
  const descriptions: { [key: string]: string } = {
    '계란형': '균형잡힌 이상적인 얼굴형입니다. 대부분의 헤어스타일이 잘 어울립니다.',
    '둥근형': '레이어드 컷으로 얼굴 라인을 살리고, 높이감 있는 스타일을 추천합니다.',
    '각진형': '웨이브나 부드러운 컬로 각진 라인을 완화시켜보세요.',
    '하트형': '턱선을 커버하는 미디엄 레이어드나 보브 스타일이 잘 어울립니다.',
    '긴 얼굴형': '옆 볼륨을 살린 스타일로 얼굴 비율의 균형을 맞춰보세요.',
    '다이아몬드형': '이마와 턱선에 볼륨을 주는 스타일로 광대를 자연스럽게 커버하세요.',
    '타원형': '균형잡힌 얼굴형으로 다양한 스타일을 시도해보세요.'
  };
  return descriptions[faceShape] || '자신에게 맞는 스타일을 찾아보세요!';
};

const getPersonalColorDescription = (personalColor: string): string => {
  const descriptions: { [key: string]: string } = {
    '봄 웜톤': '코랄, 피치, 카라멜 브라운, 골드 블론드 등 밝고 따뜻한 색상이 잘 어울립니다.',
    '가을 웜톤': '오렌지 브라운, 구리빛, 올리브, 따뜻한 레드 계열이 피부톤과 조화롭습니다.',
    '여름 쿨톤': '애쉬 브라운, 라벤더, 로즈 골드, 실버 그레이 등 부드러운 쿨톤이 어울립니다.',
    '겨울 쿨톤': '젯 블랙, 플래티넘 블론드, 와인 레드, 블루 블랙 등 선명한 색상을 추천합니다.'
  };
  return descriptions[personalColor] || '다양한 색상을 시도해보세요!';
};

export default FaceAnalysisModal;
