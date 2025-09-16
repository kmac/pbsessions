import { useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import {
  Appbar,
  Chip,
  Divider,
  IconButton,
  Menu,
  Portal,
  Searchbar,
  SegmentedButtons,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "../store";
import PlayerCard from "./PlayerCard";
import {
  Player,
  Group,
  FixedPartnership,
  PartnershipConstraint,
} from "../types";
import TopDescription from "./TopDescription";
import { v4 as uuidv4 } from "uuid";

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
        },
        subtitle: {
          fontSize: 14,
          marginTop: 2,
        },
        placeholder: {
          width: 40,
        },
        viewModeSelector: {
          flexDirection: "row",
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
          marginBottom: 12,
          paddingVertical: 4,
          borderRadius: 8,
          borderWidth: 0,
          gap: 8,
        },
        searchBar: {
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 16,
        },
        searchInput: {
          flex: 1,
          fontSize: 14,
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
          flex: 1,
        },
        playerNameSelected: {},
        ratingBadge: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
          gap: 2,
        },
        ratingText: {
          fontSize: 12,
          fontWeight: "500",
        },
        playerDetails: {
          gap: 2,
        },
        detailText: {
          fontSize: 12,
        },
        detailTextSelected: {},
        groupItem: {
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          padding: 16,
          marginBottom: 8,
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
          flex: 1,
        },
        groupNameSelected: {},
        groupStats: {
          alignItems: "flex-end",
        },
        groupPlayerCount: {
          fontSize: 14,
          fontWeight: "500",
        },
        groupPlayerCountSelected: {},
        groupDescription: {
          fontSize: 12,
          marginBottom: 4,
        },
        groupDescriptionSelected: {},
        groupPlayersPreview: {
          fontSize: 12,
        },
        groupPlayersPreviewSelected: {},
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
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
          marginTop: 12,
        },
        emptySubtext: {
          fontSize: 14,
          marginTop: 4,
          textAlign: "center",
        },
        partnershipSummary: {
          margin: 16,
          padding: 12,
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: 8,
        },
        partnershipTitle: {
          fontSize: 14,
          fontWeight: "600",
          marginBottom: 8,
        },
        partnershipChips: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        },
      }),
    [theme],
  );
};

interface SessionPlayerManagerProps {
  visible: boolean;
  selectedPlayerIds: string[];
  pausedPlayerIds?: string[];
  partnershipConstraint?: PartnershipConstraint;
  onSelectionChange: (playerIds: string[]) => void;
  onPausedPlayersChange?: (pausedPlayerIds: string[]) => void;
  onPartnershipConstraintChange?: (constraint?: PartnershipConstraint) => void;
  onClose: () => void;
}

type ViewMode = "combined" | "players" | "groups";

export default function SessionPlayerManager({
  visible,
  selectedPlayerIds,
  pausedPlayerIds = [],
  partnershipConstraint,
  onSelectionChange,
  onPausedPlayersChange,
  onPartnershipConstraintChange,
  onClose,
}: SessionPlayerManagerProps) {
  const styles = useStyles();
  const theme = useTheme();
  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);
  const [viewMode, setViewMode] = useState<ViewMode>("groups");
  const [searchQuery, setSearchQuery] = useState("");

  const partnerships = partnershipConstraint?.partnerships || [];

  const [activeMenuPlayer, setActiveMenuPlayer] = useState<Player | null>(null);

  const handleMenuPress = (player: Player) => {
    setActiveMenuPlayer(player);
  };

  const closeMenu = () => {
    setActiveMenuPlayer(null);
  };

  const isPlayerSelected = (playerId: string) => {
    return selectedPlayerIds.includes(playerId);
  };

  const isPlayerPaused = (playerId: string) => {
    return pausedPlayerIds.includes(playerId);
  };

  const getPlayerPartner = (playerId: string): Player | undefined => {
    const partnership = partnerships.find(
      (p) => p.player1Id === playerId || p.player2Id === playerId,
    );
    if (!partnership) return undefined;

    const partnerId =
      partnership.player1Id === playerId
        ? partnership.player2Id
        : partnership.player1Id;

    return players.find((p) => p.id === partnerId);
  };

  const getAvailableForLinking = (playerId: string): Player[] => {
    const currentPartner = getPlayerPartner(playerId);
    if (currentPartner) return [];

    const partneredPlayerIds = new Set(
      partnerships.flatMap((p) => [p.player1Id, p.player2Id]),
    );

    return players.filter(
      (p) =>
        p.id !== playerId &&
        isPlayerSelected(p.id) &&
        !partneredPlayerIds.has(p.id),
    );
  };

  const togglePlayer = (player: Player) => {
    const playerId = player.id;
    if (isPlayerSelected(playerId)) {
      onSelectionChange(selectedPlayerIds.filter((id) => id !== playerId));
      // Remove from paused if unselected
      if (isPlayerPaused(playerId)) {
        onPausedPlayersChange?.(
          pausedPlayerIds.filter((id) => id !== playerId),
        );
      }
      // Remove any partnerships involving this player
      handlePlayerAction(player, "unlink");
    } else {
      onSelectionChange([...selectedPlayerIds, playerId]);
    }
  };

  const handlePlayerAction = (
    player: Player,
    action: "pause" | "unpause" | "link" | "unlink",
  ) => {
    console.log(`handlePlayerAction: ${player.name}, ${action}`);

    switch (action) {
      case "pause":
        if (!isPlayerPaused(player.id)) {
          onPausedPlayersChange?.([...pausedPlayerIds, player.id]);
        }
        break;
      case "unpause":
        if (isPlayerPaused(player.id)) {
          onPausedPlayersChange?.(
            pausedPlayerIds.filter((id) => id !== player.id),
          );
        }
        break;
      case "unlink":
        const updatedPartnerships = partnerships.filter(
          (p) => p.player1Id !== player.id && p.player2Id !== player.id,
        );
        onPartnershipConstraintChange?.(
          updatedPartnerships.length > 0
            ? {
                partnerships: updatedPartnerships,
                enforceAllPairings:
                  partnershipConstraint?.enforceAllPairings || false,
              }
            : undefined,
        );
        break;
    }
  };

  const handleLinkPartner = (player1: Player, player2: Player) => {
    const newPartnership: FixedPartnership = {
      id: uuidv4(),
      player1Id: player1.id,
      player2Id: player2.id,
      name: `${player1.name} & ${player2.name}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updatedPartnerships = [...partnerships, newPartnership];
    onPartnershipConstraintChange?.({
      partnerships: updatedPartnerships,
      enforceAllPairings: partnershipConstraint?.enforceAllPairings || false,
    });
  };

  const toggleGroup = (group: Group) => {
    const groupPlayerIds = group.playerIds;
    const allSelected = groupPlayerIds.every((id) => isPlayerSelected(id));

    if (allSelected) {
      // Remove all group players
      const newSelectedIds = selectedPlayerIds.filter(
        (id) => !groupPlayerIds.includes(id),
      );
      onSelectionChange(newSelectedIds);

      // Remove from paused if unselected
      const newPausedIds = pausedPlayerIds.filter(
        (id) => !groupPlayerIds.includes(id),
      );
      onPausedPlayersChange?.(newPausedIds);

      // Remove any partnerships involving these players
      const updatedPartnerships = partnerships.filter(
        (p) =>
          !groupPlayerIds.includes(p.player1Id) &&
          !groupPlayerIds.includes(p.player2Id),
      );
      if (updatedPartnerships.length !== partnerships.length) {
        onPartnershipConstraintChange?.(
          updatedPartnerships.length > 0
            ? {
                partnerships: updatedPartnerships,
                enforceAllPairings:
                  partnershipConstraint?.enforceAllPairings || false,
              }
            : undefined,
        );
      }
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
    const partner = getPlayerPartner(item.id);
    const availableForLinking = getAvailableForLinking(item.id);

    return (
      <PlayerCard
        player={item}
        isSelected={selectedPlayerIds.includes(item.id)}
        onToggle={togglePlayer}
        compact={true}
        showActions={true}
        isPaused={isPlayerPaused(item.id)}
        partnerName={partner?.name}
        onPlayerAction={handlePlayerAction}
        availableForLinking={availableForLinking}
        onLinkPartner={handleLinkPartner}
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
      //presentationStyle="pageSheet"
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
          description="Select Players for Session (Use ⋮ menu for partnerships & pausing)"
        />

        {/* Partnership Summary */}
        {partnerships.length > 0 && (
          <Surface style={styles.partnershipSummary}>
            <Text style={styles.partnershipTitle}>Fixed Partnerships:</Text>
            <View style={styles.partnershipChips}>
              {partnerships.map((partnership) => {
                const player1 = players.find(
                  (p) => p.id === partnership.player1Id,
                );
                const player2 = players.find(
                  (p) => p.id === partnership.player2Id,
                );
                return (
                  <Chip
                    key={partnership.id}
                    icon="account-heart"
                    compact
                    mode="outlined"
                    style={{ backgroundColor: theme.colors.tertiaryContainer }}
                  >
                    {player1?.name} & {player2?.name}
                  </Chip>
                );
              })}
            </View>
          </Surface>
        )}

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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          {selectedPlayers.length > 0 && (
            <Surface style={styles.section}>
              <Text style={styles.sectionTitle}>
                Selected Players ({selectedPlayers.length})
                {pausedPlayerIds.length > 0 &&
                  ` (${pausedPlayerIds.length} paused)`}
              </Text>
              <View>
                {filteredSelectedPlayers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item) => {
                    const partner = getPlayerPartner(item.id);
                    const availableForLinking = getAvailableForLinking(item.id);

                    return (
                      <PlayerCard
                        key={`selected-${item.id}`}
                        player={item}
                        isSelected={selectedPlayerIds.includes(item.id)}
                        onToggle={togglePlayer}
                        compact={true}
                        showActions={true}
                        isPaused={isPlayerPaused(item.id)}
                        partnerName={partner?.name}
                        onPlayerAction={handlePlayerAction}
                        availableForLinking={availableForLinking}
                        onLinkPartner={handleLinkPartner}
                      />
                    );
                  })}
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
                    .map((item) => {
                      const partner = getPlayerPartner(item.id);
                      const availableForLinking = getAvailableForLinking(
                        item.id,
                      );

                      return (
                        <PlayerCard
                          key={item.id}
                          player={item}
                          isSelected={selectedPlayerIds.includes(item.id)}
                          onToggle={togglePlayer}
                          compact={true}
                          showActions={true}
                          isPaused={isPlayerPaused(item.id)}
                          partnerName={partner?.name}
                          onPlayerAction={handlePlayerAction}
                          availableForLinking={availableForLinking}
                          onLinkPartner={handleLinkPartner}
                          onMenuPress={handleMenuPress}
                          showMenu={true}
                        />
                      );
                    })
                )}
              </View>
            )}
          </Surface>
        </ScrollView>

        {/* Global menu at the end */}
        {activeMenuPlayer && (
          // <Portal>
            <Menu
              visible={!!activeMenuPlayer}
              onDismiss={closeMenu}
              anchor={<View />} // Dummy anchor
              contentStyle={{
                position: "absolute",
                top: 200, // Adjust as needed
                right: 20,
                backgroundColor: theme.colors.surface,
                elevation: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.44,
                shadowRadius: 10.32,
              }}
            >
              <Menu.Item
                onPress={() => {
                  handlePlayerAction(
                    activeMenuPlayer,
                    isPlayerPaused(activeMenuPlayer.id) ? "unpause" : "pause",
                  );
                  closeMenu();
                }}
                title={
                  isPlayerPaused(activeMenuPlayer.id)
                    ? "Resume Player"
                    : "Pause Player"
                }
                leadingIcon={
                  isPlayerPaused(activeMenuPlayer.id) ? "play" : "pause"
                }
              />
              {/* ...other menu items... */}
            </Menu>
          // </Portal>
        )}
      </SafeAreaView>
    </Modal>
  );
}
