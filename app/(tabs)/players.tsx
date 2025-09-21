import React, { useState } from "react";
import { View, FlatList, Modal, Platform, ScrollView } from "react-native";
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
  Portal,
  Checkbox,
  Dialog,
} from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store";
import {
  addPlayer,
  updatePlayer,
  removePlayer,
  selectAllPlayers,
} from "@/src/store/slices/playersSlice";
import { updateGroup } from "@/src/store/slices/groupsSlice";
import { getShortGender } from "@/src/utils/util";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import {
  copyToClipboard,
  saveToFile,
  readSelectedFile,
} from "@/src/utils/fileClipboardUtil";
import { Group, Player } from "@/src/types";
import PlayerForm from "@/src/components/PlayerForm";
import TopDescription from "@/src/components/TopDescription";
import BulkAddPlayersModal from "@/src/components/BulkAddPlayersModal";
import { Alert } from "@/src/utils/alert";
import { APP_CONFIG } from "@/src/constants";

import { useTheme } from "react-native-paper";

export default function PlayersTab() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const allPlayers = useSelector(selectAllPlayers);
  const groups = useSelector((state: RootState) => state.groups.groups);

  const [menuVisible, setMenuVisible] = useState(false);
  const [playerAddModalVisible, setPlayerAddModalVisible] = useState(false);
  const [bulkPlayerAddModalVisible, setBulkPlayerAddModalVisible] =
    useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [groupSelectionModalVisible, setGroupSelectionModalVisible] =
    useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportCsvContent, setExportCsvContent] = useState("");
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [importCsvContent, setImportCsvContent] = useState("");

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
    setPlayerAddModalVisible(false);
  };

  const handleUpdatePlayer = (playerData: Player) => {
    dispatch(updatePlayer(playerData));
    setEditingPlayer(null);
    setPlayerAddModalVisible(false);
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
    setPlayerAddModalVisible(true);
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

      if (Platform.OS !== "web") {
        const fileName = `${APP_CONFIG.NAME}-players-${new Date().toISOString().split("T")[0]}.csv`;
        await saveToFile(csvContent, fileName);
      } else {
        setExportCsvContent(csvContent);
        setExportDialogVisible(true);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Failed", "Failed to export players data.");
    }
  };

  const handleImportPlayers = async () => {
    try {
      const { importedPlayers, errors } = parsePlayersFromCsv(importCsvContent);

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

  const handleSelectImportCsvFile = async () => {
    await readSelectedFile((content) => setImportCsvContent(content));
  };

  const handleCancelCsvImport = () => {
    setImportDialogVisible(false);
    setImportCsvContent("");
  };

  const handleCopyToClipboard = async () => {
    copyToClipboard(exportCsvContent, () => setExportDialogVisible(false));
  };

  const handleSaveToFile = async () => {
    const fileName = `${APP_CONFIG.NAME}-players-${new Date().toISOString().split("T")[0]}.json`;
    saveToFile(exportCsvContent, fileName, () => setExportDialogVisible(false));
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
          let gender: "male" | "female" | undefined = undefined;
          if (rowData.gender && rowData.gender.trim() !== "") {
            const genderLower = rowData.gender.toLowerCase().trim();
            if (!validGenders.includes(genderLower)) {
              errors.push(
                `Row ${i + 1}: Invalid gender "${rowData.gender}" (must be: male, female, other)`,
              );
              continue;
            }
            gender = genderLower as "male" | "female";
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

  const renderPlayerList = ({ item: player }: { item: Player }) => {
    const isSelected = selectedPlayerIds.includes(player.id);

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
              {player.name}
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
                  {player.gender && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginRight: 4,
                        color: isSelected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {getShortGender(player.gender)}
                    </Text>
                  )}
                  {player.email && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginRight: 4,
                        color: isSelected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {player.email}
                    </Text>
                  )}
                  {player.phone && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginRight: 4,
                        color: isSelected
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {player.phone}
                    </Text>
                  )}
                </View>
                {player.rating && (
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
                    {player.rating.toFixed(APP_CONFIG.RATING_DECIMAL_PLACES)}
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
                {getPlayerGroupNames(player.id).length > 0 && (
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
                      {getPlayerGroupNames(player.id)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          right={
            isSelected
              ? () => (
                  <View
                    style={{
                      marginLeft: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      source="check-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                )
              : undefined
          }
          onPress={() => handlePlayerSelection(player.id)}
          style={{
            borderRadius: isSelected ? 8 : 0,
          }}
        />
      </Surface>
    );
  };

  // Mobile selection action bar
  const SelectionActionBar = () => {
    if (selectedPlayerIds.length === 0) return null;

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
      <Avatar.Image
        size={38}
        source={require("@/assets/images/pbsessions-logo.png")}
        style={{ marginRight: 8 }}
      />
      <View style={{ flex: 1 }}>
        <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
          Players
        </Text>
      </View>

      {selectedPlayerIds.length > 0 ? (
        <Button mode="elevated" onPress={() => clearSelection()} compact>
          Cancel
        </Button>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Button
            icon="account-multiple-plus-outline"
            mode="contained"
            onPress={() => setBulkPlayerAddModalVisible(true)}
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
                //handleImportPlayers();
                setImportDialogVisible(true);
              }}
              title="Import"
            />
            <Menu.Item
              leadingIcon="export"
              onPress={() => {
                setMenuVisible(false);
                handleExportPlayers();
                //setExportDialogVisible(true);
              }}
              title="Export"
            />
          </Menu>
        </View>
      )}
    </Surface>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <PlayerHeader />

      <Searchbar
        placeholder={`Search players...`}
        onChangeText={setSearchQuery}
        value={searchQuery}
        mode="bar"
        style={{ marginHorizontal: 16, marginTop: 6, marginBottom: 6 }}
      />

      <Text variant="labelMedium" style={{ marginHorizontal: 32 }}>
        {filteredPlayers.length}{" "}
        {allPlayers.length === filteredPlayers.length
          ? "total players"
          : "matching players"}
      </Text>

      <FlatList
        data={[...filteredPlayers].sort((a, b) => a.name.localeCompare(b.name))}
        renderItem={renderPlayerList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: selectedPlayerIds.length > 0 ? 100 : 80,
        }}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={
          <TopDescription
            visible={true}
            description="Configure individual players"
          />
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 64,
            }}
          >
            <Icon source="account-multiple" size={48} />
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

      <SelectionActionBar />

      <Modal
        visible={playerAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PlayerForm
          player={editingPlayer}
          onSave={handleSavePlayer}
          onCancel={() => {
            setPlayerAddModalVisible(false);
            setEditingPlayer(null);
          }}
        />
      </Modal>

      <Modal
        visible={groupSelectionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
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
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 16,
              }}
            >
              <Button
                mode="contained"
                onPress={() => handleConfirmAddToGroups()}
                disabled={selectedGroupIds.length === 0 || groups.length === 0}
              >
                Add to Groups
              </Button>
              <Button mode="outlined" onPress={handleCancelGroupSelection}>
                Cancel
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <BulkAddPlayersModal
        visible={bulkPlayerAddModalVisible}
        onClose={() => setBulkPlayerAddModalVisible(false)}
      />

      <Portal>
        {/* Export CSV Dialog */}
        <Dialog
          visible={exportDialogVisible}
          onDismiss={() => setExportDialogVisible(false)}
          style={{ maxHeight: "80%" }}
        >
          <Dialog.Title>Export Players</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              {Platform.OS === "web"
                ? "Download or copy the JSON data below:"
                : "Save to file or copy the JSON data below:"}
            </Text>
            <TextInput
              mode="outlined"
              multiline
              value={exportCsvContent}
              editable={false}
              style={{
                flex: 1,
                minHeight: 340,
                maxHeight: "60%",
                fontSize: 12,
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
              onPress={() => setExportDialogVisible(false)}
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

        {/* Import CSV Dialog */}
        <Dialog
          visible={importDialogVisible}
          onDismiss={handleCancelCsvImport}
          style={{ height: "80%" }}
        >
          <Dialog.Title>Import Players</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Select a file or paste CSV data to import. Expected format:{"\n"}
              name,email,phone,gender,rating,notes
            </Text>

            <Button
              mode="outlined"
              onPress={handleSelectImportCsvFile}
              icon="file-upload"
              style={{ flex: 1, marginBottom: 12 }}
            >
              Select File
            </Button>

            <TextInput
              mode="flat"
              multiline
              value={importCsvContent}
              onChangeText={(value) => setImportCsvContent(value)}
              placeholder="Import file or paste CSV data here..."
              style={{
                flex: 1,
                minHeight: 340,
                maxHeight: "60%",
                fontSize: 12,
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
                setImportDialogVisible(false);
                setImportCsvContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleImportPlayers}
              icon="import"
              disabled={!importCsvContent.trim()}
            >
              Import
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}
