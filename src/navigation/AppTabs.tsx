import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PrayerTimesScreen } from '../screens/PrayerTimesScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { QuranScreen } from '../screens/QuranScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { QiblaScreen } from '../screens/QiblaScreen';
import { DuasScreen } from '../screens/DuasScreen';
import { ZakatScreen } from '../screens/ZakatScreen';
import { TasbihScreen } from '../screens/TasbihScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';

const Tab = createBottomTabNavigator();

const iconForRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
  Prayer: 'time-outline',
  Calendar: 'calendar-outline',
  Quran: 'book-outline',
  Notes: 'document-text-outline',
  Qibla: 'compass-outline',
  Duas: 'heart-outline',
  Zakat: 'calculator-outline',
  Tasbih: 'infinite-outline',
  Settings: 'settings-outline',
};

export function AppTabs() {
  const { colors } = useTheme();
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.card,
      borderTopColor: colors.border,
    }),
    [colors],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={iconForRoute[route.name] ?? 'apps-outline'}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: colors.night,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle,
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen name="Prayer" component={PrayerTimesScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Quran" component={QuranScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Qibla" component={QiblaScreen} />
      <Tab.Screen name="Duas" component={DuasScreen} />
      <Tab.Screen name="Zakat" component={ZakatScreen} />
      <Tab.Screen name="Tasbih" component={TasbihScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
