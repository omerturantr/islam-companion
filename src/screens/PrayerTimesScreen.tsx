import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  DEFAULT_LOCATION,
  getPrayerTimes,
  type Location as PrayerLocation,
  type PrayerTimeEntry,
} from '../data/prayerTimes';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  type NotificationSettings,
  type PrayerId,
} from '../lib/prayerNotifications';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import { formatDate, formatTime } from '../utils/format';

const NOTIFICATION_ADVANCE_MINUTES = 15;
const POST_PRAYER_NOTE_MINUTES = 1;
const POST_PRAYER_MESSAGE = 'Have you read Huwallahüllezi?';
const SCHEDULE_DAYS = 7;
const PRAYER_REMINDER_CHANNEL = 'prayer-reminders';
const PRAYER_ADHAN_CHANNEL = 'prayer-adhan';
const ADHAN_SOUND = Platform.OS === 'android' ? 'adhan' : 'adhan.wav';
const LOCATION_STORAGE_KEY = 'settings:location';

const LOCATION_ERROR = 'Unable to get your location.';
const LOCATION_DISABLED = 'Location services are disabled.';
const PERMISSION_REQUIRED = 'Enable location permission to use current location.';

type DaySchedule = {
  date: Date;
  entries: PrayerTimeEntry[];
};

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}:${String(seconds).padStart(2, '0')}`;
};

const formatCoordinates = (latitude: number, longitude: number) =>
  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

const buildSchedule = (
  startDate: Date,
  days: number,
  location: PrayerLocation,
): DaySchedule[] => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const schedule: DaySchedule[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const { entries } = getPrayerTimes(date, location);
    schedule.push({ date, entries });
  }

  return schedule;
};

const schedulePrayerNotifications = async (
  days: DaySchedule[],
  settings: NotificationSettings,
  accentColor: string,
) => {
  if (days.length === 0) {
    return;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      PRAYER_REMINDER_CHANNEL,
      {
        name: 'Prayer Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: accentColor,
        sound: 'default',
      },
    );
    await Notifications.setNotificationChannelAsync(
      PRAYER_ADHAN_CHANNEL,
      {
        name: 'Prayer Adhan',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 400, 300, 400],
        lightColor: accentColor,
        sound: ADHAN_SOUND,
      },
    );
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) {
    return;
  }

  const nowTimestamp = Date.now();
  const advanceMinutes =
    settings.advanceMinutes || NOTIFICATION_ADVANCE_MINUTES;

  days.forEach((day) => {
    day.entries.forEach((entry) => {
      const prayerId = entry.id as PrayerId;
      if (!settings.prayers[prayerId]) {
        return;
      }

      const triggerDate = new Date(
        entry.time.getTime() - advanceMinutes * 60 * 1000,
      );
      if (triggerDate.getTime() <= nowTimestamp) {
        return;
      }

      Notifications.scheduleNotificationAsync({
        content: {
          title: `${entry.label} in ${advanceMinutes} minutes`,
          body: `Time for ${entry.label} at ${formatTime(entry.time)}.`,
          sound: 'default',
          channelId: PRAYER_REMINDER_CHANNEL,
        },
        trigger: triggerDate,
      }).catch(() => undefined);

      if (entry.time.getTime() <= nowTimestamp) {
        return;
      }

      Notifications.scheduleNotificationAsync({
        content: {
          title: `${entry.label} time`,
          body: `It is time for ${entry.label}.`,
          sound: ADHAN_SOUND,
          channelId: PRAYER_ADHAN_CHANNEL,
        },
        trigger: entry.time,
      }).catch(() => undefined);

      if (entry.id === 'fajr' || entry.id === 'maghrib') {
        const noteTrigger = new Date(
          entry.time.getTime() + POST_PRAYER_NOTE_MINUTES * 60 * 1000,
        );
        if (noteTrigger.getTime() > nowTimestamp) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: `${entry.label} reminder`,
              body: POST_PRAYER_MESSAGE,
              sound: 'default',
              channelId: PRAYER_REMINDER_CHANNEL,
            },
            trigger: noteTrigger,
          }).catch(() => undefined);
        }
      }
    });
  });
};

export function PrayerTimesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [now, setNow] = useState(() => new Date());
  const [location, setLocation] = useState<PrayerLocation>(DEFAULT_LOCATION);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [scheduleDays, setScheduleDays] = useState<DaySchedule[]>([]);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LOCATION_STORAGE_KEY)
      .then((value) => {
        if (!value) {
          return;
        }
        const parsed = JSON.parse(value) as PrayerLocation;
        if (
          typeof parsed.latitude === 'number' &&
          typeof parsed.longitude === 'number'
        ) {
          setLocation(parsed);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location)).catch(
      () => undefined,
    );
  }, [location]);

  useEffect(() => {
    loadNotificationSettings()
      .then((settings) => setNotificationSettings(settings))
      .catch(() => undefined);
  }, []);

  const refreshSchedule = useCallback(() => {
    setScheduleDays(buildSchedule(new Date(), SCHEDULE_DAYS, location));
  }, [location]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadNotificationSettings()
        .then((settings) => {
          if (active) {
            setNotificationSettings(settings);
          }
        })
        .catch(() => undefined);
      refreshSchedule();
      return () => {
        active = false;
      };
    }, [refreshSchedule]),
  );

  useEffect(() => {
    refreshSchedule();
  }, [refreshSchedule]);

  useEffect(() => {
    if (scheduleDays.length === 0) {
      return;
    }
    schedulePrayerNotifications(
      scheduleDays,
      notificationSettings,
      colors.pine,
    ).catch(() => undefined);
  }, [scheduleDays, notificationSettings, colors.pine]);

  const { entries, next, methodLabel, madhhabLabel } = useMemo(
    () => getPrayerTimes(now, location),
    [now, location],
  );

  const nextEntryId = useMemo(() => {
    if (!next) {
      return null;
    }
    const match = entries.find((entry) => entry.label === next.label);
    return match?.id ?? null;
  }, [entries, next]);

  const countdown = next
    ? formatCountdown(next.time.getTime() - now.getTime())
    : '--:--:--';

  const locationLabel = location.name || formatCoordinates(location.latitude, location.longitude);
  const locationDetails = formatCoordinates(location.latitude, location.longitude);
  const subtitle = `${locationLabel} - ${formatDate(now)}`;

  const detectLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationError(LOCATION_DISABLED);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(PERMISSION_REQUIRED);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const fallbackName = formatCoordinates(
        current.coords.latitude,
        current.coords.longitude,
      );
      let name = fallbackName;

      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        const place = results[0];
        if (place) {
          const parts = [place.city, place.region, place.country].filter(Boolean);
          if (parts.length > 0) {
            name = parts.join(', ');
          }
        }
      } catch {
        name = fallbackName;
      }

      setLocation({
        name,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch (err) {
      setLocationError(LOCATION_ERROR);
    } finally {
      setLocationLoading(false);
    }
  };

  const resetLocation = () => {
    setLocation(DEFAULT_LOCATION);
  };

  return (
    <Screen title="Prayer Times" subtitle={subtitle}>
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
        {next ? (
          <>
            <Text style={styles.nextPrayer}>{next.label}</Text>
            <Text style={styles.nextTime}>
              {formatTime(next.time)}
              {next.isTomorrow ? ' (tomorrow)' : ''}
            </Text>
            <View style={styles.countdownRow}>
              <Text style={styles.countdownLabel}>Time remaining</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.helperText}>Prayer times unavailable.</Text>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{methodLabel}</Text>
          <Text style={styles.metaDot}>|</Text>
          <Text style={styles.metaText}>{madhhabLabel}</Text>
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.cardEyebrow}>Location</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Current</Text>
          <Text style={styles.locationValue}>{locationLabel}</Text>
        </View>
        <Text style={styles.locationMeta}>{locationDetails}</Text>
        <View style={styles.locationActions}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={detectLocation}
          >
            <Text style={styles.locationButtonText}>Use current location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.locationButtonSecondary}
            onPress={resetLocation}
          >
            <Text style={styles.locationButtonSecondaryText}>Use Istanbul</Text>
          </TouchableOpacity>
        </View>
        {locationLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.pine} />
            <Text style={styles.loadingText}>Updating location...</Text>
          </View>
        ) : null}
        {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.cardEyebrow}>Today</Text>
          <View style={styles.timesList}>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.timeRow}>
                <Text
                  style={[
                    styles.timeLabel,
                    entry.time.getTime() > now.getTime() && styles.timeLabelUpcoming,
                    entry.id === nextEntryId && styles.timeLabelNext,
                  ]}
                >
                  {entry.label}
                </Text>
                <Text
                  style={[
                    styles.timeValue,
                    entry.time.getTime() > now.getTime() && styles.timeValueUpcoming,
                    entry.id === nextEntryId && styles.timeValueNext,
                  ]}
                >
                  {formatTime(entry.time)}
                </Text>
              </View>
          ))}
        </View>
      </SurfaceCard>
    </Screen>
  );
}

const createStyles = (colors: {
  muted: string;
  night: string;
  pine: string;
  border: string;
  parchment: string;
  card: string;
  sand: string;
}) =>
  StyleSheet.create({
    cardSpacing: {
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
  nextPrayerLabel: {
    fontFamily: fonts.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontSize: 14,
    color: colors.night,
    marginBottom: spacing.sm,
  },
  nextPrayer: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: colors.night,
  },
  nextTime: {
    fontFamily: fonts.bodyMedium,
    fontSize: 24,
    color: colors.pine,
    marginTop: spacing.xs,
  },
    countdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    countdownLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    countdownValue: {
      fontFamily: fonts.displayBold,
      fontSize: 18,
      color: colors.night,
      marginLeft: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    metaText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
    },
    metaDot: {
      marginHorizontal: spacing.sm,
      color: colors.muted,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    locationLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 15,
      color: colors.night,
    },
    locationValue: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.pine,
      maxWidth: '65%',
      textAlign: 'right',
    },
    locationMeta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    locationActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.sm,
    },
    locationButton: {
      backgroundColor: colors.pine,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    locationButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.sand,
    },
    locationButtonSecondary: {
      backgroundColor: colors.parchment,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    locationButtonSecondaryText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.night,
    },
    timesList: {
      marginTop: spacing.sm,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  timeLabel: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.night,
  },
  timeLabelUpcoming: {
    fontFamily: fonts.bodyMedium,
    color: colors.pine,
  },
  timeLabelNext: {
    fontSize: 20,
    fontFamily: fonts.bodyMedium,
  },
  timeValue: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.night,
  },
  timeValueUpcoming: {
    fontFamily: fonts.bodyMedium,
    color: colors.pine,
  },
  timeValueNext: {
    fontSize: 20,
    fontFamily: fonts.bodyMedium,
  },
    helperText: {
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
    errorText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.night,
      marginTop: spacing.sm,
    },
  });
