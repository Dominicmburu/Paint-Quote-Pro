import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, languages, isTranslating } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLang = languages[currentLanguage];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          isTranslating 
            ? 'text-blue-600 bg-blue-50' 
            : 'text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-50'
        }`}
        disabled={isTranslating}
      >
        <Globe className={`h-4 w-4 ${isTranslating ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{currentLang.flag}</span>
        <span className="hidden md:inline">{currentLang.name}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Select Language
            </p>
          </div>
          
          {Object.values(languages).map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                currentLanguage === language.code
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-base">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
              </div>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
          
          <div className="px-3 py-2 border-t border-gray-100 mt-1">
            <p className="text-xs text-gray-400">
              Powered by Google Translate
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;