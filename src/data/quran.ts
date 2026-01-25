const API_BASE = 'https://api.alquran.cloud/v1';

type ApiResponse<T> = {
  data: T;
};

type ApiSurahMeta = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

type ApiAyah = {
  number: number;
  numberInSurah: number;
  text: string;
  page?: number;
};

type ApiSurah = ApiSurahMeta & {
  ayahs: ApiAyah[];
};

export type SurahMeta = {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  translationEnglish: string;
  ayahCount: number;
  revelationType: string;
};

export type Ayah = {
  number: number;
  numberInSurah: number;
  textArabic: string;
  textTranslation: string;
  page?: number;
};

export type Surah = SurahMeta & {
  ayahs: Ayah[];
};

export type Reciter = {
  id: string;
  label: string;
  bitrates: number[];
  defaultBitrate: number;
};

type ApiSearchMatch = {
  number: number;
  text: string;
  numberInSurah: number;
  surah: ApiSurahMeta;
};

type ApiSearchResponse = {
  data: {
    count: number;
    matches: ApiSearchMatch[];
  };
};

export type VerseSearchMode = 'arabic' | 'english';

export type VerseSearchResult = {
  ayahNumber: number;
  ayahNumberInSurah: number;
  surahId: number;
  surahNameEnglish: string;
  surahNameArabic: string;
  text: string;
};

type TafsirSource = {
  id: string;
  label: string;
};

const TAFSIR_SOURCES: TafsirSource[] = [
  { id: 'en.jalalayn', label: 'Tafsir al-Jalalayn' },
  { id: 'en.kathir', label: 'Tafsir Ibn Kathir' },
];

export const RECITERS: Reciter[] = [
  {
    id: 'ar.alafasy',
    label: 'Mishary Alafasy',
    bitrates: [64, 128],
    defaultBitrate: 128,
  },
  {
    id: 'ar.abdulbasitmurattal',
    label: 'Abdul Basit (Murattal)',
    bitrates: [64, 128],
    defaultBitrate: 128,
  },
  {
    id: 'ar.husary',
    label: 'Mahmoud Al Husary',
    bitrates: [64, 128],
    defaultBitrate: 128,
  },
  {
    id: 'ar.minshawi',
    label: 'Minshawi',
    bitrates: [64, 128],
    defaultBitrate: 128,
  },
  {
    id: 'ar.sudais',
    label: 'Abdulrahman Al Sudais',
    bitrates: [64, 128],
    defaultBitrate: 128,
  },
  {
    id: 'ar.mahermuaiqly',
    label: 'Maher Al Muaiqly',
    bitrates: [64, 128],
    defaultBitrate: 128,
  },
];

export const DEFAULT_RECITER = RECITERS[0];

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }
  return response.json() as Promise<T>;
};

const toSurahMeta = (surah: ApiSurahMeta): SurahMeta => ({
  id: surah.number,
  nameArabic: surah.name,
  nameEnglish: surah.englishName,
  translationEnglish: surah.englishNameTranslation,
  ayahCount: surah.numberOfAyahs,
  revelationType: surah.revelationType,
});

export const fetchSurahList = async () => {
  const json = await fetchJson<ApiResponse<ApiSurahMeta[]>>(
    `${API_BASE}/surah`,
  );
  return json.data.map(toSurahMeta);
};

export const fetchSurahDetail = async (id: number): Promise<Surah> => {
  const [arabic, translation] = await Promise.all([
    fetchJson<ApiResponse<ApiSurah>>(`${API_BASE}/surah/${id}/quran-uthmani`),
    fetchJson<ApiResponse<ApiSurah>>(`${API_BASE}/surah/${id}/en.sahih`),
  ]);

  const meta = toSurahMeta(arabic.data);
  const translationByAyah = new Map(
    translation.data.ayahs.map((ayah) => [ayah.numberInSurah, ayah.text]),
  );

  const ayahs = arabic.data.ayahs.map((ayah) => ({
    number: ayah.number,
    numberInSurah: ayah.numberInSurah,
    textArabic: ayah.text,
    textTranslation: translationByAyah.get(ayah.numberInSurah) ?? '',
    page: ayah.page,
  }));

  return {
    ...meta,
    ayahs,
  };
};

export const getAyahAudioUrl = (
  ayahNumber: number,
  reciter: Reciter = DEFAULT_RECITER,
  bitrate = reciter.defaultBitrate,
) =>
  `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter.id}/${ayahNumber}.mp3`;

export const searchVerses = async (
  query: string,
  mode: VerseSearchMode = 'english',
): Promise<VerseSearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const edition = mode === 'arabic' ? 'quran-uthmani' : 'en.sahih';
  const json = await fetchJson<ApiSearchResponse>(
    `${API_BASE}/search/${encodeURIComponent(trimmed)}/all/${edition}`,
  );
  return json.data.matches.map((match) => ({
    ayahNumber: match.number,
    ayahNumberInSurah: match.numberInSurah,
    surahId: match.surah.number,
    surahNameEnglish: match.surah.englishName,
    surahNameArabic: match.surah.name,
    text: match.text,
  }));
};

export const fetchAyahTafsir = async (ayahNumber: number) => {
  let lastError: Error | null = null;
  for (const source of TAFSIR_SOURCES) {
    try {
      const json = await fetchJson<ApiResponse<ApiAyah>>(
        `${API_BASE}/ayah/${ayahNumber}/${source.id}`,
      );
      return { text: json.data.text, source: source.label };
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError ?? new Error('Tafsir unavailable');
};
