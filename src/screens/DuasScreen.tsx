import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import { duas } from '../data/duas';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';

export function DuasScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen title="Duas" subtitle="Daily remembrances">
      {duas.map((dua) => (
        <SurfaceCard key={dua.id} style={styles.cardSpacing}>
          <Text style={styles.duaTitle}>{dua.title}</Text>
          <Text style={styles.duaArabic}>{dua.arabic}</Text>
          <Text style={styles.duaTranslation}>{dua.translation}</Text>
          {dua.source ? (
            <Text style={styles.duaSource}>Source: {dua.source}</Text>
          ) : null}
        </SurfaceCard>
      ))}
    </Screen>
  );
}

const createStyles = (colors: {
  night: string;
  muted: string;
  pine: string;
}) =>
  StyleSheet.create({
    cardSpacing: {
      marginBottom: spacing.md,
    },
    duaTitle: {
      fontFamily: fonts.displayBold,
      fontSize: 22,
      color: colors.night,
    },
    duaArabic: {
      fontFamily: fonts.arabic,
      fontSize: 20,
      color: colors.night,
      textAlign: 'right',
      writingDirection: 'rtl',
      lineHeight: 32,
      marginTop: spacing.sm,
    },
    duaTranslation: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.muted,
      marginTop: spacing.sm,
      lineHeight: 22,
    },
    duaSource: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.pine,
      marginTop: spacing.sm,
    },
  });
