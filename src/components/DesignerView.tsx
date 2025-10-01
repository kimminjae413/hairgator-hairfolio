import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Hairstyle, Gender, FemaleMajorCategory, MaleMajorCategory, MinorCategory, DesignerStats, DesignerProfile } from '../types';
import * as firebaseService from '../services/firebaseService';
import HairstyleGallery from './HairstyleGallery';
import ShareModal from './ShareModal';
import SettingsModal from './SettingsModal';
import UploadStyleModal from './UploadStyleModal';
import EditStyleModal from './EditStyleModal';
import DesignerProfileModal from './DesignerProfileModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import LanguageSelector from './LanguageSelector';
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
  const { t } = useTranslation();
  const [portfolio, setPortfolio] = useState<Hairstyle[]>([]);
  const [reservationUrl, setReservationUrl] = useState('');
  const [stats, setStats] = useState<DesignerStats | null>(null);
  const [designerProfile, setDesignerProfile] = useState<DesignerProfile | undefined>(undefined);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Hairstyle | null>(null);
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

  // Cloudinary 환경변수 디버그
  useEffect(() => {
    console.log('=== CLOUDINARY DEBUG ===');
    console.log('Cloud Name:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
    console.log('Upload Preset:', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    console.log('Mode:', import.meta.env.MODE);
    console.log('NODE_ENV:', import.meta.env.NODE_ENV);
    
    // 환경변수 상태에 따른 경고
    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME === 'your_cloud_name_here') {
      console.error('❌ CLOUDINARY_CLOUD_NAME 문제');
      alert('이미지 업로드 설정 오류: Cloudinary Cloud Name이 설정되지 않음');
    }
    
    if (!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET === 'your_upload_preset_here') {
      console.error('❌ CLOUDINARY_UPLOAD_PRESET 문제');
      alert('이미지 업로드 설정 오류: Cloudinary Upload Preset이 설정되지 않음');
    }
    
    console.log('=== END DEBUG ===');
  }, []);

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
        alert(t('messages.portfolioSaveError'));
      }
    } catch (error) {
      console.error('Error adding portfolio image:', error);
      alert(t('messages.portfolioSaveError'));
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
        alert(t('messages.portfolioDeleteError'));
      }
    } catch (error) {
      console.error('Error deleting portfolio image:', error);
      alert(t('messages.portfolioDeleteError'));
    }
  };

  const handlePortfolioImageEdit = (hairstyle: Hairstyle) => {
    setEditingStyle(hairstyle);
    setShowEditModal(true);
  };

  const handleSaveEditedStyle = async (styleId: string, updates: Partial<Hairstyle>) => {
    try {
      const success = await firebaseService.updateStyleInPortfolio(designerName, styleId, updates);
      if (success) {
        // Update local state
        const updatedPortfolio = portfolio.map(style => 
          (style.id === styleId || style.url === styleId) 
            ? { ...style, ...updates }
            : style
        );
        setPortfolio(updatedPortfolio);
        setShowEditModal(false);
        setEditingStyle(null);
      } else {
        alert(t('messages.styleUpdateError'));
      }
    } catch (error) {
      console.error('Error updating style:', error);
      alert(t('messages.styleUpdateError'));
    }
  };

  const handleSaveSettings = async (newUrl: string) => {
    try {
      const success = await firebaseService.saveReservationUrl(designerName, newUrl);
      if (success) {
        setReservationUrl(newUrl);
        setShowSettingsModal(false);
      } else {
        alert(t('messages.settingsSaveError'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('messages.settingsSaveError'));
    }
  };

  const handleSaveProfile = async (profile: DesignerProfile) => {
    try {
      const success = await firebaseService.saveDesignerProfile(designerName, profile);
      if (success) {
        setDesignerProfile(profile);
        setShowProfileModal(false);
      } else {
        alert(t('messages.profileSaveError'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(t('messages.profileSaveError'));
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
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
              style={{
                fontFamily: designerProfile?.brandSettings?.fontFamily || 'Inter',
                color: designerProfile?.brandSettings?.textColor || '#1f2937'
              }}
            >
              {designerProfile?.brandSettings?.salonName || 'Hairfolio'}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Language Selector */}
            <LanguageSelector />
            
            <button
              onClick={() => setShowProfileModal(true)}
              className={`${headerButtonStyle} bg-blue-600 text-white hover:bg-blue-700`}
              title={t('designer.profile')}
            >
              <div className="w-5 h-5">
                <UserIcon />
              </div>
              <span className="hidden sm:inline ml-2 text-sm">{t('designer.profile')}</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className={`${headerButtonStyle} bg-indigo-600 text-white hover:bg-indigo-700`}
              title={t('designer.sharePortfolio')}
            >
              <div className="w-5 h-5">
                <ShareIcon />
              </div>
              <span className="hidden sm:inline ml-2 text-sm">{t('common.share')}</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`${headerButtonStyle} bg-gray-200 text-gray-700 hover:bg-gray-300`}
              title={t('designer.settings')}
            >
              <div className="w-5 h-5">
                <SettingsIcon />
              </div>
              <span className="hidden sm:inline ml-2 text-sm">{t('designer.settings')}</span>
            </button>
            <button
              onClick={onLogout}
              className={`${headerButtonStyle} bg-gray-600 text-white hover:bg-gray-700`}
              title={t('common.logout')}
            >
              <span className="text-sm px-1">{t('common.logout')}</span>
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
                {t('common.edit')}
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
                  <h3 className="text-lg font-semibold text-gray-800">{t('designer.setupProfile')}</h3>
                  <p className="text-sm text-gray-600">{t('designer.setupProfileDesc')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t('designer.setupProfile')}
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
                    <span>{t('designer.yourStyles')}</span>
                 </button>
                 <button 
                   onClick={() => setActiveView('analytics')} 
                   className={`${tabStyle} flex-1 sm:flex-initial ${activeView === 'analytics' ? activeTabStyle : inactiveTabStyle}`} 
                   aria-pressed={activeView === 'analytics'}
                 >
                    <div className="w-4 h-4">
                      <AnalyticsIcon />
                    </div>
                    <span>{t('designer.analytics')}</span>
                 </button>
             </div>
          </div>

          {activeView === 'gallery' ? (
             portfolio.length > 0 ? (
                <>
                  {/* DesignerView Gallery Debug */}
                  {console.log('=== DESIGNER VIEW GALLERY CALL ===')}
                  {console.log('Calling HairstyleGallery with props:', {
                    isDesignerView: true,
                    onAddImage: !!(() => setShowUploadModal(true)),
                    images: portfolio.length,
                    portfolio: portfolio
                  })}
                  
                  <HairstyleGallery 
                    images={portfolio}
                    onSelect={() => {}} // No action on select in designer view
                    selectedUrl={null}
                    disabled={false}
                    onAddImage={() => setShowUploadModal(true)}
                    onDeleteImage={handlePortfolioImageDelete}
                    onEditImage={handlePortfolioImageEdit}
                    isDesignerView={true}
                  />
                </>
              ) : (
                 <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
                    <div className="w-24 h-24 mx-auto text-indigo-200">
                        <HairIcon />
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-gray-800">{t('designer.portfolioLive')}</h3>
                    <p className="mt-2 text-gray-600 max-w-md mx-auto">{t('designer.portfolioLiveDesc')}</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
                    >
                        <div className="w-5 h-5">
                          <PlusIcon />
                        </div>
                        <span className="ml-2">{t('designer.addFirstStyle')}</span>
                    </button>
                </div>
              )
          ) : (
            stats ? <AnalyticsDashboard stats={stats} portfolio={portfolio} /> : <div className="text-center py-16 text-gray-500">{t('designer.loadingAnalytics')}</div>
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

        {showEditModal && editingStyle && (
            <EditStyleModal
                style={editingStyle}
                onSave={handleSaveEditedStyle}
                onClose={() => {
                  setShowEditModal(false);
                  setEditingStyle(null);
                }}
            />
        )}

        <footer className="text-center mt-8">
          <p className="text-gray-500">Powered by HAIRFOLIO</p>
        </footer>
      </div>
    </div>
  );
};

export default DesignerView;
