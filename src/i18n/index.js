import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Import all language files
import ar from './ar';
import en from './en';
import es from './es';
import fr from './fr';
import hi from './hi';
import ur from './ur';
import zh from './zh';

// Initialize i18n with all translations
const i18n = new I18n({
  en: { ...en },
  es: { ...es },
  fr: { ...fr },
  ar: { ...ar },
  ur: { ...ur },
  hi: { ...hi },
  zh: { ...zh },
});

// Enable fallbacks
// If a translation is missing in the current language, it will fall back to English
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Function to get the device's locale
const getDeviceLocale = () => {
  const locale = Localization.locale?.split('-')[0];
  return ['en', 'es', 'fr', 'ar', 'ur', 'hi', 'zh'].includes(locale) ? locale : 'en';
};

// Function to get the stored language preference
const getStoredLanguage = async () => {
  try {
    const storedLang = await AsyncStorage.getItem('@language');
    return storedLang || getDeviceLocale();
  } catch (error) {
    console.error('Error getting stored language:', error);
    return getDeviceLocale();
  }
};

// Initialize with stored language or device locale
let currentLocale = 'en';

// Initialize the locale
const initLocale = async () => {
  currentLocale = await getStoredLanguage();
  i18n.locale = currentLocale;
  return currentLocale;
};

// Set the locale and store it
const setLocale = async (locale) => {
  try {
    if (['en', 'es', 'fr', 'ar', 'ur', 'hi', 'zh'].includes(locale)) {
      i18n.locale = locale;
      currentLocale = locale;
      await AsyncStorage.setItem('@language', locale);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting language:', error);
    return false;
  }
};

// Initialize locale on app start
initLocale();

// Translate function with error handling
const translate = (key, options = {}) => {
  try {
    const result = i18n.t(key, options);
    // If translation is missing, return the key in development for easier debugging
    if (result.includes('missing') && result.includes('translation')) {
      if (__DEV__) console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return result;
  } catch (error) {
    if (__DEV__) console.error(`Translation error for key "${key}":`, error);
    return key;
  }
};

export { currentLocale, setLocale, translate };

