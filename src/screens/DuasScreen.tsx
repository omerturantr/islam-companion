import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import { duas } from '../data/duas';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import { useLanguage } from '../i18n/LanguageProvider';

export function DuasScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const filteredDuas = useMemo(() => {
    if (!normalizedQuery) {
      return duas;
    }
    return duas.filter((dua) => {
      const haystack = [
        dua.title,
        dua.translation,
        dua.arabic,
        dua.source ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  return (
    <Screen title={t('app_duas')} subtitle={t('tabs_duas')}>
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.searchLabel}>{t('duas_search')}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('duas_search_placeholder')}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        <Text style={styles.searchHint}>
          {filteredDuas.length}{' '}
          {filteredDuas.length === 1
            ? t('duas_result_singular')
            : t('duas_result_plural')}
        </Text>
      </SurfaceCard>

      <View>
        {filteredDuas.map((dua) => (
          <SurfaceCard key={dua.id} style={styles.cardSpacing}>
            <Text style={styles.duaTitle}>{dua.title}</Text>
            <Text style={styles.duaArabic}>{dua.arabic}</Text>
            <Text style={styles.duaTranslation}>{dua.translation}</Text>
            {dua.source ? (
              <Text style={styles.duaSource}>Source: {dua.source}</Text>
            ) : null}
          </SurfaceCard>
        ))}
        {filteredDuas.length === 0 ? (
          <Text style={styles.emptyText}>{t('duas_no_results')}</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const createStyles = (colors: {
  night: string;
  muted: string;
  pine: string;
  border: string;
  card: string;
}) =>
  StyleSheet.create({
    cardSpacing: {
      marginBottom: spacing.md,
    },
    searchLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.muted,
      marginBottom: spacing.xs,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.night,
    },
    searchHint: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
      marginTop: spacing.xs,
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
    emptyText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.muted,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  });
