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
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    if (mode === 'login') {
      if (localStorageService.designerExists(trimmedName)) {
        onLogin(trimmedName);
      } else {
        setError('Designer not found. Please check the name or sign up.');
      }
    } else { // signup
      if (localStorageService.designerExists(trimmedName)) {
        setError('This name is already taken. Please choose another.');
      } else {
        // Create a new portfolio for the designer with default images and initial stats
        localStorageService.savePortfolio(trimmedName, portfolioImages);
        onLogin(trimmedName);
      }
    }
  };

  const tabStyle = "flex-1 py-3 text-center font-semibold text-sm transition-colors duration-300 focus:outline-none";
  const activeTabStyle = "text-indigo-600 border-b-2 border-indigo-600";
  const inactiveTabStyle = "text-gray-500 hover:text-gray-700";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto text-center">
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
          <p className="text-lg text-gray-600 mt-2">The future of hairstyle portfolios.</p>
        </header>
        <main className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => handleModeChange('login')}
              className={`${tabStyle} ${mode === 'login' ? activeTabStyle : inactiveTabStyle}`}
            >
              Login
            </button>
            <button
              onClick={() => handleModeChange('signup')}
              className={`${tabStyle} ${mode === 'signup' ? activeTabStyle : inactiveTabStyle}`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {mode === 'login' ? 'Designer Login' : 'Create Your Portfolio'}
          </h2>
          <p className="text-gray-500 mb-6">
            {mode === 'login' ? 'Enter your name to manage your portfolio.' : 'Choose a name for your new portfolio.'}
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Jane Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            {error && <p className="text-red-500 text-sm mt-2 text-left">{error}</p>}
            <button
              type="submit"
              className="w-full mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-300"
              disabled={!name.trim()}
            >
              {mode === 'login' ? 'View My Portfolio' : 'Create Portfolio'}
            </button>
          </form>
        </main>
         <footer className="text-center mt-8">
          <p className="text-gray-500">Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;