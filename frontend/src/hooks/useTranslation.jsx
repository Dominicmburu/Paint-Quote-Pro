// hooks/useTranslation.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GOOGLE_TRANSLATE_KEY, GOOGLE_TRANSLATE_URL } from '../utils/constants';

const TranslationContext = createContext();

// Available languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷' },
  de: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  nl: { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  it: { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  pt: { code: 'pt', name: 'Português', flag: '🇵🇹' },
  zh: { code: 'zh', name: '中文', flag: '🇨🇳' },
  ja: { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ko: { code: 'ko', name: '한국어', flag: '🇰🇷' },
  ar: { code: 'ar', name: 'العربية', flag: '🇸🇦' },
};

// Google Cloud Translation API configuration
const GOOGLE_TRANSLATE_API_KEY = GOOGLE_TRANSLATE_KEY;
const GOOGLE_TRANSLATE_API_URL = GOOGLE_TRANSLATE_URL;

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translatedTexts, setTranslatedTexts] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('flotto_language');
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('flotto_language', currentLanguage);
  }, [currentLanguage]);

  // Pre-translate common UI texts when language changes
  useEffect(() => {
    if (currentLanguage === 'en') return;

    const commonTexts = [
      'Features', 'Pricing', 'About', 'Contact', 'Dashboard',
      'Sign In', 'Login', 'Get Started', 'Join', 'Settings', 'Sign Out',
      'Welcome', 'Home', 'Projects', 'Quotes', 'Profile'
    ];

    // Pre-translate common texts
    translateTexts(commonTexts, currentLanguage).then(() => {
      console.log(`Pre-translated common texts for ${currentLanguage}`);
    }).catch(error => {
      console.warn('Failed to pre-translate common texts:', error);
    });
  }, [currentLanguage]);

  // Translation cache key generator
  const getCacheKey = (text, targetLang) => {
    return `${text}|${targetLang}`;
  };

  // Translate text using Google Cloud Translation API
  const translateText = async (text, targetLanguage = currentLanguage) => {
    // Return original text if it's English or if no API key
    if (targetLanguage === 'en' || !GOOGLE_TRANSLATE_API_KEY) {
      return text;
    }

    // Check cache first
    const cacheKey = getCacheKey(text, targetLanguage);
    if (translatedTexts[cacheKey]) {
      return translatedTexts[cacheKey];
    }

    try {
      const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Translation request failed');
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;

      // Cache the translation
      setTranslatedTexts(prev => ({
        ...prev,
        [cacheKey]: translatedText
      }));

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  };

  // Batch translate multiple texts
  const translateTexts = async (texts, targetLanguage = currentLanguage) => {
    if (targetLanguage === 'en' || !GOOGLE_TRANSLATE_API_KEY) {
      return texts;
    }

    setIsTranslating(true);

    try {
      // Filter out already cached texts
      const textsToTranslate = texts.filter(text => {
        const cacheKey = getCacheKey(text, targetLanguage);
        return !translatedTexts[cacheKey];
      });

      if (textsToTranslate.length === 0) {
        // All texts are already cached
        const results = texts.map(text => {
          const cacheKey = getCacheKey(text, targetLanguage);
          return translatedTexts[cacheKey] || text;
        });
        setIsTranslating(false);
        return results;
      }

      const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: textsToTranslate,
          source: 'en',
          target: targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Batch translation request failed');
      }

      const data = await response.json();
      const translations = data.data.translations;

      // Update cache with new translations
      const newTranslations = {};
      textsToTranslate.forEach((text, index) => {
        const cacheKey = getCacheKey(text, targetLanguage);
        newTranslations[cacheKey] = translations[index].translatedText;
      });

      setTranslatedTexts(prev => ({ ...prev, ...newTranslations }));

      // Return all texts (cached + new translations)
      const results = texts.map(text => {
        const cacheKey = getCacheKey(text, targetLanguage);
        return translatedTexts[cacheKey] || newTranslations[cacheKey] || text;
      });

      setIsTranslating(false);
      return results;
    } catch (error) {
      console.error('Batch translation error:', error);
      setIsTranslating(false);
      return texts; // Return original texts on error
    }
  };

  // Change language
  const changeLanguage = (languageCode) => {
    if (LANGUAGES[languageCode]) {
      setCurrentLanguage(languageCode);
    }
  };

  // Get translated text (with caching and auto-translation)
  const t = (text) => {
    if (currentLanguage === 'en') {
      return text;
    }

    const cacheKey = getCacheKey(text, currentLanguage);
    const cachedTranslation = translatedTexts[cacheKey];
    
    // If we have a cached translation, return it
    if (cachedTranslation) {
      return cachedTranslation;
    }

    // If no cached translation, trigger async translation
    translateText(text, currentLanguage).then(translatedText => {
      // This will update the cache automatically
      console.log(`Auto-translated "${text}" to "${translatedText}"`);
    }).catch(error => {
      console.warn(`Failed to translate "${text}":`, error);
    });

    // Return original text while translation is in progress
    return text;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    translateText,
    translateTexts,
    t,
    languages: LANGUAGES,
    isTranslating,
    translatedTexts
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};