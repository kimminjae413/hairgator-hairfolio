// src/App.tsx - Firebase Authentication + i18n 적용 (수정된 라우팅 로직)
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as firebaseService from './services/firebaseService';
import * as authService from './services/firebaseAuthService';
import ClientView from './components/ClientView';
import DesignerView from './components/DesignerView';
import AuthLogin from './components/AuthLogin';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n'; // i18n 초기화

const App: React.FC = () => {
  const { t, ready } = useTranslation(); // i18n 준비 상태 확인
  const [loggedInDesigner, setLoggedInDesigner] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [clientViewDesigner, setClientViewDesigner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // i18n이 준비될 때까지 대기
        if (!ready) return;

        // Initialize Firebase Auth
        authService.initializeAuth();
        
        // Initialize Firebase with sample data
        await firebaseService.initializeDB();

        // 🆕 URL 파라미터를 먼저 확인 (고객용 링크 우선 처리)
        const urlParams = new URLSearchParams(window.location.search);
        const designerParam = urlParams.get('designer');
        const designerFromUrl = designerParam ? decodeURIComponent(designerParam) : null;

        // Firebase Auth 상태 확인
        const unsubscribe = authService.onAuthStateChange(async (user) => {
          // 🔥 중요: URL에 designer 파라미터가 있으면 무조건 ClientView로 이동
          if (designerFromUrl) {
            console.log('🎯 고객용 링크 접속 감지:', designerFromUrl);
            setClientViewDesigner(designerFromUrl);
            setLoggedInDesigner(null);
            setLoggedInUserId(null);
            setIsLoading(false);
            return; // 여기서 종료
          }

          if (user && user.emailVerified) {
            // 인증된 디자이너가 로그인되어 있는 경우 (URL 파라미터 없을 때만)
            console.log('✅ 인증된 사용자 로그인:', user.uid);
            
            // Get designer data to get display name
            const designerData = await firebaseService.getDesignerData(user.uid);
            const displayName = user.displayName || designerData.profile?.name || t('common.designer', '디자이너');
            
            setLoggedInDesigner(displayName);
            setLoggedInUserId(user.uid);
            setClientViewDesigner(null);
            
            // Store in sessionStorage for quick access
            sessionStorage.setItem('hairfolio_designer', JSON.stringify(displayName));
            sessionStorage.setItem('hairfolio_userId', JSON.stringify(user.uid));
            
          } else if (user && !user.emailVerified) {
            // User exists but email not verified - will be handled by AuthLogin
            console.log('⚠️ 이메일 미인증 사용자:', user.email);
            setLoggedInDesigner(null);
            setLoggedInUserId(null);
            setClientViewDesigner(null);
          } else {
            // 로그인된 사용자가 없는 경우
            console.log('ℹ️ 로그인된 사용자 없음');
            setClientViewDesigner(null);
            setLoggedInDesigner(null);
            setLoggedInUserId(null);
            
            // Clean up sessionStorage
            sessionStorage.removeItem('hairfolio_designer');
            sessionStorage.removeItem('hairfolio_userId');
          }
          setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [ready, t]); // ready와 t 의존성 추가

  const handleLogin = (name: string, userId: string) => {
    if (name.trim() && userId) {
      setLoggedInDesigner(name.trim());
      setLoggedInUserId(userId);
      setClientViewDesigner(null); // 로그인 시 클라이언트 뷰 해제
      sessionStorage.setItem('hairfolio_designer', JSON.stringify(name.trim()));
      sessionStorage.setItem('hairfolio_userId', JSON.stringify(userId));
      
      // URL에서 designer 파라미터 제거 (로그인 성공 시)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('designer')) {
        urlParams.delete('designer');
        const newUrl = urlParams.toString() 
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth
      const result = await authService.signOutUser();
      
      if (result.success) {
        setLoggedInDesigner(null);
        setLoggedInUserId(null);
        setClientViewDesigner(null);
        sessionStorage.removeItem('hairfolio_designer');
        sessionStorage.removeItem('hairfolio_userId');
        
        // Clear URL parameters if any
        if (window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        console.log('✅ 로그아웃 완료');
      } else {
        console.error('❌ 로그아웃 실패:', result.error);
        alert(t('messages.logoutError', '로그아웃 중 오류가 발생했습니다.'));
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      alert(t('messages.logoutError', '로그아웃 중 오류가 발생했습니다.'));
    }
  };

  // i18n이 준비되지 않았으면 로딩 표시
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!ready ? t('common.initializingLanguage', '언어 설정 초기화 중...') : t('common.initializingFirebase', 'Firebase 초기화 중...')}
          </p>
        </div>
      </div>
    );
  }

  // 🆕 URL 파라미터를 먼저 체크 (최우선 순위)
  const urlParams = new URLSearchParams(window.location.search);
  const designerParam = urlParams.get('designer');
  const designerFromUrl = designerParam ? decodeURIComponent(designerParam) : null;

  // sessionStorage에서 직접 확인 (JSON 파싱)
  const storedDesigner = sessionStorage.getItem('hairfolio_designer');
  const storedUserId = sessionStorage.getItem('hairfolio_userId');
  
  let parsedDesigner = null;
  let parsedUserId = null;
  
  try {
    parsedDesigner = storedDesigner ? JSON.parse(storedDesigner) : null;
    parsedUserId = storedUserId ? JSON.parse(storedUserId) : null;
  } catch (e) {
    console.error('SessionStorage 파싱 오류:', e);
  }

  // sessionStorage 값을 우선으로 사용
  const effectiveDesigner = loggedInDesigner || parsedDesigner;
  const effectiveUserId = loggedInUserId || parsedUserId;

  // 디버그 로그
  console.log('🎯 App 렌더링 상태:', {
    designerFromUrl,
    clientViewDesigner,
    loggedInDesigner,
    loggedInUserId,
    effectiveDesigner,
    effectiveUserId,
    url: window.location.href
  });

  // 🔥 라우팅 로직: URL 파라미터가 최우선!
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {designerFromUrl || clientViewDesigner ? (
          // 🎯 최우선: URL에 designer 파라미터가 있으면 무조건 ClientView
          <>
            {console.log('👤 ClientView 렌더링 (고객용 링크):', designerFromUrl || clientViewDesigner)}
            <ClientView designerName={designerFromUrl || clientViewDesigner!} />
          </>
        ) : effectiveDesigner && effectiveUserId ? (
          // 2순위: 디자이너가 로그인되어 있으면 DesignerView
          <>
            {console.log('✅ DesignerView 렌더링:', { effectiveDesigner, effectiveUserId })}
            <DesignerView designerName={effectiveUserId} onLogout={handleLogout} />
          </>
        ) : (
          // 3순위: 로그인 화면
          <>
            {console.log('🔐 AuthLogin 렌더링')}
            <AuthLogin onLogin={handleLogin} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
