// src/App.tsx - Firebase Authentication 적용
import React, { useState, useEffect } from 'react';
import * as firebaseService from './services/firebaseService';
import * as authService from './services/firebaseAuthService';
import ClientView from './components/ClientView';
import DesignerView from './components/DesignerView';
import AuthLogin from './components/AuthLogin'; // 기존 Login 대신 AuthLogin 사용
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const [loggedInDesigner, setLoggedInDesigner] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null); // Firebase UID 추가
  const [clientViewDesigner, setClientViewDesigner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Firebase Auth
        authService.initializeAuth();
        
        // Initialize Firebase with sample data
        await firebaseService.initializeDB();

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
          setIsLoading(false);
        } else {
          // Check if there's a logged-in user via Firebase Auth
          const unsubscribe = authService.onAuthStateChange(async (user) => {
            if (user && user.emailVerified) {
              // User is logged in and email is verified
              console.log('✅ 인증된 사용자 로그인:', user.uid);
              
              // Get designer data to get display name
              const designerData = await firebaseService.getDesignerData(user.uid);
              const displayName = user.displayName || designerData.profile?.name || '디자이너';
              
              setLoggedInDesigner(displayName);
              setLoggedInUserId(user.uid);
              
              // Store in sessionStorage for quick access
              sessionStorage.setItem('hairfolio_designer', JSON.stringify(displayName));
              sessionStorage.setItem('hairfolio_userId', JSON.stringify(user.uid));
            } else if (user && !user.emailVerified) {
              // User exists but email not verified - will be handled by AuthLogin
              console.log('⚠️ 이메일 미인증 사용자:', user.email);
              setLoggedInDesigner(null);
              setLoggedInUserId(null);
            } else {
              // No user logged in
              console.log('ℹ️ 로그인된 사용자 없음');
              setLoggedInDesigner(null);
              setLoggedInUserId(null);
              sessionStorage.removeItem('hairfolio_designer');
              sessionStorage.removeItem('hairfolio_userId');
            }
            setIsLoading(false);
          });

          // Cleanup subscription on unmount
          return () => unsubscribe();
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (name: string, userId: string) => {
    if (name.trim() && userId) {
      setLoggedInDesigner(name.trim());
      setLoggedInUserId(userId);
      sessionStorage.setItem('hairfolio_designer', JSON.stringify(name.trim()));
      sessionStorage.setItem('hairfolio_userId', JSON.stringify(userId));
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth
      const result = await authService.signOutUser();
      
      if (result.success) {
        setLoggedInDesigner(null);
        setLoggedInUserId(null);
        sessionStorage.removeItem('hairfolio_designer');
        sessionStorage.removeItem('hairfolio_userId');
        
        // Clear URL parameters if any
        if (window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        console.log('✅ 로그아웃 완료');
      } else {
        console.error('❌ 로그아웃 실패:', result.error);
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Firebase 초기화 중...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {clientViewDesigner ? (
          <ClientView designerName={clientViewDesigner} />
        ) : loggedInDesigner && loggedInUserId ? (
          <DesignerView designerName={loggedInUserId} onLogout={handleLogout} />
        ) : (
          <AuthLogin onLogin={handleLogin} />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
