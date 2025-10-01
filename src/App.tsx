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

        // Firebase Auth 상태를 먼저 확인
        const unsubscribe = authService.onAuthStateChange(async (user) => {
          if (user && user.emailVerified) {
            // 인증된 디자이너가 로그인되어 있는 경우
            console.log('✅ 인증된 사용자 로그인:', user.uid);
            
            // Get designer data to get display name
            const designerData = await firebaseService.getDesignerData(user.uid);
            const displayName = user.displayName || designerData.profile?.name || t('common.designer', '디자이너');
            
            setLoggedInDesigner(displayName);
            setLoggedInUserId(user.uid);
            setClientViewDesigner(null); // 디자이너 로그인 시 클라이언트 뷰 해제
            
            // Store in sessionStorage for quick access
            sessionStorage.setItem('hairfolio_designer', JSON.stringify(displayName));
            sessionStorage.setItem('hairfolio_userId', JSON.stringify(user.uid));
            
            // URL에서 designer 파라미터 제거 (디자이너 로그인 시)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('designer')) {
              urlParams.delete('designer');
              const newUrl = urlParams.toString() 
                ? `${window.location.pathname}?${urlParams.toString()}`
                : window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
            }
            
          } else if (user && !user.emailVerified) {
            // User exists but email not verified - will be handled by AuthLogin
            console.log('⚠️ 이메일 미인증 사용자:', user.email);
            setLoggedInDesigner(null);
            setLoggedInUserId(null);
            setClientViewDesigner(null);
          } else {
            // 로그인된 사용자가 없는 경우 - URL 파라미터 확인
            console.log('ℹ️ 로그인된 사용자 없음 - URL 파라미터 확인');
            
            // Check URL for a designer parameter to determine the view mode
            const urlParams = new URLSearchParams(window.location.search);
            const designerParam = urlParams.get('designer');
            
            // 한글 URL 인코딩 문제 해결: decodeURIComponent로 디코딩
            const designerFromUrl = designerParam 
              ? decodeURIComponent(designerParam) 
              : null;

            if (designerFromUrl) {
              // Client view mode
              console.log('URL에서 디자이너명 추출:', designerFromUrl);
              setClientViewDesigner(designerFromUrl);
              setLoggedInDesigner(null);
              setLoggedInUserId(null);
            } else {
              // No URL parameter and no logged in user
              setClientViewDesigner(null);
              setLoggedInDesigner(null);
              setLoggedInUserId(null);
            }
            
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

  // 디버그 로그
  console.log('🎯 App 렌더링 상태:', {
    loggedInDesigner,
    loggedInUserId,
    clientViewDesigner,
    storedDesigner,
    storedUserId,
    parsedDesigner,
    parsedUserId,
    url: window.location.href
  });

  // sessionStorage 값을 우선으로 사용
  const effectiveDesigner = loggedInDesigner || parsedDesigner;
  const effectiveUserId = loggedInUserId || parsedUserId;

  // 라우팅 로직: 우선순위에 따른 화면 렌더링
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {effectiveDesigner && effectiveUserId ? (
          // 1순위: 디자이너가 로그인되어 있으면 DesignerView
          <>
            {console.log('✅ DesignerView 렌더링 중...', { effectiveDesigner, effectiveUserId })}
            <DesignerView designerName={effectiveUserId} onLogout={handleLogout} />
          </>
        ) : clientViewDesigner ? (
          // 2순위: URL 파라미터로 디자이너가 지정되어 있으면 ClientView
          <>
            {console.log('👤 ClientView 렌더링 중...', { clientViewDesigner })}
            <ClientView designerName={clientViewDesigner} />
          </>
        ) : (
          // 3순위: 로그인 화면
          <>
            {console.log('🔐 AuthLogin 렌더링 중...')}
            <AuthLogin onLogin={handleLogin} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
