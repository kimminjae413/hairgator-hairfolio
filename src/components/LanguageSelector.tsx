import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  nativeName: string; // 각 언어의 원어 표기
}

const languages: LanguageOption[] = [
  { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', nativeName: 'Bahasa Indonesia' },
];

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean; // 컴팩트 모드 (아이콘만 표시)
  position?: 'left' | 'right'; // 드롭다운 정렬 위치
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  compact = false,
  position = 'right'
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 현재 언어 찾기 (fallback 포함)
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await i18n.changeLanguage(languageCode);
      // 언어 변경을 localStorage에도 저장
      localStorage.setItem('hairfolio_language', languageCode);
    } catch (error) {
      console.error('Language change failed:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // 언어 초기화 (localStorage에서 복원)
  useEffect(() => {
    const savedLanguage = localStorage.getItem('hairfolio_language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white 
          border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none 
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          transition-all duration-200 shadow-sm hover:shadow-md
          ${compact ? 'min-w-[48px]' : 'min-w-[120px]'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        type="button"
        aria-label="언어 선택"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-lg" role="img" aria-label={currentLanguage.name}>
          {currentLanguage.flag}
        </span>
        
        {!compact && (
          <span className="hidden sm:inline text-gray-700 font-medium">
            {currentLanguage.nativeName}
          </span>
        )}
        
        {isLoading ? (
          <div className="w-4 h-4 ml-auto">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <svg 
            className={`w-4 h-4 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div 
          className={`
            absolute z-50 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg
            ring-1 ring-black ring-opacity-5 focus:outline-none
            ${position === 'left' ? 'left-0' : 'right-0'}
          `}
          role="listbox"
          aria-label="언어 목록"
        >
          <div className="py-1">
            {languages.map((language) => {
              const isSelected = i18n.language === language.code;
              
              return (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  disabled={isLoading}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm text-left 
                    transition-colors duration-150 focus:outline-none focus:bg-gray-100
                    ${isSelected 
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="text-lg flex-shrink-0" role="img" aria-label={language.name}>
                    {language.flag}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-xs text-gray-500">{language.name}</div>
                  </div>
                  
                  {isSelected && (
                    <svg 
                      className="w-5 h-5 text-indigo-600 flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* 드롭다운 하단 정보 */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              언어 설정은 자동으로 저장됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
