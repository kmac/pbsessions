import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { Provider as StoreProvider, useDispatch } from 'react-redux';
import { useColorScheme } from 'react-native';
import { SplashScreen, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { adaptNavigationTheme, Appbar, PaperProvider } from 'react-native-paper'

import { store } from '@/src/store';
import { StorageManager } from '@/src/utils/storage';
import { setPlayers } from '@/src/store/slices/playersSlice';
import { setGroups } from '@/src/store/slices/groupsSlice';
import { setSessions } from '@/src/store/slices/sessionsSlice';
import { setLiveSession } from '@/src/store/slices/liveSessionSlice';
import { setAppConfig } from '@/src/store/slices/appConfigSlice';
import { Colors, Themes } from '@/src/ui/styles';
import { StackHeader } from '@/src/components/StackHeader';
import { Setting } from '@/src/types'
import { Alert } from '@/src/utils/alert'

import { router } from 'expo-router';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function StorageLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadInitialData = async () => {
      const storage = StorageManager.getInstance();

      try {
        const [players, groups, sessions, liveSession, appConfig] = await Promise.all([
          storage.loadPlayers(),
          storage.loadGroups(),
          storage.loadSessions(),
          storage.loadLiveSession(),
          storage.loadAppConfig(),
        ]);

        dispatch(setPlayers(players));
        dispatch(setGroups(groups));
        dispatch(setSessions(sessions));
        if (liveSession) {
          dispatch(setLiveSession(liveSession));
        }
        dispatch(setAppConfig(appConfig));

      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

  }, [dispatch]);

  return null;
}

const RootLayoutNav = () => {

  // Get settings from Redux store
  const settings = useSelector((state: RootState) => state.appConfig.appConfig);

  // const colorScheme = settings.theme || 'light';
  const colorScheme = 'light';

  // Fallback to default if settings not loaded yet
  const effectiveSettings: Setting = settings || {
    theme: 'light',
    color: 'default',
  };

  const theme =
    Themes[
    effectiveSettings.theme === 'auto' ? (colorScheme ?? 'dark') : effectiveSettings.theme
    ][effectiveSettings.color]

  const { DarkTheme, LightTheme } = adaptNavigationTheme({
    reactNavigationDark: NavDarkTheme,
    reactNavigationLight: NavLightTheme,
    materialDark: Themes.dark[settings.color],
    materialLight: Themes.light[settings.color],
  })

  return (
    <ThemeProvider
      value={
        colorScheme === 'light'
          ? { ...LightTheme, fonts: NavLightTheme.fonts }
          : { ...DarkTheme, fonts: NavDarkTheme.fonts }
      }
    >
      <PaperProvider theme={theme}>

        <StorageLoader />
        <Stack
          screenOptions={{
            // animation: 'slide_from_bottom',
            header: (props) => (
              <Appbar.Header>
                <Appbar.BackAction onPress={() => { router.push('/sessions');}} />
                <Appbar.Content title="Title" />
                <Appbar.Action icon="calendar" onPress={() => { }} />
                <Appbar.Action icon="magnify" onPress={() => { }} />
              </Appbar.Header>
            ),
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="live-session"
            options={{
              headerShown: false,
              presentation: 'modal',
              title: 'Live Session',
              // headerStyle: {
              //   backgroundColor: '#059669',
              // },
              // headerTintColor: '#fff',
              // headerTitleStyle: {
              //   fontWeight: 'bold',
              // },
            }}
          />
        </Stack>

      </PaperProvider>

      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <StoreProvider store={store}>
      <RootLayoutNav />
    </StoreProvider>
  );
}

