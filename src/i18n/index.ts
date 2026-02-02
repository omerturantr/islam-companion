import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, type LanguageCode } from './translations';

const STORAGE_KEY = 'settings:language';
const FALLBACK: LanguageCode = 'en';

const normalizeLanguage = (value?: string | null): LanguageCode => {
  if (!value) return FALLBACK;
  const code = value.toLowerCase();
  if (code.startsWith('tr')) return 'tr';
  if (code.startsWith('ar')) return 'ar';
  if (code.startsWith('ur')) return 'ur';
  if (code.startsWith('fr')) return 'fr';
  if (code.startsWith('ru')) return 'ru';
  if (code.startsWith('es')) return 'es';
  return 'en';
};

export const getDeviceLanguage = () => {
  const locale =
    Localization.getLocales()?.[0]?.languageTag ??
    Localization.locale ??
    FALLBACK;
  return normalizeLanguage(locale);
};

export const loadStoredLanguage = async (): Promise<LanguageCode | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? normalizeLanguage(stored) : null;
  } catch {
    return null;
  }
};

export const saveStoredLanguage = async (lang: LanguageCode) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    return;
  }
};

export const t = (lang: LanguageCode, key: string) => {
  return translations[lang]?.[key] ?? translations[FALLBACK]?.[key] ?? key;
};
