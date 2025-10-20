// src/components/AuthLogin.tsx - 완전한 최종 버전 (디자이너 + 일반 사용자)
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as firebaseService from '../services/firebaseService';
import * as authService from '../services/firebaseAuthService';
import { User } from 'firebase/auth';
import { UserType } from '../types';
import { portfolioImages } from '../portfolioImages';
import LanguageSelector from './LanguageSelector';

interface AuthLoginProps {
  onLogin: (name: string, userId: string) => void;
}

type Mode = 'login' | 'signup-select-type' | 'signup-step1' | 'signup-step2' | 'verify-email';

const AuthLogin: React.FC<AuthLoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('login');
  const [userType, setUserType] = useState<UserType>('designer'); // 신규: 사용자 타입
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(''); // designerName에서 name으로 변경
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    if (newMode === 'login' || newMode === 'signup-select-type') {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setEmailVerified(false);
      setUserType('designer');
    }
  };

  // Step 0: 사용자 타입 선택 (신규)
  const handleSelectUserType = (type: UserType) => {
    setUserType(type);
    setMode('signup-step1');
  };

  // Step 1: 이메일 & 이름 확인
  const handleCheckEmail = async () => {
    setError(null);
    setIsCheckingEmail(true);

    try {
      if (!authService.isValidEmail(email)) {
        throw new Error(t('auth.invalidEmailFormat'));
      }

      const nameValidation = authService.isValidName(name);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.message);
      }

      setEmailVerified(true);
      setMode('signup-step2');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.emailCheckError'));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!authService.isValidEmail(email)) {
        throw new Error(t('auth.invalidEmailFormat'));
      }

      const passwordValidation = authService.isValidPassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      const result = await authService.signInWithEmail(email, password);
      
      if (!result.success || !result.user) {
        throw new Error(result.error || t('auth.loginFailed'));
      }

      const user = result.user;

      if (!user.emailVerified) {
        setPendingUser(user);
        setMode('verify-email');
        return;
      }

      // 사용자 타입 확인
      const userData = await firebaseService.getUser(user.uid);
      const currentUserType = userData?.userType || 'designer';

      if (currentUserType === 'designer') {
        const designerData = await firebaseService.getDesignerDataById(user.uid);
        const displayName = user.displayName || designerData.profile?.name || t('common.designer');
        onLogin(displayName, user.uid);
      } else {
        const displayName = user.displayName || t('common.client', '사용자');
        onLogin(displayName, user.uid);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: 비밀번호 설정 후 회원가입
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const passwordValidation = authService.isValidPassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      if (password !== confirmPassword) {
        throw new Error(t('auth.passwordMismatch'));
      }

      const trimmedName = name.trim();
      
      // 회원가입 (사용자 타입 포함)
      const result = await authService.signUpWithEmail(email, password, trimmedName, userType);
      
      if (!result.success || !result.user) {
        if (result.error?.includes('이미 사용 중인 이메일')) {
          throw new Error(t('auth.emailAlreadyExists'));
        }
        throw new Error(result.error || t('auth.signupFailed'));
      }

      const user = result.user;
      setPendingUser(user);
      setMode('verify-email');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signupError'));
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
        throw new Error(result.error || t('auth.verificationEmailFailed'));
      }

      alert(t('auth.verificationEmailSent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.verificationEmailError'));
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
        throw new Error(t('auth.emailNotVerified'));
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error(t('auth.userNotFound'));
      }

      const userData = await firebaseService.getUser(user.uid);
      const currentUserType = userData?.userType || 'designer';
      
      if (currentUserType === 'designer') {
        const designerData = await firebaseService.getDesignerDataById(user.uid);
        const displayName = user.displayName || designerData.profile?.name || t('common.designer');
        onLogin(displayName, user.uid);
      } else {
        const displayName = user.displayName || t('common.client', '사용자');
        onLogin(displayName, user.uid);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.verificationCheckError'));
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
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-md mx-auto">
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">{t('auth.emailVerification')}</h1>
            <p className="text-lg text-gray-600 mt-2">{t('auth.emailVerificationDesc')}</p>
          </header>

          <main className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.verificationEmailSentTitle')}</h2>
              <p className="text-gray-600 mb-4">
                <strong className="text-indigo-600">{pendingUser?.email}</strong>{t('auth.verificationEmailSentDesc')}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('auth.nextSteps')}
              </h3>
              <ol className="text-blue-700 text-sm space-y-2">
                <li>{t('auth.step1CheckEmail')}</li>
                <li>{t('auth.step2ClickLink')}</li>
                <li>{t('auth.step3ClickComplete')}</li>
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
                    {t('auth.checking')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('auth.verificationComplete')}
                  </>
                )}
              </button>

              <button
                onClick={handleResendVerification}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {t('auth.resendVerificationEmail')}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {t('auth.emailNotReceived')}
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 사용자 타입 선택 화면 (신규)
  if (mode === 'signup-select-type') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
            <p className="text-lg text-gray-600 mt-2">{t('auth.platformSubtitle')}</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">가입 유형을 선택하세요</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 디자이너 가입 */}
              <button
                onClick={() => handleSelectUserType('designer')}
                className="p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">✂️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">헤어 디자이너</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    포트폴리오를 만들고<br />
                    고객들과 공유하세요
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 text-left">
                    <li>✓ AI 가상 체험 제공</li>
                    <li>✓ QR 코드로 간편 공유</li>
                    <li>✓ 분석 리포트 제공</li>
                  </ul>
                </div>
              </button>

              {/* 일반 사용자 가입 */}
              <button
                onClick={() => handleSelectUserType('client')}
                className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-600 hover:bg-purple-50 transition-all group"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">👤</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">일반 사용자</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    헤어스타일을 찾고<br />
                    AI로 미리 체험해보세요
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 text-left">
                    <li>✓ 전체 포트폴리오 탐색</li>
                    <li>✓ 얼굴형 맞춤 추천</li>
                    <li>✓ 위치 기반 검색</li>
                  </ul>
                </div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">{t('auth.alreadyHaveAccount')}</p>
              <button
                onClick={() => handleModeChange('login')}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
              >
                {t('auth.loginButton')} →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Signup Step 2: Password Setting
  if (mode === 'signup-step2') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-md mx-auto">
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">{t('auth.passwordSetup')}</h1>
            <p className="text-lg text-gray-600 mt-2">{t('auth.passwordSetupDesc')}</p>
          </header>

          <main className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* Email Confirmed Badge */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-green-800 font-semibold">{t('auth.emailConfirmed')}</p>
                  <p className="text-green-700 text-sm">{email}</p>
                  <p className="text-green-600 text-xs mt-1">{t('auth.duplicateCheckNote')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
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

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.confirmPassword')} *
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="spinner w-5 h-5 mr-2"></div>
                    {t('auth.signupInProgress')}
                  </>
                ) : (
                  <>
                    {t('auth.completeSignup')}
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('signup-step1')}
                disabled={isLoading}
                className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                ← {t('auth.changeEmail')}
              </button>
            </form>
          </main>
        </div>
      </div>
    );
  }

  // Login / Signup Step 1 Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
          <p className="text-lg text-gray-600 mt-2">{t('auth.platformSubtitle')}</p>
        </header>

        <main className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-200 mb-6 relative">
            <button
              onClick={() => handleModeChange('login')}
              className={`${tabStyle} ${mode === 'login' ? activeTabStyle : inactiveTabStyle}`}
              disabled={isLoading || isCheckingEmail}
            >
              {t('auth.login')}
            </button>
            <button
              onClick={() => handleModeChange('signup-select-type')}
              className={`${tabStyle} ${mode === 'signup-step1' ? activeTabStyle : inactiveTabStyle}`}
              disabled={isLoading || isCheckingEmail}
            >
              {t('auth.signup')}
            </button>
          </div>

          {/* Form Header */}
          <div className="text-center mb-6">
            {mode === 'login' ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.login')}</h2>
                <p className="text-gray-500">{t('auth.loginDesc')}</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {userType === 'designer' ? '디자이너 회원가입' : '일반 회원가입'}
                </h2>
                <p className="text-gray-500">이메일과 이름을 입력하세요</p>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={mode === 'login' ? handleLogin : (e) => { e.preventDefault(); handleCheckEmail(); }} className="space-y-4">
            {mode === 'signup-step1' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {userType === 'designer' ? t('auth.designerName') : '이름'} *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={userType === 'designer' ? t('auth.designerNamePlaceholder') : '홍길동'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading || isCheckingEmail}
                  maxLength={30}
                />
                {userType === 'designer' && (
                  <p className="text-xs text-gray-500 mt-1">{t('auth.designerNameNote')}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.emailAddress')} *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isLoading || isCheckingEmail}
                autoComplete="email"
              />
            </div>

            {mode === 'login' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
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
            )}

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

            <button
              type="submit"
              disabled={isLoading || isCheckingEmail}
              className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading || isCheckingEmail ? (
                <>
                  <div className="spinner w-5 h-5 mr-2"></div>
                  {mode === 'login' ? t('auth.loggingIn') : t('auth.checkingEmail')}
                </>
              ) : (
                <>
                  {mode === 'login' ? t('auth.login') : '다음'}
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
                <p className="text-sm text-gray-600 mb-2">{t('auth.firstTime')}</p>
                <button
                  onClick={() => handleModeChange('signup-select-type')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                  disabled={isLoading || isCheckingEmail}
                >
                  {t('auth.createNewPortfolioButton')} →
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">{t('auth.alreadyHaveAccount')}</p>
                <button
                  onClick={() => handleModeChange('login')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                  disabled={isLoading || isCheckingEmail}
                >
                  {t('auth.loginButton')} →
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="font-semibold text-gray-800 text-sm">{t('auth.feature1Title')}</h3>
            <p className="text-xs text-gray-600 mt-1">{t('auth.feature1Desc')}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-800 text-sm">{t('auth.feature2Title')}</h3>
            <p className="text-xs text-gray-600 mt-1">{t('auth.feature2Desc')}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800 text-sm">{t('auth.feature3Title')}</h3>
            <p className="text-xs text-gray-600 mt-1">{t('auth.feature3Desc')}</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8">
          <p className="text-sm text-gray-500">{t('auth.poweredBy')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('auth.copyright')}</p>
        </footer>
      </div>
    </div>
  );
};

export default AuthLogin;
