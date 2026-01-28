import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
} from '@expo-google-fonts/ibm-plex-sans';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { AppTabs } from './src/navigation/AppTabs';
import { ThemeProvider, useTheme } from './src/theme/theme';
import { LanguageProvider } from './src/i18n/LanguageProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type AppShellProps = {
  fontsLoaded: boolean;
};

function AppShell({ fontsLoaded }: AppShellProps) {
  const { colors, mode } = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: mode === 'dark',
      colors: {
        ...DefaultTheme.colors,
        background: colors.sand,
        card: colors.card,
        text: colors.night,
        border: colors.border,
        primary: colors.pine,
      },
    }),
    [colors, mode],
  );

  if (!fontsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.sand }]}>
        <ActivityIndicator size="large" color={colors.pine} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={[styles.flex, { backgroundColor: colors.sand }]}
    >
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <AppTabs />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  return (
    <LanguageProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <AppShell fontsLoaded={fontsLoaded} />
        </SafeAreaProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
