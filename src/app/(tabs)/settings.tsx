import React, { useState, useEffect } from "react";
import { Linking, View, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Dialog,
  Divider,
  Icon,
  Menu,
  Portal,
  RadioButton,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { StorageManager, StoredData } from "@/src/store/storage";
import { Alert } from "@/src/utils/alert";
import { APP_CONFIG } from "@/src/constants";
import { TabHeader } from "@/src/components/TabHeader";
import { TopDescription } from "@/src/components/TopDescription";
import { setAppSettings } from "@/src/store/slices/appSettingsSlice";
import { setSessions } from "@/src/store/slices/sessionsSlice";
import { setGroups } from "@/src/store/slices/groupsSlice";
import { setPlayers } from "@/src/store/slices/playersSlice";
import { Settings, Color } from "@/src/types";
import {
  copyToClipboard,
  saveToFile,
  readSelectedFile,
  pasteFromClipboard,
} from "@/src/utils/fileClipboardUtil";
import { versionManager } from "@/src/utils/version";
import Colors from "@/src/ui/styles/colors";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

export default function SettingsTab() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);
  const { sessions } = useAppSelector((state) => state.sessions);
  const { appSettings } = useAppSelector((state) => state.appSettings);

  const [colorMenuVisible, setColorMenuVisible] = useState(false);
  const [backupDialogVisible, setBackupDialogVisible] = useState(false);
  const [backupJsonData, setBackupJsonData] = useState("");
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [restoreJsonData, setRestoreJsonData] = useState("");
  const [versionInfo, setVersionInfo] = useState<string>("");

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const formattedVersion = await versionManager.getFormattedVersion();
        setVersionInfo(formattedVersion);
      } catch (error) {
        console.error("Failed to load version info:", error);
        setVersionInfo("Unknown version");
      }
    };

    loadVersionInfo();
  }, []);

  const handleBackupData = async () => {
    try {
      const storage = StorageManager.getInstance();
      const data: StoredData = await storage.backupAllData();
      const jsonData = JSON.stringify(data, null, 2);
      setBackupJsonData(jsonData);
      setBackupDialogVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to create backup");
    }
  };

  const handleCopyToClipboard = async () => {
    copyToClipboard(backupJsonData, () => setBackupDialogVisible(false));
  };

  const handleSaveToFile = async () => {
    const fileName = `${APP_CONFIG.NAME}-backup-${new Date().toISOString().split("T")[0]}.json`;
    saveToFile(backupJsonData, fileName, () => setBackupDialogVisible(false));
  };

  const handleRestoreData = async () => {
    setRestoreDialogVisible(true);
  };

  const handleSelectFile = async () => {
    readSelectedFile((content) => setRestoreJsonData(content));
  };

  const validateAndRestoreData = async () => {
    try {
      if (!restoreJsonData.trim()) {
        Alert.alert("Error", "No data to restore");
        return;
      }

      let parsedData: StoredData;
      try {
        parsedData = JSON.parse(restoreJsonData);
      } catch (parseError) {
        Alert.alert("Error", "Invalid JSON format");
        return;
      }

      if (!parsedData.players || !parsedData.groups || !parsedData.sessions) {
        Alert.alert(
          "Error",
          "Invalid data structure. Missing required fields.",
        );
        return;
      }

      Alert.alert(
        "Restore Data",
        `This will replace all current data with:\n• ${parsedData.players.length} players\n• ${parsedData.groups.length} groups\n• ${parsedData.sessions.length} sessions\n\nThis action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              try {
                const storage = StorageManager.getInstance();
                await storage.restoreAllData(parsedData);

                // Update store with imported data
                dispatch(setPlayers(parsedData.players));
                dispatch(setGroups(parsedData.groups));
                dispatch(setSessions(parsedData.sessions));
                dispatch(setAppSettings(parsedData.appSettings));

                Alert.alert("Success", "Data restored successfully");
                setRestoreDialogVisible(false);
                setRestoreJsonData("");
              } catch (error) {
                Alert.alert("Error", "Failed to restore data");
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "Failed to process restore data");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all players, groups, and sessions. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              const storage = StorageManager.getInstance();
              await storage.clearAllData();
              Alert.alert("Success", "All data cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ],
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      elevation={1}
    >
      <TabHeader title="Pickleball Sessions" showIcon={true} />
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
            onValueChange={(value) =>
              updateSettings({ theme: value as "light" | "dark" | "auto" })
            }
            buttons={[
              { value: "light", label: "Light", icon: "white-balance-sunny" },
              { value: "dark", label: "Dark", icon: "moon-waning-crescent" },
              { value: "auto", label: "Auto", icon: "brightness-auto" },
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
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: theme.colors.primary,
                        marginRight: 12,
                      }}
                    />
                    <Text variant="bodyMedium">
                      {formatColorName(appSettings.color)}
                    </Text>
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingVertical: 8,
          }}
        >
          <>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ marginBottom: 4 }}>
                Enable Scoring by Default
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                New sessions will have scoring enabled by default
              </Text>
            </View>
            <Switch
              value={appSettings.defaultUseScoring}
              onValueChange={(value) =>
                updateSettings({ defaultUseScoring: value })
              }
            />
          </>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingVertical: 8,
          }}
        >
          <>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ marginBottom: 4 }}>
                Show Ratings by Default
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                New sessions will show player ratings by default
              </Text>
            </View>
            <Switch
              value={appSettings.defaultUseRatings}
              onValueChange={(value) =>
                updateSettings({ defaultUseRatings: value })
              }
            />
          </>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingVertical: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" style={{ marginBottom: 4 }}>
              Court Layout
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Default court layout view
            </Text>
          </View>
          <RadioButton.Group
            value={appSettings.defaultCourtLayout || "horizontal"}
            onValueChange={(value) => {
              updateSettings({
                defaultCourtLayout:
                  value == "horizontal" ? "horizontal" : "vertical",
              });
            }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View>
                <Text variant="labelSmall">Horizontal</Text>
                <RadioButton value="horizontal" />
              </View>
              <View>
                <Text variant="labelSmall">Vertical</Text>
                <RadioButton value="vertical" />
              </View>
            </View>
          </RadioButton.Group>
        </View>
      </Card.Content>
    </Card>
  );

  const DataStatsCard = () => (
    <Card style={{ marginBottom: 16 }}>
      <Card.Title title="Data Overview" />
      <Card.Content>
        <Surface
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            paddingVertical: 8,
            borderRadius: 8,
          }}
          elevation={0}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: "bold",
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
          <View style={{ alignItems: "center" }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: "bold",
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
          <View style={{ alignItems: "center" }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: "bold",
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
          onPress={handleBackupData}
          style={{ marginBottom: 12 }}
          contentStyle={{ justifyContent: "flex-start" }}
        >
          Backup Data
        </Button>

        <Button
          icon="upload"
          mode="outlined"
          onPress={handleRestoreData}
          style={{ marginBottom: 12 }}
          contentStyle={{ justifyContent: "flex-start" }}
        >
          Restore Data
        </Button>

        <Button
          icon="delete"
          mode="outlined"
          buttonColor={theme.colors.errorContainer}
          textColor={theme.colors.error}
          onPress={handleClearData}
          contentStyle={{ justifyContent: "flex-start" }}
        >
          Clear All Data
        </Button>
      </Card.Content>
    </Card>
  );

  const AboutCard = () => (
    <Card>
      <Card.Title
        title="About"
        // titleVariant="titleLarge"
        // titleStyle={{ fontWeight: "600" }}
      />
      <Card.Content>
        <Text
          variant="titleMedium"
          style={{
            lineHeight: 20,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          Pickleball Sessions
        </Text>
        <View style={{ flexDirection: "column" }}>
          <Text
            variant="bodyMedium"
            style={{
              marginBottom: 20,
              //lineHeight: 20,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            Organize and manage pickleball sessions with fair player rotation
            and team balancing.
          </Text>
          <Text style={{ marginBottom: 2 }}>Version: {versionInfo}</Text>
        </View>
        <View
          style={{
            flexDirection: "column",
            marginTop: 10,
          }}
        >
          {/* Row 1 */}
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                //flex: 1,
                flexBasis: "15%",
                justifyContent: "center",
              }}
            >
              <Text variant="bodyMedium">PWA (fully offline):</Text>
            </View>
            <View
              style={{
                // padding: 12,
                // justifyContent: "flex-start",
                alignContent: "flex-start",
              }}
            >
              <Button
                icon="open-in-app"
                compact
                onPress={() => Linking.openURL("https://pbsessions.app/")}
              >
                https://pbsessions.app/
              </Button>
            </View>
          </View>
          {/* Row 2 */}
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                // flex: 1,
                flexBasis: "15%",
                justifyContent: "center",
              }}
            >
              <Text variant="bodyMedium">Source:</Text>
            </View>
            <View
              style={{
                // flex: 4,
                alignContent: "flex-start",
              }}
            >
              <Button
                icon="github"
                compact
                onPress={() =>
                  Linking.openURL("https://github.com/kmac/pbsessions")
                }
              >
                https://github.com/kmac/pbsessions
              </Button>
            </View>
          </View>
        </View>
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
        <TopDescription
          visible={true}
          description="Configure application settings and defaults"
        />

        <AppearanceCard />
        <DefaultsCard />
        <DataStatsCard />
        <DataManagementCard />
        <AboutCard />
      </ScrollView>

      <Portal>
        <Dialog
          visible={backupDialogVisible}
          onDismiss={() => setBackupDialogVisible(false)}
          // style={{ maxHeight: "60%" }}
        >
          <Dialog.Title>Backup Data</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              {Platform.OS === "web"
                ? "Download or copy the JSON data below:"
                : "Save to file or copy the JSON data below:"}
            </Text>
            <TextInput
              mode="outlined"
              multiline
              //numberOfLines={Platform.OS === "android" ?  40 : undefined}
              value={backupJsonData}
              editable={false}
              style={{
                //flex: 1,
                height: 200,
                // minHeight: 340,
                // maxHeight: "60%",
                fontSize: 11,
                fontFamily: "monospace",
              }}
              contentStyle={{
                paddingVertical: 8,
              }}
              scrollEnabled={true}
            />
          </Dialog.Content>
          <Dialog.Actions
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Button
              mode="contained-tonal"
              onPress={() => setBackupDialogVisible(false)}
            >
              Cancel
            </Button>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                mode="outlined"
                onPress={handleCopyToClipboard}
                icon="content-copy"
              >
                Copy
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveToFile}
                icon={Platform.OS === "web" ? "download" : "content-save"}
              >
                {Platform.OS === "web" ? "Download" : "Save File"}
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={restoreDialogVisible}
          onDismiss={() => setRestoreDialogVisible(false)}
          // style={{ height: "60%" }}
        >
          <Dialog.Title>Restore Data</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              Select a file or paste JSON data to restore:
            </Text>

            <Button
              mode="outlined"
              onPress={handleSelectFile}
              icon="file-upload"
              style={{ /*flex: 1,*/ marginBottom: 12 }}
            >
              Select File
            </Button>

            <TextInput
              mode="outlined"
              value={restoreJsonData}
              onChangeText={setRestoreJsonData}
              multiline
              //numberOfLines={Platform.OS === "android" ?  40 : undefined}
              placeholder="Import file or paste JSON data here..."
              style={{
                //flex: 1,
                height: 200,
                // minHeight: 340,
                // maxHeight: "60%",
                fontSize: 11,
                fontFamily: "monospace",
              }}
              contentStyle={{
                paddingVertical: 8,
              }}
              scrollEnabled={true}
            />
          </Dialog.Content>

          <Dialog.Actions
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Button
              mode="contained-tonal"
              onPress={() => {
                setRestoreDialogVisible(false);
                setRestoreJsonData("");
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={validateAndRestoreData}
              icon="import"
              disabled={!restoreJsonData.trim()}
            >
              Restore
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}
