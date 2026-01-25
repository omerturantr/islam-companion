import AsyncStorage from '@react-native-async-storage/async-storage';

export type ZakatAssets = {
  cash: number;
  bank: number;
  gold: number;
  silver: number;
  investments: number;
  receivables: number;
  businessInventory: number;
  other: number;
};

export type ZakatLiabilities = {
  debts: number;
  expenses: number;
  other: number;
};

export type ZakatProfile = {
  id: string;
  name: string;
  currency: string;
  nisab: number;
  assets: ZakatAssets;
  liabilities: ZakatLiabilities;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'zakat:profiles';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const numberValue = (value: unknown) => (isNumber(value) ? value : 0);

const normalizeAssets = (raw: unknown): ZakatAssets => {
  const record = raw && typeof raw === 'object' ? (raw as Partial<ZakatAssets>) : {};
  return {
    cash: numberValue(record.cash),
    bank: numberValue(record.bank),
    gold: numberValue(record.gold),
    silver: numberValue(record.silver),
    investments: numberValue(record.investments),
    receivables: numberValue(record.receivables),
    businessInventory: numberValue(record.businessInventory),
    other: numberValue(record.other),
  };
};

const normalizeLiabilities = (raw: unknown): ZakatLiabilities => {
  const record =
    raw && typeof raw === 'object' ? (raw as Partial<ZakatLiabilities>) : {};
  return {
    debts: numberValue(record.debts),
    expenses: numberValue(record.expenses),
    other: numberValue(record.other),
  };
};

const normalizeProfile = (raw: unknown): ZakatProfile | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Partial<ZakatProfile>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string') {
    return null;
  }
  const createdAt =
    typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString();
  const updatedAt =
    typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString();
  return {
    id: record.id,
    name: record.name,
    currency: record.currency ?? '',
    nisab: numberValue(record.nisab),
    assets: normalizeAssets(record.assets),
    liabilities: normalizeLiabilities(record.liabilities),
    createdAt,
    updatedAt,
  };
};

export const loadZakatProfiles = async (): Promise<ZakatProfile[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => normalizeProfile(item))
      .filter((item): item is ZakatProfile => Boolean(item));
  } catch {
    return [];
  }
};

export const saveZakatProfiles = async (profiles: ZakatProfile[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};
