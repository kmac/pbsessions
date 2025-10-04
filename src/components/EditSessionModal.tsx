import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { View, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  Portal,
  Snackbar,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
  Dialog,
} from "react-native-paper";
import { useAppSelector } from "../store";
import {
  createCourt,
  Court,
  PartnershipConstraint,
  Session,
  SessionState,
} from "../types";
import { deepEqual } from "../utils/util";
import { isNarrowScreen } from "../utils/screenUtil";
import { validateSessionSize } from "../utils/validation";
import { CourtManager } from "./CourtManager";
import { SessionPlayerManager } from "./SessionPlayerManager";
import { TopDescription } from "./TopDescription";
import { Alert } from "../utils/alert";

interface EditSessionModalProps {
  visible: boolean;
  session?: Session | null;
  onSave: (
    session:
      | Session
      | Omit<Session, "id" | "state" | "createdAt" | "updatedAt">,
  ) => void;
  onCancel: () => void;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  visible,
  session,
  onSave,
  onCancel,
}) => {
  const theme = useTheme();
  const { players } = useAppSelector((state) => state.players);
  const { appSettings } = useAppSelector((state) => state.appSettings);
  const [scoring, setScoring] = useState(appSettings.defaultUseScoring);
  const [useRatings, setUseRatings] = useState(appSettings.defaultUseRatings);
  const [courtSnackVisible, setCourtSnackVisible] = useState(false);

  const [formData, setFormData] = useState({
    // defaults
    name: `${new Date().toDateString()}`,
    dateTime: new Date().toDateString(),
    playerIds: [] as string[],
    pausedPlayerIds: [] as string[],
    courts: [] as Court[],
    scoring: scoring,
    showRatings: useRatings,
    partnershipConstraint: {
      partnerships: [],
      enforceAllPairings: true,
    } as PartnershipConstraint,
  });

  // Track initial values for change detection
  // `useRef` is being used to store **initial form data** that remains constant throughout the component's lifecycle.
  // 1. **Persistence**: The ref value persists across re-renders without causing re-renders itself
  // 2. **Mutable**: Unlike state, you can modify `initialFormData.current` without triggering re-renders
  // 3. **Initial Values**: Provides default/baseline values for form initialization
  // 4. **Performance**: Avoids recreating the initial data object on every render
  const initialFormData = useRef({
    name: `${new Date().toDateString()}`,
    dateTime: `${new Date().toDateString()}`,
    playerIds: [] as string[],
    pausedPlayerIds: [] as string[],
    courts: [] as Court[],
    scoring: scoring,
    showRatings: useRatings,
    partnershipConstraint: {
      partnerships: [],
      enforceAllPairings: true,
    } as PartnershipConstraint,
  });

  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [showCourtManager, setShowCourtManager] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);
  const currentPlayerIdsRef = useRef<string[]>([]);

  // This `useEffect` is handling **form initialization and
  // reset logic** when the modal opens or key dependencies
  // change.
  // The effect initializes form data differently based on
  // whether we're **editing an existing session** or
  // **creating a new one**.

  useEffect(() => {
    // Effect function: contains side effect code
    let newFormData;

    if (session) {
      newFormData = {
        name: session.name,
        dateTime: session.dateTime,
        playerIds: [...session.playerIds],
        pausedPlayerIds: session.pausedPlayerIds
          ? [...session.pausedPlayerIds]
          : [],
        courts: [...session.courts],
        scoring: session.scoring,
        showRatings: session.showRatings,
        partnershipConstraint: session.partnershipConstraint
          ? ({
              partnerships: session.partnershipConstraint.partnerships,
              enforceAllPairings:
                session.partnershipConstraint.enforceAllPairings,
            } as PartnershipConstraint)
          : ({
              partnerships: [],
              enforceAllPairings: true,
            } as PartnershipConstraint),
      };
    } else {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      newFormData = {
        name: `${new Date().toDateString()}`,
        dateTime: now.toDateString(),
        playerIds: [],
        pausedPlayerIds: [],
        courts: [],
        scoring: scoring,
        showRatings: useRatings,
        partnershipConstraint: {
          partnerships: [],
          enforceAllPairings: true,
        } as PartnershipConstraint,
      };
    }

    // used in updatePlayerIds:
    currentPlayerIdsRef.current = newFormData.playerIds;

    setFormData(newFormData);

    // Store initial values using the newFormData, not the stale formData
    initialFormData.current = {
      name: newFormData.name,
      dateTime: newFormData.dateTime,
      playerIds: [...newFormData.playerIds],
      pausedPlayerIds: [...newFormData.pausedPlayerIds],
      courts: [...newFormData.courts],
      scoring: newFormData.scoring,
      showRatings: newFormData.showRatings,
      partnershipConstraint: {
        partnerships: [...newFormData.partnershipConstraint.partnerships],
        enforceAllPairings:
          newFormData.partnershipConstraint.enforceAllPairings,
      } as PartnershipConstraint,
    };
  }, [session, visible]); // effect is only activated if any of these change

  const hasUnsavedChanges = () => {
    // Create a temporary formData object with the current ref values for comparison
    const currentFormDataWithRef = {
      ...formData,
      playerIds: currentPlayerIdsRef.current, // Use the immediate ref value
    };
    // console.log(
    //   `hasUnsavedChanges: checking currentFormDataWithRef.playerIds: ${currentFormDataWithRef.playerIds} vs ${initialFormData.current.playerIds}`,
    // );
    return !deepEqual(currentFormDataWithRef, initialFormData.current);
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesDialog(true);
    } else {
      onCancel();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    onCancel();
  };

  const handleReset = () => {

    currentPlayerIdsRef.current = [...initialFormData.current.playerIds];

    setFormData({
      name: initialFormData.current.name,
      dateTime: initialFormData.current.dateTime,
      playerIds: [...initialFormData.current.playerIds],
      pausedPlayerIds: [...initialFormData.current.pausedPlayerIds],
      courts: [...initialFormData.current.courts],
      scoring: initialFormData.current.scoring,
      showRatings: initialFormData.current.showRatings,
      partnershipConstraint: {
        partnerships: [
          ...initialFormData.current.partnershipConstraint.partnerships,
        ],
        enforceAllPairings:
          initialFormData.current.partnershipConstraint.enforceAllPairings,
      },
    });
  };

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
      currentPlayerIdsRef.current.length,
      activeCourts.length,
    );
    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.error);
      return;
    }

    const sessionData = {
      name: formData.name.trim(),
      dateTime: formData.dateTime,
      playerIds: currentPlayerIdsRef.current,
      pausedPlayerIds: formData.pausedPlayerIds,
      partnershipConstraint: formData.partnershipConstraint,
      courts: formData.courts,
      scoring: formData.scoring,
      showRatings: formData.showRatings,
    };

    // Update initial values after successful save
    initialFormData.current = {
      name: formData.name.trim(),
      dateTime: formData.dateTime,
      playerIds: [...currentPlayerIdsRef.current],
      pausedPlayerIds: [...formData.pausedPlayerIds],
      partnershipConstraint: {
        partnerships: [...formData.partnershipConstraint.partnerships],
        enforceAllPairings: formData.partnershipConstraint.enforceAllPairings,
      } as PartnershipConstraint,
      courts: [...formData.courts],
      scoring: formData.scoring,
      showRatings: formData.showRatings,
    };

    if (session) {
      onSave({ ...session, ...sessionData });
      if (validation.warning) {
        Alert.alert("Session Saved", validation.warning);
      }
    } else {
      onSave(sessionData);
      if (validation.warning) {
        Alert.alert("Session Created", validation.warning);
      }
    }
  };

  const getSelectedPlayers = () => {
    // return players.filter((p) => formData.playerIds.includes(p.id));
    return players.filter((p) => currentPlayerIdsRef.current.includes(p.id));
  };

  const getActiveCourts = () => {
    return formData.courts.filter((c) => c.isActive);
  };

  const updatePlayerIds = useCallback((playerIds: string[]) => {
    console.log(
      `updatePlayerIds: playerIds count: ${playerIds.length}`,
      playerIds,
    );
    currentPlayerIdsRef.current = playerIds;
    setFormData((prev) => {
      const newFormData = { ...prev, playerIds };
      return newFormData;
    });
  }, []);

  const handlePausedPlayers = (pausedPlayerIds: string[]) => {
    setFormData({ ...formData, pausedPlayerIds });
  };

  const handlePartnershipConstraintChange = (
    constraint?: PartnershipConstraint,
  ) => {
    if (!constraint) {
      setFormData({
        ...formData,
        // clear all:
        partnershipConstraint: { partnerships: [], enforceAllPairings: true },
      });
      return;
    }
    setFormData({
      ...formData,
      partnershipConstraint: constraint,
    });
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
      formData.courts.push(createCourt(`Court ${formData.courts.length + 1}`));
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
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={handleBackPress} />
          <Appbar.Content
            title={
              <Text
                variant="titleLarge"
                style={{
                  alignItems: "center",
                  fontWeight: "600",
                }}
              >
                {session ? "Edit Session" : "New Session"}
              </Text>
            }
          />
          {hasUnsavedChanges() && (
            <>
              <Button
                icon="restore"
                mode="outlined"
                compact={isNarrowScreen()}
                onPress={handleReset}
                style={{ marginRight: 4 }}
              >
                Reset
              </Button>
              <Button
                icon="content-save"
                mode="contained"
                onPress={handleSave}
                compact={isNarrowScreen()}
                style={{ marginRight: 4 }}
              >
                Save
              </Button>
            </>
          )}
        </Appbar.Header>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <TopDescription
              visible={true}
              description="Configure session parameters."
            />

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
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
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
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flexDirection: "column", flex: 1 }}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        marginRight: 8,
                      }}
                    >
                      Scoring:
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{
                        fontStyle: "italic",
                      }}
                    >
                      Enable scoring input for games
                    </Text>
                  </View>
                  <Switch
                    value={formData.scoring}
                    onValueChange={(value) =>
                      setFormData({ ...formData, scoring: value })
                    }
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flexDirection: "column", flex: 1 }}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        marginRight: 8,
                      }}
                    >
                      Use Ratings:
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{
                        fontStyle: "italic",
                      }}
                    >
                      Display ratings in game lineups
                    </Text>
                  </View>
                  <Switch
                    value={formData.showRatings}
                    onValueChange={(value) =>
                      setFormData({ ...formData, showRatings: value })
                    }
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flexDirection: "column", flex: 1 }}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        marginRight: 8,
                      }}
                    >
                      Enforce Pairings:
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{
                        fontStyle: "italic",
                      }}
                    >
                      Use strict partnerships when deciding who sits out
                      (partners sit out as units)
                    </Text>
                  </View>
                  <Switch
                    value={formData.partnershipConstraint.enforceAllPairings}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        partnershipConstraint: {
                          partnerships:
                            formData.partnershipConstraint.partnerships,
                          enforceAllPairings: value,
                        },
                      })
                    }
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
                {formData.partnershipConstraint?.partnerships.length > 0 && (
                  <>
                    <Text
                      variant="titleMedium"
                      style={{
                        fontWeight: "600",
                        marginTop: 12,
                        marginBottom: 12,
                      }}
                    >
                      Fixed Partners (
                      {formData.partnershipConstraint.partnerships.length})
                    </Text>
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
                        {formData.partnershipConstraint.partnerships
                          .map((partnership) => {
                            const player1 = players.find(
                              (p) => p.id === partnership.player1Id,
                            );
                            const player2 = players.find(
                              (p) => p.id === partnership.player2Id,
                            );
                            return `${player1?.name} & ${player2?.name}`;
                          })
                          .join(", ")}
                      </Text>
                    </Surface>
                  </>
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

                {/* <Surface
                  style={{
                    alignItems: "center",
                    padding: 24,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                    borderStyle: "dashed",
                  }}
                > */}
                <Surface
                  style={{
                    padding: 12,
                    alignItems: "center",
                    borderRadius: 8,
                    backgroundColor: theme.colors.surfaceVariant,
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
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
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
                          ? ` (${court.minimumRating.toFixed(2)}+)`
                          : ""}
                      </Chip>
                    ))}
                  </View>
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
                      onPress={() => {
                        if (
                          activeCourts.length >
                          initialFormData.current.courts.length
                        ) {
                          adjustCourts("minus");
                        } else {
                          setCourtSnackVisible(true);
                        }
                      }}
                    />
                    <Snackbar
                      visible={courtSnackVisible}
                      duration={4000}
                      icon="close"
                      onIconPress={() => setCourtSnackVisible(false)}
                      onDismiss={() => setCourtSnackVisible(false)}
                      style={{
                        width: 300,
                        backgroundColor: theme.colors.error,
                        padding: 8,
                        borderRadius: 6,
                        marginTop: 12,
                      }}
                    >
                      Existing courts cannot be deleted for in-progress session.
                      Disable the court instead.
                    </Snackbar>
                    <Text>{activeCourts.length}</Text>
                    <IconButton
                      icon="plus"
                      size={20}
                      mode="contained-tonal"
                      onPress={() => adjustCourts("plus")}
                    />
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
            //selectedPlayerIds={formData.playerIds}
            selectedPlayerIds={currentPlayerIdsRef.current}
            pausedPlayerIds={formData.pausedPlayerIds}
            partnershipConstraint={formData.partnershipConstraint}
            session={session || undefined}
            onSelectionChange={updatePlayerIds}
            onPausedPlayersChange={handlePausedPlayers}
            onPartnershipConstraintChange={handlePartnershipConstraintChange}
            onClose={() => setShowPlayerManager(false)}
          />

          <CourtManager
            visible={showCourtManager}
            courts={formData.courts}
            addedCourts={
              session?.courts
                ? formData.courts.filter(
                    (court) =>
                      !session.courts.some(
                        (sessionCourt) => sessionCourt.id === court.id,
                      ),
                  )
                : formData.courts
            }
            sessionState={session ? session.state : SessionState.New}
            onCourtsChange={updateCourts}
            onClose={() => setShowCourtManager(false)}
          />

          <Dialog
            visible={showUnsavedChangesDialog}
            onDismiss={() => setShowUnsavedChangesDialog(false)}
          >
            <Dialog.Title>Unsaved Changes</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                You have unsaved changes to players or courts. Are you sure you
                want to discard these changes?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowUnsavedChangesDialog(false)}>
                Cancel
              </Button>
              <Button
                onPress={handleDiscardChanges}
                mode="contained"
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
              >
                Discard Changes
              </Button>
            </Dialog.Actions>
          </Dialog>
        </SafeAreaView>
      </Modal>
    </>
  );
};
