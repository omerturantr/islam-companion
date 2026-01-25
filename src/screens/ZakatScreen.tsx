import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  loadZakatProfiles,
  saveZakatProfiles,
  type ZakatAssets,
  type ZakatLiabilities,
  type ZakatProfile,
} from '../lib/zakat';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';

const ZAKAT_RATE = 0.025;

const ASSET_FIELDS: Array<{ key: keyof ZakatAssets; label: string }> = [
  { key: 'cash', label: 'Cash' },
  { key: 'bank', label: 'Bank balance' },
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'investments', label: 'Investments' },
  { key: 'receivables', label: 'Receivables' },
  { key: 'businessInventory', label: 'Business inventory' },
  { key: 'other', label: 'Other assets' },
];

const LIABILITY_FIELDS: Array<{ key: keyof ZakatLiabilities; label: string }> = [
  { key: 'debts', label: 'Debts due' },
  { key: 'expenses', label: 'Upcoming expenses' },
  { key: 'other', label: 'Other liabilities' },
];

const EMPTY_ASSETS: Record<keyof ZakatAssets, string> = {
  cash: '',
  bank: '',
  gold: '',
  silver: '',
  investments: '',
  receivables: '',
  businessInventory: '',
  other: '',
};

const EMPTY_LIABILITIES: Record<keyof ZakatLiabilities, string> = {
  debts: '',
  expenses: '',
  other: '',
};

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

const formatAmount = (value: number) => value.toFixed(2);

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return date.toISOString().slice(0, 10);
};

const createId = () =>
  `${Date.now()}-${Math.round(Math.random() * 1000000)}`;

export function ZakatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [profileName, setProfileName] = useState('');
  const [currency, setCurrency] = useState('');
  const [nisabInput, setNisabInput] = useState('');
  const [assetInputs, setAssetInputs] = useState(EMPTY_ASSETS);
  const [liabilityInputs, setLiabilityInputs] = useState(EMPTY_LIABILITIES);
  const [profiles, setProfiles] = useState<ZakatProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadZakatProfiles()
      .then((stored) => {
        if (active) {
          setProfiles(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const updateAssetInput = (key: keyof ZakatAssets, value: string) => {
    setAssetInputs((current) => ({
      ...current,
      [key]: sanitizeNumberInput(value),
    }));
  };

  const updateLiabilityInput = (key: keyof ZakatLiabilities, value: string) => {
    setLiabilityInputs((current) => ({
      ...current,
      [key]: sanitizeNumberInput(value),
    }));
  };

  const assetTotal = useMemo(
    () =>
      ASSET_FIELDS.reduce(
        (sum, field) => sum + parseAmount(assetInputs[field.key]),
        0,
      ),
    [assetInputs],
  );
  const liabilityTotal = useMemo(
    () =>
      LIABILITY_FIELDS.reduce(
        (sum, field) => sum + parseAmount(liabilityInputs[field.key]),
        0,
      ),
    [liabilityInputs],
  );
  const netWorth = assetTotal - liabilityTotal;
  const nisabValue = parseAmount(nisabInput);
  const zakatEligible =
    netWorth > 0 && (nisabValue <= 0 || netWorth >= nisabValue);
  const zakatDue = zakatEligible ? netWorth * ZAKAT_RATE : 0;

  const status = useMemo(() => {
    if (netWorth <= 0) {
      return { text: 'Net assets are zero or below.', tone: 'negative' as const };
    }
    if (nisabValue <= 0) {
      return {
        text: 'Set a nisab threshold to confirm eligibility.',
        tone: 'neutral' as const,
      };
    }
    if (netWorth >= nisabValue) {
      return { text: 'Above nisab. Zakat is due.', tone: 'positive' as const };
    }
    return { text: 'Below nisab. Zakat is not due.', tone: 'negative' as const };
  }, [netWorth, nisabValue]);

  const orderedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [profiles]);

  const toInputValue = (value: number) =>
    Number.isFinite(value) ? String(value) : '';

  const clearForm = () => {
    setProfileName('');
    setCurrency('');
    setNisabInput('');
    setAssetInputs(EMPTY_ASSETS);
    setLiabilityInputs(EMPTY_LIABILITIES);
    setActiveProfileId(null);
    setFormError(null);
  };

  const handleSaveProfile = () => {
    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setFormError('Add a profile name to save.');
      return;
    }
    const now = new Date().toISOString();
    const nextProfile: ZakatProfile = {
      id: activeProfileId ?? createId(),
      name: trimmedName,
      currency: currency.trim(),
      nisab: nisabValue,
      assets: {
        cash: parseAmount(assetInputs.cash),
        bank: parseAmount(assetInputs.bank),
        gold: parseAmount(assetInputs.gold),
        silver: parseAmount(assetInputs.silver),
        investments: parseAmount(assetInputs.investments),
        receivables: parseAmount(assetInputs.receivables),
        businessInventory: parseAmount(assetInputs.businessInventory),
        other: parseAmount(assetInputs.other),
      },
      liabilities: {
        debts: parseAmount(liabilityInputs.debts),
        expenses: parseAmount(liabilityInputs.expenses),
        other: parseAmount(liabilityInputs.other),
      },
      createdAt:
        profiles.find((profile) => profile.id === activeProfileId)?.createdAt ??
        now,
      updatedAt: now,
    };

    const nextProfiles = profiles.some((profile) => profile.id === nextProfile.id)
      ? profiles.map((profile) =>
          profile.id === nextProfile.id ? nextProfile : profile,
        )
      : [nextProfile, ...profiles];

    setProfiles(nextProfiles);
    setActiveProfileId(nextProfile.id);
    setFormError(null);
    saveZakatProfiles(nextProfiles).catch(() => undefined);
  };

  const handleLoadProfile = (profile: ZakatProfile) => {
    setProfileName(profile.name);
    setCurrency(profile.currency);
    setNisabInput(toInputValue(profile.nisab));
    setAssetInputs({
      cash: toInputValue(profile.assets.cash),
      bank: toInputValue(profile.assets.bank),
      gold: toInputValue(profile.assets.gold),
      silver: toInputValue(profile.assets.silver),
      investments: toInputValue(profile.assets.investments),
      receivables: toInputValue(profile.assets.receivables),
      businessInventory: toInputValue(profile.assets.businessInventory),
      other: toInputValue(profile.assets.other),
    });
    setLiabilityInputs({
      debts: toInputValue(profile.liabilities.debts),
      expenses: toInputValue(profile.liabilities.expenses),
      other: toInputValue(profile.liabilities.other),
    });
    setActiveProfileId(profile.id);
    setFormError(null);
  };

  const handleDeleteProfile = (id: string) => {
    const nextProfiles = profiles.filter((profile) => profile.id !== id);
    setProfiles(nextProfiles);
    if (activeProfileId === id) {
      clearForm();
    }
    saveZakatProfiles(nextProfiles).catch(() => undefined);
  };

  const currencyLabel = currency.trim();
  const formatCurrencyValue = (value: number) =>
    currencyLabel ? `${currencyLabel} ${formatAmount(value)}` : formatAmount(value);

  return (
    <Screen title="Zakat" subtitle="Annual giving calculator">
      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Profile</Text>
        {activeProfileId ? (
          <Text style={styles.activeProfileText}>Editing saved profile</Text>
        ) : null}
        <Text style={styles.inputLabel}>Profile name</Text>
        <TextInput
          value={profileName}
          onChangeText={(value) => {
            setProfileName(value);
            setFormError(null);
          }}
          placeholder="Family"
          placeholderTextColor={colors.muted}
          style={styles.textInput}
        />
        <View style={styles.inlineRow}>
          <View style={styles.inlineField}>
            <Text style={styles.inputLabel}>Currency</Text>
            <TextInput
              value={currency}
              onChangeText={(value) => {
                setCurrency(value);
                setFormError(null);
              }}
              placeholder="TRY"
              autoCapitalize="characters"
              placeholderTextColor={colors.muted}
              style={styles.textInput}
            />
          </View>
          <View style={[styles.inlineField, styles.inlineFieldLast]}>
            <Text style={styles.inputLabel}>Nisab</Text>
            <TextInput
              value={nisabInput}
              onChangeText={(value) => {
                setNisabInput(sanitizeNumberInput(value));
                setFormError(null);
              }}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.muted}
              style={styles.textInput}
            />
          </View>
        </View>
        <Text style={styles.helperText}>
          Enter the nisab amount in your currency (based on gold or silver).
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile}>
            <Text style={styles.primaryButtonText}>
              {activeProfileId ? 'Update profile' : 'Save profile'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={clearForm}>
            <Text style={styles.secondaryButtonText}>New</Text>
          </TouchableOpacity>
        </View>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Zakatable assets</Text>
        {ASSET_FIELDS.map((field) => (
          <View key={field.key} style={styles.amountRow}>
            <Text style={styles.amountLabel}>{field.label}</Text>
            <View style={styles.amountInputWrap}>
              {currencyLabel ? (
                <Text style={styles.currencyLabel}>{currencyLabel}</Text>
              ) : null}
              <TextInput
                value={assetInputs[field.key]}
                onChangeText={(value) => updateAssetInput(field.key, value)}
                placeholder="0"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.muted}
                style={styles.amountInput}
              />
            </View>
          </View>
        ))}
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Liabilities</Text>
        {LIABILITY_FIELDS.map((field) => (
          <View key={field.key} style={styles.amountRow}>
            <Text style={styles.amountLabel}>{field.label}</Text>
            <View style={styles.amountInputWrap}>
              {currencyLabel ? (
                <Text style={styles.currencyLabel}>{currencyLabel}</Text>
              ) : null}
              <TextInput
                value={liabilityInputs[field.key]}
                onChangeText={(value) => updateLiabilityInput(field.key, value)}
                placeholder="0"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.muted}
                style={styles.amountInput}
              />
            </View>
          </View>
        ))}
      </SurfaceCard>

      <SurfaceCard style={styles.cardSpacing}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total assets</Text>
          <Text style={styles.summaryValue}>{formatCurrencyValue(assetTotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total liabilities</Text>
          <Text style={styles.summaryValue}>
            {formatCurrencyValue(liabilityTotal)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Net assets</Text>
          <Text style={styles.summaryValue}>{formatCurrencyValue(netWorth)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Zakat due (2.5%)</Text>
          <Text style={styles.summaryValueStrong}>
            {formatCurrencyValue(zakatDue)}
          </Text>
        </View>
        <Text
          style={[
            styles.statusText,
            status.tone === 'positive' && styles.statusPositive,
            status.tone === 'negative' && styles.statusNegative,
          ]}
        >
          {status.text}
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Saved profiles</Text>
        {orderedProfiles.length > 0 ? (
          <View>
            {orderedProfiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              return (
                <View key={profile.id} style={styles.profileRow}>
                  <View style={styles.profileInfo}>
                    <Text
                      style={[
                        styles.profileName,
                        isActive && styles.profileNameActive,
                      ]}
                    >
                      {profile.name}
                    </Text>
                    <Text style={styles.profileMeta}>
                      {profile.currency || 'Currency'} - Nisab{' '}
                      {formatAmount(profile.nisab)}
                    </Text>
                    <Text style={styles.profileMeta}>
                      Updated {formatDate(profile.updatedAt)}
                    </Text>
                  </View>
                  <View style={styles.profileActions}>
                    <TouchableOpacity
                      style={styles.profileButton}
                      onPress={() => handleLoadProfile(profile)}
                    >
                      <Text style={styles.profileButtonText}>Load</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.profileDeleteButton}
                      onPress={() => handleDeleteProfile(profile.id)}
                    >
                      <Text style={styles.profileDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.helperText}>
            No profiles yet. Save a profile to reuse later.
          </Text>
        )}
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
    activeProfileText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.pine,
      marginBottom: spacing.sm,
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
    inlineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    inlineField: {
      flex: 1,
      marginRight: spacing.sm,
    },
    inlineFieldLast: {
      marginRight: 0,
    },
    helperText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.sm,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    primaryButton: {
      backgroundColor: colors.pine,
      borderRadius: 12,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
    },
    primaryButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.sand,
    },
    secondaryButton: {
      backgroundColor: colors.parchment,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    secondaryButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.night,
    },
    errorText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.night,
      marginTop: spacing.sm,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    amountLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.night,
      flex: 1,
      marginRight: spacing.sm,
    },
    amountInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      minWidth: 130,
    },
    currencyLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.muted,
      marginRight: spacing.xs,
    },
    amountInput: {
      flex: 1,
      textAlign: 'right',
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.night,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    summaryLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.night,
    },
    summaryValue: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.muted,
    },
    summaryValueStrong: {
      fontFamily: fonts.bodyMedium,
      fontSize: 15,
      color: colors.pine,
    },
    statusText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
      marginTop: spacing.sm,
    },
    statusPositive: {
      color: colors.pine,
      fontFamily: fonts.bodyMedium,
    },
    statusNegative: {
      color: colors.night,
      fontFamily: fonts.bodyMedium,
    },
    profileRow: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    profileInfo: {
      marginBottom: spacing.sm,
    },
    profileName: {
      fontFamily: fonts.bodyMedium,
      fontSize: 15,
      color: colors.night,
    },
    profileNameActive: {
      color: colors.pine,
    },
    profileMeta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    profileActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileButton: {
      backgroundColor: colors.pine,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginRight: spacing.sm,
    },
    profileButtonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.sand,
    },
    profileDeleteButton: {
      backgroundColor: colors.parchment,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    profileDeleteText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.night,
    },
  });
