import AsyncStorage from '@react-native-async-storage/async-storage';

export type DhikrItem = {
  id: string;
  name: string;
  target: number;
};

export type TasbihSettings = {
  vibrationEnabled: boolean;
  lastSelectedId: string | null;
};

export type TasbihCounts = Record<string, number>;

const CUSTOM_KEY = 'tasbih:custom';
const COUNTS_KEY = 'tasbih:counts';
const SETTINGS_KEY = 'tasbih:settings';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeItem = (raw: unknown): DhikrItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Partial<DhikrItem>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string') {
    return null;
  }
  const target = isNumber(record.target) && record.target > 0 ? record.target : 33;
  return {
    id: record.id,
    name: record.name,
    target,
  };
};

export const loadCustomDhikr = async (): Promise<DhikrItem[]> => {
  const raw = await AsyncStorage.getItem(CUSTOM_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => normalizeItem(item))
      .filter((item): item is DhikrItem => Boolean(item));
  } catch {
    return [];
  }
};

export const saveCustomDhikr = async (items: DhikrItem[]) => {
  await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(items));
};

export const loadTasbihCounts = async (): Promise<TasbihCounts> => {
  const raw = await AsyncStorage.getItem(COUNTS_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    const result: TasbihCounts = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      if (isNumber(value) && value >= 0) {
        result[key] = value;
      }
    });
    return result;
  } catch {
    return {};
  }
};

export const saveTasbihCounts = async (counts: TasbihCounts) => {
  await AsyncStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
};

export const loadTasbihSettings = async (): Promise<TasbihSettings> => {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return { vibrationEnabled: true, lastSelectedId: null };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<TasbihSettings>;
    return {
      vibrationEnabled:
        typeof parsed.vibrationEnabled === 'boolean'
          ? parsed.vibrationEnabled
          : true,
      lastSelectedId:
        typeof parsed.lastSelectedId === 'string' ? parsed.lastSelectedId : null,
    };
  } catch {
    return { vibrationEnabled: true, lastSelectedId: null };
  }
};

export const saveTasbihSettings = async (settings: TasbihSettings) => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
