// src/App.tsx - 완전한 최종 버전 (디자이너 + 일반 사용자)
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as firebaseService from './services/firebaseService';
import * as authService from './services/firebaseAuthService';
import { UserType } from './types';
import ClientView from './components/ClientView';
import DesignerView from './components/DesignerView';
import ClientHomeView from './components/ClientHomeView'; // 신규: 일반 사용자 홈
import AuthLogin from './components/AuthLogin';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';

const App: React.FC = () => {
  const { t, ready } = useTranslation();
  
  // 디자이너 상태
  const [loggedInDesigner, setLoggedInDesigner] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  
  // 일반 사용자 상태 (신규)
  const [loggedInClient, setLoggedInClient] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  
  // 사용자 타입 (신규)
  const [userType, setUserType] = useState<UserType | null>(null);
  
  // 고객용 포트폴리오 뷰 (URL 파라미터로 접근)
  const [clientViewDesigner, setClientViewDesigner] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (!ready) return;

        // Initialize Firebase Auth & Database
        authService.initializeAuth();
        await firebaseService.initializeDB();

        // URL 파라미터 확인 (고객용 포트폴리오 링크)
        const urlParams = new URLSearchParams(window.location.search);
        const designerParam = urlParams.get('designer');
        const designerFromUrl = designerParam ? decodeURIComponent(designerParam) : null;

        // Firebase Auth 상태 리스너
        const unsubscribe = authService.onAuthStateChange(async (user) => {
          // 🔥 최우선: URL에 designer 파라미터가 있으면 ClientView (포트폴리오 보기)
          if (designerFromUrl) {
            console.log('🎯 고객용 포트폴리오 링크:', designerFromUrl);
            setClientViewDesigner(designerFromUrl);
            setLoggedInDesigner(null);
            setLoggedInUserId(null);
            setLoggedInClient(null);
            setUserType(null);
            setIsLoading(false);
            return;
          }

          if (user && user.emailVerified) {
            // 인증된 사용자 로그인
            console.log('✅ 인증된 사용자:', user.uid);
            
            // Firestore에서 사용자 타입 조회
            const userData = await firebaseService.getUser(user.uid);
            const currentUserType = userData?.userType || 'designer'; // 기본값: designer

            setUserType(currentUserType);

            if (currentUserType === 'designer') {
              // 디자이너 로그인
              const designerData = await firebaseService.getDesignerDataById(user.uid);
              const displayName = user.displayName || designerData.profile?.name || t('common.designer');
              
              setLoggedInDesigner(displayName);
              setLoggedInUserId(user.uid);
              setLoggedInClient(null);
              
              sessionStorage.setItem('hairfolio_designer', JSON.stringify(displayName));
              sessionStorage.setItem('hairfolio_userId', JSON.stringify(user.uid));
              sessionStorage.setItem('hairfolio_userType', 'designer');
              
              console.log('✅ 디자이너 로그인:', displayName);
              
            } else if (currentUserType === 'client') {
              // 일반 사용자 로그인
              const clientProfile = await firebaseService.getClientProfile(user.uid);
              const displayName = user.displayName || clientProfile?.name || t('common.client', '사용자');
              
              setLoggedInClient({
                userId: user.uid,
                name: displayName
              });
              setLoggedInDesigner(null);
              setLoggedInUserId(null);
              
              sessionStorage.setItem('hairfolio_clientId', user.uid);
              sessionStorage.setItem('hairfolio_clientName', displayName);
              sessionStorage.setItem('hairfolio_userType', 'client');
              
              console.log('✅ 일반 사용자 로그인:', displayName);
            }
            
          } else if (user && !user.emailVerified) {
            // 이메일 미인증
            console.log('⚠️ 이메일 미인증:', user.email);
            setLoggedInDesigner(null);
            setLoggedInUserId(null);
            setLoggedInClient(null);
            setUserType(null);
            
          } else {
            // 로그아웃 상태
            console.log('ℹ️ 로그인된 사용자 없음');
            setLoggedInDesigner(null);
            setLoggedInUserId(null);
            setLoggedInClient(null);
            setUserType(null);
            setClientViewDesigner(null);
            
            // 세션 정리
            sessionStorage.removeItem('hairfolio_designer');
            sessionStorage.removeItem('hairfolio_userId');
            sessionStorage.removeItem('hairfolio_clientId');
            sessionStorage.removeItem('hairfolio_clientName');
            sessionStorage.removeItem('hairfolio_userType');
          }
          
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('❌ App 초기화 오류:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [ready, t]);

  /**
   * 로그인 핸들러 (디자이너용 - 하위 호환성)
   */
  const handleLogin = (name: string, userId: string) => {
    if (name.trim() && userId) {
      setLoggedInDesigner(name.trim());
      setLoggedInUserId(userId);
      setLoggedInClient(null);
      setUserType('designer');
      setClientViewDesigner(null);
      
      sessionStorage.setItem('hairfolio_designer', JSON.stringify(name.trim()));
      sessionStorage.setItem('hairfolio_userId', JSON.stringify(userId));
      sessionStorage.setItem('hairfolio_userType', 'designer');
      
      // URL 파라미터 제거
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

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = async () => {
    try {
      const result = await authService.signOutUser();
      
      if (result.success) {
        setLoggedInDesigner(null);
        setLoggedInUserId(null);
        setLoggedInClient(null);
        setUserType(null);
        setClientViewDesigner(null);
        
        // 세션 정리
        sessionStorage.removeItem('hairfolio_designer');
        sessionStorage.removeItem('hairfolio_userId');
        sessionStorage.removeItem('hairfolio_clientId');
        sessionStorage.removeItem('hairfolio_clientName');
        sessionStorage.removeItem('hairfolio_userType');
        
        // URL 파라미터 제거
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

  // 로딩 화면
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!ready 
              ? t('common.initializingLanguage', '언어 설정 초기화 중...') 
              : t('common.initializingFirebase', 'Firebase 초기화 중...')
            }
          </p>
        </div>
      </div>
    );
  }

  // SessionStorage 백업 (새로고침 대응)
  const storedDesigner = sessionStorage.getItem('hairfolio_designer');
  const storedUserId = sessionStorage.getItem('hairfolio_userId');
  const storedClientId = sessionStorage.getItem('hairfolio_clientId');
  const storedClientName = sessionStorage.getItem('hairfolio_clientName');
  const storedUserType = sessionStorage.getItem('hairfolio_userType') as UserType | null;
  
  let parsedDesigner = null;
  let parsedUserId = null;
  
  try {
    parsedDesigner = storedDesigner ? JSON.parse(storedDesigner) : null;
    parsedUserId = storedUserId ? JSON.parse(storedUserId) : null;
  } catch (e) {
    console.error('SessionStorage 파싱 오류:', e);
  }

  // 최종 상태 결정
  const effectiveDesigner = loggedInDesigner || parsedDesigner;
  const effectiveUserId = loggedInUserId || parsedUserId;
  const effectiveClient = loggedInClient || (storedClientId && storedClientName ? {
    userId: storedClientId,
    name: storedClientName
  } : null);
  const effectiveUserType = userType || storedUserType;

  // URL 파라미터 재확인
  const urlParams = new URLSearchParams(window.location.search);
  const designerParam = urlParams.get('designer');
  const designerFromUrl = designerParam ? decodeURIComponent(designerParam) : null;

  // 디버그 로그
  console.log('🎯 App 렌더링 상태:', {
    designerFromUrl,
    clientViewDesigner,
    effectiveUserType,
    effectiveDesigner,
    effectiveUserId,
    effectiveClient,
    url: window.location.href
  });

  // 🔥 라우팅 로직
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* 1순위: URL 파라미터 (고객용 포트폴리오 링크) */}
        {(designerFromUrl || clientViewDesigner) ? (
          <>
            {console.log('👤 ClientView 렌더링 (포트폴리오 보기):', designerFromUrl || clientViewDesigner)}
            <ClientView designerName={designerFromUrl || clientViewDesigner!} />
          </>
        ) 
        
        {/* 2순위: 디자이너 로그인 */}
        : effectiveUserType === 'designer' && effectiveDesigner && effectiveUserId ? (
          <>
            {console.log('✅ DesignerView 렌더링:', { effectiveDesigner, effectiveUserId })}
            <DesignerView designerName={effectiveUserId} onLogout={handleLogout} />
          </>
        ) 
        
        {/* 3순위: 일반 사용자 로그인 (신규) */}
        : effectiveUserType === 'client' && effectiveClient ? (
          <>
            {console.log('✅ ClientHomeView 렌더링:', effectiveClient)}
            <ClientHomeView 
              userId={effectiveClient.userId} 
              userName={effectiveClient.name}
              onLogout={handleLogout} 
            />
          </>
        ) 
        
        {/* 4순위: 로그인 화면 */}
        : (
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
