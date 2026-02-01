import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import { zikrCollections } from '../data/adhkarCollections';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import { useLanguage } from '../i18n/LanguageProvider';

export function ZikrsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen title={t('app_zikrs')} subtitle={t('tabs_zikrs')}>
      {zikrCollections.map((category) => (
        <SurfaceCard key={category.id} style={styles.cardSpacing}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <View style={styles.itemList}>
            {category.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => Linking.openURL(item.url)}
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemLink}>{t('common_open')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SurfaceCard>
      ))}
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
    categoryTitle: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      color: colors.night,
      marginBottom: spacing.sm,
    },
    itemList: {
      gap: spacing.sm,
    },
    itemRow: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemTitle: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.night,
      flex: 1,
      marginRight: spacing.sm,
    },
    itemLink: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.pine,
    },
  });
