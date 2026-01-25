import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors } from './palette';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const STORAGE_KEY = 'settings:theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(
    systemScheme === 'dark' ? 'dark' : 'light',
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        } else if (systemScheme === 'dark') {
          setModeState('dark');
        }
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, [systemScheme]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => undefined);
  }, [mode, hydrated]);

  const value = useMemo<ThemeContextValue>(() => {
    const colors = mode === 'dark' ? darkColors : lightColors;
    return {
      mode,
      colors,
      setMode: setModeState,
      toggleMode: () =>
        setModeState((current) => (current === 'dark' ? 'light' : 'dark')),
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const useThemeColors = () => useTheme().colors;
