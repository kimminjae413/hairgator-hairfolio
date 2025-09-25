import React, { useState, useEffect } from 'react';
import { DesignerProfile } from '../types';

interface IntroScreenProps {
  designerProfile: DesignerProfile;
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ designerProfile, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [typingText, setTypingText] = useState('');

  const salonName = designerProfile?.brandSettings?.salonName || 'Professional Salon';
  const designerName = designerProfile?.name || 'Hair Stylist';
  const profileImage = designerProfile?.profileImage;
  const subtitle = "Professional Hair Designer";

  // 타이핑 효과
  useEffect(() => {
    if (currentStep >= 4) {
      let index = 0;
      const timer = setInterval(() => {
        if (index <= subtitle.length) {
          setTypingText(subtitle.slice(0, index));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 50);
      return () => clearInterval(timer);
    }
  }, [currentStep, subtitle]);

  // 자동 단계 진행
  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 500),   // 프로필 사진 확대
      setTimeout(() => setCurrentStep(2), 1000),  // 골든 링 애니메이션
      setTimeout(() => setCurrentStep(3), 1500),  // 매장명 슬라이드업
      setTimeout(() => setCurrentStep(4), 2000),  // 타이핑 효과 시작
      setTimeout(() => setCurrentStep(5), 3500),  // Tap to continue 표시
      setTimeout(onComplete, 5000) // 자동 완료
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // 클릭으로 건너뛰기
  const handleSkip = () => {
    onComplete();
  };

  if (!profileImage) {
    // 프로필 이미지가 없으면 인트로 건너뛰기
    onComplete();
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%)'
      }}
      onClick={handleSkip}
    >
      {/* 배경 파티클 효과 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative text-center">
        
        {/* 프로필 사진 컨테이너 */}
        <div className="relative mb-8">
          {/* 골든 링 애니메이션 */}
          <div 
            className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              currentStep >= 2 
                ? 'border-4 border-yellow-400 shadow-lg shadow-yellow-400/50 scale-110' 
                : 'border-0 scale-100'
            }`}
            style={{
              width: '200px',
              height: '200px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: currentStep >= 2 ? 'conic-gradient(from 0deg, transparent 0deg, #fbbf24 90deg, transparent 180deg, #fbbf24 270deg, transparent 360deg)' : 'none',
              animation: currentStep >= 2 ? 'spin 3s linear infinite' : 'none',
              padding: '4px',
              borderRadius: '50%'
            }}
          >
            <div className="w-full h-full bg-gray-900 rounded-full"></div>
          </div>

          {/* 프로필 사진 */}
          <div 
            className={`relative w-48 h-48 mx-auto rounded-full overflow-hidden transition-all duration-1000 shadow-2xl ${
              currentStep >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
            style={{
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(251, 191, 36, 0.1)'
            }}
          >
            <img 
              src={profileImage} 
              alt={designerName}
              className="w-full h-full object-cover"
              style={{
                filter: 'brightness(1.1) contrast(1.1) saturate(1.2)'
              }}
            />
            
            {/* 프로필 사진 위 미묘한 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* 매장명 */}
        <div 
          className={`transition-all duration-1000 delay-500 ${
            currentStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h1 
            className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-yellow-100 to-yellow-200 bg-clip-text text-transparent"
            style={{
              fontFamily: designerProfile?.brandSettings?.fontFamily || 'serif',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              letterSpacing: '0.05em'
            }}
          >
            {salonName}
          </h1>
        </div>

        {/* 디자이너명 */}
        <div 
          className={`transition-all duration-1000 delay-700 ${
            currentStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <p className="text-xl text-gray-300 mb-4 font-light">
            with {designerName}
          </p>
        </div>

        {/* 타이핑 효과 서브타이틀 */}
        <div 
          className={`transition-all duration-500 ${
            currentStep >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-yellow-400 text-lg font-medium tracking-wider">
            {typingText}
            {currentStep >= 4 && typingText.length < subtitle.length && (
              <span className="animate-pulse">|</span>
            )}
          </p>
        </div>

        {/* Tap to continue */}
        <div 
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${
            currentStep >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-gray-400 text-sm animate-pulse">
            Tap anywhere to continue
          </p>
        </div>
      </div>

      {/* CSS 애니메이션을 위한 스타일 */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;
