import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  type DhikrItem,
  loadCustomDhikr,
  loadTasbihCounts,
  loadTasbihSettings,
  saveCustomDhikr,
  saveTasbihCounts,
  saveTasbihSettings,
  type TasbihCounts,
} from '../lib/tasbih';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';

const DEFAULT_DHIKR: DhikrItem[] = [
  { id: 'subhanallah', name: 'SubhanAllah', target: 33 },
  { id: 'alhamdulillah', name: 'Alhamdulillah', target: 33 },
  { id: 'allahu-akbar', name: 'Allahu Akbar', target: 34 },
  { id: 'astaghfirullah', name: 'Astaghfirullah', target: 100 },
  { id: 'la-ilaha-illallah', name: 'La ilaha illallah', target: 100 },
  { id: 'salawat', name: 'Salawat', target: 100 },
];

const DEFAULT_TARGET = 33;
const VIBRATION_DURATION = 12;

const sanitizeNumberInput = (value: string) =>
  value.replace(/[^0-9,.-]/g, '');

const parseAmount = (value: string) => {
  const normalized = sanitizeNumberInput(value).replace(/,/g, '.');
  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  return Math.max(0, numberValue);
};

const createId = () =>
  `dhikr-${Date.now()}-${Math.round(Math.random() * 1000000)}`;

export function TasbihScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [customDhikr, setCustomDhikr] = useState<DhikrItem[]>([]);
  const [counts, setCounts] = useState<TasbihCounts>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([loadCustomDhikr(), loadTasbihCounts(), loadTasbihSettings()])
      .then(([storedCustom, storedCounts, storedSettings]) => {
        if (!active) {
          return;
        }
        setCustomDhikr(storedCustom);
        setCounts(storedCounts);
        setVibrationEnabled(storedSettings.vibrationEnabled);
        setSelectedId(storedSettings.lastSelectedId);
        setSettingsLoaded(true);
      })
      .catch(() => {
        if (active) {
          setSettingsLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const allDhikr = useMemo(
    () => [...DEFAULT_DHIKR, ...customDhikr],
    [customDhikr],
  );

  useEffect(() => {
    if (allDhikr.length === 0) {
      return;
    }
    if (!selectedId || !allDhikr.some((item) => item.id === selectedId)) {
      setSelectedId(allDhikr[0].id);
    }
  }, [allDhikr, selectedId]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }
    saveTasbihSettings({ vibrationEnabled, lastSelectedId: selectedId }).catch(
      () => undefined,
    );
  }, [settingsLoaded, vibrationEnabled, selectedId]);

  const selectedDhikr =
    allDhikr.find((item) => item.id === selectedId) ?? allDhikr[0] ?? null;
  const count = selectedDhikr ? counts[selectedDhikr.id] ?? 0 : 0;
  const target = selectedDhikr?.target ?? 0;
  const cycleProgress =
    target > 0 ? (count % target || (count > 0 ? target : 0)) : count;
  const remaining = target > 0 ? Math.max(target - cycleProgress, 0) : 0;
  const cycles = target > 0 ? Math.floor(count / target) : 0;
  const progressPercent =
    target > 0 ? Math.min(cycleProgress / target, 1) : 0;

  const handleIncrement = () => {
    if (!selectedDhikr) {
      return;
    }
    const nextCount = count + 1;
    const nextCounts: TasbihCounts = {
      ...counts,
      [selectedDhikr.id]: nextCount,
    };
    setCounts(nextCounts);
    saveTasbihCounts(nextCounts).catch(() => undefined);
    if (vibrationEnabled) {
      Vibration.vibrate(VIBRATION_DURATION);
    }
  };

  const handleReset = () => {
    if (!selectedDhikr) {
      return;
    }
    const nextCounts: TasbihCounts = {
      ...counts,
      [selectedDhikr.id]: 0,
    };
    setCounts(nextCounts);
    saveTasbihCounts(nextCounts).catch(() => undefined);
  };

  const handleAddCustom = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setFormError('Enter a dhikr name to add.');
      return;
    }
    const parsedTarget = parseAmount(targetInput);
    const targetValue =
      parsedTarget > 0 ? Math.round(parsedTarget) : DEFAULT_TARGET;
    const newItem: DhikrItem = {
      id: createId(),
      name: trimmedName,
      target: targetValue,
    };
    const nextCustom = [newItem, ...customDhikr];
    setCustomDhikr(nextCustom);
    setSelectedId(newItem.id);
    setNameInput('');
    setTargetInput('');
    setFormError(null);
    saveCustomDhikr(nextCustom).catch(() => undefined);
  };

  const handleRemoveCustom = (id: string) => {
    const nextCustom = customDhikr.filter((item) => item.id !== id);
    setCustomDhikr(nextCustom);
    saveCustomDhikr(nextCustom).catch(() => undefined);
    if (selectedId === id) {
      setSelectedId(DEFAULT_DHIKR[0]?.id ?? null);
    }
    if (counts[id] !== undefined) {
      const { [id]: _, ...rest } = counts;
      setCounts(rest);
      saveTasbihCounts(rest).catch(() => undefined);
    }
  };

  return (
    <Screen title="Tasbih" subtitle="Dhikr counter and goals">
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Dhikr</Text>
        <View style={styles.chipRow}>
          {allDhikr.map((item) => {
            const isSelected = item.id === selectedDhikr?.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedId(item.id)}
              >
                <Text
                  style={[
                    styles.chipName,
                    isSelected && styles.chipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.chipTarget,
                    isSelected && styles.chipTextActive,
                  ]}
                >
                  Target {item.target}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Counter</Text>
        {selectedDhikr ? (
          <View style={styles.counterContent}>
            <Text style={styles.counterLabel}>{selectedDhikr.name}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={handleIncrement}
              activeOpacity={0.85}
            >
              <Text style={styles.counterValue}>{count}</Text>
              <Text style={styles.counterHint}>Tap to count</Text>
            </TouchableOpacity>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progressPercent * 100)}%` },
                ]}
              />
            </View>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>{target}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValue}>{remaining}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Cycles</Text>
                <Text style={styles.statValue}>{cycles}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset counter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.helperText}>Select a dhikr to begin.</Text>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Custom dhikr</Text>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          value={nameInput}
          onChangeText={(value) => {
            setNameInput(value);
            setFormError(null);
          }}
          placeholder="Example: SubhanAllah"
          placeholderTextColor={colors.muted}
          style={styles.textInput}
        />
        <Text style={styles.inputLabel}>Target</Text>
        <TextInput
          value={targetInput}
          onChangeText={(value) => {
            setTargetInput(sanitizeNumberInput(value));
            setFormError(null);
          }}
          placeholder={String(DEFAULT_TARGET)}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.muted}
          style={styles.textInput}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddCustom}>
          <Text style={styles.primaryButtonText}>Add dhikr</Text>
        </TouchableOpacity>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        {customDhikr.length > 0 ? (
          <View style={styles.customList}>
            {customDhikr.map((item) => (
              <View key={item.id} style={styles.customRow}>
                <View style={styles.customInfo}>
                  <Text style={styles.customName}>{item.name}</Text>
                  <Text style={styles.customMeta}>Target {item.target}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveCustom(item.id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>
            Add a custom dhikr to keep a personal counter.
          </Text>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Vibration</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.oasis }}
            thumbColor={vibrationEnabled ? colors.pine : colors.parchment}
            onValueChange={setVibrationEnabled}
            value={vibrationEnabled}
          />
        </View>
      </SurfaceCard>
    </Screen>
  );
}

const createStyles = (colors: {
  night: string;
  muted: string;
  border: string;
  card: string;
  pine: string;
  parchment: string;
  sand: string;
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
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    chip: {
      backgroundColor: colors.parchment,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
      minWidth: 140,
    },
    chipActive: {
      backgroundColor: colors.pine,
      borderColor: colors.pine,
    },
    chipName: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.night,
    },
    chipTarget: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    chipTextActive: {
      color: colors.sand,
    },
    counterContent: {
      alignItems: 'center',
    },
    counterLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 16,
      color: colors.muted,
      marginBottom: spacing.sm,
    },
    counterButton: {
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 2,
      borderColor: colors.pine,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.night,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    counterValue: {
      fontFamily: fonts.displayBold,
      fontSize: 48,
      color: colors.night,
    },
    counterHint: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    progressTrack: {
      width: '100%',
      height: 8,
      backgroundColor: colors.parchment,
      borderRadius: 999,
      marginTop: spacing.md,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.pine,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      width: '100%',
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
    },
    statValue: {
      fontFamily: fonts.bodyMedium,
      fontSize: 16,
      color: colors.night,
      marginTop: spacing.xs,
    },
    resetButton: {
      marginTop: spacing.md,
      backgroundColor: colors.parchment,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    resetButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.night,
    },
    inputLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    textInput: {
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
    primaryButton: {
      marginTop: spacing.md,
      backgroundColor: colors.pine,
      borderRadius: 12,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      alignSelf: 'flex-start',
    },
    primaryButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.sand,
    },
    errorText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.night,
      marginTop: spacing.sm,
    },
    customList: {
      marginTop: spacing.md,
    },
    customRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    customInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    customName: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.night,
    },
    customMeta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    removeButton: {
      backgroundColor: colors.parchment,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    removeButtonText: {
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
    preferenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    preferenceLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.night,
    },
  });
