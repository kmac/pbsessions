import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useTheme } from 'react-native-paper';
import { Appbar, Icon, Tooltip } from "react-native-paper";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  size?: number;
}) {
  return (
    <FontAwesome
      size={props.size || 28}
      style={{ marginBottom: -3 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  const theme = useTheme();

  return (
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
          // tabBarIcon: (props) => (
          //   <MaterialCommunityIcons
          //     {...props}
          //     size={24}
          //     name={props.focused ? 'account' : 'account-outline'}
          //   />
          // ),
          // headerLeft: () => <Icon source="camera" size={20} />,
          // headerTitle: "Switch",
          // headerRight: () => (
          //   <>
          //     <Tooltip title="Search">
          //       <Appbar.Action icon="magnify" onPress={() => {}} />
          //     </Tooltip>
          //     <Tooltip title="Settings">
          //       <Appbar.Action
          //         icon="menu"
          //         onPress={() => router.navigate("/settings")}
          //       />
          //     </Tooltip>
          //   </>
          // ),
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
            <Icon
              source="view-grid"
              // source="scoreboard-outline"
              color={color}
              size={size || 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          // href: null,
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            // cog
            <Icon source="tune-vertical-variant" color={color} size={size || 24} />
          ),
        }}
      />



    </Tabs>
  );
}


export function TabLayoutOrig() {
  // const colorScheme = useColorScheme();

  return (
    <Tabs
      // screenOptions={{
      // tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      // Disable the static render of the header on web
      // to prevent a hydration error in React Navigation v6.
      // headerShown: useClientOnlyValue(false, true),
      // headerStyle: {
      //   backgroundColor: '#f8fafc',
      // },
      // headerTitleStyle: {
      //   fontWeight: 'bold',
      // },
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
          // tabBarIcon: (props) => (
          //   <MaterialCommunityIcons
          //     {...props}
          //     size={24}
          //     name={props.focused ? 'account' : 'account-outline'}
          //   />
          // ),
          // headerLeft: () => <Icon source="camera" size={20} />,
          // headerTitle: "Switch",
          // headerRight: () => (
          //   <>
          //     <Tooltip title="Search">
          //       <Appbar.Action icon="magnify" onPress={() => {}} />
          //     </Tooltip>
          //     <Tooltip title="Settings">
          //       <Appbar.Action
          //         icon="menu"
          //         onPress={() => router.navigate("/settings")}
          //       />
          //     </Tooltip>
          //   </>
          // ),
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
            <Icon
              source="view-grid"
              // source="scoreboard-outline"
              color={color}
              size={size || 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          // href: null,
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            // cog
            <Icon source="tune-vertical-variant" color={color} size={size || 24} />
          ),
        }}
      />
    </Tabs>
  );
}
