import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';

type ScreenProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  headerVisible?: boolean;
  contentPadding?: number;
};

export function Screen({
  title,
  subtitle,
  children,
  scrollable = true,
  headerVisible = true,
  contentPadding = spacing.lg,
}: ScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const orbOneAnim = useRef(new Animated.Value(0)).current;
  const orbTwoAnim = useRef(new Animated.Value(0)).current;
  const orbThreeAnim = useRef(new Animated.Value(0)).current;
  const orbFourAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbOneAnim, {
            toValue: 1,
            duration: 14000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbOneAnim, {
            toValue: 0,
            duration: 14000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbTwoAnim, {
            toValue: 1,
            duration: 18000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbTwoAnim, {
            toValue: 0,
            duration: 18000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbThreeAnim, {
            toValue: 1,
            duration: 16000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbThreeAnim, {
            toValue: 0,
            duration: 16000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbFourAnim, {
            toValue: 1,
            duration: 19000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orbFourAnim, {
            toValue: 0,
            duration: 19000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ];

    loops.forEach((loop) => loop.start());
    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [orbOneAnim, orbTwoAnim, orbThreeAnim, orbFourAnim]);

  const orbOneStyle = {
    transform: [
      {
        translateX: orbOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 36],
        }),
      },
      {
        translateY: orbOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -28],
        }),
      },
      {
        scale: orbOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.18],
        }),
      },
    ],
    opacity: orbOneAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.24, 0.4],
    }),
  };

  const orbTwoStyle = {
    transform: [
      {
        translateX: orbTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -30],
        }),
      },
      {
        translateY: orbTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 26],
        }),
      },
      {
        scale: orbTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.14],
        }),
      },
    ],
    opacity: orbTwoAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 0.34],
    }),
  };

  const orbThreeStyle = {
    transform: [
      {
        translateX: orbThreeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
      },
      {
        translateY: orbThreeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -24],
        }),
      },
      {
        scale: orbThreeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.26],
        }),
      },
    ],
    opacity: orbThreeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.26, 0.42],
    }),
  };

  const orbFourStyle = {
    transform: [
      {
        translateX: orbFourAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -28],
        }),
      },
      {
        translateY: orbFourAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 32],
        }),
      },
      {
        scale: orbFourAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.18],
        }),
      },
    ],
    opacity: orbFourAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.18, 0.32],
    }),
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.background} pointerEvents="none">
        <Animated.View style={[styles.orb, styles.orbOne, orbOneStyle]} />
        <Animated.View style={[styles.orb, styles.orbTwo, orbTwoStyle]} />
        <Animated.View style={[styles.orb, styles.orbThree, orbThreeStyle]} />
        <Animated.View style={[styles.orb, styles.orbFour, orbFourStyle]} />
      </View>
      <View style={[styles.content, { paddingHorizontal: contentPadding }]}>
        {headerVisible ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        ) : null}
        {scrollable ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.scrollContent, styles.fillContent]}>
            {children}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: {
  sand: string;
  oasis: string;
  gold: string;
  pine: string;
  night: string;
  muted: string;
}) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.sand,
    },
    background: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.sand,
    },
    orb: {
      position: 'absolute',
      borderRadius: 999,
    },
    orbOne: {
      width: 240,
      height: 240,
      backgroundColor: colors.oasis,
      top: -60,
      right: -80,
    },
    orbTwo: {
      width: 200,
      height: 200,
      backgroundColor: colors.gold,
      bottom: -80,
      left: -60,
    },
    orbThree: {
      width: 120,
      height: 120,
      backgroundColor: colors.pine,
      top: 160,
      left: 20,
    },
    orbFour: {
      width: 180,
      height: 180,
      backgroundColor: colors.gold,
      bottom: 120,
      right: -60,
    },
    content: {
      flex: 1,
    },
    header: {
      paddingTop: spacing.lg + spacing.sm,
      paddingBottom: spacing.sm,
    },
    title: {
      fontFamily: fonts.displayBold,
      fontSize: 30,
      color: colors.night,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
    },
    fillContent: {
      flex: 1,
    },
  });
