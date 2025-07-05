// app/(tabs)/_layout.tsx (Tab Layout)
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Users, Users2, Calendar, Settings } from 'lucide-react-native';

import Colors from '../../src/theme/Colors';
import { useClientOnlyValue } from '../../src/utils/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size || 28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: '#f8fafc',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Players',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size || 24} />,
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
      <Tabs.Screen
        name="configuration"
        options={{
          title: 'Configuration',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size || 24} />,
        }}
      />
    </Tabs>
  );
}
