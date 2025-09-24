import React, { useState, useEffect } from 'react';
import { Hairstyle, Gender, FemaleMajorCategory, MaleMajorCategory, MinorCategory, DesignerStats, DesignerProfile } from '../types';
import * as localStorageService from '../services/localStorageService';
import HairstyleGallery from './HairstyleGallery';
import ShareModal from './ShareModal';
import SettingsModal from './SettingsModal';
import UploadStyleModal from './UploadStyleModal';
import DesignerProfileModal from './DesignerProfileModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import ShareIcon from './icons/ShareIcon';
import SettingsIcon from './icons/SettingsIcon';
import UserIcon from './icons/UserIcon';
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
  const [designerProfile, setDesignerProfile] = useState<DesignerProfile | undefined>(undefined);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('gallery');

  useEffect(() => {
    const data = localStorageService.getDesignerData(designerName);
    setPortfolio(data.portfolio);
    setReservationUrl(data.reservationUrl || '');
    setStats(data.stats || { visits: 0, styleViews: {}, bookings: {} });
    setDesignerProfile(data.profile);
  }, [designerName]);

  const handlePortfolioImageAdd = async (styleData: {
    file: File;
    name: string;
    gender: Gender;
    majorCategory: FemaleMajorCategory | MaleMajorCategory;
    minorCategory: MinorCategory;
    cloudinaryUrl: string;
  }) => {
    const { file, cloudinaryUrl, ...details } = styleData;
    const newImage: Hairstyle = {
      ...details,
      url: cloudinaryUrl, // Cloudinary URL 사용
      isLocal: false, // 클라우드에 저장됨
      id: Date.now().toString(),
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

  const handleSaveProfile = (profile: DesignerProfile) => {
    localStorageService.saveDesignerProfile(designerName, profile);
    setDesignerProfile(profile);
    setShowProfileModal(false);
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
              onClick={() => setShowProfileModal(true)}
              className={`${headerButtonStyle} bg-blue-600 text-white hover:bg-blue-700`}
              title="Edit Profile"
            >
              <div className="w-5 h-5">
                <UserIcon />
              </div>
              <span className="hidden sm:inline ml-2 text-sm">Profile</span>
            </button>
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

        {/* Profile Preview Card */}
        {designerProfile && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {designerProfile.name ? designerProfile.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) : designerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{designerProfile.name}</h3>
                {designerProfile.bio && (
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{designerProfile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                  {designerProfile.location && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {designerProfile.location}
                    </span>
                  )}
                  {designerProfile.phone && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {designerProfile.phone}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                편집
              </button>
            </div>
          </div>
        )}

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
        
        {showProfileModal && (
          <DesignerProfileModal
            currentProfile={designerProfile}
            designerName={designerName}
            onSave={handleSaveProfile}
            onClose={() => setShowProfileModal(false)}
          />
        )}
        
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
