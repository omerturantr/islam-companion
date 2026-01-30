import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { PrayerTimesScreen } from '../screens/PrayerTimesScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { QuranScreen } from '../screens/QuranScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { QiblaScreen } from '../screens/QiblaScreen';
import { DuasScreen } from '../screens/DuasScreen';
import { ZakatScreen } from '../screens/ZakatScreen';
import { TasbihScreen } from '../screens/TasbihScreen';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/theme';
import { useLanguage } from '../i18n/LanguageProvider';

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
};

const LIVE_QURAN_STREAM_URL = 'http://philae.shoutca.st:8222/Quran';

function EmptyScreen() {
  return null;
}

export function AppTabs() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);
  const [liveStreaming, setLiveStreaming] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const liveSoundRef = useRef<Audio.Sound | null>(null);
  const swipeStartY = useRef(0);
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.card,
      borderTopColor: colors.border,
    }),
    [colors],
  );
  const liveLabel = liveStreaming
    ? t('app_live_quran_stop')
    : t('app_live_quran');

  useEffect(() => {
    return () => {
      if (liveSoundRef.current) {
        liveSoundRef.current.unloadAsync().catch(() => undefined);
        liveSoundRef.current = null;
      }
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !moreOpen && gesture.dy < -12 && Math.abs(gesture.dx) < 20,
      onPanResponderGrant: (_, gesture) => {
        swipeStartY.current = gesture.moveY;
      },
      onPanResponderMove: (_, gesture) => {
        if (moreOpen) {
          return;
        }
        if (swipeStartY.current - gesture.moveY > 24) {
          setMoreOpen(true);
        }
      },
      onPanResponderRelease: () => {
        swipeStartY.current = 0;
      },
      onPanResponderTerminate: () => {
        swipeStartY.current = 0;
      },
    }),
  ).current;

  const toggleLiveQuran = async () => {
    if (liveLoading) {
      return;
    }
    setLiveLoading(true);
    try {
      if (liveSoundRef.current) {
        await liveSoundRef.current.stopAsync().catch(() => undefined);
        await liveSoundRef.current.unloadAsync().catch(() => undefined);
        liveSoundRef.current = null;
        setLiveStreaming(false);
        return;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: LIVE_QURAN_STREAM_URL },
        { shouldPlay: true, isLooping: false },
      );
      liveSoundRef.current = sound;
      setLiveStreaming(true);
    } catch (error) {
      if (liveSoundRef.current) {
        await liveSoundRef.current.unloadAsync().catch(() => undefined);
        liveSoundRef.current = null;
      }
      setLiveStreaming(false);
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
        <Tab.Screen
          name="Prayer"
          component={PrayerTimesScreen}
          options={{ tabBarLabel: t('app_prayer_times') }}
        />
        <Tab.Screen
          name="Quran"
          component={QuranScreen}
          options={{ tabBarLabel: t('app_quran') }}
        />
        <Tab.Screen
          name="Notes"
          component={NotesScreen}
          options={{ tabBarLabel: t('app_notes') }}
        />
        <Tab.Screen
          name="Qibla"
          component={QiblaScreen}
          options={{ tabBarLabel: t('app_qibla') }}
        />
        <Tab.Screen
          name="Duas"
          component={DuasScreen}
          options={{ tabBarLabel: t('app_duas') }}
        />
        <Tab.Screen
          name="More"
          component={EmptyScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="menu-outline" color={color} size={size + 2} />
            ),
            tabBarButton: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="More tabs"
                onPress={() => setMoreOpen((prev) => !prev)}
                style={styles.moreButton}
              >
                <Ionicons name="menu-outline" color={colors.night} size={26} />
              </Pressable>
            ),
          }}
        />
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            tabBarLabel: t('app_calendar'),
            tabBarButton: () => null,
            tabBarItemStyle: styles.hiddenTabItem,
          }}
        />
        <Tab.Screen
          name="Zakat"
          component={ZakatScreen}
          options={{
            tabBarLabel: t('app_zakat'),
            tabBarButton: () => null,
            tabBarItemStyle: styles.hiddenTabItem,
          }}
        />
        <Tab.Screen
          name="Tasbih"
          component={TasbihScreen}
          options={{
            tabBarLabel: t('app_tasbih'),
            tabBarButton: () => null,
            tabBarItemStyle: styles.hiddenTabItem,
          }}
        />
      </Tab.Navigator>
      <Modal
        animationType="fade"
        transparent
        visible={moreOpen}
        presentationStyle="overFullScreen"
        onRequestClose={() => setMoreOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMoreOpen(false)}>
          <BlurView intensity={25} tint="dark" style={styles.blurBackground} />
          <Pressable
            style={[
              styles.moreMenu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                marginBottom: insets.bottom + 64,
              },
            ]}
            onPress={() => undefined}
          >
            <Pressable
              style={styles.moreItem}
              onPress={toggleLiveQuran}
              accessibilityRole="button"
              accessibilityLabel={liveLabel}
              disabled={liveLoading}
            >
              <Ionicons
                name={liveStreaming ? 'pause-circle-outline' : 'radio-outline'}
                color={colors.night}
                size={24}
              />
              <Text style={[styles.moreLabel, { color: colors.night }]}>
                {liveLabel}
              </Text>
            </Pressable>
            <Pressable
              style={styles.moreItem}
              onPress={() => {
                setMoreOpen(false);
                navigation.navigate('Calendar');
              }}
            >
              <Ionicons name="calendar-outline" color={colors.night} size={22} />
              <Text style={[styles.moreLabel, { color: colors.night }]}>
                {t('app_calendar')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.moreItem}
              onPress={() => {
                setMoreOpen(false);
                navigation.navigate('Zakat');
              }}
            >
              <Ionicons name="calculator-outline" color={colors.night} size={22} />
              <Text style={[styles.moreLabel, { color: colors.night }]}>
                {t('app_zakat')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.moreItem}
              onPress={() => {
                setMoreOpen(false);
                navigation.navigate('Tasbih');
              }}
            >
              <Ionicons name="infinite-outline" color={colors.night} size={22} />
              <Text style={[styles.moreLabel, { color: colors.night }]}>
                {t('app_tasbih')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <View
        style={styles.swipeHandle}
        pointerEvents="box-only"
        {...panResponder.panHandlers}
      >
        <View style={styles.swipePill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  swipeHandle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipePill: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  hiddenTabItem: {
    display: 'none',
  },
  moreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  moreMenu: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  moreItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 6,
  },
  moreLabel: {
    marginTop: 4,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
});
