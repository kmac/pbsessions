import { Tabs, useSegments } from "expo-router";
import { useTheme } from "react-native-paper";
import { Appbar, Icon, Tooltip } from "react-native-paper";
import { useEffect } from "react";
import { Alert } from "@/src/utils/alert";
import { useBackHandler } from "@/src/hooks/useBackHandler";
import { BackHandler } from "react-native";

function TabNavigationWrapper({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const currentTab = segments[1]; // Get current tab from segments

  // Handle back button for tab navigation
  useBackHandler(() => {
    // Check if we're on the first/main tab
    if (currentTab === "sessions" || !currentTab) {
      Alert.alert("Exit App", "Are you sure you want to exit?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => {
            BackHandler.exitApp();
            return false;
          },
        },
      ]);
      // Prevent default back action to show our alert
      return true;
    }

    // For other tabs, allow normal back navigation
    return false;
  }, [currentTab]);

  return <>{children}</>;
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <TabNavigationWrapper>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
          },
          tabBarLabelStyle: {
            fontFamily: theme.fonts.labelMedium.fontFamily,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="players"
          options={{
            headerShown: false,
            title: "Players",
            tabBarIcon: ({ color, size }) => (
              <Icon
                source="account-multiple-plus"
                color={color}
                size={size || 24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            headerShown: false,
            title: "Groups",
            tabBarIcon: ({ color, size }) => (
              <Icon source="account-group" color={color} size={size || 24} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            headerShown: false,
            title: "Sessions",
            tabBarIcon: ({ color, size }) => (
              <Icon source="view-grid" color={color} size={size || 24} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Icon
                source="tune-vertical-variant"
                color={color}
                size={size || 24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="live-session"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </TabNavigationWrapper>
  );
}
