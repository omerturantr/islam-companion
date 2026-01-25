import AsyncStorage from '@react-native-async-storage/async-storage';

export type QuranBookmark = {
  id: string;
  surahId: number;
  surahNameEnglish: string;
  surahNameArabic: string;
  pageIndex: number;
  pageNumber: number | null;
  createdAt: string;
};

export type VerseBookmark = {
  id: string;
  surahId: number;
  surahNameEnglish: string;
  surahNameArabic: string;
  ayahNumber: number;
  ayahNumberInSurah: number;
  pageIndex: number;
  pageNumber: number | null;
  excerpt: string;
  note: string;
  createdAt: string;
};

export type LastRead = {
  surahId: number;
  pageIndex: number;
  pageNumber: number | null;
  updatedAt: string;
};

const BOOKMARKS_KEY = 'quran:bookmarks';
const VERSE_BOOKMARKS_KEY = 'quran:verseBookmarks';
const LAST_READ_KEY = 'quran:lastRead';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value);

const normalizeBookmarks = (raw: unknown): QuranBookmark[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Partial<QuranBookmark>;
      if (
        typeof record.id !== 'string' ||
        !isNumber(record.surahId) ||
        !isNumber(record.pageIndex)
      ) {
        return null;
      }
      return {
        id: record.id,
        surahId: record.surahId,
        surahNameEnglish: record.surahNameEnglish ?? '',
        surahNameArabic: record.surahNameArabic ?? '',
        pageIndex: record.pageIndex,
        pageNumber: record.pageNumber ?? null,
        createdAt: record.createdAt ?? new Date().toISOString(),
      };
    })
    .filter((item): item is QuranBookmark => Boolean(item));
};

const normalizeVerseBookmarks = (raw: unknown): VerseBookmark[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Partial<VerseBookmark>;
      if (
        typeof record.id !== 'string' ||
        !isNumber(record.surahId) ||
        !isNumber(record.ayahNumber) ||
        !isNumber(record.ayahNumberInSurah) ||
        !isNumber(record.pageIndex)
      ) {
        return null;
      }
      return {
        id: record.id,
        surahId: record.surahId,
        surahNameEnglish: record.surahNameEnglish ?? '',
        surahNameArabic: record.surahNameArabic ?? '',
        ayahNumber: record.ayahNumber,
        ayahNumberInSurah: record.ayahNumberInSurah,
        pageIndex: record.pageIndex,
        pageNumber: record.pageNumber ?? null,
        excerpt: record.excerpt ?? '',
        note: record.note ?? '',
        createdAt: record.createdAt ?? new Date().toISOString(),
      };
    })
    .filter((item): item is VerseBookmark => Boolean(item));
};

const normalizeLastRead = (raw: unknown): LastRead | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Partial<LastRead>;
  if (!isNumber(record.surahId) || !isNumber(record.pageIndex)) {
    return null;
  }
  return {
    surahId: record.surahId,
    pageIndex: record.pageIndex,
    pageNumber: record.pageNumber ?? null,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  };
};

export const loadBookmarks = async (): Promise<QuranBookmark[]> => {
  const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return normalizeBookmarks(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const saveBookmarks = async (bookmarks: QuranBookmark[]) => {
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
};

export const loadVerseBookmarks = async (): Promise<VerseBookmark[]> => {
  const raw = await AsyncStorage.getItem(VERSE_BOOKMARKS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return normalizeVerseBookmarks(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const saveVerseBookmarks = async (bookmarks: VerseBookmark[]) => {
  await AsyncStorage.setItem(VERSE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
};

export const loadLastRead = async (): Promise<LastRead | null> => {
  const raw = await AsyncStorage.getItem(LAST_READ_KEY);
  if (!raw) {
    return null;
  }
  try {
    return normalizeLastRead(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const saveLastRead = async (lastRead: LastRead) => {
  await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(lastRead));
};
