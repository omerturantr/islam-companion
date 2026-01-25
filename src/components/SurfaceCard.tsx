import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/theme';

type SurfaceCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (colors: {
  card: string;
  border: string;
  ink: string;
}) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.ink,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  });
