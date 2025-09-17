import React from 'react';
import { LoadingState, Hairstyle } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface ResultDisplayProps {
  beforeSrc: string;
  afterSrc: string | null;
  onReset: () => void;
  loadingState: LoadingState;
  error: string | null;
  reservationUrl?: string;
  hairstyle?: Hairstyle;
  onBookNow?: (hairstyle: Hairstyle) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ beforeSrc, afterSrc, onReset, loadingState, error, reservationUrl, hairstyle, onBookNow }) => {
  const isLoading = loadingState === 'analyzing' || loadingState === 'generating';

  const loadingMessages: { [key in LoadingState]?: string } = {
    analyzing: 'Step 1/2: Analyzing hairstyle...',
    generating: 'Step 2/2: Applying new hairstyle...',
  };
  
  const handleBookNowClick = () => {
    if (hairstyle && onBookNow) {
        onBookNow(hairstyle);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onReset}
    >
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl p-6 md:p-8 text-center overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-96">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">{loadingMessages[loadingState]}</h2>
            <p className="text-gray-600 mt-2">This may take a moment...</p>
          </div>
        )}
        
        {error && (
            <div className="flex flex-col items-center justify-center h-96">
                <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
                <p className="text-gray-600 max-w-md">{error}</p>
                 <button
                    onClick={onReset}
                    className="mt-6 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-300"
                >
                    Close
                </button>
            </div>
        )}

        {loadingState === 'done' && afterSrc && (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Your New Look!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Before</h3>
                <img src={beforeSrc} alt="Original" className="rounded-lg shadow-md w-full aspect-square object-cover" />
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">After</h3>
                <img src={afterSrc} alt="Generated Hairstyle" className="rounded-lg shadow-md w-full aspect-square object-cover" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
               {reservationUrl && hairstyle && onBookNow && (
                <button
                  onClick={handleBookNowClick}
                  className="w-full sm:w-auto flex justify-center items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300"
                >
                  <SparklesIcon />
                  Book "{hairstyle.name}" Now
                </button>
              )}
              <button
                onClick={onReset}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
              >
                Try Another Style
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;