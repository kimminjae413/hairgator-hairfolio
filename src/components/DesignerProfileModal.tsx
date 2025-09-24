import React, { useState, useEffect, useRef } from 'react';
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
  const [profile, setProfile] = useState<DesignerProfile>({
    name: currentProfile?.name || designerName,
    bio: currentProfile?.bio || '',
    location: currentProfile?.location || '',
    phone: currentProfile?.phone || '',
    profileImage: currentProfile?.profileImage || '', // 프로필 이미지 추가
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
      alert('JPG, PNG, WEBP 파일만 업로드 가능합니다.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('파일 크기는 5MB 이하만 가능합니다.');
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
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
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
    if (field === 'socialLinks') return; // Handle separately
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
      alert('디자이너 이름을 입력해주세요.');
      return;
    }

    // Validate URLs
    if (profile.socialLinks?.instagram && !isValidInstagramUrl(profile.socialLinks.instagram)) {
      alert('올바른 Instagram URL을 입력해주세요. (https://instagram.com/username)');
      return;
    }

    if (profile.socialLinks?.website && !isValidUrl(profile.socialLinks.website)) {
      alert('올바른 웹사이트 URL을 입력해주세요. (http:// 또는 https://로 시작)');
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
      alert('프로필 저장 중 오류가 발생했습니다.');
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={!isSubmitting ? onClose : undefined}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">프로필 편집</h2>
            <p className="text-indigo-100 text-sm">고객에게 보여질 프로필 정보를 설정하세요</p>
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
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          
          {/* Profile Image Upload */}
          <div className="text-center mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              프로필 사진
            </label>
            
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
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
                  {imageUploading ? '업로드 중...' : '사진 변경'}
                </button>
                
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={imageUploading || isSubmitting}
                    className="px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    제거
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
              JPG, PNG, WEBP 형식, 최대 5MB
            </p>
          </div>
          
          {/* Designer Name */}
          <div>
            <label htmlFor="designer-name" className="block text-sm font-medium text-gray-700 mb-2">
              디자이너 이름 *
            </label>
            <input
              id="designer-name"
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="예: 김미용, 박스타일"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
              maxLength={30}
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              소개글
            </label>
            <textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="예: 10년 경력의 전문 헤어 디자이너입니다. 고객 맞춤형 스타일링을 제공합니다."
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
              위치
            </label>
            <input
              id="location"
              type="text"
              value={profile.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="예: 서울시 강남구, 부산시 해운대구"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
              maxLength={50}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              연락처
            </label>
            <input
              id="phone"
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="예: 010-1234-5678"
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
              웹사이트
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
                <h4 className="font-medium text-blue-800 text-sm">프로필 정보</h4>
                <ul className="text-blue-700 text-xs mt-1 space-y-1">
                  <li>• 이 정보는 고객이 포트폴리오를 볼 때 표시됩니다</li>
                  <li>• 신뢰도 향상을 위해 정확한 정보를 입력해주세요</li>
                  <li>• 소셜 링크는 선택사항입니다</li>
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
                저장 중...
              </>
            ) : (
              '프로필 저장'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignerProfileModal;
