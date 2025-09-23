import React, { useState } from 'react';
import * as localStorageService from '../services/localStorageService';
import { portfolioImages } from '../portfolioImages';

interface LoginProps {
  onLogin: (name: string) => void;
}

type Mode = 'login' | 'signup';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error("이름을 입력해주세요.");
      }

      if (trimmedName.length < 2) {
        throw new Error("이름은 2글자 이상 입력해주세요.");
      }

      if (trimmedName.length > 20) {
        throw new Error("이름은 20글자 이하로 입력해주세요.");
      }

      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      if (mode === 'login') {
        if (localStorageService.designerExists(trimmedName)) {
          onLogin(trimmedName);
        } else {
          throw new Error('등록되지 않은 디자이너입니다. 회원가입을 먼저 진행해주세요.');
        }
      } else { // signup
        if (localStorageService.designerExists(trimmedName)) {
          throw new Error('이미 사용중인 이름입니다. 다른 이름을 선택해주세요.');
        } else {
          // Create a new portfolio for the designer with default images and initial stats
          localStorageService.savePortfolio(trimmedName, portfolioImages);
          onLogin(trimmedName);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabStyle = "flex-1 py-3 text-center font-semibold text-sm transition-all duration-300 focus:outline-none relative";
  const activeTabStyle = "text-indigo-600 border-b-2 border-indigo-600";
  const inactiveTabStyle = "text-gray-500 hover:text-gray-700";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
          <p className="text-lg text-gray-600 mt-2">AI 헤어스타일 가상 체험 플랫폼</p>
        </header>

        {/* Main Card */}
        <main className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-200 mb-6 relative">
            <button
              onClick={() => handleModeChange('login')}
              className={`${tabStyle} ${mode === 'login' ? activeTabStyle : inactiveTabStyle}`}
              disabled={isLoading}
            >
              로그인
            </button>
            <button
              onClick={() => handleModeChange('signup')}
              className={`${tabStyle} ${mode === 'signup' ? activeTabStyle : inactiveTabStyle}`}
              disabled={isLoading}
            >
              회원가입
            </button>
          </div>

          {/* Form Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {mode === 'login' ? '포트폴리오 관리' : '새 포트폴리오 만들기'}
            </h2>
            <p className="text-gray-500">
              {mode === 'login' 
                ? '디자이너 이름을 입력해서 포트폴리오를 관리하세요.' 
                : '새로운 헤어 디자이너 포트폴리오를 시작하세요.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="designer-name" className="block text-sm font-medium text-gray-700 mb-2">
                디자이너 이름
              </label>
              <input
                id="designer-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 김미용, 박스타일"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isLoading}
                autoComplete="name"
                maxLength={20}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="spinner w-5 h-5 mr-2"></div>
                  {mode === 'login' ? '로그인 중...' : '포트폴리오 생성 중...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? '포트폴리오 열기' : '포트폴리오 만들기'}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {mode === 'login' ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">처음이신가요?</p>
                <button
                  onClick={() => handleModeChange('signup')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                  disabled={isLoading}
                >
                  새 포트폴리오 만들기 →
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">이미 계정이 있나요?</p>
                <button
                  onClick={() => handleModeChange('login')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                  disabled={isLoading}
                >
                  기존 포트폴리오 열기 →
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="font-semibold text-gray-800 text-sm">AI 스타일링</h3>
            <p className="text-xs text-gray-600 mt-1">실시간 헤어스타일 체험</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-800 text-sm">QR 공유</h3>
            <p className="text-xs text-gray-600 mt-1">간편한 포트폴리오 공유</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800 text-sm">분석 리포트</h3>
            <p className="text-xs text-gray-600 mt-1">상세한 통계 제공</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8">
          <p className="text-sm text-gray-500">Powered by VModel AI</p>
          <p className="text-xs text-gray-400 mt-1">
            © 2024 Hairfolio. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
