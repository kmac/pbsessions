// app/_layout.tsx (Root Layout)
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Provider as StoreProvider, useDispatch } from 'react-redux';
import { useColorScheme } from 'react-native';

import { store } from '../src/store';
import { StorageManager } from '../src/utils/storage';
import { setPlayers } from '../src/store/slices/playersSlice';
import { setGroups } from '../src/store/slices/groupsSlice';

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
        const [players, groups] = await Promise.all([
          storage.loadPlayers(),
          storage.loadGroups(),
        ]);

        dispatch(setPlayers(players));
        dispatch(setGroups(groups));
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [dispatch]);

  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StorageLoader />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="live-session"
          options={{
            presentation: 'modal',
            title: 'Live Session',
            headerStyle: {
              backgroundColor: '#059669',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
