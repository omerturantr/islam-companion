import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import type {
  StyleProp,
  TextStyle,
  ViewToken,
  ViewabilityConfig,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  Ayah,
  DEFAULT_RECITER,
  RECITERS,
  Surah,
  SurahMeta,
  VerseSearchMode,
  VerseSearchResult,
  fetchSurahDetail,
  fetchSurahList,
  fetchAyahTafsir,
  getAyahAudioUrl,
  searchVerses,
} from '../data/quran';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import {
  loadBookmarks,
  loadLastRead,
  saveBookmarks,
  saveLastRead,
  type LastRead,
  type QuranBookmark,
  loadVerseBookmarks,
  saveVerseBookmarks,
  type VerseBookmark,
} from '../lib/quranReading';

const AUDIO_ERROR = 'Audio playback failed. Check your connection.';
const DATA_ERROR = 'Unable to load Quran data. Please try again.';
const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5];
const SLEEP_TIMER_OPTIONS = [5, 10, 15, 30, 60];
const FALLBACK_PAGE_SIZE = 10;
const BISMILLAH_DISPLAY =
  '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650';
const BISMILLAH_PLAIN =
  '\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062d\u0645\u0646 \u0627\u0644\u0631\u062d\u064a\u0645';
const DIACRITIC_REGEX = /[\u064b-\u065f\u0670]/;
const STOP_MARKS = new Set([
  '\u06d6',
  '\u06d7',
  '\u06d8',
  '\u06d9',
  '\u06da',
  '\u06db',
  '\u06dc',
  '\u06e9',
]);
const JUMP_STORAGE_KEY = 'quran:jumpTarget';

type SurahPage = {
  id: string;
  pageNumber: number | null;
  ayahs: Ayah[];
};

const buildPages = (ayahs: Ayah[]): SurahPage[] => {
  if (ayahs.length === 0) {
    return [];
  }

  const hasPageNumbers = ayahs.some((ayah) => typeof ayah.page === 'number');
  if (!hasPageNumbers) {
    const pages: SurahPage[] = [];
    for (let index = 0; index < ayahs.length; index += FALLBACK_PAGE_SIZE) {
      pages.push({
        id: `chunk-${index}`,
        pageNumber: null,
        ayahs: ayahs.slice(index, index + FALLBACK_PAGE_SIZE),
      });
    }
    return pages;
  }

  const pageMap = new Map<number, Ayah[]>();
  ayahs.forEach((ayah) => {
    const page = typeof ayah.page === 'number' ? ayah.page : -1;
    if (!pageMap.has(page)) {
      pageMap.set(page, []);
    }
    pageMap.get(page)?.push(ayah);
  });

  return Array.from(pageMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([pageNumber, pageAyahs]) => ({
      id: `page-${pageNumber}`,
      pageNumber: pageNumber > 0 ? pageNumber : null,
      ayahs: pageAyahs,
    }));
};

const findPageIndexForAyah = (pages: SurahPage[], ayahNumberInSurah: number) =>
  pages.findIndex((page) =>
    page.ayahs.some((ayah) => ayah.numberInSurah === ayahNumberInSurah),
  );

const toArabicDigits = (value: number) => {
  const digits = String(value).split('');
  return digits
    .map((digit) => {
      const numeric = digit.charCodeAt(0) - 48;
      if (numeric >= 0 && numeric <= 9) {
        return String.fromCharCode(0x0660 + numeric);
      }
      return digit;
    })
    .join('');
};

const formatAyahMarker = (value: number) => `(${toArabicDigits(value)})`;
const normalizeBismillahChar = (char: string) => {
  if (DIACRITIC_REGEX.test(char)) {
    return '';
  }
  if (char === '\u0671') {
    return '\u0627';
  }
  return char;
};

const stripBismillah = (text: string) => {
  let sourceIndex = 0;
  let targetIndex = 0;

  while (sourceIndex < text.length && targetIndex < BISMILLAH_PLAIN.length) {
    const normalized = normalizeBismillahChar(text[sourceIndex]);
    if (!normalized) {
      sourceIndex += 1;
      continue;
    }
    if (normalized !== BISMILLAH_PLAIN[targetIndex]) {
      return text;
    }
    sourceIndex += 1;
    targetIndex += 1;
  }

  if (targetIndex !== BISMILLAH_PLAIN.length) {
    return text;
  }

  while (sourceIndex < text.length && DIACRITIC_REGEX.test(text[sourceIndex])) {
    sourceIndex += 1;
  }

  return text.slice(sourceIndex).trim();
};

const renderAyahSegments = (
  text: string,
  keyPrefix: string,
  stopMarkStyle: StyleProp<TextStyle>,
) => {
  const parts: React.ReactNode[] = [];
  let buffer = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (STOP_MARKS.has(char)) {
      if (buffer) {
        parts.push(buffer);
        buffer = '';
      }
      parts.push(
        <Text key={`${keyPrefix}-stop-${i}`} style={stopMarkStyle}>
          {char}
        </Text>,
      );
    } else {
      buffer += char;
    }
  }
  if (buffer) {
    parts.push(buffer);
  }
  return parts;
};

export function QuranScreen() {
  const { colors, mode } = useTheme();
  const highlightColor =
    mode === 'dark' ? 'rgba(159, 208, 199, 0.28)' : 'rgba(31, 92, 91, 0.12)';
  const styles = useMemo(
    () => createStyles(colors, highlightColor),
    [colors, highlightColor],
  );

  const rtlPaging = true;
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [selectedSurahId, setSelectedSurahId] = useState(0);
  const [activeSurah, setActiveSurah] = useState<Surah | null>(null);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [verseBookmarks, setVerseBookmarks] = useState<VerseBookmark[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [pendingLastRead, setPendingLastRead] = useState<LastRead | null>(null);
  const [readingStateLoaded, setReadingStateLoaded] = useState(false);
  const [initialSurahSet, setInitialSurahSet] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSurah, setLoadingSurah] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [reciter, setReciter] = useState(DEFAULT_RECITER);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [repeatStart, setRepeatStart] = useState<number | null>(null);
  const [repeatEnd, setRepeatEnd] = useState<number | null>(null);
  const [lastTappedAyah, setLastTappedAyah] = useState<Ayah | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [surahQuery, setSurahQuery] = useState('');
  const [controlsVisible, setControlsVisible] = useState(false);
  const [verseQuery, setVerseQuery] = useState('');
  const [verseSearchMode, setVerseSearchMode] =
    useState<VerseSearchMode>('english');
  const [verseResults, setVerseResults] = useState<VerseSearchResult[]>([]);
  const [verseSearching, setVerseSearching] = useState(false);
  const [verseSearchError, setVerseSearchError] = useState<string | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [selectedVerse, setSelectedVerse] = useState<{
    surahId: number;
    surahNameEnglish: string;
    surahNameArabic: string;
    ayahNumber: number;
    ayahNumberInSurah: number;
    pageIndex: number;
    pageNumber: number | null;
    excerpt: string;
  } | null>(null);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirSource, setTafsirSource] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageBodyHeight, setPageBodyHeight] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pageListRef = useRef<FlatList<SurahPage> | null>(null);
  const suppressPressRef = useRef(0);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);
  const [pendingVerseJump, setPendingVerseJump] = useState<{
    surahId: number;
    ayahNumberInSurah: number;
  } | null>(null);
  const viewabilityConfig = useRef<ViewabilityConfig>({
    viewAreaCoveragePercentThreshold: 60,
  }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (typeof index === 'number') {
        setPageIndex(index);
      }
    },
  ).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    let active = true;
    Promise.all([loadBookmarks(), loadLastRead(), loadVerseBookmarks()])
      .then(([savedBookmarks, savedLastRead, savedVerseBookmarks]) => {
        if (!active) {
          return;
        }
        setBookmarks(savedBookmarks);
        setVerseBookmarks(savedVerseBookmarks);
        setLastRead(savedLastRead);
        setPendingLastRead(savedLastRead);
        setReadingStateLoaded(true);
      })
      .catch(() => {
        if (active) {
          setReadingStateLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadVerseBookmarks()
        .then((list) => {
          if (active) {
            setVerseBookmarks(list);
          }
        })
        .catch(() => undefined);
      AsyncStorage.getItem(JUMP_STORAGE_KEY)
        .then((value) => {
          if (!value) {
            return;
          }
          const parsed = JSON.parse(value) as {
            surahId?: number;
            pageIndex?: number;
            pageNumber?: number | null;
          };
          if (!active) {
            return;
          }
          AsyncStorage.removeItem(JUMP_STORAGE_KEY).catch(() => undefined);
          if (
            typeof parsed.surahId !== 'number' ||
            typeof parsed.pageIndex !== 'number'
          ) {
            return;
          }
          setPendingLastRead({
            surahId: parsed.surahId,
            pageIndex: parsed.pageIndex,
            pageNumber: parsed.pageNumber ?? null,
            updatedAt: new Date().toISOString(),
          });
          setSelectedSurahId(parsed.surahId);
          setInitialSurahSet(true);
          setControlsVisible(false);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  const normalizedQuery = surahQuery.trim().toLowerCase();
  const normalizedVerseQuery = verseQuery.trim();
  const isArabicSearch = verseSearchMode === 'arabic';

  useEffect(() => {
    const trimmed = normalizedVerseQuery.trim();
    if (trimmed.length < 2) {
      setVerseResults([]);
      setVerseSearchError(null);
      setVerseSearching(false);
      return () => undefined;
    }
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setVerseSearching(true);
    setVerseSearchError(null);

    const timer = setTimeout(() => {
      searchVerses(trimmed, verseSearchMode)
        .then((results) => {
          if (searchRequestRef.current !== requestId) {
            return;
          }
          setVerseResults(results);
        })
        .catch(() => {
          if (searchRequestRef.current !== requestId) {
            return;
          }
          setVerseSearchError('Unable to search verses right now.');
          setVerseResults([]);
        })
        .finally(() => {
          if (searchRequestRef.current === requestId) {
            setVerseSearching(false);
          }
        });
    }, 450);

    return () => clearTimeout(timer);
  }, [normalizedVerseQuery, verseSearchMode]);
  const filteredSurahs = surahs.filter((surah) => {
    if (!normalizedQuery) {
      return true;
    }

    const idMatch = String(surah.id).startsWith(normalizedQuery);
    const nameMatch = surah.nameEnglish
      .toLowerCase()
      .includes(normalizedQuery);
    const translationMatch = surah.translationEnglish
      .toLowerCase()
      .includes(normalizedQuery);
    const arabicMatch = surah.nameArabic.toLowerCase().includes(normalizedQuery);

    return idMatch || nameMatch || translationMatch || arabicMatch;
  });

  const pages = useMemo(
    () => buildPages(activeSurah?.ayahs ?? []),
    [activeSurah],
  );
  const currentPage = pages[pageIndex];
  const pageIndicatorText = loadingSurah
    ? 'Loading pages...'
    : pages.length > 0
      ? `Page ${pageIndex + 1} of ${pages.length}${
          currentPage?.pageNumber ? ` | Mushaf page ${currentPage.pageNumber}` : ''
        }`
      : 'Select a surah to begin.';
  const pageWidth = Math.max(1, width);
  const pageTypography = useMemo(() => {
    const fallback = { fontSize: 26, lineHeight: 46 };
    if (pageBodyHeight <= 0) {
      return fallback;
    }
    const targetLines = 10;
    const rawLineHeight = Math.floor(pageBodyHeight / targetLines);
    const lineHeight = Math.max(32, Math.min(58, rawLineHeight));
    const fontSize = Math.max(22, Math.min(36, Math.round(lineHeight * 0.56)));
    return { fontSize, lineHeight };
  }, [pageBodyHeight]);
  const currentPageLabel = currentPage?.pageNumber
    ? `Mushaf page ${currentPage.pageNumber}`
    : `Page ${pageIndex + 1}`;
  const lastReadSurah = useMemo(() => {
    if (!lastRead) {
      return null;
    }
    return surahs.find((surah) => surah.id === lastRead.surahId) ?? null;
  }, [lastRead, surahs]);
  const lastReadPageLabel = lastRead
    ? lastRead.pageNumber
      ? `Mushaf page ${lastRead.pageNumber}`
      : `Page ${lastRead.pageIndex + 1}`
    : '';
  const canResumeLastRead = Boolean(
    lastRead &&
      (lastRead.surahId !== selectedSurahId ||
        lastRead.pageIndex !== pageIndex),
  );
  const canBookmark = Boolean(activeSurah && currentPage);
  const orderedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }, [bookmarks]);
  const verseBookmarkMap = useMemo(() => {
    const map = new Map<string, VerseBookmark>();
    verseBookmarks.forEach((bookmark) => {
      map.set(`${bookmark.surahId}:${bookmark.ayahNumberInSurah}`, bookmark);
    });
    return map;
  }, [verseBookmarks]);
  const orderedVerseBookmarks = useMemo(() => {
    return [...verseBookmarks].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }, [verseBookmarks]);
  const repeatActive = repeatStart !== null && repeatEnd !== null;
  const hasRepeatPoints = repeatStart !== null || repeatEnd !== null;
  const selectedVerseBookmark = useMemo(() => {
    if (!selectedVerse) {
      return null;
    }
    return (
      verseBookmarkMap.get(
        `${selectedVerse.surahId}:${selectedVerse.ayahNumberInSurah}`,
      ) ?? null
    );
  }, [selectedVerse, verseBookmarkMap]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoadingList(true);
    fetchSurahList()
      .then((data) => {
        if (!isMounted) return;
        setSurahs(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(DATA_ERROR);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialSurahSet || !readingStateLoaded || surahs.length === 0) {
      return;
    }
    const preferred =
      lastRead && surahs.some((surah) => surah.id === lastRead.surahId)
        ? lastRead.surahId
        : surahs[0].id;
    setSelectedSurahId(preferred);
    setInitialSurahSet(true);
  }, [initialSurahSet, readingStateLoaded, lastRead, surahs]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedSurahId) {
      setActiveSurah(null);
      setLoadingSurah(false);
      return () => {
        isMounted = false;
      };
    }
    setLoadingSurah(true);
    setError(null);

    fetchSurahDetail(selectedSurahId)
      .then((data) => {
        if (!isMounted) return;
        setActiveSurah(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(DATA_ERROR);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoadingSurah(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSurahId]);

  useEffect(() => {
    return () => {
      stopPlayback().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    stopPlayback().catch(() => undefined);
  }, [selectedSurahId]);

  useEffect(() => {
    setRepeatStart(null);
    setRepeatEnd(null);
    setLastTappedAyah(null);
  }, [selectedSurahId]);

  useEffect(() => {
    stopPlayback().catch(() => undefined);
  }, [reciter]);

  useEffect(() => {
    const currentSound = soundRef.current;
    if (!currentSound) {
      return;
    }
    currentSound.setRateAsync(playbackRate, true).catch(() => undefined);
  }, [playbackRate]);

  useEffect(() => {
    if (pages.length === 0) {
      setPageIndex(0);
      return;
    }
    const verseTargetIndex =
      pendingVerseJump && pendingVerseJump.surahId === selectedSurahId
        ? findPageIndexForAyah(pages, pendingVerseJump.ayahNumberInSurah)
        : -1;
    const targetIndex =
      verseTargetIndex >= 0
        ? verseTargetIndex
        : pendingLastRead && pendingLastRead.surahId === selectedSurahId
          ? Math.min(
              pages.length - 1,
              Math.max(0, pendingLastRead.pageIndex),
            )
          : 0;
    setPageIndex(targetIndex);
    pageListRef.current?.scrollToIndex({ index: targetIndex, animated: false });
    if (pendingVerseJump && pendingVerseJump.surahId === selectedSurahId) {
      setPendingVerseJump(null);
    }
    if (pendingLastRead && pendingLastRead.surahId === selectedSurahId) {
      setPendingLastRead(null);
    }
  }, [selectedSurahId, pages, pendingLastRead, pendingVerseJump]);

  useEffect(() => {
    if (!activeSurah || pages.length === 0) {
      return;
    }
    const page = pages[pageIndex];
    if (!page) {
      return;
    }
    const record: LastRead = {
      surahId: activeSurah.id,
      pageIndex,
      pageNumber: page.pageNumber ?? null,
      updatedAt: new Date().toISOString(),
    };
    setLastRead(record);
    saveLastRead(record).catch(() => undefined);
  }, [activeSurah, pageIndex, pages]);

  const stopPlayback = async () => {
    const currentSound = soundRef.current;
    if (!currentSound) {
      setPlayingAyah(null);
      return;
    }

    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    soundRef.current = null;
    setPlayingAyah(null);
  };

  const getRepeatTargetAyah = () => {
    if (lastTappedAyah) {
      return lastTappedAyah;
    }
    if (playingAyah && activeSurah) {
      return activeSurah.ayahs.find((ayah) => ayah.number === playingAyah) ?? null;
    }
    return null;
  };

  const handleSetRepeatStart = () => {
    if (!activeSurah) {
      return;
    }
    const target = getRepeatTargetAyah();
    if (!target) {
      return;
    }
    const nextStart = target.numberInSurah;
    let nextEnd = repeatEnd;
    if (nextEnd !== null && nextStart > nextEnd) {
      nextEnd = nextStart;
    }
    setRepeatStart(nextStart);
    setRepeatEnd(nextEnd);
  };

  const handleSetRepeatEnd = () => {
    if (!activeSurah) {
      return;
    }
    const target = getRepeatTargetAyah();
    if (!target) {
      return;
    }
    const nextEnd = target.numberInSurah;
    let nextStart = repeatStart;
    if (nextStart !== null && nextEnd < nextStart) {
      nextStart = nextEnd;
    }
    setRepeatStart(nextStart ?? nextEnd);
    setRepeatEnd(nextEnd);
  };

  const handleClearRepeat = () => {
    setRepeatStart(null);
    setRepeatEnd(null);
  };

  const playAyah = async (ayahNumber: number) => {
    if (playingAyah === ayahNumber) {
      await stopPlayback();
      return;
    }

    try {
      setError(null);
      await stopPlayback();
      const { sound } = await Audio.Sound.createAsync(
        { uri: getAyahAudioUrl(ayahNumber, reciter) },
        { shouldPlay: true },
      );
      await sound.setRateAsync(playbackRate, true);
      soundRef.current = sound;
      setPlayingAyah(ayahNumber);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          return;
        }
        if (status.didJustFinish) {
          if (repeatActive && activeSurah && repeatStart !== null && repeatEnd !== null) {
            const startIndex = activeSurah.ayahs.findIndex(
              (ayah) => ayah.numberInSurah === repeatStart,
            );
            const endIndex = activeSurah.ayahs.findIndex(
              (ayah) => ayah.numberInSurah === repeatEnd,
            );
            const currentIndex = activeSurah.ayahs.findIndex(
              (ayah) => ayah.number === ayahNumber,
            );
            if (
              startIndex >= 0 &&
              endIndex >= 0 &&
              currentIndex >= 0 &&
              currentIndex >= startIndex &&
              currentIndex <= endIndex
            ) {
              const nextIndex =
                currentIndex < endIndex ? currentIndex + 1 : startIndex;
              const nextAyah = activeSurah.ayahs[nextIndex];
              if (nextAyah) {
                setTimeout(() => {
                  playAyah(nextAyah.number).catch(() => undefined);
                }, 0);
                return;
              }
            }
          }
          stopPlayback().catch(() => undefined);
        }
      });
    } catch (err) {
      setError(AUDIO_ERROR);
    }
  };

  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (!sleepTimerMinutes) {
      return () => undefined;
    }
    sleepTimerRef.current = setTimeout(() => {
      stopPlayback().catch(() => undefined);
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60 * 1000);

    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
    };
  }, [sleepTimerMinutes]);

  const jumpToPage = (surahId: number, targetIndex: number, pageNumber?: number | null) => {
    if (surahId === selectedSurahId && pages.length > 0) {
      const clamped = Math.min(
        pages.length - 1,
        Math.max(0, targetIndex),
      );
      pageListRef.current?.scrollToIndex({ index: clamped, animated: false });
      setPageIndex(clamped);
      setControlsVisible(false);
      return;
    }
    setPendingLastRead({
      surahId,
      pageIndex: targetIndex,
      pageNumber: pageNumber ?? null,
      updatedAt: new Date().toISOString(),
    });
    setSelectedSurahId(surahId);
    setControlsVisible(false);
  };

  const handleResumeLastRead = () => {
    if (!lastRead) {
      return;
    }
    jumpToPage(lastRead.surahId, lastRead.pageIndex, lastRead.pageNumber);
  };

  const handleAddBookmark = () => {
    if (!activeSurah || !currentPage) {
      return;
    }
    const alreadySaved = bookmarks.some(
      (bookmark) =>
        bookmark.surahId === activeSurah.id &&
        bookmark.pageIndex === pageIndex,
    );
    if (alreadySaved) {
      return;
    }
    const record: QuranBookmark = {
      id: `${activeSurah.id}-${pageIndex}-${Date.now()}`,
      surahId: activeSurah.id,
      surahNameEnglish: activeSurah.nameEnglish,
      surahNameArabic: activeSurah.nameArabic,
      pageIndex,
      pageNumber: currentPage.pageNumber ?? null,
      createdAt: new Date().toISOString(),
    };
    const next = [record, ...bookmarks];
    setBookmarks(next);
    saveBookmarks(next).catch(() => undefined);
  };

  const handleRemoveBookmark = (id: string) => {
    const next = bookmarks.filter((bookmark) => bookmark.id !== id);
    setBookmarks(next);
    saveBookmarks(next).catch(() => undefined);
  };

  const handleGoToBookmark = (bookmark: QuranBookmark) => {
    jumpToPage(bookmark.surahId, bookmark.pageIndex, bookmark.pageNumber);
  };

  const getVerseKey = (surahId: number, ayahNumberInSurah: number) =>
    `${surahId}:${ayahNumberInSurah}`;

  const openVerseModal = (ayah: Ayah, surah: Surah) => {
    const key = getVerseKey(surah.id, ayah.numberInSurah);
    const existing = verseBookmarkMap.get(key);
    const excerptSource = ayah.textArabic.replace(/\s+/g, ' ').trim();
    const excerpt =
      excerptSource.length > 140
        ? `${excerptSource.slice(0, 140)}...`
        : excerptSource;
    setSelectedVerse({
      surahId: surah.id,
      surahNameEnglish: surah.nameEnglish,
      surahNameArabic: surah.nameArabic,
      ayahNumber: ayah.number,
      ayahNumberInSurah: ayah.numberInSurah,
      pageIndex,
      pageNumber: currentPage?.pageNumber ?? null,
      excerpt,
    });
    setNoteDraft(existing?.note ?? '');
    setTafsirText(null);
    setTafsirSource(null);
    setTafsirError(null);
    setTafsirLoading(false);
    setNoteModalVisible(true);
  };

  const openVerseModalFromBookmark = (bookmark: VerseBookmark) => {
    setSelectedVerse({
      surahId: bookmark.surahId,
      surahNameEnglish: bookmark.surahNameEnglish,
      surahNameArabic: bookmark.surahNameArabic,
      ayahNumber: bookmark.ayahNumber,
      ayahNumberInSurah: bookmark.ayahNumberInSurah,
      pageIndex: bookmark.pageIndex,
      pageNumber: bookmark.pageNumber ?? null,
      excerpt: bookmark.excerpt,
    });
    setNoteDraft(bookmark.note);
    setTafsirText(null);
    setTafsirSource(null);
    setTafsirError(null);
    setTafsirLoading(false);
    setNoteModalVisible(true);
  };

  const closeNoteModal = () => {
    setNoteModalVisible(false);
    setSelectedVerse(null);
    setNoteDraft('');
    setTafsirText(null);
    setTafsirSource(null);
    setTafsirError(null);
    setTafsirLoading(false);
  };

  const handleSaveVerseBookmark = () => {
    if (!selectedVerse) {
      return;
    }
    const key = getVerseKey(
      selectedVerse.surahId,
      selectedVerse.ayahNumberInSurah,
    );
    const existing = verseBookmarkMap.get(key);
    const record: VerseBookmark = {
      id: existing?.id ?? `${key}-${Date.now()}`,
      surahId: selectedVerse.surahId,
      surahNameEnglish: selectedVerse.surahNameEnglish,
      surahNameArabic: selectedVerse.surahNameArabic,
      ayahNumber: selectedVerse.ayahNumber,
      ayahNumberInSurah: selectedVerse.ayahNumberInSurah,
      pageIndex: selectedVerse.pageIndex,
      pageNumber: selectedVerse.pageNumber ?? null,
      excerpt: selectedVerse.excerpt,
      note: noteDraft.trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const next = existing
      ? verseBookmarks.map((bookmark) =>
          bookmark.id === existing.id ? record : bookmark,
        )
      : [record, ...verseBookmarks];
    setVerseBookmarks(next);
    saveVerseBookmarks(next).catch(() => undefined);
    closeNoteModal();
  };

  const handleLoadTafsir = () => {
    if (!selectedVerse || tafsirLoading) {
      return;
    }
    setTafsirLoading(true);
    setTafsirError(null);
    fetchAyahTafsir(selectedVerse.ayahNumber)
      .then((result) => {
        setTafsirText(result.text);
        setTafsirSource(result.source);
      })
      .catch(() => {
        setTafsirError('Unable to load tafsir for this verse.');
        setTafsirText(null);
        setTafsirSource(null);
      })
      .finally(() => setTafsirLoading(false));
  };

  const handleRemoveVerseBookmark = (id: string) => {
    const next = verseBookmarks.filter((bookmark) => bookmark.id !== id);
    setVerseBookmarks(next);
    saveVerseBookmarks(next).catch(() => undefined);
  };

  const handleGoToVerseBookmark = (bookmark: VerseBookmark) => {
    jumpToPage(bookmark.surahId, bookmark.pageIndex, bookmark.pageNumber);
  };

  const handleGoToSearchResult = (result: VerseSearchResult) => {
    setPendingVerseJump({
      surahId: result.surahId,
      ayahNumberInSurah: result.ayahNumberInSurah,
    });
    setSelectedSurahId(result.surahId);
    setInitialSurahSet(true);
    setControlsVisible(false);
  };

  const handleAyahPress = (ayah: Ayah) => {
    if (Date.now() - suppressPressRef.current < 800) {
      suppressPressRef.current = 0;
      return;
    }
    setLastTappedAyah(ayah);
    playAyah(ayah.number);
  };

  const handleAyahLongPress = (ayah: Ayah) => {
    if (!activeSurah) {
      return;
    }
    suppressPressRef.current = Date.now();
    setLastTappedAyah(ayah);
    openVerseModal(ayah, activeSurah);
  };

  const renderSurahChip = (surah: SurahMeta) => {
    const isActive = surah.id === selectedSurahId;
    return (
      <TouchableOpacity
        key={surah.id}
        style={[styles.surahChip, isActive && styles.surahChipActive]}
        onPress={() => setSelectedSurahId(surah.id)}
      >
        <Text style={[styles.surahChipNumber, isActive && styles.activeText]}>
          {surah.id}
        </Text>
        <Text
          style={[styles.surahChipLabel, isActive && styles.activeText]}
          numberOfLines={1}
        >
          {surah.nameEnglish}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderReciterChip = (item: typeof RECITERS[number]) => {
    const isActive = item.id === reciter.id;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.selectorChip, isActive && styles.selectorChipActive]}
        onPress={() => setReciter(item)}
      >
        <Text style={[styles.selectorText, isActive && styles.activeText]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSpeedChip = (value: number) => {
    const isActive = value === playbackRate;
    return (
      <TouchableOpacity
        key={`speed-${value}`}
        style={[styles.selectorChip, isActive && styles.selectorChipActive]}
        onPress={() => setPlaybackRate(value)}
      >
        <Text style={[styles.selectorText, isActive && styles.activeText]}>
          {value}x
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPage = ({ item, index }: { item: SurahPage; index: number }) => {
    const pageLabel = item.pageNumber ?? index + 1;
    const pageTitle = activeSurah?.nameArabic ?? '';
    const showBismillah = index === 0 && Boolean(activeSurah);
    return (
      <View style={[styles.page, rtlPaging && styles.pageRtl, { width: pageWidth }]}>
        <View style={styles.pagePaper}>
          <View style={styles.pageEdgeLeft} pointerEvents="none" />
          <View style={styles.pageEdgeRight} pointerEvents="none" />
          <View style={styles.pageFrame}>
            {pageTitle ? (
              <View style={styles.pageHeader}>
                <View style={styles.pageHeaderLine} />
                <Text style={styles.pageHeaderTitle} numberOfLines={1}>
                  {pageTitle}
                </Text>
                <View style={styles.pageHeaderLine} />
              </View>
            ) : null}
            {showBismillah ? (
              <Text style={styles.bismillah}>{BISMILLAH_DISPLAY}</Text>
            ) : null}
            <View
              style={styles.pageBody}
              onLayout={(event) => {
                const height = Math.round(event.nativeEvent.layout.height);
                if (height > 0 && height !== pageBodyHeight) {
                  setPageBodyHeight(height);
                }
              }}
            >
              <Text style={[styles.pageText, pageTypography]}>
                {item.ayahs.map((ayah) => {
                  let ayahText = ayah.textArabic;
                  if (showBismillah && ayah.numberInSurah === 1) {
                    ayahText = stripBismillah(ayahText);
                  }
                  if (!ayahText) {
                    return null;
                  }
                  const isPlaying = playingAyah === ayah.number;
                  return (
                    <Text
                      key={`ayah-${ayah.number}`}
                      onPress={() => handleAyahPress(ayah)}
                      onLongPress={() => handleAyahLongPress(ayah)}
                      delayLongPress={180}
                      suppressHighlighting
                      style={[styles.ayahSpan, isPlaying && styles.ayahSpanActive]}
                    >
                      {renderAyahSegments(
                        ayahText,
                        `ayah-${ayah.number}`,
                        styles.stopMark,
                      )}
                      {' '}
                      <Text style={styles.ayahMarker}>
                        {formatAyahMarker(ayah.numberInSurah)}
                      </Text>{' '}
                    </Text>
                  );
                })}
              </Text>
            </View>
            <View style={styles.pageFooter}>
              <View style={styles.pageFooterLine} />
              <View style={styles.pageNumberBadge}>
                <Text style={styles.pageNumberText}>
                  {toArabicDigits(pageLabel)}
                </Text>
              </View>
              <View style={styles.pageFooterLine} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const controls = (
    <View>
      <SurfaceCard style={styles.sectionSpacing}>
        <Text style={styles.cardEyebrow}>Surah</Text>
        {activeSurah ? (
          <View>
            <Text style={styles.surahTitle}>{activeSurah.nameEnglish}</Text>
            <Text style={styles.surahSubtitle}>
              {activeSurah.translationEnglish} | {activeSurah.ayahCount} ayahs
            </Text>
            <Text style={styles.surahMeta}>
              {activeSurah.revelationType} | Reciter: {reciter.label} | {playbackRate}x
            </Text>
          </View>
        ) : (
          <ActivityIndicator size="small" color={colors.pine} />
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.sectionSpacing}>
        <Text style={styles.cardEyebrow}>Last Read</Text>
        {lastReadSurah ? (
          <View>
            <Text style={styles.lastReadTitle}>{lastReadSurah.nameEnglish}</Text>
            <Text style={styles.lastReadMeta}>{lastReadSurah.nameArabic}</Text>
            <Text style={styles.lastReadMeta}>{lastReadPageLabel}</Text>
            <TouchableOpacity
              style={[
                styles.bookmarkButton,
                !canResumeLastRead && styles.bookmarkButtonDisabled,
              ]}
              onPress={handleResumeLastRead}
              disabled={!canResumeLastRead}
            >
              <Text
                style={[
                  styles.bookmarkButtonText,
                  !canResumeLastRead && styles.bookmarkButtonTextDisabled,
                ]}
              >
                Go to last read
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.helperText}>No last read saved yet.</Text>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.sectionSpacing}>
        <Text style={styles.cardEyebrow}>Bookmarks</Text>
        <TouchableOpacity
          style={[
            styles.bookmarkButton,
            !canBookmark && styles.bookmarkButtonDisabled,
          ]}
          onPress={handleAddBookmark}
          disabled={!canBookmark}
        >
          <Text
            style={[
              styles.bookmarkButtonText,
              !canBookmark && styles.bookmarkButtonTextDisabled,
            ]}
          >
            Bookmark {currentPageLabel}
          </Text>
        </TouchableOpacity>
        {orderedBookmarks.length > 0 ? (
          <View style={styles.bookmarkList}>
            {orderedBookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.bookmarkRow}>
                <View style={styles.bookmarkInfo}>
                  <Text style={styles.bookmarkTitle}>
                    {bookmark.surahNameEnglish || `Surah ${bookmark.surahId}`}
                  </Text>
                  {bookmark.surahNameArabic ? (
                    <Text style={styles.bookmarkArabic}>
                      {bookmark.surahNameArabic}
                    </Text>
                  ) : null}
                  <Text style={styles.bookmarkMeta}>
                    {bookmark.pageNumber
                      ? `Mushaf page ${bookmark.pageNumber}`
                      : `Page ${bookmark.pageIndex + 1}`}
                  </Text>
                </View>
                <View style={styles.bookmarkActions}>
                  <TouchableOpacity
                    style={styles.bookmarkActionButton}
                    onPress={() => handleGoToBookmark(bookmark)}
                  >
                    <Text style={styles.bookmarkActionText}>Go</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookmarkDeleteButton}
                    onPress={() => handleRemoveBookmark(bookmark.id)}
                  >
                    <Text style={styles.bookmarkDeleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>No bookmarks yet.</Text>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.sectionSpacing}>
        <Text style={styles.cardEyebrow}>Verse Bookmarks</Text>
        {orderedVerseBookmarks.length > 0 ? (
          <View style={styles.bookmarkList}>
            {orderedVerseBookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.bookmarkRow}>
                <View style={styles.bookmarkInfo}>
                  <Text style={styles.bookmarkTitle}>
                    {bookmark.surahNameEnglish || `Surah ${bookmark.surahId}`}{' '}
                    • Ayah {bookmark.ayahNumberInSurah}
                  </Text>
                  {bookmark.surahNameArabic ? (
                    <Text style={styles.bookmarkArabic}>
                      {bookmark.surahNameArabic}
                    </Text>
                  ) : null}
                  {bookmark.note ? (
                    <Text style={styles.bookmarkNote} numberOfLines={2}>
                      {bookmark.note}
                    </Text>
                  ) : (
                    <Text style={styles.bookmarkMeta}>No note</Text>
                  )}
                  {bookmark.pageNumber ? (
                    <Text style={styles.bookmarkMeta}>
                      Mushaf page {bookmark.pageNumber}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.bookmarkActions}>
                  <TouchableOpacity
                    style={styles.bookmarkActionButton}
                    onPress={() => handleGoToVerseBookmark(bookmark)}
                  >
                    <Text style={styles.bookmarkActionText}>Go</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookmarkActionButton}
                    onPress={() => openVerseModalFromBookmark(bookmark)}
                  >
                    <Text style={styles.bookmarkActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookmarkDeleteButton}
                    onPress={() => handleRemoveVerseBookmark(bookmark.id)}
                  >
                    <Text style={styles.bookmarkDeleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>
            Long-press a verse to add a bookmark and note.
          </Text>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.sectionSpacing}>
        <Text style={styles.cardEyebrow}>Choose Surah</Text>
        <Text style={styles.selectorTitle}>Search</Text>
        <TextInput
          value={surahQuery}
          onChangeText={setSurahQuery}
          placeholder="Search surah or number"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {!loadingList && normalizedQuery && filteredSurahs.length === 0 ? (
          <Text style={styles.searchHint}>No surahs match your search.</Text>
        ) : null}
        {loadingList ? (
          <ActivityIndicator size="small" color={colors.pine} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.surahRow}
          >
            {filteredSurahs.map(renderSurahChip)}
          </ScrollView>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.sectionSpacing}>
        <Text style={styles.cardEyebrow}>Verse Search</Text>
        <View style={styles.searchModeRow}>
          <TouchableOpacity
            style={[
              styles.searchModeChip,
              verseSearchMode === 'english' && styles.searchModeChipActive,
            ]}
            onPress={() => setVerseSearchMode('english')}
          >
            <Text
              style={[
                styles.searchModeText,
                verseSearchMode === 'english' && styles.searchModeTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.searchModeChip,
              verseSearchMode === 'arabic' && styles.searchModeChipActive,
            ]}
            onPress={() => setVerseSearchMode('arabic')}
          >
            <Text
              style={[
                styles.searchModeText,
                verseSearchMode === 'arabic' && styles.searchModeTextActive,
              ]}
            >
              Arabic
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={verseQuery}
          onChangeText={setVerseQuery}
          placeholder={`Search ${isArabicSearch ? 'Arabic' : 'English'} text`}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {verseSearching ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.pine} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : null}
        {verseSearchError ? (
          <Text style={styles.errorText}>{verseSearchError}</Text>
        ) : null}
        {!verseSearching &&
        normalizedVerseQuery.length >= 2 &&
        verseResults.length === 0 &&
        !verseSearchError ? (
          <Text style={styles.searchHint}>No matches found.</Text>
        ) : null}
        {verseResults.length > 0 ? (
          <View style={styles.searchResults}>
            {verseResults.slice(0, 20).map((result) => (
              <View
                key={`${result.surahId}-${result.ayahNumberInSurah}-${result.ayahNumber}`}
                style={styles.searchResultRow}
              >
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultTitle}>
                    {result.surahNameEnglish || `Surah ${result.surahId}`} • Ayah{' '}
                    {result.ayahNumberInSurah}
                  </Text>
                  {result.surahNameArabic ? (
                    <Text style={styles.searchResultArabic}>
                      {result.surahNameArabic}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.searchResultText,
                      isArabicSearch && styles.searchResultTextArabic,
                    ]}
                    numberOfLines={2}
                  >
                    {result.text}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.searchResultButton}
                  onPress={() => handleGoToSearchResult(result)}
                >
                  <Text style={styles.searchResultButtonText}>Go</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </SurfaceCard>

      <SurfaceCard style={styles.sectionSpacing}>
        <Text style={styles.cardEyebrow}>Audio</Text>
        <Text style={styles.selectorTitle}>Reciter</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorRow}
        >
          {RECITERS.map(renderReciterChip)}
        </ScrollView>
        <Text style={styles.selectorTitle}>Playback Speed</Text>
        <View style={styles.selectorRow}>
          {SPEED_OPTIONS.map(renderSpeedChip)}
        </View>
        <Text style={styles.selectorTitle}>A-B Repeat</Text>
        <Text style={styles.selectorHint}>
          Tap a verse, then set A and B to loop that range.
        </Text>
        <View style={styles.repeatRow}>
          <TouchableOpacity style={styles.repeatChip} onPress={handleSetRepeatStart}>
            <Text style={styles.repeatChipText}>Set A</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.repeatChip} onPress={handleSetRepeatEnd}>
            <Text style={styles.repeatChipText}>Set B</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.repeatChip, !repeatActive && styles.repeatChipDisabled]}
            onPress={handleClearRepeat}
            disabled={!repeatActive}
          >
            <Text
              style={[
                styles.repeatChipText,
                !repeatActive && styles.repeatChipTextDisabled,
              ]}
            >
              Clear
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.repeatStatus, repeatActive && styles.repeatStatusActive]}>
          {repeatActive
            ? `Looping Ayah ${repeatStart} to ${repeatEnd}`
            : 'Set A and B to enable looping.'}
        </Text>
        <Text style={styles.selectorTitle}>Sleep Timer</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[
              styles.selectorChip,
              sleepTimerMinutes === null && styles.selectorChipActive,
            ]}
            onPress={() => setSleepTimerMinutes(null)}
          >
            <Text
              style={[
                styles.selectorText,
                sleepTimerMinutes === null && styles.activeText,
              ]}
            >
              Off
            </Text>
          </TouchableOpacity>
          {SLEEP_TIMER_OPTIONS.map((minutes) => (
            <TouchableOpacity
              key={`sleep-${minutes}`}
              style={[
                styles.selectorChip,
                sleepTimerMinutes === minutes && styles.selectorChipActive,
              ]}
              onPress={() => setSleepTimerMinutes(minutes)}
            >
              <Text
                style={[
                  styles.selectorText,
                  sleepTimerMinutes === minutes && styles.activeText,
                ]}
              >
                {minutes} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SurfaceCard>

      {error ? (
        <SurfaceCard style={styles.sectionSpacing}>
          <Text style={styles.errorText}>{error}</Text>
        </SurfaceCard>
      ) : null}
    </View>
  );

  return (
    <Screen
      title="Quran"
      subtitle="Tanzil Arabic (Mushaf view)"
      scrollable={false}
      headerVisible={false}
      contentPadding={0}
    >
      <View style={styles.readerLayout}>
        <View style={styles.readerHeader}>
          <View>
            <Text style={styles.readerTitle}>
              {activeSurah ? activeSurah.nameEnglish : 'Quran'}
            </Text>
            <Text style={styles.readerSubtitle}>{pageIndicatorText}</Text>
          </View>
          <TouchableOpacity
            style={styles.readerAction}
            onPress={() => setControlsVisible(true)}
          >
            <Text style={styles.readerActionText}>Options</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          ref={pageListRef}
          data={pages}
          keyExtractor={(item) => item.id}
          renderItem={renderPage}
          horizontal
          pagingEnabled
          initialScrollIndex={pages.length > 0 ? 0 : undefined}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsHorizontalScrollIndicator={false}
          snapToInterval={pageWidth}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: pageWidth,
            offset: pageWidth * index,
            index,
          })}
          style={[styles.pageList, rtlPaging && styles.pageListRtl]}
          contentContainerStyle={styles.pageListContent}
          ListEmptyComponent={
            loadingSurah ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={colors.pine} />
                <Text style={styles.emptyText}>Loading surah...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Select a surah to begin.</Text>
              </View>
            )
          }
        />
        <Modal
          animationType="slide"
          visible={controlsVisible}
          onRequestClose={() => setControlsVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reader Settings</Text>
              <TouchableOpacity onPress={() => setControlsVisible(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              {controls}
            </ScrollView>
          </SafeAreaView>
        </Modal>
        <Modal
          animationType="slide"
          visible={noteModalVisible}
          onRequestClose={closeNoteModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verse Note</Text>
              <TouchableOpacity onPress={closeNoteModal}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              {selectedVerse ? (
                <View>
                  <Text style={styles.noteTitle}>
                    {selectedVerse.surahNameEnglish || `Surah ${selectedVerse.surahId}`}
                    {' • '}Ayah {selectedVerse.ayahNumberInSurah}
                  </Text>
                  {selectedVerse.surahNameArabic ? (
                    <Text style={styles.noteArabic}>
                      {selectedVerse.surahNameArabic}
                    </Text>
                  ) : null}
                  {selectedVerse.excerpt ? (
                    <Text style={styles.noteExcerpt} numberOfLines={6}>
                      {selectedVerse.excerpt}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.helperText}>Select a verse to add a note.</Text>
              )}
              <Text style={styles.noteLabel}>Note</Text>
              <TextInput
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="Write your reflection or reminder..."
                placeholderTextColor={colors.muted}
                style={styles.noteInput}
                multiline
              />
              <View style={styles.noteActions}>
                <TouchableOpacity
                  style={styles.noteSaveButton}
                  onPress={handleSaveVerseBookmark}
                  disabled={!selectedVerse}
                >
                  <Text style={styles.noteSaveText}>Save</Text>
                </TouchableOpacity>
                {selectedVerseBookmark ? (
                  <TouchableOpacity
                    style={styles.noteDeleteButton}
                    onPress={() => {
                      handleRemoveVerseBookmark(selectedVerseBookmark.id);
                      closeNoteModal();
                    }}
                  >
                    <Text style={styles.noteDeleteText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.tafsirSection}>
                <Text style={styles.noteLabel}>Tafsir</Text>
                {tafsirLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.pine} />
                    <Text style={styles.loadingText}>Loading tafsir...</Text>
                  </View>
                ) : tafsirText ? (
                  <View style={styles.tafsirBody}>
                    {tafsirSource ? (
                      <Text style={styles.tafsirSource}>{tafsirSource}</Text>
                    ) : null}
                    <Text style={styles.tafsirText}>{tafsirText}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.tafsirButton}
                    onPress={handleLoadTafsir}
                    disabled={!selectedVerse}
                  >
                    <Text style={styles.tafsirButtonText}>Load tafsir</Text>
                  </TouchableOpacity>
                )}
                {tafsirError ? (
                  <Text style={styles.tafsirError}>{tafsirError}</Text>
                ) : null}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </Screen>
  );
}

const createStyles = (
  colors: {
  night: string;
  muted: string;
  parchment: string;
  border: string;
  card: string;
  ink: string;
  sand: string;
  pine: string;
  gold: string;
  oasis: string;
},
  highlightColor: string,
) =>
  StyleSheet.create({
  readerLayout: {
    flex: 1,
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  readerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.night,
  },
  readerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  readerAction: {
    backgroundColor: colors.parchment,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  readerActionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.night,
  },
  pageList: {
    flex: 1,
  },
  pageListRtl: {
    transform: [{ scaleX: -1 }],
  },
  pageListContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xs,
  },
  pageRtl: {
    transform: [{ scaleX: -1 }],
  },
  pagePaper: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    marginTop: 0,
    marginBottom: 0,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  pageFrame: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.parchment,
    paddingHorizontal: spacing.xs,
    paddingTop: 2,
    paddingBottom: 2,
    backgroundColor: colors.sand,
  },
  pageEdgeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  pageEdgeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  pageHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  pageHeaderTitle: {
    fontFamily: fonts.arabicBold,
    fontSize: 18,
    color: colors.pine,
    marginHorizontal: spacing.md,
    textAlign: 'center',
  },
  bismillah: {
    fontFamily: fonts.arabicBold,
    fontSize: 22,
    color: colors.pine,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 34,
  },
  pageBody: {
    flex: 1,
    paddingBottom: 0,
  },
  pageText: {
    fontFamily: fonts.arabic,
    fontSize: 26,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 44,
  },
  ayahSpan: {
    fontFamily: fonts.arabic,
  },
  ayahSpanActive: {
    backgroundColor: highlightColor,
    borderRadius: 6,
  },
  stopMark: {
    color: colors.ink,
  },
  ayahMarker: {
    fontFamily: fonts.arabic,
    fontSize: 14,
    color: colors.pine,
    lineHeight: 22,
  },
  pageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pageFooterLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  pageNumberBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
  },
  pageNumberText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.night,
  },
  modalClose: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.pine,
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionSpacing: {
    marginBottom: spacing.md,
  },
  cardEyebrow: {
    fontFamily: fonts.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  surahTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.night,
  },
  surahSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.pine,
    marginTop: spacing.xs,
  },
  surahMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  lastReadTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.night,
  },
  lastReadMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  noteTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.night,
  },
  noteArabic: {
    fontFamily: fonts.arabic,
    fontSize: 18,
    color: colors.night,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
  },
  noteExcerpt: {
    fontFamily: fonts.arabic,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 30,
    marginTop: spacing.sm,
  },
  noteLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.lg,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.night,
    marginTop: spacing.sm,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  noteSaveButton: {
    backgroundColor: colors.pine,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  noteSaveText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.sand,
  },
  noteDeleteButton: {
    backgroundColor: colors.parchment,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  noteDeleteText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.night,
  },
  tafsirSection: {
    marginTop: spacing.lg,
  },
  tafsirBody: {
    marginTop: spacing.sm,
  },
  tafsirSource: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.pine,
    marginBottom: spacing.xs,
  },
  tafsirText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.night,
    lineHeight: 22,
  },
  tafsirButton: {
    backgroundColor: colors.parchment,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  tafsirButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.night,
  },
  tafsirError: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  surahRow: {
    paddingVertical: spacing.xs,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: spacing.xs,
  },
  selectorTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.night,
    marginTop: spacing.sm,
  },
  selectorHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  searchInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.night,
  },
  searchModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  searchModeChip: {
    backgroundColor: colors.parchment,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  searchModeChipActive: {
    backgroundColor: colors.pine,
    borderColor: colors.pine,
  },
  searchModeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.night,
  },
  searchModeTextActive: {
    color: colors.sand,
  },
  searchHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
  searchResults: {
    marginTop: spacing.md,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  searchResultInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  searchResultTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.night,
  },
  searchResultArabic: {
    fontFamily: fonts.arabic,
    fontSize: 16,
    color: colors.night,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  searchResultText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  searchResultTextArabic: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  searchResultButton: {
    backgroundColor: colors.pine,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  searchResultButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.sand,
  },
  repeatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  repeatChip: {
    backgroundColor: colors.parchment,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  repeatChipDisabled: {
    backgroundColor: colors.card,
  },
  repeatChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.night,
  },
  repeatChipTextDisabled: {
    color: colors.muted,
  },
  repeatStatus: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  repeatStatusActive: {
    color: colors.pine,
    fontFamily: fonts.bodyMedium,
  },
  helperText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  bookmarkButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pine,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  bookmarkButtonDisabled: {
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookmarkButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.sand,
  },
  bookmarkButtonTextDisabled: {
    color: colors.muted,
  },
  bookmarkList: {
    marginTop: spacing.md,
  },
  bookmarkRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  bookmarkInfo: {
    marginBottom: spacing.sm,
  },
  bookmarkTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.night,
  },
  bookmarkArabic: {
    fontFamily: fonts.arabic,
    fontSize: 18,
    color: colors.night,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  bookmarkMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  bookmarkNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.night,
    marginTop: spacing.xs,
  },
  bookmarkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bookmarkActionButton: {
    backgroundColor: colors.pine,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  bookmarkActionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.sand,
  },
  bookmarkDeleteButton: {
    backgroundColor: colors.parchment,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  bookmarkDeleteText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.night,
  },
  surahChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.parchment,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    minWidth: 90,
  },
  surahChipActive: {
    backgroundColor: colors.pine,
    borderColor: colors.pine,
  },
  selectorChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.parchment,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectorChipActive: {
    backgroundColor: colors.pine,
    borderColor: colors.pine,
  },
  surahChipNumber: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  selectorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.night,
  },
  surahChipLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.night,
    marginTop: spacing.xs,
  },
  activeText: {
    color: colors.sand,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.night,
  },
  });



