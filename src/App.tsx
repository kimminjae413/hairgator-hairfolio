import React, { useState, useEffect } from 'react';
import * as firebaseService from './services/firebaseService';
import ClientView from './components/ClientView';
import DesignerView from './components/DesignerView';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const [loggedInDesigner, setLoggedInDesigner] = useState<string | null>(null);
  const [clientViewDesigner, setClientViewDesigner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
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
        } else {
          // Check if there's a logged-in designer in memory
          const storedDesigner = JSON.parse(sessionStorage.getItem('hairfolio_designer') || 'null');
          if (storedDesigner) {
            setLoggedInDesigner(storedDesigner);
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (name: string) => {
    if (name.trim()) {
      const formattedName = name.trim();
      setLoggedInDesigner(formattedName);
      sessionStorage.setItem('hairfolio_designer', JSON.stringify(formattedName));
    }
  };

  const handleLogout = () => {
    setLoggedInDesigner(null);
    sessionStorage.removeItem('hairfolio_designer');
    // Clear URL parameters if any
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
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
        ) : loggedInDesigner ? (
          <DesignerView designerName={loggedInDesigner} onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
