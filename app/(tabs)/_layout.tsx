// app/(tabs)/_layout.tsx (Tab Layout)
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
// import { useColorScheme } from 'react-native';
import { Appbar, Icon, Tooltip } from 'react-native-paper';
import { router } from 'expo-router';
import { Users, Users2, Calendar, Settings } from 'lucide-react-native';
import { TabsHeader } from '@/src/components/TabsHeader';

import Colors from '@/src/theme/Colors';
import { useClientOnlyValue } from '@/src/utils/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size || 28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
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
      screenOptions={{
        tabBarHideOnKeyboard: true,
        header: (props) => <TabsHeader navProps={props} children={undefined} />,
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
          title: 'Players',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size || 24} />,
          // tabBarIcon: (props) => (
          //   <MaterialCommunityIcons
          //     {...props}
          //     size={24}
          //     name={props.focused ? 'account' : 'account-outline'}
          //   />
          // ),
          headerLeft: () => (
            <Icon
              source="camera"
              size={20}
            />
          ),
          headerTitle : "Switch",
          headerRight: () => (
            <>
              <Tooltip title='Search'>
                <Appbar.Action
                  icon="magnify"
                  onPress={() => { }}
                />
              </Tooltip>
              <Tooltip title='Settings'>
                <Appbar.Action
                  icon="menu"
                  onPress={() => router.push('/settings')}
                />
              </Tooltip>
            </>
          ),
        }}

      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => <Users2 color={color} size={size || 24} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size || 24} />,
        }}
      />
      {/*
      <Tabs.Screen
        name="archived"
        options={{
          href: null,
          title: 'Archived',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size || 24} />,
        }}
      />
      */}
      <Tabs.Screen
        name="settings"
        options={{
          // href: null,
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size || 24} />,
        }}
      />
    </Tabs>
  );
}
