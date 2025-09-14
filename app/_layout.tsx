import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { useColorScheme } from "react-native";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect } from "react";
import {
  Provider as StoreProvider,
  useDispatch,
  useSelector,
} from "react-redux";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from "expo-status-bar";
import {
  adaptNavigationTheme,
  Appbar,
  Text,
  PaperProvider,
  Tooltip,
} from "react-native-paper";

import { store, RootState } from "@/src/store";
import { StorageManager } from "@/src/store/storage";
import { setPlayers } from "@/src/store/slices/playersSlice";
import { setGroups } from "@/src/store/slices/groupsSlice";
import { setSessions } from "@/src/store/slices/sessionsSlice";
import { setAppSettings } from "@/src/store/slices/appSettingsSlice";
import { Themes } from "@/src/ui/styles";
import { Settings } from "@/src/types";

import { router } from "expo-router";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function StorageLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadInitialData = async () => {
      const storage = StorageManager.getInstance();

      try {
        const [players, groups, sessions, appSettings] = await Promise.all([
          storage.loadPlayers(),
          storage.loadGroups(),
          storage.loadSessions(),
          storage.loadAppSettings(),
        ]);

        dispatch(setPlayers(players));
        dispatch(setGroups(groups));
        dispatch(setSessions(sessions));
        dispatch(setAppSettings(appSettings));
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, [dispatch]);

  return null;
}

const RootLayoutNav = () => {
  // Get settings from Redux store
  const settings = useSelector(
    (state: RootState) => state.appSettings.appSettings,
  );

  // Fix: Get actual system color scheme and use settings theme
  const systemColorScheme = useColorScheme();
  const getEffectiveColorScheme = () => {
    if (!settings?.theme) return "light";
    if (settings.theme === "auto") return systemColorScheme ?? "light";
    return settings.theme;
  };

  const colorScheme = getEffectiveColorScheme();

  // Fallback to default if settings not loaded yet
  const effectiveSettings: Settings = settings || {
    theme: "light",
    color: "default",
  };

  const theme =
    Themes[
      effectiveSettings.theme === "auto"
        ? (systemColorScheme ?? "light")
        : effectiveSettings.theme
    ][effectiveSettings.color];

  const { DarkTheme, LightTheme } = adaptNavigationTheme({
    reactNavigationDark: NavDarkTheme,
    reactNavigationLight: NavLightTheme,
    materialDark: Themes.dark[effectiveSettings.color],
    materialLight: Themes.light[effectiveSettings.color],
  });

  const stackHeader = () => {
    return (
      <Appbar.Header mode="center-aligned">
        {/*<Appbar.BackAction
                  onPress={() => {
                    router.navigate("/sessions");
                  }}
                />*/}
        <Appbar.Content
          title={
            <Text
              variant="titleMedium"
              style={{
                alignItems: "center",
                fontWeight: "600",
              }}
            >
              Pickleball Sessions
            </Text>
          }
        />
        <Tooltip title="Settings">
          <Appbar.Action
            icon="dots-vertical"
            onPress={() => router.navigate("/settings")}
          />
        </Tooltip>
      </Appbar.Header>
    );
  };

  return (
    <ThemeProvider
      value={
        colorScheme === "light"
          ? { ...LightTheme, fonts: NavLightTheme.fonts }
          : { ...DarkTheme, fonts: NavDarkTheme.fonts }
      }
    >
      <PaperProvider theme={theme}>
        <StorageLoader />
        <Stack
          screenOptions={
            {
              // animation: 'slide_from_bottom',
              //header: (props) => stackHeader()
            }
          }
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="live-session"
            options={{
              headerShown: false,
              presentation: "modal",
              title: "Live Session",
            }}
          />
        </Stack>
      </PaperProvider>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
};

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
