import React, { useState, useCallback, useEffect } from 'react';
import { analyzeHairstyle, applyHairstyle } from '../services/geminiService';
import * as localStorageService from '../services/localStorageService';
import { LoadingState, Hairstyle } from '../types';
import ImageUploader from './ImageUploader';
import ResultDisplay from './ResultDisplay';
import HairstyleGallery from './HairstyleGallery';
import UserIcon from './icons/UserIcon';

interface ClientViewProps {
  designerName: string;
}

const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
};

const ClientView: React.FC<ClientViewProps> = ({ designerName }) => {
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Hairstyle[]>([]);
  const [reservationUrl, setReservationUrl] = useState<string>('');
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  useEffect(() => {
    const { portfolio, reservationUrl } = localStorageService.getDesignerData(designerName);
    setPortfolio(portfolio);
    setReservationUrl(reservationUrl || '');
    localStorageService.trackVisit(designerName);
  }, [designerName]);

  const handleFaceFileChange = (file: File | null) => {
    setFaceFile(file);
    if (file) {
      setFacePreview(URL.createObjectURL(file));
    } else {
      setFacePreview(null);
    }
  };

  const handleHairstyleSelect = useCallback(async (hairstyle: Hairstyle) => {
    if (!faceFile) {
      setError('Please upload your face photo first.');
      return;
    }
    setSelectedHairstyle(hairstyle);
    setLoadingState('analyzing');
    setError(null);
    setGeneratedImage(null);
    setIsResultModalOpen(true);

    localStorageService.trackStyleView(designerName, hairstyle.url);

    try {
      const hairstyleFile = await urlToFile(hairstyle.url, hairstyle.name, 'image/jpeg');
      const hairstyleDescription = await analyzeHairstyle(hairstyleFile);
      setLoadingState('generating');
      const finalImage = await applyHairstyle(faceFile, hairstyleFile, hairstyleDescription);
      
      setGeneratedImage(finalImage);
      setLoadingState('done');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate image: ${message}. Please try again.`);
      setLoadingState('error');
    }
  }, [faceFile, designerName]);

  const handleCloseModal = () => {
    setIsResultModalOpen(false);
    setGeneratedImage(null);
    setSelectedHairstyle(null);
    setLoadingState('idle');
    setError(null);
  };
  
  const handleBookNow = (hairstyle: Hairstyle) => {
    localStorageService.trackBooking(designerName, hairstyle.url);
    if(reservationUrl) {
        window.open(reservationUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  const isLoading = loadingState === 'analyzing' || loadingState === 'generating';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
          <p className="text-lg text-gray-600 mt-2">Try on <span className="font-semibold text-indigo-600">{designerName}'s</span> portfolio.</p>
        </header>

        <main className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
           {portfolio.length === 0 ? (
             <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-gray-700">Portfolio Not Found</h2>
                <p className="text-gray-500 mt-2">Could not find a portfolio for "{designerName}". Please check the link.</p>
             </div>
           ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                 <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center md:text-left">Step 1: Your Photo</h2>
                 <ImageUploader
                    id="face-uploader"
                    label="Upload a clear, front-facing photo"
                    previewSrc={facePreview}
                    onFileChange={handleFaceFileChange}
                    icon={<UserIcon />}
                    disabled={isLoading}
                  />
              </div>
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center md:text-left">Step 2: Choose a Style</h2>
                <HairstyleGallery 
                  images={portfolio}
                  onSelect={handleHairstyleSelect}
                  // No onAddImage prop passed, so the upload button won't render
                  selectedUrl={selectedHairstyle?.url || null}
                  disabled={!faceFile || isLoading}
                />
                 {!faceFile && <p className="text-center text-sm text-indigo-600 mt-4">Please upload your photo to enable the gallery.</p>}
              </div>
            </div>
           )}
        </main>
        
        {isResultModalOpen && selectedHairstyle && (
           <ResultDisplay 
              beforeSrc={facePreview!}
              afterSrc={generatedImage}
              onReset={handleCloseModal}
              loadingState={loadingState}
              error={error}
              reservationUrl={reservationUrl}
              hairstyle={selectedHairstyle}
              onBookNow={handleBookNow}
            />
        )}

        <footer className="text-center mt-8">
          <p className="text-gray-500">Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default ClientView;