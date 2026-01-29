import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SurfaceCard } from './SurfaceCard';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import { useLanguage } from '../i18n/LanguageProvider';
import { getDailyWisdom, type DailyWisdom } from '../data/dailyWisdom';

const STORAGE_KEY = 'dailyWisdom:lastShown';

const todayKey = () => new Date().toISOString().slice(0, 10);

type DailyWisdomModalProps = {
  enabled?: boolean;
};

export function DailyWisdomModal({ enabled = true }: DailyWisdomModalProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const [wisdom, setWisdom] = useState<DailyWisdom | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    const load = async () => {
      const key = todayKey();
      const lastShown = await AsyncStorage.getItem(STORAGE_KEY);
      if (lastShown === key) {
        return;
      }
      const daily = getDailyWisdom(new Date());
      if (!active) {
        return;
      }
      setWisdom(daily);
      setVisible(true);
      await AsyncStorage.setItem(STORAGE_KEY, key);
    };
    load().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [enabled]);

  if (!wisdom) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
        <Pressable onPress={() => undefined}>
          <SurfaceCard style={styles.card}>
            <Text style={styles.title}>{t('daily_wisdom_title')}</Text>
            <Text style={styles.subtitle}>{t('daily_wisdom_subtitle')}</Text>
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('daily_wisdom_verse')}</Text>
                <Text style={styles.bodyText}>{wisdom.verse.text}</Text>
                <Text style={styles.referenceText}>{wisdom.verse.reference}</Text>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('daily_wisdom_hadith')}</Text>
                <Text style={styles.bodyText}>{wisdom.hadith.text}</Text>
                <Text style={styles.referenceText}>{wisdom.hadith.reference}</Text>
              </View>
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeLabel}>{t('daily_wisdom_close')}</Text>
            </Pressable>
          </SurfaceCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: {
  night: string;
  muted: string;
  pine: string;
  border: string;
  sand: string;
  card: string;
}) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    card: {
      maxHeight: '80%',
    },
    title: {
      fontFamily: fonts.displayBold,
      fontSize: 22,
      color: colors.night,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    content: {
      paddingBottom: spacing.md,
    },
    section: {
      marginBottom: spacing.md,
    },
    sectionLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      color: colors.muted,
      marginBottom: spacing.xs,
    },
    bodyText: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.night,
      lineHeight: 22,
    },
    referenceText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.pine,
      marginTop: spacing.xs,
    },
    closeButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.pine,
      borderRadius: 12,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    closeLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.sand,
    },
  });
