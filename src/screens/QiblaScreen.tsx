import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import { DEFAULT_LOCATION } from '../data/prayerTimes';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import { getCardinalDirection, getQiblaBearing } from '../utils/qibla';
import { useLanguage } from '../i18n/LanguageProvider';

const HEADING_SMOOTHING = 0.12;
const HEADING_THRESHOLD = 1.2;
const HEADING_DEADBAND = 2.5;
const HEADING_THROTTLE_MS = 80;
const HEADING_ACCURACY_MAX = 25;

const normalizeHeading = (value: number) => (value % 360 + 360) % 360;
const shortestAngleDiff = (from: number, to: number) =>
  ((to - from + 540) % 360) - 180;
const smoothHeading = (current: number, target: number) => {
  const diff = shortestAngleDiff(current, target);
  return normalizeHeading(current + diff * HEADING_SMOOTHING);
};
const getDeadband = (accuracy: number | null) => {
  if (accuracy && accuracy > 0) {
    return Math.max(HEADING_DEADBAND, accuracy * 0.2);
  }
  return HEADING_DEADBAND;
};

export function QiblaScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watchPositionRef = useRef<Location.LocationSubscription | null>(null);
  const watchHeadingRef = useRef<Location.LocationSubscription | null>(null);
  const headingRef = useRef<number | null>(null);
  const lastHeadingUpdateRef = useRef(0);

  const latitude = coords?.latitude ?? DEFAULT_LOCATION.latitude;
  const longitude = coords?.longitude ?? DEFAULT_LOCATION.longitude;

  const qiblaBearing = useMemo(
    () => getQiblaBearing(latitude, longitude),
    [latitude, longitude],
  );
  const cardinal = getCardinalDirection(qiblaBearing);
  const arrowRotation = heading !== null
    ? (qiblaBearing - heading + 360) % 360
    : 0;

  const locationLabel = coords
    ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
    : `${DEFAULT_LOCATION.name} (default)`;

  const headingLabel = heading !== null ? `${Math.round(heading)} deg` : t('qibla_heading_unavailable');

  const stopTracking = () => {
    watchPositionRef.current?.remove();
    watchHeadingRef.current?.remove();
    watchPositionRef.current = null;
    watchHeadingRef.current = null;
    headingRef.current = null;
    lastHeadingUpdateRef.current = 0;
  };

  const startTracking = async () => {
    setLoading(true);
    setError(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError(t('qibla_location_disabled'));
        setLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
        setError(t('qibla_permission_required'));
        setLoading(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords(current.coords);

      stopTracking();
      watchPositionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 25,
        },
        (update) => setCoords(update.coords),
      );

      watchHeadingRef.current = await Location.watchHeadingAsync((update) => {
        const rawHeading = update.trueHeading > 0 ? update.trueHeading : update.magHeading;
        const normalized = normalizeHeading(rawHeading);
        const accuracy = typeof update.accuracy === 'number' ? update.accuracy : null;
        if (accuracy !== null && accuracy > HEADING_ACCURACY_MAX) {
          return;
        }
        const now = Date.now();
        if (now - lastHeadingUpdateRef.current < HEADING_THROTTLE_MS) {
          return;
        }

        const current = headingRef.current;
        if (current !== null) {
          const deadband = getDeadband(accuracy);
          if (Math.abs(shortestAngleDiff(current, normalized)) < deadband) {
            return;
          }
        }

        const next = current === null ? normalized : smoothHeading(current, normalized);
        if (
          current !== null &&
          Math.abs(shortestAngleDiff(current, next)) < HEADING_THRESHOLD
        ) {
          return;
        }

        headingRef.current = next;
        lastHeadingUpdateRef.current = now;
        setHeading(next);
      });
    } catch (err) {
      setError(t('qibla_location_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, []);

  return (
    <Screen title={t('app_qibla')} subtitle={t('tabs_qibla')}>
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.cardEyebrow}>{t('qibla_direction')}</Text>
        <View style={styles.directionRow}>
          <Text style={styles.bearingValue}>{Math.round(qiblaBearing)} deg</Text>
          <Text style={styles.cardinalText}>{cardinal}</Text>
        </View>
        <Text style={styles.metaText}>{t('qibla_location')}: {locationLabel}</Text>
        <Text style={styles.metaText}>{t('qibla_heading')}: {headingLabel}</Text>
        {heading === null ? (
          <Text style={styles.helperText}>{t('qibla_calibrate')}</Text>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={startTracking}>
            <Text style={styles.actionButtonText}>
              {permissionStatus === 'granted' ? t('qibla_refresh') : t('qibla_enable')}
            </Text>
          </TouchableOpacity>
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.cardEyebrow}>{t('qibla_compass')}</Text>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.pine} />
            <Text style={styles.loadingText}>{t('qibla_finding')}</Text>
          </View>
        ) : (
          <View style={styles.compassWrap}>
            <View style={styles.compassFace}>
              <Ionicons
                name="navigate"
                size={64}
                color={colors.pine}
                style={[styles.qiblaArrow, { transform: [{ rotate: `${arrowRotation}deg` }] }]}
              />
              <View style={styles.compassCenter} />
            </View>
            <Text style={styles.compassHint}>
              {t('qibla_hint')}
            </Text>
          </View>
        )}
      </SurfaceCard>
    </Screen>
  );
}

const createStyles = (colors: {
  muted: string;
  night: string;
  pine: string;
  sand: string;
  border: string;
  card: string;
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
    directionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    bearingValue: {
      fontFamily: fonts.displayBold,
      fontSize: 32,
      color: colors.night,
    },
    cardinalText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 16,
      color: colors.pine,
      marginLeft: spacing.sm,
    },
    metaText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    helperText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.sm,
    },
    errorText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.night,
      marginTop: spacing.sm,
    },
    actionRow: {
      marginTop: spacing.md,
    },
    actionButton: {
      backgroundColor: colors.pine,
      borderRadius: 12,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      alignSelf: 'flex-start',
    },
    actionButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.sand,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    loadingText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginLeft: spacing.sm,
    },
    compassWrap: {
      alignItems: 'center',
    },
    compassFace: {
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qiblaArrow: {
      position: 'absolute',
    },
    compassCenter: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.night,
    },
    compassHint: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.md,
      textAlign: 'center',
    },
  });
