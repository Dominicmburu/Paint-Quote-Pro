import React, { useEffect } from 'react';
import { Globe } from 'lucide-react';

const GoogleTranslate = () => {
  useEffect(() => {
    if (window.google && window.google.translate) {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,es,fr,de,nl,it,pt,pl,ru,zh,ja,ko,ar',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');
    }
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <div id="google_translate_element" className="google-translate-container"></div>
    </div>
  );
};

export default GoogleTranslate;