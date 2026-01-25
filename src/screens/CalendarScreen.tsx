import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFocusEffect,
  type NavigationProp,
  type ParamListBase,
  useNavigation,
} from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  DEFAULT_LOCATION,
  getPrayerTimes,
  type Location as PrayerLocation,
  type PrayerTimeEntry,
} from '../data/prayerTimes';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import { formatDate, formatTime } from '../utils/format';

const LOCATION_STORAGE_KEY = 'settings:location';
const DAYS_RANGE = 30;

type DaySchedule = {
  date: Date;
  entries: PrayerTimeEntry[];
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

export function CalendarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const [location, setLocation] = useState<PrayerLocation>(DEFAULT_LOCATION);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  const loadLocation = useCallback(async () => {
    const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (!stored) {
      setLocation(DEFAULT_LOCATION);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as PrayerLocation;
      if (
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number'
      ) {
        setLocation(parsed);
      } else {
        setLocation(DEFAULT_LOCATION);
      }
    } catch {
      setLocation(DEFAULT_LOCATION);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLocation().catch(() => undefined);
    }, [loadLocation]),
  );

  useEffect(() => {
    setSchedule(buildSchedule(new Date(), DAYS_RANGE, location));
  }, [location]);

  const locationLabel = location.name || formatCoordinates(location.latitude, location.longitude);
  const subtitle = `${locationLabel} - ${formatDate(new Date())}`;
  const todayKey = new Date().toDateString();

  return (
    <Screen title="Prayer Calendar" subtitle={subtitle}>
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.cardEyebrow}>Location</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Current</Text>
          <Text style={styles.locationValue}>{locationLabel}</Text>
        </View>
        <Text style={styles.locationMeta}>
          {formatCoordinates(location.latitude, location.longitude)}
        </Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => navigation.navigate('Prayer')}
        >
          <Text style={styles.locationButtonText}>Change location</Text>
        </TouchableOpacity>
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.cardEyebrow}>Next {DAYS_RANGE} Days</Text>
        <View style={styles.calendarList}>
          {schedule.map((item) => {
            const timesText = item.entries
              .map((entry) => `${entry.label} ${formatTime(entry.time)}`)
              .join(' · ');
            const isToday = item.date.toDateString() === todayKey;
            return (
              <View
                key={item.date.toISOString()}
                style={[styles.calendarRow, isToday && styles.calendarRowToday]}
              >
                <Text style={styles.calendarDate}>
                  {formatDate(item.date)}
                </Text>
                <Text style={styles.calendarTimes}>{timesText}</Text>
              </View>
            );
          })}
          {schedule.length === 0 ? (
            <Text style={styles.helperText}>Prayer schedule unavailable.</Text>
          ) : null}
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
  card: string;
  sand: string;
  parchment: string;
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
    locationButton: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      backgroundColor: colors.pine,
      borderRadius: 12,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    locationButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.sand,
    },
    calendarList: {
      marginTop: spacing.sm,
    },
    calendarRow: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    calendarRowToday: {
      backgroundColor: colors.parchment,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
    },
    calendarDate: {
      fontFamily: fonts.bodyMedium,
      fontSize: 15,
      color: colors.night,
    },
    calendarTimes: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    helperText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.sm,
    },
  });
