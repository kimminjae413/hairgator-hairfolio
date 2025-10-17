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
    if (!isAnalyzing) {
      setLandmarkProgress(468);
      setCurrentPhase('complete');
      return;
    }

    setLandmarkProgress(0);
    setCurrentPhase('detecting');

    // Phase 1: 랜드마크 감지 (0-468)
    const landmarkInterval = setInterval(() => {
      setLandmarkProgress(prev => {
        if (prev >= 468) {
          clearInterval(landmarkInterval);
          setCurrentPhase('analyzing');
          return 468;
        }
        return prev + Math.floor(Math.random() * 30) + 15; // 15-45개씩 증가
      });
    }, 80);

    return () => clearInterval(landmarkInterval);
  }, [isAnalyzing]);

  // Canvas에 랜드마크 그리기 (실제 시각화)
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;

    if (!canvas || !img || !analysis?.landmarks || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기를 이미지 원본 크기에 맞춤
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 이미지를 Canvas 배경으로 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 애니메이션 진행에 따라 랜드마크 그리기
    const visibleLandmarks = analysis.landmarks.slice(0, Math.min(landmarkProgress, 468));

    // 1. 연결선 먼저 그리기 (얼굴 윤곽)
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.6)';
    ctx.lineWidth = 2;

    // 턱선 연결 (0-16)
    ctx.beginPath();
    for (let i = 0; i < Math.min(17, visibleLandmarks.length); i++) {
      const lm = visibleLandmarks[i];
      const x = lm.x * canvas.width;
      const y = lm.y * canvas.height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // 왼쪽 눈썹 (17-21)
    if (visibleLandmarks.length > 21) {
      ctx.beginPath();
      for (let i = 17; i <= 21; i++) {
        const lm = visibleLandmarks[i];
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        if (i === 17) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 오른쪽 눈썹 (22-26)
    if (visibleLandmarks.length > 26) {
      ctx.beginPath();
      for (let i = 22; i <= 26; i++) {
        const lm = visibleLandmarks[i];
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        if (i === 22) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 코 (27-35)
    if (visibleLandmarks.length > 35) {
      ctx.beginPath();
      for (let i = 27; i <= 35; i++) {
        const lm = visibleLandmarks[i];
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        if (i === 27) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 왼쪽 눈 (36-41)
    if (visibleLandmarks.length > 41) {
      ctx.beginPath();
      for (let i = 36; i <= 41; i++) {
        const lm = visibleLandmarks[i];
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        if (i === 36) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 오른쪽 눈 (42-47)
    if (visibleLandmarks.length > 47) {
      ctx.beginPath();
      for (let i = 42; i <= 47; i++) {
        const lm = visibleLandmarks[i];
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        if (i === 42) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 입술 외곽 (48-59)
    if (visibleLandmarks.length > 59) {
      ctx.beginPath();
      for (let i = 48; i <= 59; i++) {
        const lm = visibleLandmarks[i];
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        if (i === 48) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 2. 랜드마크 점 그리기
    visibleLandmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      // 주요 포인트 (이마, 턱, 관자놀이)는 크고 빨간색으로
      const isKeyPoint = [10, 152, 234, 454, 172, 397].includes(index);
      
      if (isKeyPoint) {
        // 주요 포인트: 빨간색 그라데이션
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#FF0000');
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 흰색 테두리
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // 일반 포인트: 초록색 그라데이션
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 2);
        gradient.addColorStop(0, '#4ECDC4');
        gradient.addColorStop(1, '#2C9A93');
        
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    });

    // 3. Canvas 왼쪽 상단에 진행률 표시
    if (landmarkProgress < 468) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 180, 40);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px sans-serif';
      ctx.fillText(`랜드마크: ${landmarkProgress}/468`, 20, 35);
    }

  }, [analysis, landmarkProgress]);

  // 이미지 로드 완료 시 Canvas 업데이트 트리거
  const handleImageLoad = () => {
    if (analysis?.landmarks) {
      // 강제로 리렌더링
      setLandmarkProgress(prev => prev);
    }
  };

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
          {/* 이미지 및 랜드마크 Canvas */}
          <div className="relative mb-6">
            {/* 원본 이미지 (숨김 - Canvas 그리기용) */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Face Analysis"
              onLoad={handleImageLoad}
              style={{ display: 'none' }}
            />
            
            {/* Canvas (랜드마크 시각화) */}
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg shadow-lg"
              style={{ display: analysis?.landmarks ? 'block' : 'none' }}
            />
            
            {/* 랜드마크 없을 때 원본 이미지 표시 */}
            {!analysis?.landmarks && (
              <img
                src={imageUrl}
                alt="Face Analysis"
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
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-md"
                    style={{ backgroundColor: analysis.skinTone?.hex || '#C89678' }}
                  >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
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
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">분석 신뢰도</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {Math.round((analysis.confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(analysis.confidence || 0) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* 감지 실패 메시지 */}
          {!isAnalyzing && !analysis?.detected && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">얼굴 감지 실패</h3>
              <p className="text-sm text-gray-600">
                {analysis?.message || '정면 얼굴 사진을 업로드해주세요.'}
              </p>
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
    '봄 웜톤 (뮤트)': '부드러운 코랄, 베이지, 라이트 브라운 등 은은한 따뜻한 색상을 추천합니다.',
    '가을 웜톤': '오렌지 브라운, 구리빛, 올리브, 따뜻한 레드 계열이 피부톤과 조화롭습니다.',
    '가을 웜톤 (딥)': '초콜릿 브라운, 딥 레드, 진한 오렌지 계열의 풍부한 색상이 어울립니다.',
    '여름 쿨톤': '애쉬 브라운, 로즈 골드, 실버 그레이 등 부드러운 쿨톤이 어울립니다.',
    '여름 쿨톤 (라이트)': '라벤더, 핑크 베이지, 연한 애쉬 블론드 등 밝은 쿨톤을 추천합니다.',
    '겨울 쿨톤': '젯 블랙, 와인 레드, 블루 블랙 등 선명한 색상을 추천합니다.',
    '겨울 쿨톤 (브라이트)': '플래티넘 블론드, 실버, 비비드 레드 등 강렬한 색상이 잘 어울립니다.'
  };
  return descriptions[personalColor] || '다양한 색상을 시도해보세요!';
};

export default FaceAnalysisModal;
