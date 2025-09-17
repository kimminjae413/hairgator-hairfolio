import React, { useState, useEffect } from 'react';
import { Hairstyle, Gender, FemaleMajorCategory, MaleMajorCategory, MinorCategory, DesignerStats } from '../types';
import * as localStorageService from '../services/localStorageService';
import HairstyleGallery from './HairstyleGallery';
import ShareModal from './ShareModal';
import SettingsModal from './SettingsModal';
import UploadStyleModal from './UploadStyleModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import ShareIcon from './icons/ShareIcon';
import SettingsIcon from './icons/SettingsIcon';
import PlusIcon from './icons/PlusIcon';
import HairIcon from './icons/HairIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';

interface DesignerViewProps {
  designerName: string;
  onLogout: () => void;
}

type ActiveView = 'gallery' | 'analytics';

const DesignerView: React.FC<DesignerViewProps> = ({ designerName, onLogout }) => {
  const [portfolio, setPortfolio] = useState<Hairstyle[]>([]);
  const [reservationUrl, setReservationUrl] = useState('');
  const [stats, setStats] = useState<DesignerStats | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('gallery');

  useEffect(() => {
    const data = localStorageService.getDesignerData(designerName);
    setPortfolio(data.portfolio);
    setReservationUrl(data.reservationUrl || '');
    setStats(data.stats || { visits: 0, styleViews: {}, bookings: {} });
  }, [designerName]);

  const handlePortfolioImageAdd = (styleData: {
    file: File;
    name: string;
    gender: Gender;
    majorCategory: FemaleMajorCategory | MaleMajorCategory;
    minorCategory: MinorCategory;
  }) => {
    const { file, ...details } = styleData;
    const newImage: Hairstyle = {
      ...details,
      url: URL.createObjectURL(file),
      isLocal: true,
    };
    const updatedPortfolio = [newImage, ...portfolio];
    setPortfolio(updatedPortfolio);
    localStorageService.savePortfolio(designerName, updatedPortfolio);
    setShowUploadModal(false);
  };

  const handleSaveSettings = (newUrl: string) => {
    localStorageService.saveReservationUrl(designerName, newUrl);
    setReservationUrl(newUrl);
    setShowSettingsModal(false);
  };

  const tabStyle = "px-4 py-2 text-center font-semibold text-sm rounded-lg transition-colors duration-300 focus:outline-none flex items-center justify-center gap-2";
  const activeTabStyle = "bg-indigo-600 text-white shadow";
  const inactiveTabStyle = "text-gray-600 hover:bg-gray-200";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
            <p className="text-lg text-gray-600 mt-1">Portfolio for <span className="font-semibold text-indigo-600">{designerName}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
            >
              <ShareIcon />
              <span className="hidden sm:inline ml-2">Share</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-300"
            >
              <SettingsIcon />
               <span className="hidden sm:inline ml-2">Settings</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
           <div className="border-b pb-4 mb-6">
             <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full sm:w-max">
                 <button onClick={() => setActiveView('gallery')} className={`${tabStyle} flex-1 sm:flex-initial ${activeView === 'gallery' ? activeTabStyle : inactiveTabStyle}`} aria-pressed={activeView === 'gallery'}>
                    <HairIcon />
                    Your Styles
                 </button>
                 <button onClick={() => setActiveView('analytics')} className={`${tabStyle} flex-1 sm:flex-initial ${activeView === 'analytics' ? activeTabStyle : inactiveTabStyle}`} aria-pressed={activeView === 'analytics'}>
                    <AnalyticsIcon />
                    Analytics
                 </button>
             </div>
          </div>

          {activeView === 'gallery' ? (
             portfolio.length > 0 ? (
                <HairstyleGallery 
                  images={portfolio}
                  onSelect={() => {}} // No action on select in designer view
                  selectedUrl={null}
                  disabled={false}
                  onAddImage={() => setShowUploadModal(true)}
                />
              ) : (
                 <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
                    <div className="w-24 h-24 mx-auto text-indigo-200">
                        <HairIcon />
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-gray-800">Your Portfolio is Live!</h3>
                    <p className="mt-2 text-gray-600 max-w-md mx-auto">This is your gallery. Add your first hairstyle and share it with your clients to let them try it on virtually.</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
                    >
                        <PlusIcon />
                        <span className="ml-2">Add Your First Style</span>
                    </button>
                </div>
              )
          ) : (
            stats ? <AnalyticsDashboard stats={stats} portfolio={portfolio} /> : <div className="text-center py-16 text-gray-500">Loading analytics...</div>
          )}
        </main>
        
        {showShareModal && (
          <ShareModal 
            designerName={designerName}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {showSettingsModal && (
            <SettingsModal
                currentUrl={reservationUrl}
                onSave={handleSaveSettings}
                onClose={() => setShowSettingsModal(false)}
            />
        )}

        {showUploadModal && (
            <UploadStyleModal
                onUpload={handlePortfolioImageAdd}
                onClose={() => setShowUploadModal(false)}
            />
        )}

        <footer className="text-center mt-8">
          <p className="text-gray-500">Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default DesignerView;
