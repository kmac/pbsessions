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
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  Menu,
  Portal,
  Searchbar,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "../store";
import { renderPlayerCard } from "./render/playerCardRenderer";
import {
  Player,
  Group,
  FixedPartnership,
  PartnershipConstraint,
} from "../types";
import TopDescription from "./TopDescription";
import { v4 as uuidv4 } from "uuid";
import { getPlayer } from "../utils/util";

const useStyles = () => {
  const theme = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
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
          backgroundColor: "white",
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
        groupStats: {
          alignItems: "flex-end",
        },
        groupPlayerCount: {
          fontSize: 14,
          fontWeight: "500",
        },
        groupDescription: {
          fontSize: 12,
          marginBottom: 4,
        },
        groupPlayersPreview: {
          fontSize: 12,
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
  const [activeMenuPlayer, setActiveMenuPlayer] = useState<Player | null>(null);
  const [detailsDialogPlayer, setDetailsDialogPlayer] = useState<Player | null>(
    null,
  );
  const [detailsDialogPlayerPaused, setDetailsDialogPlayerPaused] = useState<
    boolean | null
  >(null);
  const [detailsDialogPartnerId, setDetailsDialogPartnerId] = useState<
    string | null
  >(null);

  const partnerships = partnershipConstraint?.partnerships || [];

  const isPlayerSelected = (playerId: string) => {
    return selectedPlayerIds.includes(playerId);
  };

  const isPlayerPaused = (playerId: string) => {
    return pausedPlayerIds.includes(playerId);
  };

  const getPauseIconState = (playerId: string): boolean => {
    if (detailsDialogPlayerPaused === null) {
      return isPlayerPaused(playerId);
    }
    return detailsDialogPlayerPaused;
  };

  const getPlayerPartner = (playerId: string): Player | undefined => {
    const partnership = partnerships.find(
      (p) => p.player1Id === playerId || p.player2Id === playerId,
    );
    if (!partnership) {
      return undefined;
    }

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
    console.log(`handleLinkPartner: ${player1.name} and ${player2.name}`);
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

  const closeMenu = () => setActiveMenuPlayer(null);

  const closeDetailsDialog = () => {
    setDetailsDialogPlayer(null);
    setDetailsDialogPlayerPaused(null);
    setDetailsDialogPartnerId(null);
  };

  const savePlayerSessionDetails = (player: Player) => {
    // Handle pause/unpause
    if (detailsDialogPlayerPaused !== null) {
      if (detailsDialogPlayerPaused && !isPlayerPaused(player.id)) {
        handlePlayerAction(player, "pause");
      } else if (!detailsDialogPlayerPaused && isPlayerPaused(player.id)) {
        handlePlayerAction(player, "unpause");
      }
    }

    const currentPartner = getPlayerPartner(player.id);

    // Handle partner changes
    if (detailsDialogPartnerId) {
      const dialogPartnerPlayer = getPlayer(players, detailsDialogPartnerId);
      if (currentPartner && currentPartner.name !== dialogPartnerPlayer.name) {
        handlePlayerAction(player, "unlink");
      }
      handleLinkPartner(player, dialogPartnerPlayer);
    } else {
      if (currentPartner) {
        handlePlayerAction(player, "unlink");
      }
    }
    setDetailsDialogPlayer(null);
    setDetailsDialogPartnerId(null);
  };

  const renderPlayer = (player: Player) => {
    const partner = getPlayerPartner(player.id);
    const availableForLinking = getAvailableForLinking(player.id);

    return renderPlayerCard(
      {
        player,
        isSelected: isPlayerSelected(player.id),
        isPaused: isPlayerPaused(player.id),
        partnerName: partner?.name,
        availableForLinking,
        showActions: true,
        showPauseButton: true,
        showDetailsButton: true,
        showPartnershipMenu: true,
      },
      {
        onToggle: togglePlayer,
        onPlayerAction: handlePlayerAction,
        onLinkPartner: handleLinkPartner,
        onShowDetails: setDetailsDialogPlayer,
        onShowPartnershipMenu: setActiveMenuPlayer,
      },
      theme,
    );
  };

  const renderGroup = (group: Group) => {
    const groupPlayers = getGroupPlayers(group);
    const selectedCount = groupPlayers.filter((p) =>
      isPlayerSelected(p.id),
    ).length;
    const isFullySelected =
      selectedCount === groupPlayers.length && groupPlayers.length > 0;
    const isPartiallySelected =
      selectedCount > 0 && selectedCount < groupPlayers.length;

    return (
      <TouchableOpacity
        key={group.id}
        style={[
          styles.groupItem,
          isFullySelected && styles.groupItemSelected,
          isPartiallySelected && styles.groupItemPartial,
        ]}
        onPress={() => toggleGroup(group)}
      >
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.groupStats}>
              <Text style={styles.groupPlayerCount}>
                {selectedCount}/{groupPlayers.length}
              </Text>
            </View>
          </View>

          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}

          {groupPlayers.length > 0 && (
            <Text style={styles.groupPlayersPreview} numberOfLines={1}>
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
    <Modal visible={visible} animationType="slide">
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
          description="Select Players for Session (Use details menu for partnerships & pausing)"
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
              </Text>
              <View>
                {filteredSelectedPlayers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((player) => (
                    <View key={`selected-${player.id}`}>
                      {renderPlayer(player)}
                    </View>
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
                    .map((group) => renderGroup(group))}
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
                    .map((player) => renderPlayer(player))
                )}
              </View>
            )}
          </Surface>
        </ScrollView>

        {/* <Portal> */}
        <Dialog
          visible={!!detailsDialogPlayer}
          onDismiss={closeDetailsDialog}
          style={{
            alignSelf: "center",
            width: "80%",
            maxWidth: 400,
            position: "absolute",
            margin: 16,
            right: 16,
            top: 200, // Adjust based on your bottom navigation/safe area
            zIndex: 4000,
          }}
        >
          <Dialog.Title>Session Player Configuration</Dialog.Title>
          {detailsDialogPlayer && (
            <Dialog.Content>
              <Text
                variant="titleLarge"
                style={{
                  marginBottom: 16,
                  color: theme.colors.onSecondaryContainer,
                  backgroundColor: theme.colors.secondaryContainer,
                }}
              >
                {detailsDialogPlayer.name}
              </Text>
              {/* <Text variant="labelSmall">Player options for this session</Text> */}
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 24,
                    gap: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text variant="bodyMedium" style={{ marginRight: 8 }}>
                      Paused:
                    </Text>
                    <Switch
                      value={getPauseIconState(detailsDialogPlayer.id)}
                      onValueChange={(value) =>
                        setDetailsDialogPlayerPaused(value)
                      }
                    />
                  </View>
                  {getPauseIconState(detailsDialogPlayer.id) && (
                    <Text variant="labelSmall" style={{ fontStyle: "italic" }}>
                      Player wil be excluded from any new games.
                    </Text>
                  )}
                </View>
                <Divider />
                <View
                  style={{
                    flexDirection: "column",
                  }}
                >
                  <Text variant="titleSmall">Fixed Partnership</Text>
                  <Text variant="labelSmall">
                    Select a player to partner with for this session.
                  </Text>
                  <Dropdown
                    style={{
                      margin: 8,
                      marginTop: 16,
                      height: 40,
                      backgroundColor: theme.colors.secondaryContainer,
                      borderBottomColor: theme.colors.secondary,
                      borderBottomWidth: 0.5,
                      minWidth: 200,
                    }}
                    containerStyle={{
                      margin: 8,
                      backgroundColor: theme.colors.onSecondary,
                    }}
                    itemTextStyle={{
                      color: theme.colors.secondary,
                      // backgroundColor: theme.colors.secondary,
                      fontSize: 14,
                    }}
                    placeholderStyle={{
                      color: theme.colors.primary,
                      fontSize: 14,
                    }}
                    selectedTextStyle={{
                      color: theme.colors.primary,
                      margin: 8,
                      fontSize: 16,
                    }}
                    inputSearchStyle={{
                      height: 40,
                      fontSize: 14,
                      color: theme.colors.primary,
                    }}
                    iconStyle={{
                      width: 20,
                      height: 20,
                    }}
                    data={getAvailableForLinking(detailsDialogPlayer.id).map(
                      (player) => {
                        return { label: player.name, value: player.id };
                      },
                    )}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select partner"
                    searchPlaceholder="Search..."
                    value={detailsDialogPartnerId}
                    onChange={(item) => {
                      setDetailsDialogPartnerId(item.value);
                    }}
                    renderLeftIcon={() => (
                      <IconButton
                        icon="close"
                        size={14}
                        onPress={() => setDetailsDialogPartnerId(null)}
                      />
                    )}
                  />
                </View>
              </View>
            </Dialog.Content>
          )}
          <Dialog.Actions>
            <Button onPress={closeDetailsDialog}>Cancel</Button>
            <Button
              onPress={() =>
                detailsDialogPlayer &&
                savePlayerSessionDetails(detailsDialogPlayer)
              }
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Partnership Menu 


          TODO remove this

        */}
        <Menu
          visible={!!activeMenuPlayer}
          onDismiss={closeMenu}
          anchor={<View />} // Will be positioned absolutely
          contentStyle={{
            position: "absolute",
            top: 200,
            right: 20,
            backgroundColor: theme.colors.surface,
            //elevation: 20,
            zIndex: 5000,
          }}
        >
          {activeMenuPlayer && (
            <>
              {getPlayerPartner(activeMenuPlayer.id) ? (
                <Menu.Item
                  onPress={() => {
                    handlePlayerAction(activeMenuPlayer, "unlink");
                    closeMenu();
                  }}
                  title={`Unlink from ${getPlayerPartner(activeMenuPlayer.id)?.name}`}
                  leadingIcon="account-heart-outline"
                />
              ) : (
                getAvailableForLinking(activeMenuPlayer.id).map(
                  (availablePlayer) => (
                    <Menu.Item
                      key={availablePlayer.id}
                      onPress={() => {
                        handleLinkPartner(activeMenuPlayer, availablePlayer);
                        closeMenu();
                      }}
                      title={availablePlayer.name}
                      leadingIcon="account"
                    />
                  ),
                )
              )}
            </>
          )}
        </Menu>
        {/* </Portal> */}
      </SafeAreaView>
    </Modal>
  );
}
