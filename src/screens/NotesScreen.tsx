import React, { useCallback, useMemo, useState } from 'react';
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
  loadVerseBookmarks,
  saveVerseBookmarks,
  type VerseBookmark,
} from '../lib/quranReading';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';

const JUMP_STORAGE_KEY = 'quran:jumpTarget';

export function NotesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [verseBookmarks, setVerseBookmarks] = useState<VerseBookmark[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadVerseBookmarks()
        .then((list) => {
          if (active) {
            setVerseBookmarks(list);
          }
        })
        .catch(() => {
          if (active) {
            setVerseBookmarks([]);
          }
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const notes = useMemo(
    () => verseBookmarks.filter((item) => item.note.trim().length > 0),
    [verseBookmarks],
  );
  const orderedNotes = useMemo(() => {
    return [...notes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [notes]);

  const handleGoToNote = (note: VerseBookmark) => {
    const payload = {
      surahId: note.surahId,
      pageIndex: note.pageIndex,
      pageNumber: note.pageNumber ?? null,
      ayahNumberInSurah: note.ayahNumberInSurah,
    };
    AsyncStorage.setItem(JUMP_STORAGE_KEY, JSON.stringify(payload)).catch(
      () => undefined,
    );
    navigation.navigate('Quran');
  };

  const handleRemoveNote = (id: string) => {
    const next = verseBookmarks.filter((bookmark) => bookmark.id !== id);
    setVerseBookmarks(next);
    saveVerseBookmarks(next).catch(() => undefined);
  };

  return (
    <Screen title="Notes" subtitle="Your verse reflections">
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.cardEyebrow}>Saved Notes</Text>
        {orderedNotes.length > 0 ? (
          <View style={styles.noteList}>
            {orderedNotes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle}>
                    {note.surahNameEnglish || `Surah ${note.surahId}`} • Ayah{' '}
                    {note.ayahNumberInSurah}
                  </Text>
                  <TouchableOpacity
                    style={styles.noteGoButton}
                    onPress={() => handleGoToNote(note)}
                  >
                    <Text style={styles.noteGoText}>Go</Text>
                  </TouchableOpacity>
                </View>
                {note.surahNameArabic ? (
                  <Text style={styles.noteArabic}>{note.surahNameArabic}</Text>
                ) : null}
                {note.excerpt ? (
                  <Text style={styles.noteExcerpt} numberOfLines={2}>
                    {note.excerpt}
                  </Text>
                ) : null}
                <Text style={styles.noteText}>{note.note}</Text>
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    style={styles.noteRemoveButton}
                    onPress={() => handleRemoveNote(note.id)}
                  >
                    <Text style={styles.noteRemoveText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>
            No notes yet. Long-press a verse in the Quran tab to add one.
          </Text>
        )}
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
  ink: string;
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
    noteList: {
      marginTop: spacing.sm,
    },
    noteCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    noteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    noteTitle: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.night,
      flex: 1,
      marginRight: spacing.sm,
    },
    noteGoButton: {
      backgroundColor: colors.pine,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    noteGoText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.sand,
    },
    noteArabic: {
      fontFamily: fonts.arabic,
      fontSize: 18,
      color: colors.night,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginTop: spacing.xs,
    },
    noteExcerpt: {
      fontFamily: fonts.arabic,
      fontSize: 16,
      color: colors.ink,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginTop: spacing.xs,
      lineHeight: 28,
    },
    noteText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.night,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    noteActions: {
      flexDirection: 'row',
      marginTop: spacing.sm,
    },
    noteRemoveButton: {
      backgroundColor: colors.parchment,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    noteRemoveText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.night,
    },
    helperText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.sm,
    },
  });
