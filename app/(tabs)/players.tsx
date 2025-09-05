import React, { useState } from "react";
import {
  View,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  Chip,
  Icon,
  IconButton,
  List,
  Searchbar,
  Surface,
  Text,
  TextInput,
  FAB,
  Menu,
  Divider,
  Portal,
  Checkbox,
} from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import { Users } from "lucide-react-native";
import { RootState } from "@/src/store";
import {
  addPlayer,
  updatePlayer,
  removePlayer,
  selectAllPlayers,
} from "@/src/store/slices/playersSlice";
import { updateGroup } from "@/src/store/slices/groupsSlice";
import { getShortGender } from "@/src/utils/util";
import { Group, Player } from "@/src/types";
import PlayerForm from "@/src/components/PlayerForm";
import BulkAddPlayersModal from "@/src/components/BulkAddPlayersModal";
import { Alert } from "@/src/utils/alert";
import { APP_CONFIG } from "@/src/constants";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { useTheme } from "react-native-paper";

export default function PlayersTab() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const allPlayers = useSelector(selectAllPlayers);
  const groups = useSelector((state: RootState) => state.groups.groups);

  const { width: screenWidth } = Dimensions.get("window");
  const isNarrowScreen = screenWidth < 768;

  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [csvImportModalVisible, setCsvImportModalVisible] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [groupSelectionModalVisible, setGroupSelectionModalVisible] =
    useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const filteredPlayers = allPlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.email &&
        player.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleAddPlayer = (
    playerData: Omit<Player, "id" | "createdAt" | "updatedAt">,
  ) => {
    dispatch(addPlayer(playerData));
    setModalVisible(false);
  };

  const handleUpdatePlayer = (playerData: Player) => {
    dispatch(updatePlayer(playerData));
    setEditingPlayer(null);
    setModalVisible(false);
  };

  const handleSavePlayer = (
    playerData: Omit<Player, "id" | "createdAt" | "updatedAt"> | Player,
  ) => {
    if (editingPlayer && "id" in playerData) {
      handleUpdatePlayer(playerData as Player);
    } else {
      handleAddPlayer(
        playerData as Omit<Player, "id" | "createdAt" | "updatedAt">,
      );
    }
  };

  const handleDeletePlayer = (player: Player) => {
    // Check if player is in any groups
    const playerGroups = groups.filter((group) =>
      group.playerIds.includes(player.id),
    );
    if (playerGroups.length > 0) {
      Alert.alert(
        "Cannot Delete Player",
        `${player.name} is assigned to ${playerGroups.length} group(s). Remove them from all groups first.`,
        [{ text: "OK" }],
      );
      return;
    }
    Alert.alert(
      "Delete Player",
      `Are you sure you want to delete ${player.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => dispatch(removePlayer(player.id)),
        },
      ],
    );
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setModalVisible(true);
  };

  function getPlayerGroups(playerId: string): Group[] {
    return groups.filter((group) => group.playerIds.includes(playerId));
  }

  function getPlayerGroupNames(playerId: string): string {
    return getPlayerGroups(playerId)
      .map((group) => group.name)
      .join(", ");
  }

  const handleExportPlayers = async () => {
    try {
      if (allPlayers.length === 0) {
        Alert.alert("No Data", "No players to export.");
        return;
      }

      // CSV headers for user-editable fields only
      const headers = ["name", "email", "phone", "gender", "rating", "notes"];

      // Convert players to CSV rows
      const csvRows = allPlayers.map((player) => [
        `"${(player.name || "").replace(/"/g, '""')}"`,
        `"${(player.email || "").replace(/"/g, '""')}"`,
        `"${(player.phone || "").replace(/"/g, '""')}"`,
        `"${(player.gender || "").replace(/"/g, '""')}"`,
        player.rating !== undefined ? player.rating.toString() : "",
        `"${(player.notes || "").replace(/"/g, '""')}"`,
      ]);

      // Combine headers and data
      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const fileName = `players_export_${timestamp}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      if (Platform.OS !== "web") {
        // Write file
        // Export error: Error: The method or property
        // expo-file-system.writeAsStringAsync is not available on web, are you
        // sure you've linked all the native dependencies properly?
        await FileSystem.writeAsStringAsync(filePath, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: "text/csv",
            dialogTitle: "Export Players",
          });
        } else {
          Alert.alert("Export Complete", `File saved as ${fileName}`);
        }
      } else {
        Alert.alert("Export", csvContent);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Failed", "Failed to export players data.");
    }
  };

  const handleImportPlayers = async () => {
    if (Platform.OS === "web") {
      handleImportPlayersWeb();
      return;
    }
    try {
      // Pick CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;

      // Read file content
      const csvContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const { importedPlayers, errors } = parsePlayersFromCsv(csvContent);

      // Show errors if any
      if (errors.length > 0) {
        Alert.alert(
          "Import Warnings",
          `${errors.length} error(s) occurred:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? "\n..." : ""}`,
          [{ text: "OK" }],
        );
      }

      if (importedPlayers.length === 0) {
        Alert.alert("Import Failed", "No valid players found to import.");
        return;
      }

      // Confirm import
      Alert.alert(
        "Confirm Import",
        `Import ${importedPlayers.length} player(s)?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            onPress: () => {
              importedPlayers.forEach((playerData) => {
                dispatch(addPlayer(playerData));
              });
              Alert.alert(
                "Success",
                `Imported ${importedPlayers.length} player(s).`,
              );
            },
          },
        ],
      );
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Import Failed", "Failed to import players data.");
    }
  };

  const handleImportPlayersWeb = async () => {
    setCsvText("");
    setCsvImportModalVisible(true);
  };

  const handleCsvImport = () => {
    if (!csvText.trim()) {
      Alert.alert("No Data", "Please paste CSV data to import.");
      return;
    }

    const { importedPlayers, errors } = parsePlayersFromCsv(csvText);

    // Show errors if any
    if (errors.length > 0) {
      Alert.alert(
        "Import Warnings",
        `${errors.length} error(s) occurred:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? "\n..." : ""}`,
        [{ text: "OK" }],
      );
    }

    if (importedPlayers.length === 0) {
      Alert.alert("Import Failed", "No valid players found to import.");
      return;
    }

    // Close modal first
    setCsvImportModalVisible(false);
    setCsvText("");

    // Confirm import
    Alert.alert(
      "Confirm Import",
      `Import ${importedPlayers.length} player(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: () => {
            importedPlayers.forEach((playerData) => {
              dispatch(addPlayer(playerData));
            });
            Alert.alert(
              "Success",
              `Imported ${importedPlayers.length} player(s).`,
            );
          },
        },
      ],
    );
  };

  const handleCancelCsvImport = () => {
    setCsvImportModalVisible(false);
    setCsvText("");
  };

  const parsePlayersFromCsv = (
    csvContent: string,
  ): {
    importedPlayers: Omit<Player, "id" | "createdAt" | "updatedAt">[];
    errors: string[];
  } => {
    const importedPlayers: Omit<Player, "id" | "createdAt" | "updatedAt">[] =
      [];
    const errors: string[] = [];

    try {
      // Parse CSV
      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        errors.push("CSV data must contain headers and at least one data row.");
        return { importedPlayers, errors };
      }

      const headers = lines[0]
        .split(",")
        .map((h) => h.replace(/"/g, "").trim().toLowerCase());
      const expectedHeaders = [
        "name",
        "email",
        "phone",
        "gender",
        "rating",
        "notes",
      ];

      // Validate that name header exists (required field)
      if (!headers.includes("name")) {
        errors.push('CSV must contain a "name" column.');
        return { importedPlayers, errors };
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          // Parse CSV row with proper quote handling
          const values: string[] = [];
          let current = "";
          let inQuotes = false;

          for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
              if (inQuotes && lines[i][j + 1] === '"') {
                current += '"';
                j++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // Add last value

          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || "";
          });

          // Validate required fields
          if (!rowData.name || rowData.name.trim() === "") {
            errors.push(`Row ${i + 1}: Name is required`);
            continue;
          }

          // Check for duplicate names (case-insensitive)
          const existingPlayer = allPlayers.find(
            (p) =>
              p.name.toLowerCase().trim() === rowData.name.toLowerCase().trim(),
          );
          if (existingPlayer) {
            errors.push(
              `Row ${i + 1}: Player "${rowData.name}" already exists`,
            );
            continue;
          }

          // Validate and convert rating
          let rating: number | undefined = undefined;
          if (rowData.rating && rowData.rating.trim() !== "") {
            const ratingNum = parseFloat(rowData.rating);
            if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
              errors.push(
                `Row ${i + 1}: Invalid rating "${rowData.rating}" (must be 0-10)`,
              );
              continue;
            }
            rating = ratingNum;
          }

          // Validate gender
          const validGenders = ["male", "female", "other"];
          let gender: "male" | "female" | "other" | undefined = undefined;
          if (rowData.gender && rowData.gender.trim() !== "") {
            const genderLower = rowData.gender.toLowerCase().trim();
            if (!validGenders.includes(genderLower)) {
              errors.push(
                `Row ${i + 1}: Invalid gender "${rowData.gender}" (must be: male, female, other)`,
              );
              continue;
            }
            gender = genderLower as "male" | "female" | "other";
          }

          // Create player object
          const playerData: Omit<Player, "id" | "createdAt" | "updatedAt"> = {
            name: rowData.name.trim(),
            email: rowData.email?.trim() || undefined,
            phone: rowData.phone?.trim() || undefined,
            gender: gender,
            rating: rating,
            notes: rowData.notes?.trim() || undefined,
          };

          importedPlayers.push(playerData);
        } catch (error) {
          errors.push(
            `Row ${i + 1}: Parse error - ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    } catch (error) {
      errors.push(
        `Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return { importedPlayers, errors };
  };

  function getAvatarName(name: string, props: any) {
    let initials: string = "";
    if (name.length > 1) {
      name.split(" ").forEach((val) => {
        initials += val.charAt(0);
      });
    } else {
      initials = name.charAt(0);
    }

    return (
      <Avatar.Text
        /*...props*/ style={{ marginLeft: 12 }}
        label={initials}
        size={40}
      />
    );
  }

  const handlePlayerSelection = (playerId: string) => {
    if (!isNarrowScreen) {
      return;
    }

    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const clearSelection = (playerIds?: string[]): number => {
    if (!playerIds || playerIds.length === selectedPlayerIds.length) {
      setSelectedPlayerIds([]);
      return 0;
    } else {
      setSelectedPlayerIds(
        selectedPlayerIds.filter((playerId) => !playerIds.includes(playerId)),
      );
      return selectedPlayerIds.length;
    }
  };

  const handleBulkEdit = () => {
    if (selectedPlayerIds.length === 1) {
      const player = allPlayers.find((p) => p.id === selectedPlayerIds[0]);
      if (player) {
        handleEditPlayer(player);
        clearSelection();
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedPlayerIds.length === 0) return;

    const selectedPlayers = allPlayers.filter((p) =>
      selectedPlayerIds.includes(p.id),
    );
    const playerNames = selectedPlayers.map((p) => p.name).join(", ");

    Alert.alert(
      "Delete Players",
      `Are you sure you want to delete ${selectedPlayerIds.length} player(s)?\n\n${playerNames}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const deletedPlayerIds: string[] = [];
            selectedPlayers.forEach((player) => {
              // Check if player is in any groups
              const playerGroups = groups.filter((group) =>
                group.playerIds.includes(player.id),
              );
              if (playerGroups.length === 0) {
                deletedPlayerIds.push(player.id);
                dispatch(removePlayer(player.id));
              }
            });
            const numUndeleted = clearSelection(deletedPlayerIds);
            if (numUndeleted > 0) {
              Alert.alert(
                `Cannot delete ${numUndeleted} player(s). Remove players from all groups first.}`,
              );
            }
          },
        },
      ],
    );
  };

  const handleAddToGroup = () => {
    if (selectedPlayerIds.length === 0) return;

    // Reset selected groups and show modal
    setSelectedGroupIds([]);
    setGroupSelectionModalVisible(true);
  };

  const handleGroupSelection = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleConfirmAddToGroups = (showSuccess = false) => {
    if (selectedGroupIds.length === 0) {
      Alert.alert("No Groups Selected", "Please select at least one group.");
      return;
    }

    // Add selected players to selected groups
    selectedGroupIds.forEach((groupId) => {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        // Get unique player IDs to avoid duplicates
        const newPlayerIds = [
          ...new Set([...group.playerIds, ...selectedPlayerIds]),
        ];
        dispatch(
          updateGroup({
            ...group,
            playerIds: newPlayerIds,
          }),
        );
      }
    });

    if (showSuccess) {
      const groupNames = groups
        .filter((g) => selectedGroupIds.includes(g.id))
        .map((g) => g.name)
        .join(", ");

      Alert.alert(
        "Success",
        `Added ${selectedPlayerIds.length} player(s) to ${selectedGroupIds.length} group(s): ${groupNames}`,
      );
    }

    // Clean up
    setGroupSelectionModalVisible(false);
    setSelectedGroupIds([]);
    clearSelection();
  };

  const handleCancelGroupSelection = () => {
    setGroupSelectionModalVisible(false);
    setSelectedGroupIds([]);
  };

  const renderPlayerList = ({ item }: { item: Player }) => {
    const isSelected = isNarrowScreen && selectedPlayerIds.includes(item.id);

    return (
      <Surface
        style={{
          margin: 0,
          backgroundColor: isSelected
            ? theme.colors.secondaryContainer
            : theme.colors.surface,
        }}
      >
        <List.Item
          title={() => (
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "600",
                marginBottom: 4,
                color: isSelected
                  ? theme.colors.onSecondaryContainer
                  : theme.colors.onSurface,
              }}
            >
              {item.name}
            </Text>
          )}
          description={() => (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 20,
                }}
              >
                <View style={{ flexDirection: "row", flex: 3 }}>
                  {item.gender && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginRight: 4,
                        color: isSelected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {getShortGender(item.gender)}
                    </Text>
                  )}
                  {item.email && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginRight: 4,
                        color: isSelected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {item.email}
                    </Text>
                  )}
                  {item.phone && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginRight: 4,
                        color: isSelected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {item.phone}
                    </Text>
                  )}
                </View>
                {item.rating && (
                  <Chip
                    icon="star-outline"
                    elevated={true}
                    compact={true}
                    textStyle={{
                      fontSize: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {item.rating.toFixed(APP_CONFIG.RATING_DECIMAL_PLACES)}
                  </Chip>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 20,
                }}
              >
                {getPlayerGroupNames(item.id).length > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon
                      source="account-group"
                      size={20}
                      color={
                        isSelected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "400",
                        marginLeft: 5,
                        color: isSelected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {getPlayerGroupNames(item.id)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          left={
            isNarrowScreen
              ? isSelected
                ? () => (
                    <Icon
                      source="check-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )
                : undefined
              : (props) => getAvatarName(item.name, props)
          }
          right={
            isNarrowScreen
              ? undefined
              : (props) => (
                  <View
                    {...props}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      icon="pencil"
                      onPress={() => handleEditPlayer(item)}
                    />
                    <IconButton
                      icon="delete"
                      onPress={() => handleDeletePlayer(item)}
                    />
                  </View>
                )
          }
          onPress={
            isNarrowScreen ? () => handlePlayerSelection(item.id) : undefined
          }
          style={{
            borderRadius: isSelected ? 8 : 0,
          }}
        />
      </Surface>
    );
  };

  // Mobile selection action bar
  const SelectionActionBar = () => {
    if (!isNarrowScreen || selectedPlayerIds.length === 0) return null;

    return (
      <Portal>
        <Surface
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outlineVariant,
            backgroundColor: theme.colors.surface,
          }}
          elevation={4}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text variant="titleMedium" style={{ fontWeight: "600" }}>
              {selectedPlayerIds.length} selected
            </Text>
            <IconButton
              icon="close"
              size={20}
              onPress={() => clearSelection()}
              style={{ marginLeft: 8 }}
            />
          </View>

          {/*<View style={{ flexDirection: "row", align: "center", gap: 8 }}>*/}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
               paddingVertical: 4,
              // borderBottomWidth: 1,
              // borderBottomColor: theme.colors.surfaceVariant,
            }}
          >
            {selectedPlayerIds.length === 1 && (
              <IconButton
                icon="pencil"
                mode="contained"
                onPress={handleBulkEdit}
              />
            )}
            <Button
              icon="account-group"
              mode="contained-tonal"
              onPress={handleAddToGroup}
              compact
            >
              Group
            </Button>
            <IconButton
              icon="delete"
              mode="contained"
              onPress={handleBulkDelete}
            />
          </View>
        </Surface>
      </Portal>
    );
  };

  const PlayerHeader = () => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceVariant,
      }}
    >
      <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
        Players ({filteredPlayers.length})
      </Text>

      {isNarrowScreen ? (
        selectedPlayerIds.length > 0 ? (
          <Button mode="elevated" onPress={() => clearSelection()} compact>
            Cancel
          </Button>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Button
              icon="account-multiple-plus-outline"
              mode="contained"
              onPress={() => setBulkModalVisible(true)}
              compact={false}
            >
              Add
            </Button>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              {/*<Menu.Item
                leadingIcon="account-multiple-plus-outline"
                onPress={() => {
                  setMenuVisible(false);
                  setBulkModalVisible(true);
                }}
                title="Bulk Add"
              />
              <Divider />*/}
              <Menu.Item
                leadingIcon="import"
                onPress={() => {
                  setMenuVisible(false);
                  handleImportPlayers();
                }}
                title="Import"
              />
              <Menu.Item
                leadingIcon="export"
                onPress={() => {
                  setMenuVisible(false);
                  handleExportPlayers();
                }}
                title="Export"
              />
            </Menu>
          </View>
        )
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            icon="account-multiple-plus-outline"
            mode="elevated"
            onPress={() => setBulkModalVisible(true)}
          >
            Bulk Add
          </Button>
          <Button icon="import" mode="elevated" onPress={handleImportPlayers}>
            Import
          </Button>
          <Button icon="export" mode="elevated" onPress={handleExportPlayers}>
            Export
          </Button>
          <Button
            icon="account-plus-outline"
            mode="contained-tonal"
            onPress={() => setModalVisible(true)}
          >
            Add Player
          </Button>
        </View>
      )}
    </View>
  );

  // Mobile FAB for quick access to primary action
  const PrimaryFAB = () => {
    if (!isNarrowScreen || selectedPlayerIds.length > 0) {
      return null;
    }
    return (
      <FAB
        icon="account-plus"
        onPress={() => setModalVisible(true)}
        color={theme.colors.onSecondary}
        style={{
          position: "absolute",
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.secondary,
        }}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PlayerHeader />

      <Searchbar
        placeholder="Search players..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        mode="bar"
        style={{ marginHorizontal: 16, marginTop: 6, marginBottom: 6 }}
      />

      <FlatList
        data={[...filteredPlayers].sort((a, b) => a.name.localeCompare(b.name))}
        renderItem={renderPlayerList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: isNarrowScreen
            ? selectedPlayerIds.length > 0
              ? 100
              : 80
            : 16,
        }}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 64,
            }}
          >
            <Users size={48} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginTop: 16,
              }}
            >
              No players yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                marginTop: 4,
              }}
            >
              Add players to start organizing sessions
            </Text>
          </View>
        }
      />

      <PrimaryFAB />
      <SelectionActionBar />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PlayerForm
          player={editingPlayer}
          onSave={handleSavePlayer}
          onCancel={() => {
            setModalVisible(false);
            setEditingPlayer(null);
          }}
        />
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        visible={csvImportModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                Import Players from CSV
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={handleCancelCsvImport}
              />
            </View>

            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Paste your CSV data below. Expected format:
              {"\n"}name,email,phone,gender,rating,notes
            </Text>

            <ScrollView style={{ flex: 1 }}>
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={15}
                value={csvText}
                onChangeText={setCsvText}
                placeholder="Paste CSV data here..."
                style={{ minHeight: 300 }}
                contentStyle={{
                  fontFamily:
                    Platform.OS === "ios" ? "Courier New" : "monospace",
                  fontSize: 14,
                }}
              />
            </ScrollView>

            <View
              style={{
                flexDirection: isNarrowScreen ? "column" : "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 16,
              }}
            >
              {isNarrowScreen ? (
                // Mobile: Primary action first, then secondary
                <>
                  <Button
                    mode="contained"
                    onPress={handleCsvImport}
                    disabled={!csvText.trim()}
                  >
                    Parse CSV
                  </Button>
                  <Button mode="outlined" onPress={handleCancelCsvImport}>
                    Cancel
                  </Button>
                </>
              ) : (
                // Desktop: Cancel first, then primary action (standard pattern)
                <>
                  <Button mode="outlined" onPress={handleCancelCsvImport}>
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleCsvImport}
                    disabled={!csvText.trim()}
                  >
                    Parse CSV
                  </Button>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={groupSelectionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                Add to Group(s)
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={handleCancelGroupSelection}
              />
            </View>

            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Adding {selectedPlayerIds.length} player(s) to selected groups:
            </Text>

            {groups.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Icon
                  source="account-group"
                  size={48}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="titleMedium"
                  style={{ marginTop: 16, textAlign: "center" }}
                >
                  No Groups Available
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ marginTop: 8, textAlign: "center" }}
                >
                  Create groups first to add players to them.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }}>
                {groups.map((group) => (
                  <Surface
                    key={group.id}
                    style={{
                      marginBottom: 8,
                      borderRadius: 8,
                    }}
                  >
                    <List.Item
                      title={group.name}
                      description={`${group.playerIds.length} player(s)`}
                      left={(props) => (
                        <Checkbox
                          status={
                            selectedGroupIds.includes(group.id)
                              ? "checked"
                              : "unchecked"
                          }
                          onPress={() => handleGroupSelection(group.id)}
                        />
                      )}
                      right={(props) => (
                        <Icon
                          source="account-group"
                          size={24}
                          color={theme.colors.onSurfaceVariant}
                        />
                      )}
                      onPress={() => handleGroupSelection(group.id)}
                      style={{
                        backgroundColor: selectedGroupIds.includes(group.id)
                          ? theme.colors.secondaryContainer
                          : theme.colors.surface,
                        borderRadius: 8,
                      }}
                    />
                  </Surface>
                ))}
              </ScrollView>
            )}

            <View
              style={{
                flexDirection: isNarrowScreen ? "column" : "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 16,
              }}
            >
              {isNarrowScreen ? (
                <>
                  <Button
                    mode="contained"
                    onPress={() => handleConfirmAddToGroups()}
                    disabled={
                      selectedGroupIds.length === 0 || groups.length === 0
                    }
                  >
                    Add to Groups
                  </Button>
                  <Button mode="outlined" onPress={handleCancelGroupSelection}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button mode="outlined" onPress={handleCancelGroupSelection}>
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleConfirmAddToGroups()}
                    disabled={
                      selectedGroupIds.length === 0 || groups.length === 0
                    }
                  >
                    Add to Groups
                  </Button>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <BulkAddPlayersModal
        visible={bulkModalVisible}
        onClose={() => setBulkModalVisible(false)}
      />
    </SafeAreaView>
  );
}
