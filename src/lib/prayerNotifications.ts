import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrayerId =
  | 'fajr'
  | 'sunrise'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha';

export type NotificationSettings = {
  enabled: boolean;
  advanceMinutes: number;
  prayers: Record<PrayerId, boolean>;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  advanceMinutes: 15,
  prayers: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
};

const STORAGE_KEY = 'settings:prayerNotifications';

const clampAdvanceMinutes = (value: number) => {
  if (Number.isNaN(value)) {
    return DEFAULT_NOTIFICATION_SETTINGS.advanceMinutes;
  }
  return Math.min(60, Math.max(5, Math.round(value)));
};

const normalizeSettings = (
  raw: Partial<NotificationSettings> | null,
): NotificationSettings => {
  if (!raw) {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  const prayers = {
    ...DEFAULT_NOTIFICATION_SETTINGS.prayers,
    ...(raw.prayers ?? {}),
  };

  return {
    enabled: raw.enabled ?? DEFAULT_NOTIFICATION_SETTINGS.enabled,
    advanceMinutes: clampAdvanceMinutes(
      raw.advanceMinutes ?? DEFAULT_NOTIFICATION_SETTINGS.advanceMinutes,
    ),
    prayers,
  };
};

export const loadNotificationSettings = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
  try {
    const parsed = JSON.parse(raw) as NotificationSettings;
    return normalizeSettings(parsed);
  } catch (err) {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const saveNotificationSettings = async (settings: NotificationSettings) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
