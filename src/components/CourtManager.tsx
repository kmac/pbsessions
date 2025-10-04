import React, { useEffect, useState } from "react";
import { View, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  Icon,
  IconButton,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
  Dialog,
  Portal,
  HelperText,
} from "react-native-paper";
import { createCourt, Court, SessionState } from "../types";
import { APP_CONFIG } from "../constants";
import { Alert } from "../utils/alert";
import { isNarrowScreen } from "../utils/screenUtil";

interface CourtManagerProps {
  visible: boolean;
  courts: Court[];
  addedCourts: Court[];
  sessionState: SessionState;
  onCourtsChange: (courts: Court[]) => void;
  onClose: () => void;
}

export const CourtManager: React.FC<CourtManagerProps> = ({
  visible,
  courts,
  addedCourts,
  sessionState,
  onCourtsChange,
  onClose,
}) => {
  const theme = useTheme();
  const [localCourts, setLocalCourts] = useState<Court[]>([]);
  const [newCourts, setNewCourts] = useState<Court[]>([...addedCourts]);

  // Temporary state for editing
  const [tempCourtNames, setTempCourtNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [tempActiveStates, setTempActiveStates] = useState<
    Map<string, boolean>
  >(new Map());
  const [tempMinimumRatings, setTempMinimumRatings] = useState<
    Map<string, string>
  >(new Map());

  // Validation state
  const [courtNameErrors, setCourtNameErrors] = useState<Map<string, string>>(
    new Map(),
  );
  const [ratingErrors, setRatingErrors] = useState<Map<string, string>>(
    new Map(),
  );

  // Dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Initialize temporary state when modal opens or courts change
  useEffect(() => {
    if (visible) {
      setLocalCourts([...courts]);
      setNewCourts([...addedCourts]);

      const newTempNames = new Map();
      const newTempActiveStates = new Map();
      const newTempRatings = new Map();

      courts.forEach((court) => {
        newTempNames.set(court.id, court.name);
        newTempActiveStates.set(court.id, court.isActive);
        newTempRatings.set(court.id, court.minimumRating?.toString() || "");
      });

      setTempCourtNames(newTempNames);
      setTempActiveStates(newTempActiveStates);
      setTempMinimumRatings(newTempRatings);

      // Clear validation errors
      setCourtNameErrors(new Map());
      setRatingErrors(new Map());
    }
  }, [courts, visible]);

  const hasUnsavedChanges = (): boolean => {
    // Check if any temporary values differ from original court values
    return localCourts.some((court) => {
      const tempName = tempCourtNames.get(court.id);
      const tempActive = tempActiveStates.get(court.id);
      const tempRating = tempMinimumRatings.get(court.id);
      const originalRating = court.minimumRating?.toString() || "";

      return (
        tempName !== court.name ||
        tempActive !== court.isActive ||
        tempRating !== originalRating
      );
    });
  };

  const isCourtNameUnique = (name: string, currentCourtId: string): boolean => {
    if (!name.trim()) return true; // Empty names are allowed

    return !localCourts.some(
      (court) =>
        court.id !== currentCourtId &&
        court.name?.toLowerCase().trim() === name.toLowerCase().trim(),
    );
  };

  const isNewCourt = (courtId: string): boolean => {
    return !!newCourts.find((court) => court.id === courtId);
  };

  const validateCourtName = (courtId: string, name: string): string => {
    if (name.trim().length > 50) {
      return "Court name must be 50 characters or less";
    }
    if (!isCourtNameUnique(name, courtId)) {
      return "Court name must be unique";
    }
    return "";
  };

  const validateMinimumRating = (rating: string): string => {
    if (!rating.trim()) return ""; // Empty is valid

    const numRating = parseFloat(rating);
    if (isNaN(numRating)) {
      return "Rating must be a valid number";
    }
    if (numRating < 0 || numRating > 10) {
      return "Rating must be between 0 and 10";
    }
    // if (!/^\d+(\.\d{1})?$/.test(rating)) {
    //   return "Rating can have at most one decimal place";
    // }
    return "";
  };

  const handleTempCourtNameChange = (courtId: string, text: string) => {
    const newTempNames = new Map(tempCourtNames);
    const newNameErrors = new Map(courtNameErrors);

    newTempNames.set(courtId, text);

    const error = validateCourtName(courtId, text);
    if (error) {
      newNameErrors.set(courtId, error);
    } else {
      newNameErrors.delete(courtId);
    }

    setTempCourtNames(newTempNames);
    setCourtNameErrors(newNameErrors);
  };

  const handleTempActiveToggle = (courtId: string) => {
    const currentActive = tempActiveStates.get(courtId) || false;
    const activeCourts = Array.from(tempActiveStates.values()).filter(Boolean);

    if (currentActive && activeCourts.length === 1) {
      Alert.alert("Cannot Deactivate", "At least one court must be active");
      return;
    }

    const newTempActiveStates = new Map(tempActiveStates);
    newTempActiveStates.set(courtId, !currentActive);
    setTempActiveStates(newTempActiveStates);
  };

  const handleTempMinimumRatingChange = (courtId: string, rating: string) => {
    const newTempRatings = new Map(tempMinimumRatings);
    const newRatingErrors = new Map(ratingErrors);

    newTempRatings.set(courtId, rating);

    const error = validateMinimumRating(rating);
    if (error) {
      newRatingErrors.set(courtId, error);
    } else {
      newRatingErrors.delete(courtId);
    }

    setTempMinimumRatings(newTempRatings);
    setRatingErrors(newRatingErrors);
  };

  const hasValidationErrors = (): boolean => {
    return courtNameErrors.size > 0 || ratingErrors.size > 0;
  };

  const handleSave = () => {
    // Check for validation errors
    if (hasValidationErrors()) {
      Alert.alert("Validation Error", "Please fix all errors before saving");
      return;
    }

    const activeCourts = Array.from(tempActiveStates.values()).filter(Boolean);
    if (activeCourts.length === 0) {
      Alert.alert("Validation Error", "At least one court must be active");
      return;
    }

    // Apply all temporary changes to courts
    const updatedCourts = localCourts.map((court) => ({
      ...court,
      name: tempCourtNames.get(court.id) || court.name,
      isActive: tempActiveStates.get(court.id) ?? court.isActive,
      minimumRating: tempMinimumRatings.get(court.id)
        ? parseFloat(tempMinimumRatings.get(court.id)!)
        : undefined,
    }));

    onCourtsChange(updatedCourts);
    setNewCourts([]);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowCancelDialog(true);
    } else {
      setNewCourts([]);
      onClose();
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    setNewCourts([]);
    onClose();
  };

  const addCourt = () => {
    if (localCourts.length >= APP_CONFIG.MAX_COURTS) {
      Alert.alert(
        "Maximum Courts",
        `Cannot have more than ${APP_CONFIG.MAX_COURTS} courts`,
      );
      return;
    }
    const newCourt = createCourt(`Court ${localCourts.length + 1}`);
    const updatedCourts = [...localCourts, newCourt];
    setLocalCourts(updatedCourts);
    setNewCourts([...newCourts, newCourt]);

    // Add to temporary state
    const newTempNames = new Map(tempCourtNames);
    const newTempActiveStates = new Map(tempActiveStates);
    const newTempRatings = new Map(tempMinimumRatings);

    newTempNames.set(newCourt.id, newCourt.name);
    newTempActiveStates.set(newCourt.id, newCourt.isActive);
    newTempRatings.set(newCourt.id, "");

    setTempCourtNames(newTempNames);
    setTempActiveStates(newTempActiveStates);
    setTempMinimumRatings(newTempRatings);
  };

  const removeCourt = (courtId: string) => {
    if (localCourts.length <= 1) {
      Alert.alert("Cannot Remove", "Must have at least one court");
      return;
    }
    if (sessionState !== SessionState.New && !isNewCourt(courtId)) {
      Alert.alert(
        "Cannot Remove",
        "Cannot remove this court as it belongs to a session.",
      );
      return;
    }
    const updatedCourts = localCourts.filter((c) => c.id !== courtId);
    setLocalCourts(updatedCourts);
    const updatedNewCourts = newCourts.filter((c) => c.id !== courtId);
    setNewCourts(updatedNewCourts);

    // Remove from temporary state and validation errors
    const newTempNames = new Map(tempCourtNames);
    const newTempActiveStates = new Map(tempActiveStates);
    const newTempRatings = new Map(tempMinimumRatings);
    const newNameErrors = new Map(courtNameErrors);
    const newRatingErrors = new Map(ratingErrors);

    newTempNames.delete(courtId);
    newTempActiveStates.delete(courtId);
    newTempRatings.delete(courtId);
    newNameErrors.delete(courtId);
    newRatingErrors.delete(courtId);

    setTempCourtNames(newTempNames);
    setTempActiveStates(newTempActiveStates);
    setTempMinimumRatings(newTempRatings);
    setCourtNameErrors(newNameErrors);
    setRatingErrors(newRatingErrors);
  };

  const getActiveCourtCount = () => {
    return Array.from(tempActiveStates.values()).filter(Boolean).length;
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={handleClose} />
          <Appbar.Content
            title={isNarrowScreen() ? "Configure" : "Court Configuration"}
            titleStyle={{ fontWeight: "600" }}
          />
          <Button
            icon="content-save"
            mode="contained"
            onPress={handleSave}
            disabled={hasValidationErrors()}
            style={{ marginRight: 8 }}
          >
            Save
          </Button>
        </Appbar.Header>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <Surface
              style={{
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    variant="headlineMedium"
                    style={{
                      fontWeight: "bold",
                      color: theme.colors.primary,
                      marginBottom: 4,
                    }}
                  >
                    {localCourts.length}
                  </Text>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      textAlign: "center",
                    }}
                  >
                    Total Courts
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text
                    variant="headlineMedium"
                    style={{
                      fontWeight: "bold",
                      color: theme.colors.primary,
                      marginBottom: 4,
                    }}
                  >
                    {getActiveCourtCount()}
                  </Text>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      textAlign: "center",
                    }}
                  >
                    Active Courts
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text
                    variant="headlineMedium"
                    style={{
                      fontWeight: "bold",
                      color: theme.colors.primary,
                      marginBottom: 4,
                    }}
                  >
                    {getActiveCourtCount() * 4}
                  </Text>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      textAlign: "center",
                    }}
                  >
                    Players per Game
                  </Text>
                </View>
              </View>
            </Surface>

            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text variant="titleLarge" style={{ fontWeight: "600" }}>
                  Courts
                </Text>
                <Button
                  icon="plus"
                  mode="outlined"
                  onPress={addCourt}
                  disabled={localCourts.length >= APP_CONFIG.MAX_COURTS}
                >
                  Add Court
                </Button>
              </View>

              {localCourts.map((court, index) => {
                const isActive =
                  tempActiveStates.get(court.id) ?? court.isActive;
                const nameError = courtNameErrors.get(court.id);
                const ratingError = ratingErrors.get(court.id);

                return (
                  <Card
                    key={court.id}
                    style={[
                      {
                        marginBottom: 12,
                        marginHorizontal: 8,
                        opacity: isActive ? 1 : 0.7,
                      },
                      isNewCourt(court.id) && {
                        borderLeftWidth: 4,
                        borderLeftColor: theme.colors.tertiary,
                      },
                    ]}
                  >
                    <Card.Content>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: isActive ? 12 : 0,
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 16 }}>
                          <TextInput
                            mode="flat"
                            value={tempCourtNames.get(court.id) || court.name}
                            onChangeText={(text) =>
                              handleTempCourtNameChange(court.id, text)
                            }
                            error={!!nameError}
                            placeholder="Optional"
                            keyboardType="default"
                            dense
                            label="Name"
                            style={{
                              maxWidth: 300,
                              textAlign: "left",
                              fontWeight: "500",
                              color: isActive
                                ? theme.colors.onSurface
                                : theme.colors.onSurfaceVariant,
                            }}
                          />
                          {nameError && (
                            <HelperText type="error" visible={!!nameError}>
                              {nameError}
                            </HelperText>
                          )}
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <Text variant="labelSmall">
                              {isActive ? "Active" : "Inactive"}
                            </Text>
                            <Switch
                              value={isActive}
                              onValueChange={() =>
                                handleTempActiveToggle(court.id)
                              }
                            />
                          </View>

                          {(sessionState === SessionState.New ||
                            isNewCourt(court.id)) &&
                            localCourts.length > 1 && (
                              <IconButton
                                icon="delete"
                                iconColor={theme.colors.primary}
                                onPress={() => removeCourt(court.id)}
                                style={{
                                  marginHorizontal: 8,
                                }}
                              />
                            )}
                        </View>
                      </View>

                      {isActive && (
                        <Surface
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            backgroundColor: theme.colors.surfaceVariant,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Icon source="star-outline" size={16} />
                              <Text
                                variant="labelMedium"
                                style={{
                                  fontWeight: "500",
                                  marginRight: 10,
                                }}
                              >
                                Minimum Rating
                              </Text>
                            </View>
                            <View>
                              <View style={{ position: "relative" }}>
                                <TextInput
                                  mode="outlined"
                                  value={tempMinimumRatings.get(court.id) || ""}
                                  onChangeText={(text) =>
                                    handleTempMinimumRatingChange(
                                      court.id,
                                      text,
                                    )
                                  }
                                  error={!!ratingError}
                                  placeholder="e.g. 3.5"
                                  keyboardType="decimal-pad"
                                  style={{
                                    width: 100,
                                    height: 40,
                                    fontSize: 14,
                                    textAlign: "center",
                                  }}
                                  right={
                                    tempMinimumRatings.get(court.id) ? (
                                      <TextInput.Icon
                                        icon="close-circle"
                                        size={16}
                                        onPress={() =>
                                          handleTempMinimumRatingChange(
                                            court.id,
                                            "",
                                          )
                                        }
                                      />
                                    ) : undefined
                                  }
                                />
                              </View>
                              {ratingError && (
                                <HelperText
                                  type="error"
                                  visible={!!ratingError}
                                  style={{ fontSize: 11 }}
                                >
                                  {ratingError}
                                </HelperText>
                              )}
                            </View>
                          </View>
                          <Text
                            variant="bodySmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              fontStyle: "italic",
                            }}
                          >
                            Only players with this rating or higher can be
                            assigned to this court
                          </Text>
                        </Surface>
                      )}
                    </Card.Content>
                  </Card>
                );
              })}
            </View>

            {Array.from(tempActiveStates.entries()).some(
              ([courtId, isActive]) =>
                isActive && tempMinimumRatings.get(courtId),
            ) && (
              <Surface
                style={{
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: theme.colors.tertiaryContainer,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Icon source="cog-outline" size={20} />
                  <Text
                    variant="titleMedium"
                    style={{
                      fontWeight: "600",
                      color: theme.colors.onTertiaryContainer,
                    }}
                  >
                    Rating Requirements
                  </Text>
                </View>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onTertiaryContainer,
                    lineHeight: 20,
                  }}
                >
                  Courts with minimum ratings will prioritize players based on
                  skill level. Players without ratings will be assigned to
                  courts without minimum requirements.
                </Text>
              </Surface>
            )}

            {sessionState !== SessionState.New && (
              <Surface
                style={{
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: theme.colors.secondaryContainer,
                }}
              >
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSecondaryContainer,
                    //lineHeight: 20,
                  }}
                >
                  Existing courts cannot be deleted for in-progress session.
                  Inactive courts will be excluded from new game assignments.
                </Text>
              </Surface>
            )}
          </ScrollView>

          <Dialog
            visible={showCancelDialog}
            onDismiss={() => setShowCancelDialog(false)}
          >
            <Dialog.Icon icon="alert-outline" />
            <Dialog.Title>Unsaved Changes</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                You have unsaved changes. Are you sure you want to close without
                saving?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowCancelDialog(false)}>
                Continue Editing
              </Button>
              <Button
                onPress={handleCancelConfirm}
                textColor={theme.colors.error}
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
