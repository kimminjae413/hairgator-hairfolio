import React, { useState, useEffect } from 'react';
import * as localStorageService from './services/localStorageService';
import ClientView from './components/ClientView';
import DesignerView from './components/DesignerView';
import Login from './components/Login';

const App: React.FC = () => {
  const [loggedInDesigner, setLoggedInDesigner] = useState<string | null>(null);
  const [clientViewDesigner, setClientViewDesigner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize the local storage with sample data if it's the first visit
    localStorageService.initializeDB();

    // Check URL for a designer parameter to determine the view mode
    const urlParams = new URLSearchParams(window.location.search);
    const designerFromUrl = urlParams.get('designer');

    if (designerFromUrl) {
      setClientViewDesigner(designerFromUrl);
    }
    // sessionStorage 관련 코드 제거됨
    setIsLoading(false);
  }, []);

  const handleLogin = (name: string) => {
    if (name.trim()) {
      const formattedName = name.trim();
      setLoggedInDesigner(formattedName);
      // sessionStorage 제거됨
    }
  };

  const handleLogout = () => {
    setLoggedInDesigner(null);
    // sessionStorage 제거됨
  };

  if (isLoading) {
    return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <p className="text-gray-600">Loading Hairfolio...</p>
       </div>
    );
  }

  if (clientViewDesigner) {
    return <ClientView designerName={clientViewDesigner} />;
  }

  if (loggedInDesigner) {
    return <DesignerView designerName={loggedInDesigner} onLogout={handleLogout} />;
  }

  return <Login onLogin={handleLogin} />;
};

export default App;
