import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
  type PrayerId,
} from '../lib/prayerNotifications';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';

const PRAYER_LABELS: Record<PrayerId, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    loadNotificationSettings()
      .then((stored) => {
        setSettings(stored);
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }
    saveNotificationSettings(settings).catch(() => undefined);
  }, [settings, settingsLoaded]);

  const toggleNotification = (key: PrayerId) => {
    setSettings((current) => ({
      ...current,
      prayers: {
        ...current.prayers,
        [key]: !current.prayers[key],
      },
    }));
  };

  const toggleEnabled = () => {
    setSettings((current) => ({
      ...current,
      enabled: !current.enabled,
    }));
  };

  const adjustAdvance = (delta: number) => {
    setSettings((current) => {
      const nextValue = Math.min(60, Math.max(5, current.advanceMinutes + delta));
      return {
        ...current,
        advanceMinutes: nextValue,
      };
    });
  };

  const canDecrease = settings.advanceMinutes > 5;
  const canIncrease = settings.advanceMinutes < 60;
  const isDark = mode === 'dark';
  const toggleTheme = () => setMode(isDark ? 'light' : 'dark');

  return (
    <Screen title="Settings" subtitle="Preferences and reminders">
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Prayer Method</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.labelText}>Calculation</Text>
          <Text style={styles.valueText}>Diyanet (Turkey)</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.labelText}>Madhhab</Text>
          <Text style={styles.valueText}>Hanafi</Text>
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionHelper}>
          Schedule reminders and adhan at prayer times.
        </Text>
        <View style={styles.rowBetween}>
          <Text style={styles.labelText}>Enable notifications</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.oasis }}
            thumbColor={settings.enabled ? colors.pine : colors.parchment}
            onValueChange={toggleEnabled}
            value={settings.enabled}
          />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.labelText}>Lead time</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[
                styles.stepperButton,
                (!canDecrease || !settings.enabled) && styles.stepperButtonDisabled,
              ]}
              onPress={() => adjustAdvance(-5)}
              disabled={!canDecrease || !settings.enabled}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{settings.advanceMinutes} min</Text>
            <TouchableOpacity
              style={[
                styles.stepperButton,
                (!canIncrease || !settings.enabled) && styles.stepperButtonDisabled,
              ]}
              onPress={() => adjustAdvance(5)}
              disabled={!canIncrease || !settings.enabled}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        {(Object.keys(PRAYER_LABELS) as PrayerId[]).map((key) => (
          <View key={key} style={styles.rowBetween}>
            <Text style={styles.labelText}>{PRAYER_LABELS[key]}</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.oasis }}
              thumbColor={settings.prayers[key] ? colors.pine : colors.parchment}
              onValueChange={() => toggleNotification(key)}
              value={settings.prayers[key]}
              disabled={!settings.enabled}
            />
          </View>
        ))}
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.labelText}>Dark mode</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.oasis }}
            thumbColor={isDark ? colors.pine : colors.parchment}
            onValueChange={toggleTheme}
            value={isDark}
          />
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Reading</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.labelText}>Translation</Text>
          <Text style={styles.valueText}>English (Sahih International)</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.labelText}>Font size</Text>
          <Text style={styles.valueText}>Medium</Text>
        </View>
      </SurfaceCard>
    </Screen>
  );
}

const createStyles = (colors: {
  night: string;
  muted: string;
  border: string;
  parchment: string;
  card: string;
  pine: string;
  oasis: string;
}) =>
  StyleSheet.create({
    cardSpacing: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      color: colors.night,
      marginBottom: spacing.sm,
    },
    sectionHelper: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginBottom: spacing.sm,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepperButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.parchment,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperButtonDisabled: {
      backgroundColor: colors.card,
    },
    stepperButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 16,
      color: colors.night,
    },
    stepperValue: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.pine,
      marginHorizontal: spacing.sm,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    labelText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 15,
      color: colors.night,
    },
    valueText: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.pine,
    },
  });
