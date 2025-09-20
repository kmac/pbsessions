import React, { useState, useEffect } from "react";
import { View, Modal, FlatList, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  Icon,
  SegmentedButtons,
  Searchbar,
  Surface,
  Text,
  useTheme,
  FAB,
  Chip,
} from "react-native-paper";
import { useAppSelector, useAppDispatch } from "@/src/store";
import { addPlayer } from "@/src/store/slices/playersSlice";
import { Player, FixedPartnership, PartnershipConstraint } from "@/src/types";
import PlayerCard from "./PlayerCard";
import { renderPlayerCard } from "./render/playerCardRenderer";
import PlayerForm from "./PlayerForm";
import { Alert } from "@/src/utils/alert";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import { v4 as uuidv4 } from "uuid";

interface GroupPlayerManagerProps {
  visible: boolean;
  groupName: string;
  groupPlayers: Player[];
  onSave: (groupPlayers: Player[]) => void;
  onCancel: () => void;
  pausedPlayerIds?: string[];
  partnershipConstraint?: PartnershipConstraint;
  onPausedPlayersChange?: (pausedPlayerIds: string[]) => void;
  onPartnershipConstraintChange?: (constraint?: PartnershipConstraint) => void;
}

type ViewMode = "select" | "add";

export default function GroupPlayerManager({
  visible,
  groupName,
  groupPlayers,
  onSave,
  onCancel,
  pausedPlayerIds = [],
  partnershipConstraint,
  onPausedPlayersChange,
  onPartnershipConstraintChange,
}: GroupPlayerManagerProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { players: allPlayers } = useAppSelector((state) => state.players);

  const [selectedPlayers, setSelectedPlayers] =
    useState<Player[]>(groupPlayers);

  const narrowScreen = isNarrowScreen();

  // Sync selectedPlayers with groupPlayers when props change
  useEffect(() => {
    setSelectedPlayers(groupPlayers);
  }, [groupPlayers]);

  const selectedPlayerIds = selectedPlayers.map((item) => item.id);
  const partnerships = partnershipConstraint?.partnerships || [];

  const [viewMode, setViewMode] = useState<ViewMode>("select");
  const [groupPlayerSearchQuery, setGroupPlayerSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  function isPlayerSelected(player: Player) {
    return selectedPlayerIds.includes(player.id);
  }

  function isPlayerPaused(playerId: string) {
    return pausedPlayerIds.includes(playerId);
  }

  const getPlayerPartner = (playerId: string): Player | undefined => {
    const partnership = partnerships.find(
      (p) => p.player1Id === playerId || p.player2Id === playerId,
    );
    if (!partnership) return undefined;

    const partnerId =
      partnership.player1Id === playerId
        ? partnership.player2Id
        : partnership.player1Id;

    return allPlayers.find((p) => p.id === partnerId);
  };

  const getAvailableForLinking = (playerId: string): Player[] => {
    const currentPartner = getPlayerPartner(playerId);
    if (currentPartner) return [];

    const partneredPlayerIds = new Set(
      partnerships.flatMap((p) => [p.player1Id, p.player2Id]),
    );

    return selectedPlayers.filter(
      (p) => p.id !== playerId && !partneredPlayerIds.has(p.id),
    );
  };

  function addPlayerToSelected(player: Player) {
    setSelectedPlayers([...selectedPlayers, player]);
  }

  function handleTogglePlayer(player: Player) {
    if (isPlayerSelected(player)) {
      setSelectedPlayers(
        selectedPlayers.filter((item) => item.id !== player.id),
      );
      // Remove from paused if unselected
      if (isPlayerPaused(player.id)) {
        onPausedPlayersChange?.(
          pausedPlayerIds.filter((id) => id !== player.id),
        );
      }
      // Remove any partnerships involving this player
      handlePlayerAction(player, "unlink");
    } else {
      addPlayerToSelected(player);
    }
  }

  const handlePlayerAction = (
    player: Player,
    action: "pause" | "unpause" | "link" | "unlink",
  ) => {
    const playerId = player.id;

    switch (action) {
      case "pause":
        if (!isPlayerPaused(playerId)) {
          onPausedPlayersChange?.([...pausedPlayerIds, playerId]);
        }
        break;
      case "unpause":
        if (isPlayerPaused(playerId)) {
          onPausedPlayersChange?.(
            pausedPlayerIds.filter((id) => id !== playerId),
          );
        }
        break;
      case "unlink":
        const updatedPartnerships = partnerships.filter(
          (p) => p.player1Id !== playerId && p.player2Id !== playerId,
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

  const filteredPlayers = allPlayers.filter(
    (player) =>
      player.name
        .toLowerCase()
        .includes(groupPlayerSearchQuery.toLowerCase()) ||
      (player.email &&
        player.email
          .toLowerCase()
          .includes(groupPlayerSearchQuery.toLowerCase())),
  );

  const availablePlayers = filteredPlayers.filter(
    (player) => !isPlayerSelected(player),
  );

  const filteredSelectedPlayers = selectedPlayers.filter(
    (player) =>
      player.name
        .toLowerCase()
        .includes(groupPlayerSearchQuery.toLowerCase()) ||
      (player.email &&
        player.email
          .toLowerCase()
          .includes(groupPlayerSearchQuery.toLowerCase())),
  );

  async function handleQuickAddPlayer(
    playerData: Omit<Player, "id" | "createdAt" | "updatedAt">,
  ) {
    const resultAction = await dispatch(addPlayer(playerData));
    const newPlayer = resultAction.payload;

    if (!newPlayer) {
      console.error("handleQuickAddPlayer: newPlayer is null");
    } else {
      addPlayerToSelected(newPlayer);
    }
    setShowQuickAdd(false);
    Alert.alert("Success", `${playerData.name} has been added to the group!`);
  }

  const handleSave = () => {
    onSave(selectedPlayers);
  };

  const renderPlayer = (player: Player) => {
    const partner = getPlayerPartner(player.id);

    return renderPlayerCard(
      {
        player,
        isSelected: isPlayerSelected(player),
        isPaused: isPlayerPaused(player.id),
        partnerName: partner?.name,
        showActions: true,
        showPauseButton: true,
        showDetailsButton: false, // Disabled for GroupPlayerManager for now
      },
      {
        onToggle: handleTogglePlayer,
        onPlayerAction: handlePlayerAction,
        onLinkPartner: handleLinkPartner,
      },
      theme,
    );
  };

  const SelectExistingView = () => (
    <>
      {/* Partnership Summary */}
      {partnerships.length > 0 && (
        <Surface
          style={{
            margin: 16,
            padding: 12,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
            Fixed Partnerships:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {partnerships.map((partnership) => {
              const player1 = allPlayers.find(
                (p) => p.id === partnership.player1Id,
              );
              const player2 = allPlayers.find(
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

      {selectedPlayers.length > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text
            variant="titleMedium"
            style={{
              fontWeight: "600",
              marginBottom: 12,
            }}
          >
            Selected Players ({selectedPlayers.length})
            {pausedPlayerIds.length > 0 &&
              ` (${pausedPlayerIds.length} paused)`}
          </Text>
          <View>
            {[...filteredSelectedPlayers]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((player) => (
                <View key={`selected-${player.id}`}>
                  {renderPlayer(player)}
                </View>
              ))}
          </View>
        </View>
      )}

      <View style={{ marginHorizontal: 16 }}>
        <Text
          variant="titleMedium"
          style={{
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          Available Players ({availablePlayers.length})
        </Text>

        {availablePlayers.length === 0 ? (
          <Surface
            style={{
              alignItems: "center",
              paddingVertical: 32,
              borderRadius: 8,
            }}
          >
            {groupPlayerSearchQuery ? (
              <Text
                variant="bodyLarge"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                No players match your search
              </Text>
            ) : (
              <>
                <Text
                  variant="bodyLarge"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 16,
                  }}
                >
                  All players are already in this group
                </Text>
                <Button
                  icon="plus"
                  mode="outlined"
                  onPress={() => setViewMode("add")}
                >
                  Add New Player
                </Button>
              </>
            )}
          </Surface>
        ) : (
          <View>
            {[...availablePlayers]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((player) => (
                <View key={`available-${player.id}`}>
                  {renderPlayer(player)}
                </View>
              ))}
          </View>
        )}
      </View>
    </>
  );

  const AddNewView = () => (
    <View style={{ padding: 16 }}>
      <Surface
        style={{
          alignItems: "center",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <Icon source="account" size={32} />
        <Text
          variant="headlineSmall"
          style={{
            fontWeight: "600",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Add New Player to Group
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurfaceVariant,
            marginTop: 8,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Add a new player and they'll be automatically added to "{groupName}"
        </Text>
      </Surface>

      <Button
        icon="plus"
        mode="contained"
        onPress={() => setShowQuickAdd(true)}
        contentStyle={{ paddingVertical: 8 }}
        style={{ marginBottom: 24 }}
      >
        Add New Player
      </Button>

      {selectedPlayers.length > 0 && (
        <Card>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Current players in this group:
            </Text>
            <ScrollView
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={true}
            >
              {selectedPlayers.map((player) => (
                <View
                  key={player.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.surfaceVariant,
                  }}
                >
                  <Text variant="bodyMedium">{player.name}</Text>
                  {player.rating && (
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: "500",
                      }}
                    >
                      {player.rating.toFixed(1)}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const BottomActionBar = () => (
    <Surface
      style={{
        flexDirection: narrowScreen ? "column" : "row",
        padding: 16,
        gap: narrowScreen ? 12 : 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outlineVariant,
        backgroundColor: theme.colors.surface,
      }}
      elevation={3}
    >
      {narrowScreen ? (
        // Stack buttons vertically on narrow screens
        <>
          <Button icon="content-save" mode="contained" onPress={handleSave}>
            Save Changes
          </Button>
          <Button icon="cancel" mode="outlined" onPress={onCancel}>
            Cancel
          </Button>
        </>
      ) : (
        // Side by side on wider screens
        <>
          <Button
            icon="cancel"
            mode="outlined"
            onPress={onCancel}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            icon="content-save"
            mode="contained"
            onPress={handleSave}
            style={{ flex: 1 }}
          >
            Save Changes
          </Button>
        </>
      )}
    </Surface>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={onCancel} />
          <Appbar.Content
            title={
              <Text
                variant="titleLarge"
                style={{
                  alignItems: "center",
                  fontWeight: "600",
                }}
              >
                {groupName}
              </Text>
            }
          />
          {/* Keep one action button on wider screens */}
          {!narrowScreen && (
            <Appbar.Action icon="content-save" onPress={handleSave} />
          )}
        </Appbar.Header>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: narrowScreen ? 160 : 100 }}
        >
          <SegmentedButtons
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            buttons={[
              {
                value: "select",
                label: "Select Existing",
                icon: "account-group",
              },
              {
                value: "add",
                label: "Add New",
                icon: "plus",
              },
            ]}
            style={{ margin: 16 }}
          />

          <Searchbar
            placeholder="Search players..."
            onChangeText={setGroupPlayerSearchQuery}
            value={groupPlayerSearchQuery}
            mode="bar"
            style={{ marginHorizontal: 16, marginTop: 6, marginBottom: 12 }}
          />

          {viewMode === "select" ? <SelectExistingView /> : <AddNewView />}
        </ScrollView>

        <BottomActionBar />

        <Modal
          visible={showQuickAdd}
          animationType="slide"
          presentationStyle="formSheet"
        >
          <PlayerForm
            onSave={handleQuickAddPlayer}
            onCancel={() => setShowQuickAdd(false)}
          />
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
