import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // 드롭다운 위치 계산
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 드롭다운 크기
      const dropdownWidth = 192; // w-48 = 12rem = 192px
      const dropdownHeight = 100; // 2개 언어 * 40px + padding
      
      // 기본 위치 (버튼 아래쪽, 우측 정렬)
      let top = buttonRect.bottom + 8;
      let left = buttonRect.right - dropdownWidth;
      
      // 화면 우측 경계 체크
      if (left < 8) {
        left = buttonRect.left; // 버튼 왼쪽에 정렬
      }
      
      // 화면 하단 경계 체크 - 위쪽에 공간이 더 많으면 위로
      if (top + dropdownHeight > viewportHeight - 8) {
        const spaceAbove = buttonRect.top;
        const spaceBelow = viewportHeight - buttonRect.bottom;
        
        if (spaceAbove > spaceBelow && spaceAbove >= dropdownHeight + 8) {
          top = buttonRect.top - dropdownHeight - 8; // 버튼 위쪽
        } else {
          // 화면에 맞춰 위치 조정
          top = viewportHeight - dropdownHeight - 8;
        }
      }
      
      setDropdownStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${dropdownWidth}px`,
        zIndex: 9999
      });
    }
  }, [isOpen]);

  // 외부 클릭으로 닫기
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // 드롭다운 컴포넌트 (Portal로 렌더링)
  const dropdownPortal = isOpen && createPortal(
    <div 
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in fade-in duration-150"
    >
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => handleLanguageChange(language.code)}
          className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
            language.code === i18n.language
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-gray-700'
          }`}
        >
          <span className="text-lg">{language.flag}</span>
          <span>{language.name}</span>
          {language.code === i18n.language && (
            <svg className="w-4 h-4 ml-auto text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownPortal}
    </>
  );
};

export default LanguageSelector;
