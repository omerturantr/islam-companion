import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import { ISLAMIC_HOLIDAYS } from '../data/islamicHolidays';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import { useLanguage } from '../i18n/LanguageProvider';

export function IslamicHolidaysScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen title={t('app_holidays')} subtitle={t('tabs_holidays')}>
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.noteTitle}>{t('holidays_title')}</Text>
        <Text style={styles.noteText}>{t('holidays_note')}</Text>
      </SurfaceCard>

      <View>
        {ISLAMIC_HOLIDAYS.map((holiday) => (
          <SurfaceCard key={holiday.id} style={styles.cardSpacing}>
            <Text style={styles.holidayName}>{holiday.name}</Text>
            <Text style={styles.holidayDate}>{holiday.hijriDate}</Text>
            <Text style={styles.holidaySummary}>{holiday.summary}</Text>
          </SurfaceCard>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (colors: {
  night: string;
  muted: string;
  pine: string;
  card: string;
  border: string;
}) =>
  StyleSheet.create({
    cardSpacing: {
      marginBottom: spacing.md,
    },
    noteTitle: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      color: colors.night,
      marginBottom: spacing.xs,
    },
    noteText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      lineHeight: 20,
    },
    holidayName: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      color: colors.night,
    },
    holidayDate: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.pine,
      marginTop: spacing.xs,
    },
    holidaySummary: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
  });
