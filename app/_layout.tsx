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
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import {
  adaptNavigationTheme,
  Appbar,
  Text,
  PaperProvider,
  Tooltip,
  ActivityIndicator,
} from "react-native-paper";

import { store, RootState } from "@/src/store";
import { StorageManager } from "@/src/store/storage";
import { setPlayers } from "@/src/store/slices/playersSlice";
import { setGroups } from "@/src/store/slices/groupsSlice";
import { setSessions } from "@/src/store/slices/sessionsSlice";
import { setAppSettings } from "@/src/store/slices/appSettingsSlice";
import {
  startInitialization,
  completeInitialization,
} from "@/src/store/slices/appSlice";
import { Themes } from "@/src/ui/styles";
import { Settings } from "@/src/types";

import { router } from "expo-router";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Only set splash screen options on native platforms
if (Platform.OS !== "web") {
  SplashScreen.setOptions({
    duration: 1000,
    fade: true,
  });
  SplashScreen.preventAutoHideAsync();
}

function StorageLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch(startInitialization());
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

        dispatch(completeInitialization());
      } catch (error) {
        console.error("Error loading initial data:", error);
        dispatch(completeInitialization()); // Complete even on error
      }
    };

    loadInitialData();
  }, [dispatch]);

  return null;
}

// Loading Screen Component
function LoadingScreen() {
  const theme = Themes.light.default; // Fallback theme for loading

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator
        size="large"
        animating={true}
        color={theme.colors.primary}
      />
      <Text
        variant="headlineMedium"
        style={{
          marginTop: 16,
          color: theme.colors.onSurface,
          fontSize: 16,
        }}
      >
        Loading Sessions...
      </Text>
    </View>
  );
}

const RootLayoutNav = () => {
  const isInitialized = useSelector(
    (state: RootState) => state.app.isInitialized,
  );
  const settings = useSelector(
    (state: RootState) => state.appSettings.appSettings,
  );

  const systemColorScheme = useColorScheme();

  const effectiveSettings: Settings = settings || {
    theme: "light",
    color: "default",
  };

  const getEffectiveColorScheme = () => {
    if (effectiveSettings.theme === "auto") {
      return systemColorScheme ?? "light";
    }
    return effectiveSettings.theme;
  };

  const colorScheme = getEffectiveColorScheme();

  const theme = Themes[colorScheme][effectiveSettings.color];

  const { DarkTheme, LightTheme } = adaptNavigationTheme({
    reactNavigationDark: NavDarkTheme,
    reactNavigationLight: NavLightTheme,
    materialDark: Themes.dark[effectiveSettings.color],
    materialLight: Themes.light[effectiveSettings.color],
  });

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <PaperProvider theme={theme}>
        <LoadingScreen />
      </PaperProvider>
    );
  }

  return (
    <ThemeProvider
      value={
        colorScheme === "light"
          ? { ...LightTheme, fonts: NavLightTheme.fonts }
          : { ...DarkTheme, fonts: NavDarkTheme.fonts }
      }
    >
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </PaperProvider>
    </ThemeProvider>
  );
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && Platform.OS !== "web") {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <StoreProvider store={store}>
      <StorageLoader />
      <RootLayoutNav />
    </StoreProvider>
  );
}
