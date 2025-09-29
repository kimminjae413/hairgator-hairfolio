// src/components/AuthLogin.tsx
import React, { useState } from 'react';
import * as firebaseService from '../services/firebaseService';
import * as authService from '../services/firebaseAuthService';
import { User } from 'firebase/auth';
import { portfolioImages } from '../portfolioImages';

interface AuthLoginProps {
  onLogin: (name: string, userId: string) => void;
}

type Mode = 'login' | 'signup' | 'verify-email';

const AuthLogin: React.FC<AuthLoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDesignerName('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!authService.isValidEmail(email)) {
        throw new Error('유효하지 않은 이메일 형식입니다.');
      }

      const passwordValidation = authService.isValidPassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // Sign in with Firebase Auth
      const result = await authService.signInWithEmail(email, password);
      
      if (!result.success || !result.user) {
        throw new Error(result.error || '로그인에 실패했습니다.');
      }

      const user = result.user;

      // Check if email is verified
      if (!user.emailVerified) {
        setPendingUser(user);
        setMode('verify-email');
        return;
      }

      // Get designer data from Firestore
      const designerData = await firebaseService.getDesignerData(user.uid);
      
      // Use display name from auth or from designer data
      const displayName = user.displayName || designerData.profile?.name || '디자이너';
      
      onLogin(displayName, user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!authService.isValidEmail(email)) {
        throw new Error('유효하지 않은 이메일 형식입니다.');
      }

      const passwordValidation = authService.isValidPassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      if (password !== confirmPassword) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      const nameValidation = authService.isValidDesignerName(designerName);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.message);
      }

      const trimmedName = designerName.trim();

      // Check if designer name is already taken (by checking UID in Firestore)
      // We'll use the displayName as the unique identifier
      const allDesigners = await firebaseService.getAllDesignerNames();
      if (allDesigners.includes(trimmedName)) {
        throw new Error('이미 사용 중인 디자이너 이름입니다. 다른 이름을 선택해주세요.');
      }

      // Create user account with Firebase Auth
      const result = await authService.signUpWithEmail(email, password, trimmedName);
      
      if (!result.success || !result.user) {
        throw new Error(result.error || '회원가입에 실패했습니다.');
      }

      const user = result.user;

      // Create initial portfolio in Firestore using UID as document ID
      const success = await firebaseService.savePortfolio(user.uid, portfolioImages);
      
      if (!success) {
        throw new Error('포트폴리오 생성에 실패했습니다.');
      }

      // Save designer profile
      await firebaseService.saveDesignerProfile(user.uid, {
        name: trimmedName
      });

      // Set pending user and switch to email verification mode
      setPendingUser(user);
      setMode('verify-email');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.resendEmailVerification();
      
      if (!result.success) {
        throw new Error(result.error || '인증 이메일 전송에 실패했습니다.');
      }

      alert('인증 이메일이 재전송되었습니다. 이메일을 확인해주세요.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const isVerified = await authService.checkEmailVerified();
      
      if (!isVerified) {
        throw new Error('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // Get designer data
      const designerData = await firebaseService.getDesignerData(user.uid);
      const displayName = user.displayName || designerData.profile?.name || '디자이너';
      
      onLogin(displayName, user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabStyle = "flex-1 py-3 text-center font-semibold text-sm transition-all duration-300 focus:outline-none relative";
  const activeTabStyle = "text-indigo-600 border-b-2 border-indigo-600";
  const inactiveTabStyle = "text-gray-500 hover:text-gray-700";

  // Email Verification Screen
  if (mode === 'verify-email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md mx-auto">
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">이메일 인증</h1>
            <p className="text-lg text-gray-600 mt-2">회원가입을 완료하려면 이메일을 인증해주세요</p>
          </header>

          <main className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">인증 이메일을 전송했습니다!</h2>
              <p className="text-gray-600 mb-4">
                <strong className="text-indigo-600">{pendingUser?.email}</strong>로<br />
                인증 이메일을 보냈습니다.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                다음 단계
              </h3>
              <ol className="text-blue-700 text-sm space-y-2">
                <li>1. 이메일 받은편지함을 확인하세요</li>
                <li>2. "이메일 인증" 링크를 클릭하세요</li>
                <li>3. 아래 "인증 완료" 버튼을 클릭하세요</li>
              </ol>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleCheckVerification}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="spinner w-5 h-5 mr-2"></div>
                    확인 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    인증 완료
                  </>
                )}
              </button>

              <button
                onClick={handleResendVerification}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                인증 이메일 재전송
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                이메일을 받지 못하셨나요?<br />
                스팸 메일함을 확인하거나 위의 "재전송" 버튼을 눌러주세요.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Login/Signup Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
          <p className="text-lg text-gray-600 mt-2">AI 헤어스타일 가상 체험 플랫폼</p>
        </header>

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
                ? '이메일과 비밀번호로 로그인하세요.' 
                : '새로운 헤어 디자이너 계정을 만드세요.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {/* Designer Name (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="designer-name" className="block text-sm font-medium text-gray-700 mb-2">
                  디자이너 이름 *
                </label>
                <input
                  id="designer-name"
                  type="text"
                  value={designerName}
                  onChange={(e) => setDesignerName(e.target.value)}
                  placeholder="예: 김미용, 박스타일"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                  maxLength={30}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 주소 *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인 *
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

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
              disabled={isLoading}
              className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="spinner w-5 h-5 mr-2"></div>
                  {mode === 'login' ? '로그인 중...' : '회원가입 중...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? '로그인' : '회원가입'}
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
                  로그인하기 →
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

export default AuthLogin;
