import React, { useState, useEffect } from 'react';
import { Hairstyle, Gender, FemaleMajorCategory, MaleMajorCategory, MinorCategory, DesignerStats, DesignerProfile } from '../types';
import * as firebaseService from '../services/firebaseService';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDesignerData = async () => {
      try {
        setIsLoading(true);
        const data = await firebaseService.getDesignerData(designerName);
        setPortfolio(data.portfolio);
        setReservationUrl(data.reservationUrl || '');
        setStats(data.stats || { visits: 0, styleViews: {}, bookings: {} });
        setDesignerProfile(data.profile);
      } catch (error) {
        console.error('Error loading designer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDesignerData();
  }, [designerName]);

  const handlePortfolioImageAdd = async (styleData: {
    file: File;
    name: string;
    gender: Gender;
    majorCategory: FemaleMajorCategory | MaleMajorCategory;
    minorCategory: MinorCategory;
    cloudinaryUrl: string;
  }) => {
    try {
      const { file, cloudinaryUrl, ...details } = styleData;
      const newImage: Hairstyle = {
        ...details,
        url: cloudinaryUrl,
        isLocal: false,
        id: Date.now().toString(),
      };
      
      const success = await firebaseService.addStyleToPortfolio(designerName, newImage);
      if (success) {
        const updatedPortfolio = [newImage, ...portfolio];
        setPortfolio(updatedPortfolio);
        setShowUploadModal(false);
      } else {
        alert('포트폴리오 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error adding portfolio image:', error);
      alert('포트폴리오 저장 중 오류가 발생했습니다.');
    }
  };

  const handlePortfolioImageDelete = async (hairstyle: Hairstyle) => {
    try {
      if (!hairstyle.id && !hairstyle.url) {
        console.error('Hairstyle identifier is missing');
        return;
      }

      const identifier = hairstyle.id || hairstyle.url;
      const success = await firebaseService.removeStyleFromPortfolio(designerName, identifier);
      
      if (success) {
        const updatedPortfolio = portfolio.filter(item => 
          (item.id && item.id !== identifier) && (item.url !== identifier)
        );
        setPortfolio(updatedPortfolio);
      } else {
        alert('포트폴리오 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting portfolio image:', error);
      alert('포트폴리오 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSaveSettings = async (newUrl: string) => {
    try {
      const success = await firebaseService.saveReservationUrl(designerName, newUrl);
      if (success) {
        setReservationUrl(newUrl);
        setShowSettingsModal(false);
      } else {
        alert('설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSaveProfile = async (profile: DesignerProfile) => {
    try {
      const success = await firebaseService.saveDesignerProfile(designerName, profile);
      if (success) {
        setDesignerProfile(profile);
        setShowProfileModal(false);
      } else {
        alert('프로필 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  // Generate designer initials for fallback
  const getDesignerInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // 통일된 탭 스타일 - 아이콘 크기와 패딩 최적화
  const tabStyle = "px-3 py-2.5 text-center font-medium text-sm rounded-lg transition-colors duration-300 focus:outline-none flex items-center justify-center gap-2 min-w-[100px]";
  const activeTabStyle = "bg-indigo-600 text-white shadow";
  const inactiveTabStyle = "text-gray-600 hover:bg-gray-200";

  // 통일된 헤더 버튼 스타일
  const headerButtonStyle = "inline-flex items-center justify-center px-3 py-2 font-semibold rounded-lg shadow-md transition-colors duration-300 min-w-[44px] h-[44px]";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">디자이너 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">Hairfolio</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-1">
              Portfolio for <span className="font-semibold text-indigo-600 block sm:inline">{designerProfile?.name || designerName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
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
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                {designerProfile.profileImage ? (
                  <img
                    src={designerProfile.profileImage}
                    alt={designerProfile.name || designerName}
                    className="w-16 h-16 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.profile-fallback') as HTMLElement;
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-indigo-100 shadow-lg profile-fallback ${designerProfile.profileImage ? 'hidden' : ''}`}>
                  {getDesignerInitials(designerProfile.name || designerName)}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-gray-800">{designerProfile.name || designerName}</h3>
                {designerProfile.bio && (
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{designerProfile.bio}</p>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 mt-2 text-xs text-gray-500">
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
                  {designerProfile.socialLinks?.instagram && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </span>
                  )}
                  {designerProfile.socialLinks?.website && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                      </svg>
                      Website
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                편집
              </button>
            </div>
          </div>
        )}

        {/* New Profile Setup CTA */}
        {!designerProfile && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 mb-6 border border-blue-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">프로필을 설정해보세요!</h3>
                  <p className="text-sm text-gray-600">고객에게 보여질 프로필 정보를 추가하면 더 전문적으로 보입니다.</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                프로필 설정
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
