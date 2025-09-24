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
      id: Date.now().toString(), // Generate simple ID
    };
    const updatedPortfolio = [newImage, ...portfolio];
    setPortfolio(updatedPortfolio);
    localStorageService.savePortfolio(designerName, updatedPortfolio);
    setShowUploadModal(false);
  };

  const handlePortfolioImageDelete = (hairstyle: Hairstyle) => {
    if (!hairstyle.id && !hairstyle.url) {
      console.error('Hairstyle identifier is missing');
      return;
    }

    // Use URL as fallback if ID is not available (for existing images)
    const identifier = hairstyle.id || hairstyle.url;
    const updatedPortfolio = portfolio.filter(item => 
      (item.id && item.id !== identifier) && (item.url !== identifier)
    );
    
    setPortfolio(updatedPortfolio);
    localStorageService.savePortfolio(designerName, updatedPortfolio);
  };

  const handleSaveSettings = (newUrl: string) => {
    localStorageService.saveReservationUrl(designerName, newUrl);
    setReservationUrl(newUrl);
    setShowSettingsModal(false);
  };

  // 통일된 탭 스타일 - 아이콘 크기와 패딩 최적화
  const tabStyle = "px-3 py-2.5 text-center font-medium text-sm rounded-lg transition-colors duration-300 focus:outline-none flex items-center justify-center gap-2 min-w-[100px]";
  const activeTabStyle = "bg-indigo-600 text-white shadow";
  const inactiveTabStyle = "text-gray-600 hover:bg-gray-200";

  // 통일된 헤더 버튼 스타일
  const headerButtonStyle = "inline-flex items-center justify-center px-3 py-2 font-semibold rounded-lg shadow-md transition-colors duration-300 min-w-[44px] h-[44px]";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
            <p className="text-lg text-gray-600 mt-1">Portfolio for <span className="font-semibold text-indigo-600">{designerName}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className={`${headerButtonStyle} bg-indigo-600 text-white hover:bg-indigo-700`}
              title="Share Portfolio"
            >
              <div className="w-5 h-5">
                <ShareIcon />
              </div>
              <span className="hidden sm:inline ml-2 text-sm">Share</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`${headerButtonStyle} bg-gray-200 text-gray-700 hover:bg-gray-300`}
              title="Settings"
            >
              <div className="w-5 h-5">
                <SettingsIcon />
              </div>
              <span className="hidden sm:inline ml-2 text-sm">Settings</span>
            </button>
            <button
              onClick={onLogout}
              className={`${headerButtonStyle} bg-gray-600 text-white hover:bg-gray-700`}
              title="Logout"
            >
              <span className="text-sm px-1">Logout</span>
            </button>
          </div>
        </header>

        <main className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
           <div className="border-b pb-4 mb-6">
             <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-full sm:w-max">
                 <button 
                   onClick={() => setActiveView('gallery')} 
                   className={`${tabStyle} flex-1 sm:flex-initial ${activeView === 'gallery' ? activeTabStyle : inactiveTabStyle}`} 
                   aria-pressed={activeView === 'gallery'}
                 >
                    <div className="w-4 h-4">
                      <HairIcon />
                    </div>
                    <span>Your Styles</span>
                 </button>
                 <button 
                   onClick={() => setActiveView('analytics')} 
                   className={`${tabStyle} flex-1 sm:flex-initial ${activeView === 'analytics' ? activeTabStyle : inactiveTabStyle}`} 
                   aria-pressed={activeView === 'analytics'}
                 >
                    <div className="w-4 h-4">
                      <AnalyticsIcon />
                    </div>
                    <span>Analytics</span>
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
                  onDeleteImage={handlePortfolioImageDelete}
                  isDesignerView={true}
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
                        <div className="w-5 h-5">
                          <PlusIcon />
                        </div>
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
          <p className="text-gray-500">Powered by VModel AI</p>
        </footer>
      </div>
    </div>
  );
};

export default DesignerView;
