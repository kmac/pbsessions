import { useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
} from "react-native";
import {
  Appbar,
  Divider,
  IconButton,
  Searchbar,
  SegmentedButtons,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "../store";
import PlayerCard from "./PlayerCard";
import { Player, Group } from "../types";
import TopDescription from "./TopDescription";

const useStyles = () => {
  const theme = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          // borderBottomColor: theme.colors.borderBottomColor,
          backgroundColor: "white",
        },
        closeButton: {
          padding: 8,
        },
        headerInfo: {
          alignItems: "center",
          flex: 1,
        },
        title: {
          fontSize: 18,
          fontWeight: "600",
          // color: theme.colors.text,
        },
        subtitle: {
          fontSize: 14,
          //color: colors.textSecondary,
          marginTop: 2,
        },
        placeholder: {
          width: 40,
        },
        viewModeSelector: {
          flexDirection: "row",
          //backgroundColor: colors.grayLight,
          margin: 16,
          borderRadius: 8,
          padding: 4,
        },
        viewModeButton: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 6,
          gap: 8,
        },
        viewModeButtonActive: {
          backgroundColor: theme.colors.primaryContainer,
        },
        viewModeButtonText: {
          fontSize: 14,
          fontWeight: "500",
          color: theme.colors.onSurface,
        },
        viewModeButtonTextActive: {
          color: theme.colors.onSurfaceVariant,
        },
        searchContainer: {
          flexDirection: "row",
          alignItems: "center",
          // backgroundColor: "white",
          //marginHorizontal: 16,
          marginBottom: 12,
          // paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 8,
          borderWidth: 0,
          //borderColor: colors.border,
          gap: 8,
        },
        searchBar: {
          flexDirection: "row",
          alignItems: "center",
          //backgroundColor: "white",
          marginHorizontal: 16,
          //marginBottom: 16,
          //paddingHorizontal: 12,
          //paddingVertical: 12,
          //borderRadius: 8,
          //borderWidth: 1,
          //borderColor: colors.border,
          //gap: 8,
        },
        searchInput: {
          flex: 1,
          fontSize: 14,
          //color: theme.colors.primary,
        },
        content: {
          flex: 1,
        },
        section: {
          marginHorizontal: 16,
          marginBottom: 24,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: "600",
          // color: colors.text,
          // color: theme.colors.text,
          marginTop: 12,
          marginBottom: 12,
        },
        divider: {
          marginBottom: 15,
        },
        playerItem: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "white",
          borderRadius: 12,
          padding: 16,
          marginBottom: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
        playerItemSelected: {
          //backgroundColor: colors.primaryLight,
          shadowOpacity: 0.1,
        },
        playerInfo: {
          flex: 1,
        },
        playerHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        },
        playerName: {
          fontSize: 16,
          fontWeight: "600",
          //color: colors.text,
          flex: 1,
        },
        playerNameSelected: {
          //color: "white",
        },
        ratingBadge: {
          flexDirection: "row",
          alignItems: "center",
          //backgroundColor: colors.orangeLight,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
          gap: 2,
        },
        ratingText: {
          fontSize: 12,
          fontWeight: "500",
          //color: colors.orange,
        },
        playerDetails: {
          gap: 2,
        },
        detailText: {
          fontSize: 12,
          //color: colors.textSecondary,
        },
        detailTextSelected: {
          //color: colors.grayLight,
        },
        groupItem: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "white",
          borderRadius: 12,
          padding: 16,
          marginBottom: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
        groupItemSelected: {
          backgroundColor: theme.colors.primaryContainer,
          shadowOpacity: 0.1,
        },
        groupItemPartial: {
          backgroundColor: theme.colors.surfaceVariant,
          //borderWidth: 1,
          //borderColor: theme.colors.primary,
        },
        groupInfo: {
          flex: 1,
        },
        groupHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        },
        groupName: {
          fontSize: 16,
          fontWeight: "600",
          //color: colors.text,
          flex: 1,
        },
        groupNameSelected: {
          //color: "white",
        },
        groupStats: {
          alignItems: "flex-end",
        },
        groupPlayerCount: {
          fontSize: 14,
          fontWeight: "500",
          //color: colors.primary,
        },
        groupPlayerCountSelected: {
          //color: "white",
        },
        groupDescription: {
          fontSize: 12,
          //color: colors.textSecondary,
          marginBottom: 4,
        },
        groupDescriptionSelected: {
          //color: colors.grayLight,
        },
        groupPlayersPreview: {
          fontSize: 12,
          //color: colors.gray,
        },
        groupPlayersPreviewSelected: {
          //color: colors.grayLight,
        },
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          //borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 12,
        },
        checkboxSelected: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        checkboxPartial: {
          borderColor: theme.colors.primary,
        },
        partialIndicator: {
          width: 8,
          height: 8,
          borderRadius: 4,
          //backgroundColor: colors.primary,
        },
        emptyState: {
          alignItems: "center",
          paddingVertical: 32,
          backgroundColor: "white",
          borderRadius: 8,
        },
        emptyText: {
          fontSize: 16,
          fontWeight: "600",
          //color: colors.textSecondary,
          marginTop: 12,
        },
        emptySubtext: {
          fontSize: 14,
          //color: colors.gray,
          marginTop: 4,
          textAlign: "center",
        },
      }),
    [theme],
  );
};

interface SessionPlayerManagerProps {
  visible: boolean;
  selectedPlayerIds: string[];
  onSelectionChange: (playerIds: string[]) => void;
  onClose: () => void;
}

type ViewMode = "combined" | "players" | "groups";

export default function SessionPlayerManager({
  visible,
  selectedPlayerIds,
  onSelectionChange,
  onClose,
}: SessionPlayerManagerProps) {
  const styles = useStyles();
  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);
  const [viewMode, setViewMode] = useState<ViewMode>("groups");
  const [searchQuery, setSearchQuery] = useState("");

  const isPlayerSelected = (playerId: string) => {
    return selectedPlayerIds.includes(playerId);
  };

  const togglePlayer = (player: Player) => {
    const playerId = player.id;
    if (isPlayerSelected(playerId)) {
      onSelectionChange(selectedPlayerIds.filter((id) => id !== playerId));
    } else {
      onSelectionChange([...selectedPlayerIds, playerId]);
    }
  };

  const toggleGroup = (group: Group) => {
    const groupPlayerIds = group.playerIds;
    const allSelected = groupPlayerIds.every((id) => isPlayerSelected(id));

    if (allSelected) {
      // Remove all group players
      onSelectionChange(
        selectedPlayerIds.filter((id) => !groupPlayerIds.includes(id)),
      );
    } else {
      // Add all group players
      const newPlayerIds = [...selectedPlayerIds];
      groupPlayerIds.forEach((id) => {
        if (!newPlayerIds.includes(id)) {
          newPlayerIds.push(id);
        }
      });
      onSelectionChange(newPlayerIds);
    }
  };

  const getGroupPlayers = (group: Group) => {
    return players.filter((p) => group.playerIds.includes(p.id));
  };

  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.email &&
        player.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const selectedPlayers = players.filter((p) => isPlayerSelected(p.id));

  const filteredSelectedPlayers = selectedPlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.email &&
        player.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const renderPlayer = ({ item }: { item: Player }) => {
    return (
      <PlayerCard
        player={item}
        isSelected={selectedPlayerIds.includes(item.id)}
        onToggle={togglePlayer}
        compact={true}
        showActions={true}
      />
    );
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const groupPlayers = getGroupPlayers(item);
    const selectedCount = groupPlayers.filter((p) =>
      isPlayerSelected(p.id),
    ).length;
    const isFullySelected =
      selectedCount === groupPlayers.length && groupPlayers.length > 0;
    const isPartiallySelected =
      selectedCount > 0 && selectedCount < groupPlayers.length;

    return (
      <TouchableOpacity
        style={[
          styles.groupItem,
          isFullySelected && styles.groupItemSelected,
          isPartiallySelected && styles.groupItemPartial,
        ]}
        onPress={() => toggleGroup(item)}
      >
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text
              style={[
                styles.groupName,
                (isFullySelected || isPartiallySelected) &&
                  styles.groupNameSelected,
              ]}
            >
              {item.name}
            </Text>
            <View style={styles.groupStats}>
              <Text
                style={[
                  styles.groupPlayerCount,
                  (isFullySelected || isPartiallySelected) &&
                    styles.groupPlayerCountSelected,
                ]}
              >
                {selectedCount}/{groupPlayers.length}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text
              style={[
                styles.groupDescription,
                (isFullySelected || isPartiallySelected) &&
                  styles.groupDescriptionSelected,
              ]}
            >
              {item.description}
            </Text>
          )}

          {groupPlayers.length > 0 && (
            <Text
              style={[
                styles.groupPlayersPreview,
                (isFullySelected || isPartiallySelected) &&
                  styles.groupPlayersPreviewSelected,
              ]}
              numberOfLines={1}
            >
              {groupPlayers.map((p) => p.name).join(", ")}
            </Text>
          )}
        </View>

        {!isFullySelected && !isPartiallySelected && (
          <IconButton icon="circle-outline" />
        )}
        {isPartiallySelected && <IconButton icon="circle-slice-5" />}
        {isFullySelected && <IconButton icon="circle-slice-8" />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={onClose} />
          <Appbar.Content
            title={
              <Text
                variant="titleLarge"
                style={{
                  alignItems: "center",
                  fontWeight: "600",
                }}
              >
                Session Players
              </Text>
            }
          />
        </Appbar.Header>
        <TopDescription
          visible={true}
          description="Select Players for Session"
        />
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            {
              value: "groups",
              label: `Groups (${groups.length})`,
              icon: "account-multiple-outline",
            },
            {
              value: "players",
              label: `Individual (${players.length})`,
              icon: "account-outline",
            },
          ]}
          style={{ margin: 16 }}
        />

        {viewMode === "players" && (
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search players..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              mode="bar"
              style={styles.searchBar}
            />
          </View>
        )}

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={true}
        >
          {selectedPlayers.length > 0 && (
            <Surface style={styles.section}>
              <Text style={styles.sectionTitle}>
                Selected Players ({selectedPlayers.length})
              </Text>
              <View>
                {filteredSelectedPlayers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item) => (
                    <PlayerCard
                      key={`selected-${item.id}`}
                      player={item}
                      isSelected={selectedPlayerIds.includes(item.id)}
                      onToggle={togglePlayer}
                      compact={true}
                      showActions={true}
                    />
                  ))}
              </View>
            </Surface>
          )}

          <Divider horizontalInset={true} style={styles.divider} />

          <Surface style={styles.section}>
            <Text style={styles.sectionTitle}>
              {viewMode === "groups" ? "Available Groups" : "Available Players"}
            </Text>

            {viewMode === "groups" ? (
              groups.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconButton icon="account-multiple-outline" />
                  <Text style={styles.emptyText}>No groups available</Text>
                  <Text style={styles.emptySubtext}>
                    Create groups to quickly add players
                  </Text>
                </View>
              ) : (
                <View>
                  {[...groups]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((item) => {
                      const groupPlayers = getGroupPlayers(item);
                      const selectedCount = groupPlayers.filter((p) =>
                        isPlayerSelected(p.id),
                      ).length;
                      const isFullySelected =
                        selectedCount === groupPlayers.length &&
                        groupPlayers.length > 0;
                      const isPartiallySelected =
                        selectedCount > 0 &&
                        selectedCount < groupPlayers.length;

                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.groupItem,
                            isFullySelected && styles.groupItemSelected,
                            isPartiallySelected && styles.groupItemPartial,
                          ]}
                          onPress={() => toggleGroup(item)}
                        >
                          <View style={styles.groupInfo}>
                            <View style={styles.groupHeader}>
                              <Text
                                style={[
                                  styles.groupName,
                                  (isFullySelected || isPartiallySelected) &&
                                    styles.groupNameSelected,
                                ]}
                              >
                                {item.name}
                              </Text>
                              <View style={styles.groupStats}>
                                <Text
                                  style={[
                                    styles.groupPlayerCount,
                                    (isFullySelected || isPartiallySelected) &&
                                      styles.groupPlayerCountSelected,
                                  ]}
                                >
                                  {selectedCount}/{groupPlayers.length}
                                </Text>
                              </View>
                            </View>

                            {item.description && (
                              <Text
                                style={[
                                  styles.groupDescription,
                                  (isFullySelected || isPartiallySelected) &&
                                    styles.groupDescriptionSelected,
                                ]}
                              >
                                {item.description}
                              </Text>
                            )}

                            {groupPlayers.length > 0 && (
                              <Text
                                style={[
                                  styles.groupPlayersPreview,
                                  (isFullySelected || isPartiallySelected) &&
                                    styles.groupPlayersPreviewSelected,
                                ]}
                                numberOfLines={1}
                              >
                                {groupPlayers.map((p) => p.name).join(", ")}
                              </Text>
                            )}
                          </View>

                          {!isFullySelected && !isPartiallySelected && (
                            <IconButton icon="circle-outline" />
                          )}
                          {isPartiallySelected && (
                            <IconButton icon="circle-slice-5" />
                          )}
                          {isFullySelected && (
                            <IconButton icon="circle-slice-8" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              )
            ) : (
              <View>
                {filteredPlayers
                  .filter((player) => !isPlayerSelected(player.id))
                  .sort((a, b) => a.name.localeCompare(b.name)).length === 0 ? (
                  <View style={styles.emptyState}>
                    <IconButton icon="account-plus-outline" />
                    <Text style={styles.emptyText}>No players found</Text>
                    <Text style={styles.emptySubtext}>
                      {searchQuery
                        ? "Try a different search term"
                        : "Add players first"}
                    </Text>
                  </View>
                ) : (
                  filteredPlayers
                    .filter((player) => !isPlayerSelected(player.id))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((item) => (
                      <PlayerCard
                        key={item.id}
                        player={item}
                        isSelected={selectedPlayerIds.includes(item.id)}
                        onToggle={togglePlayer}
                        compact={true}
                        showActions={true}
                      />
                    ))
                )}
              </View>
            )}
          </Surface>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
