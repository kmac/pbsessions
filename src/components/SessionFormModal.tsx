import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  Checkbox,
  Chip,
  Icon,
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { DatePickerInput, TimePickerModal } from "react-native-paper-dates";
import { useAppSelector } from "../store";
import { createCourt, Session, SessionState, Court, Player, Group } from "../types";
import { validateSessionSize } from "../utils/validation";
import SessionPlayerManager from "./SessionPlayerManager";
import CourtManager from "./CourtManager";
import { Alert } from "../utils/alert";

interface SessionFormModalProps {
  session?: Session | null;
  onSave: (
    session:
      | Session
      | Omit<Session, "id" | "state" | "createdAt" | "updatedAt">,
  ) => void;
  onCancel: () => void;
}

export default function SessionFormModal({
  session,
  onSave,
  onCancel,
}: SessionFormModalProps) {
  const theme = useTheme();
  const { players } = useAppSelector((state) => state.players);
  const { appSettings } = useAppSelector((state) => state.appSettings);
  const [scoring, setScoring] = useState(appSettings.defaultUseScoring);
  const [useRatings, setUseRatings] = useState(appSettings.defaultUseRatings);

  const [formData, setFormData] = useState({
    // defaults
    name: `${new Date().toDateString()}`,
    dateTime: new Date().toISOString(),
    playerIds: [] as string[],
    courts: [] as Court[],
    scoring: appSettings.defaultUseScoring,
    showRatings: appSettings.defaultUseRatings,
  });

  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [showCourtManager, setShowCourtManager] = useState(false);

  useEffect(
    () => {
      /* Effect function: contains side effect code */
      if (session) {
        setFormData({
          name: session.name,
          dateTime: session.dateTime,
          playerIds: session.playerIds,
          courts: session.courts,
          scoring: session.scoring,
          showRatings: session.showRatings,
        });
      } else {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        setFormData((prev) => ({ ...prev, dateTime: now.toISOString() }));
      }
    },
    [
      session,
    ] /* Dependency array: effect function runs whenever any dependency changes */,
  );

  const handleSave = () => {
    // Saves formData which is then persisted by calling the 'onSave' callback
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Session name is required");
      return;
    }
    const activeCourts = formData.courts.filter((c) => c.isActive);
    if (activeCourts.length === 0) {
      Alert.alert("Validation Error", "At least one court must be active");
      return;
    }
    const validation = validateSessionSize(
      formData.playerIds.length,
      activeCourts.length,
    );
    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.error);
      return;
    }

    const sessionData = {
      name: formData.name.trim(),
      dateTime: formData.dateTime,
      playerIds: formData.playerIds,
      courts: formData.courts,
      scoring: formData.scoring,
      showRatings: formData.showRatings,
    };

    if (session) {
      onSave({ ...session, ...sessionData });
    } else {
      onSave(sessionData);
      if (validation.warning) {
        Alert.alert("Session Created", validation.warning);
      }
    }
  };

  // const formatTimeForInput = (isoString: string) => {
  //   const date = new Date(isoString);
  //   return date.toLocaleString('en-US', {
  //     year: 'numeric',
  //     month: '2-digit',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     hour12: false,
  //   }).replace(',', '');
  // };

  const getSelectedPlayers = () => {
    return players.filter((p) => formData.playerIds.includes(p.id));
  };

  const getActiveCourts = () => {
    return formData.courts.filter((c) => c.isActive);
  };

  const updatePlayerIds = (playerIds: string[]) => {
    setFormData({ ...formData, playerIds });
  };

  const updateCourts = (courts: Court[]) => {
    setFormData({
      ...formData,
      courts: [...courts],
    });
  };

  const adjustCourts = (delta: "plus" | "minus") => {
    if (delta === "minus") {
      if (activeCourts.length > 0) {
        let courtIdToRemove: string | undefined;
        [...formData.courts].reverse().forEach((court) => {
          if (!courtIdToRemove) {
            if (court.isActive) {
              courtIdToRemove = court.id;
            }
          }
        });
        if (courtIdToRemove) {
          formData.courts = formData.courts.filter(
            (c) => c.id !== courtIdToRemove,
          );
        }
        updateCourts(formData.courts);
      }
    } else {
      formData.courts.push(createCourt(activeCourts.length + 1));
      updateCourts(formData.courts);
    }
  };

  const selectedPlayers = getSelectedPlayers();
  const activeCourts = getActiveCourts();
  const validation = validateSessionSize(
    selectedPlayers.length,
    activeCourts.length,
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={onCancel} />
        <Appbar.Content
          title={session ? "Edit Session" : "New Session"}
          titleStyle={{ fontWeight: "600" }}
        />
        <Button
          icon="content-save"
          mode="contained"
          onPress={handleSave}
          style={{ marginRight: 8 }}
        >
          Save
        </Button>
      </Appbar.Header>

      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Surface
          style={{
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <Text
            variant="labelLarge"
            style={{
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Session Name *
          </Text>
          <TextInput
            mode="outlined"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter session name"
            autoFocus={!session}
          />
        </Surface>

        <Surface
          style={{
            padding: 16,
            // borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <Text
            variant="labelLarge"
            style={{
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Settings
          </Text>

          <View
            style={{
              flexDirection: "row",
              //alignItems: 'flex-start',
              //alignContent: 'space-evenly',
              padding: 12,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              borderRadius: 4,
              gap: 8,
            }}
          >
            <DatePickerInput
              locale="en"
              label="Date"
              value={new Date(formData.dateTime)}
              //onChange={(d) => setInputDate(d)}
              onChange={(d) => {}}
              inputMode="start"
              style={{
                flex: 1,
                //width: 200,
              }}
              mode="outlined"
            />
            {/*<TimePickerModal
              visible={false}
              onDismiss={() => {}}
              onConfirm={() => {}}
              hours={12}
              minutes={14}
            />*/}
            <View style={{ flexDirection: "row", flex: 2 }}>
              {/*<Text>Scoring Enabled:</Text>
              <Switch value={scoring} onValueChange={() => setScoring(!scoring)} />
              <RadioButton
                value="Scoring Enabled"
                status={scoring ? 'checked' : 'unchecked'}
                onPress={() => setScoring(!scoring)}
              />*/}
              <Checkbox.Item
                label="Scoring Enabled"
                status={scoring ? "checked" : "unchecked"}
                onPress={() => {
                  setScoring(!scoring);
                }}
              />
              {/*<Text>Use Ratings:</Text>
              <Switch value={useRatings} onValueChange={() => setUseRatings(!useRatings)} />
              <RadioButton
                value="Use Ratings"
                status={useRatings ? 'checked' : 'unchecked'}
                onPress={() => setUseRatings(!useRatings)}
              />*/}
              <Checkbox.Item
                label="Use Ratings"
                status={useRatings ? "checked" : "unchecked"}
                onPress={() => {
                  setUseRatings(!useRatings);
                }}
              />
            </View>
          </View>
        </Surface>

        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                Players ({selectedPlayers.length})
              </Text>
              <Button
                icon="account-multiple"
                mode="outlined"
                onPress={() => setShowPlayerManager(true)}
                compact={true}
              >
                Manage Players
              </Button>
            </View>

            {selectedPlayers.length === 0 ? (
              <Surface
                style={{
                  alignItems: "center",
                  padding: 24,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  borderStyle: "dashed",
                }}
              >
                <Icon source="account-multiple-plus" size={32} />
                <Text
                  variant="bodyLarge"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginVertical: 8,
                  }}
                >
                  No players selected
                </Text>
                <Button
                  icon="plus"
                  mode="outlined"
                  onPress={() => setShowPlayerManager(true)}
                >
                  Add Players
                </Button>
              </Surface>
            ) : (
              <Surface
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {selectedPlayers
                    .map((p) => p.name)
                    .sort()
                    .join(", ")}
                </Text>
              </Surface>
            )}
          </Card.Content>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                Courts ({activeCourts.length} active)
              </Text>
              <Button
                icon="cog-outline"
                mode="outlined"
                onPress={() => setShowCourtManager(true)}
                compact={true}
              >
                Manage Courts
              </Button>
            </View>

            <Surface
              style={{
                alignItems: "center",
                padding: 24,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderStyle: "dashed",
              }}
            >
              {activeCourts.length === 0 && (
                <Text
                  variant="bodyLarge"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginVertical: 8,
                  }}
                >
                  No courts configured
                </Text>
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IconButton
                  icon="minus"
                  size={20}
                  mode="contained-tonal"
                  onPress={() => adjustCourts("minus")}
                />
                <Text>{activeCourts.length}</Text>
                <IconButton
                  icon="plus"
                  size={20}
                  mode="contained-tonal"
                  onPress={() => adjustCourts("plus")}
                />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {formData.courts.map((court) => (
                  <Chip
                    key={court.id}
                    icon="map-marker-outline"
                    style={{
                      backgroundColor: court.isActive
                        ? theme.colors.tertiaryContainer
                        : theme.colors.surfaceVariant,
                    }}
                  >
                    {court.name}
                    {court.minimumRating
                      ? ` (${court.minimumRating.toFixed(1)}+)`
                      : ""}
                  </Chip>
                ))}
              </View>
            </Surface>
          </Card.Content>
        </Card>

        {selectedPlayers.length > 0 && activeCourts.length > 0 && (
          <Card>
            <Card.Content>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                Session Summary
              </Text>

              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Total Players:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                    {selectedPlayers.length}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Active Courts:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                    {activeCourts.length}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Playing per game:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                    {activeCourts.length * 4}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Sitting out:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                    {Math.max(
                      0,
                      selectedPlayers.length - activeCourts.length * 4,
                    )}
                  </Text>
                </View>
              </View>

              {validation.warning && (
                <Surface
                  style={{
                    backgroundColor: theme.colors.errorContainer,
                    padding: 8,
                    borderRadius: 6,
                    marginTop: 12,
                  }}
                >
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onErrorContainer,
                      textAlign: "center",
                    }}
                  >
                    {validation.warning}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <SessionPlayerManager
        visible={showPlayerManager}
        selectedPlayerIds={formData.playerIds}
        onSelectionChange={updatePlayerIds}
        onClose={() => setShowPlayerManager(false)}
      />

      <CourtManager
        visible={showCourtManager}
        courts={formData.courts}
        onCourtsChange={updateCourts}
        onClose={() => setShowCourtManager(false)}
      />
    </SafeAreaView>
  );
}
