import React, { useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Surface,
  Text,
  useTheme,
  Icon,
  Divider,
  Switch,
  SegmentedButtons,
  Menu,
  TouchableRipple,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { StorageManager, StoredData } from '@/src/store/storage';
import { Alert } from '@/src/utils/alert';
import TopDescription from '@/src/components/TopDescription';
import { setAppSettings } from '@/src/store/slices/appSettingsSlice';
import { Settings, Color } from '@/src/types';
import Colors from '@/src/ui/styles/colors';

export default function SettingsTab() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { width: screenWidth } = Dimensions.get('window');
  const isNarrowScreen = screenWidth < 768;

  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);
  const { sessions } = useAppSelector((state) => state.sessions);
  const { appSettings } = useAppSelector((state) => state.appSettings);

  const [colorMenuVisible, setColorMenuVisible] = useState(false);

  const handleExportData = async () => {
    try {
      const storage = StorageManager.getInstance();
      const data: StoredData = await storage.exportAllData();

      Alert.alert(
        'Export Data',
        `TODO: Ready to export:\n• ${data.players.length} players\n• ${data.groups.length} groups\n• ${data.sessions.length} sessions.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all players, groups, and sessions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const storage = StorageManager.getInstance();
              await storage.clearAllData();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const updateSettings = (updates: Partial<Settings>) => {
    const newSettings = { ...appSettings, ...updates };
    dispatch(setAppSettings(newSettings));
  };

  const colorOptions = Object.keys(Colors.light) as Color[];

  const formatColorName = (color: Color) => {
    return color.charAt(0).toUpperCase() + color.slice(1);
  };

  const SettingsHeader = () => (
    <Surface
      style={{
        paddingHorizontal: 16,
        paddingVertical: 24,
      }}
    >
      <Text
        variant="titleLarge"
        style={{
          marginBottom: 8,
          color: theme.colors.onSurface,
        }}
      >
        Pickleball Sessions
      </Text>
      <TopDescription
        visible={true}
        description="Configure application settings and defaults"
      />
    </Surface>
  );

  const AppearanceCard = () => (
    <Card style={{ marginBottom: 16 }}>
      <Card.Title title="Appearance" />
      <Card.Content>

        {/* Theme Selection */}
        <View style={{ marginBottom: 16 }}>
          <Text variant="titleSmall" style={{ marginBottom: 8 }}>
            Theme
          </Text>
          <SegmentedButtons
            value={appSettings.theme}
            onValueChange={(value) => updateSettings({ theme: value as 'light' | 'dark' | 'auto' })}
            buttons={[
              { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
              { value: 'auto', label: 'Auto', icon: 'brightness-auto' },
            ]}
          />
        </View>

        <Divider style={{ marginVertical: 8 }} />

        {/* Color Selection */}
        <View>
          <Text variant="titleSmall" style={{ marginBottom: 8 }}>
            Color Theme
          </Text>
          <Menu
            visible={colorMenuVisible}
            onDismiss={() => setColorMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setColorMenuVisible(true)}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: theme.colors.primary,
                        marginRight: 12,
                      }}
                    />
                    <Text variant="bodyMedium">{formatColorName(appSettings.color)}</Text>
                  </View>
                  <Icon source="chevron-down" size={20} />
                </View>
              </TouchableRipple>
            }
          >
            {colorOptions.map((color) => (
              <Menu.Item
                key={color}
                onPress={() => {
                  updateSettings({ color });
                  setColorMenuVisible(false);
                }}
                title={formatColorName(color)}
                leadingIcon={() => (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: Colors.light[color].primary,
                    }}
                  />
                )}
                trailingIcon={appSettings.color === color ? "check" : undefined}
              />
            ))}
          </Menu>
        </View>
      </Card.Content>
    </Card>
  );

  const DefaultsCard = () => (
    <Card style={{ marginBottom: 16 }}>
      <Card.Title title="Session Defaults" />
      <Card.Content>
        <View style={{ marginBottom: 16 }}>
          <TouchableRipple
            onPress={() => updateSettings({ defaultUseScoring: !appSettings.defaultUseScoring })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 8,
            }}
          >
            <>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ marginBottom: 4 }}>
                  Enable Scoring by Default
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  New sessions will have scoring enabled by default
                </Text>
              </View>
              <Switch
                value={appSettings.defaultUseScoring}
                onValueChange={(value) => updateSettings({ defaultUseScoring: value })}
              />
            </>
          </TouchableRipple>
        </View>

        <TouchableRipple
          onPress={() => updateSettings({ defaultUseRatings: !appSettings.defaultUseRatings })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 8,
          }}
        >
          <>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ marginBottom: 4 }}>
                Show Ratings by Default
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                New sessions will show player ratings by default
              </Text>
            </View>
            <Switch
              value={appSettings.defaultUseRatings}
              onValueChange={(value) => updateSettings({ defaultUseRatings: value })}
            />
          </>
        </TouchableRipple>
      </Card.Content>
    </Card>
  );

  const DataStatsCard = () => (
    <Card style={{ marginBottom: 16 }}>
      <Card.Title title="Data Overview" />
      <Card.Content>
        <Surface
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 8,
            borderRadius: 8,
          }}
          elevation={0}
        >
          <View style={{ alignItems: 'center' }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: 'bold',
                color: theme.colors.primary,
                marginBottom: 4,
              }}
            >
              {players.length}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Players
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: 'bold',
                color: theme.colors.primary,
                marginBottom: 4,
              }}
            >
              {groups.length}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Groups
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: 'bold',
                color: theme.colors.primary,
                marginBottom: 4,
              }}
            >
              {sessions.length}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Sessions
            </Text>
          </View>
        </Surface>
      </Card.Content>
    </Card>
  );

  const DataManagementCard = () => (
    <Card style={{ marginBottom: 16 }}>
      <Card.Title title="Data Management" />
      <Card.Content>
        <Button
          icon="download"
          mode="outlined"
          onPress={handleExportData}
          style={{ marginBottom: 12 }}
          contentStyle={{ justifyContent: 'flex-start' }}
        >
          Export Data
        </Button>

        <Button
          icon="delete"
          mode="outlined"
          buttonColor={theme.colors.errorContainer}
          textColor={theme.colors.error}
          onPress={handleClearData}
          contentStyle={{ justifyContent: 'flex-start' }}
        >
          Clear All Data
        </Button>
      </Card.Content>
    </Card>
  );

  const AboutCard = () => (
    <Card>
      <Card.Title title="About" />
      <Card.Content>
        <Text
          variant="bodyMedium"
          style={{
            lineHeight: 20,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          Pickleball Sessions v1.0.0{'\n'}
          Organize and manage pickleball sessions with fair player rotation and
          team balancing.
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SettingsHeader />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppearanceCard />
        <DefaultsCard />
        <DataStatsCard />
        <DataManagementCard />
        <AboutCard />
      </ScrollView>
    </SafeAreaView>
  );
}
