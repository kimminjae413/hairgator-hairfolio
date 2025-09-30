import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DesignerProfile } from '../types';
import { uploadToCloudinary } from '../services/cloudinaryService';

interface DesignerProfileModalProps {
  currentProfile: DesignerProfile | undefined;
  designerName: string;
  onSave: (profile: DesignerProfile) => void;
  onClose: () => void;
}

const DesignerProfileModal: React.FC<DesignerProfileModalProps> = ({
  currentProfile,
  designerName,
  onSave,
  onClose
}) => {
  const { t } = useTranslation();
  
  // Font options with translation
  const FONT_OPTIONS = [
    { value: 'Inter', label: t('profile.fontModern', '모던 (기본)'), preview: 'font-sans' },
    { value: 'serif', label: t('profile.fontClassic', '클래식'), preview: 'font-serif' },
    { value: 'Noto Sans KR', label: t('profile.fontKorean', '한글 최적화'), preview: 'font-sans' },
    { value: 'cursive', label: t('profile.fontHandwritten', '손글씨체'), preview: 'font-mono' },
    { value: 'Georgia', label: t('profile.fontElegant', '우아한'), preview: 'font-serif' },
  ];

  // Color options with translation
  const COLOR_OPTIONS = [
    { value: '#1f2937', label: t('profile.colorClassicBlack', '클래식 블랙'), color: 'bg-gray-800' },
    { value: '#dc2626', label: t('profile.colorRed', '빨간색'), color: 'bg-red-600' },
    { value: '#2563eb', label: t('profile.colorBlue', '파란색'), color: 'bg-blue-600' },
    { value: '#7c3aed', label: t('profile.colorPurple', '보라색'), color: 'bg-violet-600' },
    { value: '#059669', label: t('profile.colorGreen', '초록색'), color: 'bg-emerald-600' },
    { value: '#d97706', label: t('profile.colorOrange', '주황색'), color: 'bg-amber-600' },
    { value: '#be185d', label: t('profile.colorPink', '핑크색'), color: 'bg-pink-600' },
    { value: '#374151', label: t('profile.colorDarkGray', '다크 그레이'), color: 'bg-gray-700' },
  ];

  const [profile, setProfile] = useState<DesignerProfile>({
    name: currentProfile?.name || designerName,
    bio: currentProfile?.bio || '',
    location: currentProfile?.location || '',
    phone: currentProfile?.phone || '',
    profileImage: currentProfile?.profileImage || '',
    brandSettings: {
      salonName: currentProfile?.brandSettings?.salonName || '',
      fontFamily: currentProfile?.brandSettings?.fontFamily || 'Inter',
      textColor: currentProfile?.brandSettings?.textColor || '#1f2937',
      showSubtitle: currentProfile?.brandSettings?.showSubtitle !== false,
    },
    socialLinks: {
      instagram: currentProfile?.socialLinks?.instagram || '',
      website: currentProfile?.socialLinks?.website || ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(currentProfile?.profileImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle profile image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert(t('profile.invalidFileType', 'JPG, PNG, WEBP 파일만 업로드 가능합니다.'));
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(t('profile.fileTooLarge', '파일 크기는 5MB 이하만 가능합니다.'));
      return;
    }

    setImageUploading(true);
    
    try {
      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file, {
        folder: 'hairfolio/profiles',
        tags: ['hairfolio', 'profile', designerName.toLowerCase()]
      });

      setProfile(prev => ({ ...prev, profileImage: imageUrl }));
      setImagePreview(imageUrl);
    } catch (error) {
      console.error('Profile image upload failed:', error);
      alert(t('profile.uploadError', '이미지 업로드에 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setImageUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Remove profile image
  const handleRemoveImage = () => {
    setProfile(prev => ({ ...prev, profileImage: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (field: keyof DesignerProfile, value: string) => {
    if (field === 'socialLinks' || field === 'brandSettings') return; // Handle separately
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: 'instagram' | 'website', value: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleBrandSettingChange = (field: keyof NonNullable<DesignerProfile['brandSettings']>, value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      brandSettings: {
        ...prev.brandSettings,
        [field]: value
      }
    }));
  };

  // Validate social media URLs
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const isValidInstagramUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    return isValidUrl(url) && url.includes('instagram.com');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profile.name.trim()) {
      alert(t('profile.nameRequired', '디자이너 이름을 입력해주세요.'));
      return;
    }

    // Validate URLs
    if (profile.socialLinks?.instagram && !isValidInstagramUrl(profile.socialLinks.instagram)) {
      alert(t('profile.invalidInstagramUrl', '올바른 Instagram URL을 입력해주세요. (https://instagram.com/username)'));
      return;
    }

    if (profile.socialLinks?.website && !isValidUrl(profile.socialLinks.website)) {
      alert(t('profile.invalidWebsiteUrl', '올바른 웹사이트 URL을 입력해주세요. (http:// 또는 https://로 시작)'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Clean up empty social links
      const cleanedProfile = {
        ...profile,
        name: profile.name.trim(),
        bio: profile.bio?.trim() || undefined,
        location: profile.location?.trim() || undefined,
        phone: profile.phone?.trim() || undefined,
        brandSettings: {
          salonName: profile.brandSettings?.salonName?.trim() || undefined,
          fontFamily: profile.brandSettings?.fontFamily || 'Inter',
          textColor: profile.brandSettings?.textColor || '#1f2937',
          showSubtitle: profile.brandSettings?.showSubtitle !== false,
        },
        socialLinks: {
          instagram: profile.socialLinks?.instagram?.trim() || undefined,
          website: profile.socialLinks?.website?.trim() || undefined
        }
      };

      // Remove empty social links object if no links
      if (!cleanedProfile.socialLinks?.instagram && !cleanedProfile.socialLinks?.website) {
        delete cleanedProfile.socialLinks;
      }

      onSave(cleanedProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(t('profile.saveError', '프로필 저장 중 오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal with escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isSubmitting]);

  // Get current brand display name
  const displaySalonName = profile.brandSettings?.salonName || 'Hairfolio';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={!isSubmitting ? onClose : undefined}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">{t('profile.editProfile', '프로필 편집')}</h2>
            <p className="text-indigo-100 text-sm">{t('profile.editProfileDesc', '고객에게 보여질 프로필 정보를 설정하세요')}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-indigo-100 hover:text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Profile Image Upload */}
          <div className="text-center mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('profile.profilePhoto', '프로필 사진')}
            </label>
            
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt={t('profile.profilePreview', 'Profile preview')} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                    {profile.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                
                {imageUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>

              {/* Upload/Remove buttons */}
              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading || isSubmitting}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {imageUploading ? t('profile.uploading', '업로드 중...') : t('profile.changePhoto', '사진 변경')}
                </button>
                
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={imageUploading || isSubmitting}
                    className="px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {t('profile.remove', '제거')}
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={imageUploading || isSubmitting}
              />
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {t('profile.imageRequirements', 'JPG, PNG, WEBP 형식, 최대 5MB')}
            </p>
          </div>

          {/* Brand Settings Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v14a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-9a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2z" />
              </svg>
              {t('profile.brandSettings', '브랜드 설정')}
            </h3>
            
            {/* Salon Name */}
            <div className="mb-4">
              <label htmlFor="salon-name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.salonName', '매장명/브랜드명')}
              </label>
              <input
                id="salon-name"
                type="text"
                value={profile.brandSettings?.salonName || ''}
                onChange={(e) => handleBrandSettingChange('salonName', e.target.value)}
                placeholder={t('profile.salonNamePlaceholder', '예: 스타일 헤어살롱, 뷰티 스튜디오')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isSubmitting}
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">{t('profile.salonNameNote', '비어있으면 \'Hairfolio\'로 표시됩니다')}</p>
            </div>

            {/* Font Family */}
            <div className="mb-4">
              <label htmlFor="font-family" className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.fontFamily', '글씨체')}
              </label>
              <select
                id="font-family"
                value={profile.brandSettings?.fontFamily || 'Inter'}
                onChange={(e) => handleBrandSettingChange('fontFamily', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSubmitting}
              >
                {FONT_OPTIONS.map(font => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('profile.textColor', '텍스트 색상')}</label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleBrandSettingChange('textColor', color.value)}
                    className={`w-full h-12 rounded-lg border-2 ${color.color} ${
                      profile.brandSettings?.textColor === color.value
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-300 hover:border-purple-300'
                    } transition-all duration-200 relative flex items-center justify-center`}
                    disabled={isSubmitting}
                    title={color.label}
                  >
                    {profile.brandSettings?.textColor === color.value && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Subtitle Toggle */}
            <div className="mb-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{t('profile.showSubtitle', '부제목 표시')}</span>
                <input
                  type="checkbox"
                  checked={profile.brandSettings?.showSubtitle !== false}
                  onChange={(e) => handleBrandSettingChange('showSubtitle', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  disabled={isSubmitting}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">{t('profile.subtitleDesc', '"AI로 새로운 헤어스타일을..." 문구 표시')}</p>
            </div>

            {/* Brand Preview */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">{t('profile.preview', '미리보기:')}</p>
              <h4 
                className="text-xl font-bold mb-1"
                style={{
                  fontFamily: profile.brandSettings?.fontFamily || 'Inter',
                  color: profile.brandSettings?.textColor || '#1f2937'
                }}
              >
                {displaySalonName}
              </h4>
              {profile.brandSettings?.showSubtitle !== false && (
                <p className="text-sm text-gray-600">{t('profile.previewSubtitle', 'AI로 새로운 헤어스타일을 미리 체험해보세요')}</p>
              )}
            </div>
          </div>
          
          {/* Designer Name */}
          <div>
            <label htmlFor="designer-name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.designerName', '디자이너 이름')} *
            </label>
            <input
              id="designer-name"
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('profile.designerNamePlaceholder', '예: 김미용, 박스타일')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
              maxLength={30}
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.bio', '소개글')}
            </label>
            <textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder={t('profile.bioPlaceholder', '예: 10년 경력의 전문 헤어 디자이너입니다. 고객 맞춤형 스타일링을 제공합니다.')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
              maxLength={150}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {(profile.bio || '').length}/150
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.location', '위치')}
            </label>
            <input
              id="location"
              type="text"
              value={profile.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder={t('profile.locationPlaceholder', '예: 서울시 강남구, 부산시 해운대구')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
              maxLength={50}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.phone', '연락처')}
            </label>
            <input
              id="phone"
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder={t('profile.phonePlaceholder', '예: 010-1234-5678')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
              maxLength={20}
            />
          </div>

          {/* Instagram */}
          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              id="instagram"
              type="url"
              value={profile.socialLinks?.instagram || ''}
              onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
              placeholder="https://instagram.com/your_username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.website', '웹사이트')}
            </label>
            <input
              id="website"
              type="url"
              value={profile.socialLinks?.website || ''}
              onChange={(e) => handleSocialLinkChange('website', e.target.value)}
              placeholder="https://your-website.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-800 text-sm">{t('profile.helpTitle', '프로필 정보')}</h4>
                <ul className="text-blue-700 text-xs mt-1 space-y-1">
                  <li>{t('profile.helpTip1', '• 브랜드 설정으로 고유한 매장 이미지를 만들어보세요')}</li>
                  <li>{t('profile.helpTip2', '• 이 정보는 고객이 포트폴리오를 볼 때 표시됩니다')}</li>
                  <li>{t('profile.helpTip3', '• 신뢰도 향상을 위해 정확한 정보를 입력해주세요')}</li>
                </ul>
              </div>
            </div>
          </div>

        </form>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row-reverse gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !profile.name.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t('profile.saving', '저장 중...')}
              </>
            ) : (
              t('profile.saveProfile', '프로필 저장')
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel', '취소')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignerProfileModal;
