import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Checkbox,
  Badge,
  Card,
  Chip,
  Dialog,
  Divider,
  Icon,
  IconButton,
  FAB,
  HelperText,
  Portal,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { Court, Game, Session, Player, PlayerStats } from "@/src/types";
import { getCurrentRound } from "@/src/services/sessionService";
import {
  updateCourtInSessionThunk,
  updateCurrentRoundThunk,
  togglePausePlayerInSessionThunk,
  updatePartnershipInSessionThunk,
} from "@/src/store/actions/sessionActions";
import { RoundGameCard } from "@/src/components/RoundGameCard";
import { PlayerStatsDisplay } from "@/src/components/PlayerStatsDisplay";
import {
  getPlayerText,
  getPlayerRating,
  PlayerButton,
} from "@/src/components/PlayerButton";
import { getSessionPlayers, getSessionPausedPlayers } from "@/src/utils/util";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import { Alert } from "@/src/utils/alert";

interface RoundComponentProps {
  session: Session;
  editing: boolean;
  ratingSwitch: boolean;
  roundIndex?: number;
  onSwapPlayersChange?: (canSwap: boolean, swapHandler: () => void) => void;
}

export const RoundComponent: React.FC<RoundComponentProps> = ({
  session,
  editing,
  ratingSwitch = true,
  roundIndex,
  onSwapPlayersChange,
}) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const useFlatList = false;
  const [selectedPlayers, setSelectedPlayers] = useState(
    new Map<string, Player>(),
  );
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null,
  );
  const [selectedCourts, setSelectedCourts] = useState(new Set<string>());
  const [courtSettingDialogVisible, setCourtSettingDialogVisible] =
    useState(false);
  const [playerDetailsDialogVisible, setPlayerDetailsDialogVisible] =
    useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [currentCourtId, setCurrentCourtId] = useState<string>("");
  const [courtRatingInput, setCourtRatingInput] = useState<string>("");
  const [courtRatingEnabled, setCourtRatingEnabled] = useState<boolean>(false);
  const [courtDisabled, setCourtDisabled] = useState<boolean>(false);

  const { players } = useAppSelector((state) => state.players);
  const { appSettings } = useAppSelector((state) => state.appSettings);

  const courts = session ? session.courts : [];
  const disabledCourts = courts.filter((court) => court.isActive === false);

  const sessionPlayers: Player[] = session
    ? getSessionPlayers(session, players)
    : [];
  const sessionPausedPlayers: Player[] = session
    ? getSessionPausedPlayers(session, players)
    : [];

  const currentRound = getCurrentRound(session, false, roundIndex);

  const showRating = session?.showRatings ?? false;
  const [showRatingEnabled, setShowRatingEnabled] =
    useState<boolean>(showRating);

  const chipMode = editing ? "outlined" : "flat";

  const getPlayer = (playerId: string): Player => {
    const player = sessionPlayers.find((p) => p.id === playerId);
    if (!player) {
      console.warn(`Player with ID "${playerId}" not found in session players`);
      const now = new Date().toISOString();
      return { id: playerId, name: "UNKNOWN", createdAt: now, updatedAt: now };
    }
    return player;
  };

  const getPartner = (playerId: string): Player | undefined => {
    if (
      !session.partnershipConstraint ||
      session.partnershipConstraint.partnerships.length <= 0
    ) {
      return undefined;
    }
    const partnership = session.partnershipConstraint.partnerships.find(
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

  const getPlayerStats = (
    session: Session,
    playerId: string,
  ): PlayerStats | undefined => {
    return session.liveData?.playerStats.find(
      (stat) => stat.playerId === playerId,
    );
  };

  const getAvailablePartners = (playerId: string): Player[] => {
    const partnerships = session.partnershipConstraint?.partnerships || [];
    const currentPartner = getPartner(playerId);

    const allPartneredPlayerIds = new Set(
      partnerships.flatMap((p) => [p.player1Id, p.player2Id]),
    );

    return sessionPlayers.filter((p) => {
      if (p.id === playerId) {
        return false;
      }
      if (p.id === currentPartner?.id) {
        return true;
      }
      return !allPartneredPlayerIds.has(p.id);
    });
  };

  const getCourt = (courtId: string): Court => {
    const court = courts?.find((c) => c.id === courtId);
    if (!court) {
      console.error(`Court with ID "${courtId}" not found in session courts`);
      return {
        id: courtId,
        name: "UNKNOWN",
        isActive: false,
      } as Court;
    }
    return court;
  };

  const getCourtMinimumRating = (courtId: string): string | undefined => {
    const court = getCourt(courtId);
    if (court.minimumRating) {
      return court.minimumRating.toFixed(2);
    }
    return undefined;
  };

  const setCourtMinimumRating = (
    courtId: string,
    rating: number | undefined,
  ) => {
    const court = getCourt(courtId);
    const updatedCourt = { ...court, minimumRating: rating };
    dispatch(
      updateCourtInSessionThunk({
        sessionId: session.id,
        court: updatedCourt,
      }),
    );
  };

  const sittingOutPlayers =
    currentRound.games.length > 0
      ? (currentRound.sittingOutIds.map(getPlayer).filter(Boolean) as Player[])
      : [];

  const pausedPlayers: Player[] = session.pausedPlayerIds
    ? session.pausedPlayerIds.map((playerId) => getPlayer(playerId))
    : [];

  const isPlayerPaused = (playerId: string) => {
    return session.pausedPlayerIds?.includes(playerId);
  };

  const playerSelectDisabled = (player: Player | undefined) => {
    if (!player) {
      return true;
    }
    if (selectedPlayers.has(player.id)) {
      return false;
    }
    return selectedPlayers.size >= 2;
  };

  const getPlayerSelected = (player: Player | undefined): boolean => {
    if (!player) {
      return false;
    }
    return selectedPlayers.has(player.id);
  };

  const togglePlayerSelected = (player: Player) => {
    if (player) {
      let newSelectedPlayers: Map<string, Player>;

      if (selectedPlayers.has(player.id)) {
        const updatedMap = new Map(selectedPlayers);
        updatedMap.delete(player.id);
        newSelectedPlayers = updatedMap;
        setSelectedPlayers(newSelectedPlayers);
      } else {
        if (!playerSelectDisabled(player)) {
          newSelectedPlayers = new Map(selectedPlayers.set(player.id, player));
          setSelectedPlayers(newSelectedPlayers);
        } else {
          return;
        }
      }
    }
  };

  const handleLongPress = (player: Player) => {
    if (player) {
      setCurrentPlayerId(player.id);
      const partner = getPartner(player.id);
      setSelectedPartnerId(partner?.id || null);
      setPlayerDetailsDialogVisible(true);
    }
  };

  const handleClosePlayerDetails = () => {
    setPlayerDetailsDialogVisible(false);
    setCurrentPlayerId("");
    setSelectedPartnerId(null);
  };

  const handleTogglePlayerPause = async (playerId: string) => {
    try {
      await dispatch(
        togglePausePlayerInSessionThunk({
          sessionId: session.id,
          playerId: playerId,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Failed to toggle player pause:", error);
      Alert.alert("Error", "Failed to update player status");
    }
  };

  const handleUpdatePartnership = async (
    playerId: string,
    newPartnerId: string | null,
  ) => {
    try {
      await dispatch(
        updatePartnershipInSessionThunk({
          sessionId: session.id,
          playerId: playerId,
          newPartnerId: newPartnerId,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Failed to update partnership:", error);
      Alert.alert("Error", "Failed to update partnership");
    }
  };

  // Notify parent about swap state changes
  useEffect(() => {
    if (onSwapPlayersChange) {
      const canSwap = selectedPlayers.size === 2;
      onSwapPlayersChange(canSwap, handleSwapPlayers);
    }
  }, [selectedPlayers.size, onSwapPlayersChange]);

  const clearSelectedPlayers = () => {
    setSelectedPlayers(new Map());
  };

  const courtSelectDisabled = (courtId: string | undefined) => {
    if (!courtId) {
      return true;
    }
    if (selectedCourts.has(courtId)) {
      return false;
    }
    return selectedCourts.size >= 1;
  };

  const handleSwapPlayers = () => {
    if (selectedPlayers.size !== 2) {
      return;
    }

    const playerIds = Array.from(selectedPlayers.keys());
    const [playerId1, playerId2] = playerIds;
    const games = currentRound.games;

    // Find positions of both players in the games
    const findPlayerPosition = (
      id: string,
    ): { gameIndex: number; position: string } | null => {
      for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
        const game = games[gameIndex];

        if (game.serveTeam.player1Id === id)
          return { gameIndex, position: "serveTeam.player1Id" };
        if (game.serveTeam.player2Id === id)
          return { gameIndex, position: "serveTeam.player2Id" };
        if (game.receiveTeam.player1Id === id)
          return { gameIndex, position: "receiveTeam.player1Id" };
        if (game.receiveTeam.player2Id === id)
          return { gameIndex, position: "receiveTeam.player2Id" };

        // Check sitting out players
        const sittingOutPlayer = sittingOutPlayers.find(
          (player) => player.id === id,
        );
        if (sittingOutPlayer) {
          const sittingOutIndex = sittingOutPlayers.indexOf(sittingOutPlayer);
          return { gameIndex, position: `sittingOut.${sittingOutIndex}` };
        }
      }
      return null;
    };

    const position1 = findPlayerPosition(playerId1);
    const position2 = findPlayerPosition(playerId2);

    if (!position1 || !position2) {
      console.error("Could not find positions for selected players");
      return;
    }

    const newSittingOutIds = [...currentRound.sittingOutIds];
    const newGames = games.map((game, gameIndex) => {
      const newGame = { ...game };

      // Helper function to set player at position
      const setPlayerAtPosition = (pos: string, playerId: string) => {
        if (pos === "serveTeam.player1Id") {
          newGame.serveTeam = { ...newGame.serveTeam, player1Id: playerId };
        } else if (pos === "serveTeam.player2Id") {
          newGame.serveTeam = { ...newGame.serveTeam, player2Id: playerId };
        } else if (pos === "receiveTeam.player1Id") {
          newGame.receiveTeam = { ...newGame.receiveTeam, player1Id: playerId };
        } else if (pos === "receiveTeam.player2Id") {
          newGame.receiveTeam = { ...newGame.receiveTeam, player2Id: playerId };
        } else if (pos.startsWith("sittingOut.")) {
          const index = parseInt(pos.split(".")[1]);
          newSittingOutIds[index] = playerId;
        }
      };

      // Perform the swap
      if (gameIndex === position1.gameIndex) {
        setPlayerAtPosition(position1.position, playerId2);
      }
      if (gameIndex === position2.gameIndex) {
        setPlayerAtPosition(position2.position, playerId1);
      }

      return newGame;
    });

    dispatch(
      updateCurrentRoundThunk({
        sessionId: session.id,
        assignment: {
          gameAssignments: newGames.map((game) => {
            return {
              courtId: game.courtId,
              serveTeam: game.serveTeam,
              receiveTeam: game.receiveTeam,
            };
          }),
          sittingOutIds: newSittingOutIds,
        },
      }),
    );
    setSelectedPlayers(new Map());
  };

  const handleCourtSetting = (courtId: string) => {
    const court: Court = getCourt(courtId);
    setCurrentCourtId(courtId);
    setCourtRatingInput(court.minimumRating?.toString() || "");
    setCourtRatingEnabled(court.minimumRating ? true : false);
    setCourtDisabled(!court.isActive);
    setCourtSettingDialogVisible(true);
  };

  const handleSaveCourtSetting = async () => {
    const court = getCourt(currentCourtId);
    const rating =
      courtRatingEnabled && courtRatingInput.trim() !== ""
        ? parseFloat(courtRatingInput)
        : undefined;
    const updatedCourt = {
      ...court,
      minimumRating: rating,
      isActive: !courtDisabled,
    };

    try {
      await dispatch(
        updateCourtInSessionThunk({
          sessionId: session.id,
          court: updatedCourt,
        }),
      ).unwrap(); // unwrap() throws if the thunk rejects
    } catch (error) {
      console.error("Failed to update court settings:", error);
      Alert.alert("Error", "Failed to update court settings");
    }
    handleCloseCourtSetting();
  };

  const handleCloseCourtSetting = () => {
    setCourtSettingDialogVisible(false);
    setCurrentCourtId("");
    setCourtRatingInput("");
    setCourtRatingEnabled(false);
    setCourtDisabled(false);
  };

  const handleCourtRatingEnabledChange = (enabled: boolean) => {
    setCourtRatingEnabled(enabled);
    if (!enabled) {
      setCourtRatingInput("");
    }
  };

  const renderCourtAssignment = ({ item: game }: { item: Game }) => {
    const servePlayer1 = getPlayer(game.serveTeam.player1Id);
    const servePlayer2 = getPlayer(game.serveTeam.player2Id);
    const receivePlayer1 = getPlayer(game.receiveTeam.player1Id);
    const receivePlayer2 = getPlayer(game.receiveTeam.player2Id);

    return (
      <RoundGameCard
        key={game.id}
        servePlayer1Data={{
          player: servePlayer1,
          partner: getPartner(servePlayer1.id),
          stats: getPlayerStats(session, servePlayer1.id),
          selected: getPlayerSelected(servePlayer1),
          selectDisabled: playerSelectDisabled(servePlayer1),
          onSelected: () => editing && togglePlayerSelected(servePlayer1),
          onLongPress: () => handleLongPress(servePlayer1),
        }}
        servePlayer2Data={{
          player: servePlayer2,
          partner: getPartner(servePlayer2.id),
          stats: getPlayerStats(session, servePlayer2.id),
          selected: getPlayerSelected(servePlayer2),
          selectDisabled: playerSelectDisabled(servePlayer2),
          onSelected: () => editing && togglePlayerSelected(servePlayer2),
          onLongPress: () => handleLongPress(servePlayer2),
        }}
        receivePlayer1Data={{
          player: receivePlayer1,
          partner: getPartner(receivePlayer1.id),
          stats: getPlayerStats(session, receivePlayer1.id),
          selected: getPlayerSelected(receivePlayer1),
          selectDisabled: playerSelectDisabled(receivePlayer1),
          onSelected: () => editing && togglePlayerSelected(receivePlayer1),
          onLongPress: () => handleLongPress(receivePlayer1),
        }}
        receivePlayer2Data={{
          player: receivePlayer2,
          partner: getPartner(receivePlayer2.id),
          stats: getPlayerStats(session, receivePlayer2.id),
          selected: getPlayerSelected(receivePlayer2),
          selectDisabled: playerSelectDisabled(receivePlayer2),
          onSelected: () => editing && togglePlayerSelected(receivePlayer2),
          onLongPress: () => handleLongPress(receivePlayer2),
        }}
        court={getCourt(game.courtId)}
        score={game.score}
        showRating={showRatingEnabled}
        handleCourtSetting={editing ? handleCourtSetting : undefined}
        courtLayout={appSettings.defaultCourtLayout}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          marginBottom: 24,
        }}
      >
        {useFlatList && (
          <FlatList
            data={currentRound.games || []}
            renderItem={renderCourtAssignment}
            keyExtractor={(game) => game.id}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
        {!useFlatList && (
          <View>
            {(currentRound.games || []).map((game) =>
              renderCourtAssignment({ item: game }),
            )}
          </View>
        )}
      </View>
      {disabledCourts.length > 0 &&
        disabledCourts.map((court) => {
          return (
            <Card key={court.id} style={{ marginBottom: 12 }}>
              <Card.Content>
                <View
                  style={{
                    flexDirection: "row",
                    // flexDirection: "column",
                    // alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Chip // Court
                    mode={chipMode}
                    disabled={!editing}
                    onPress={() => {
                      handleCourtSetting && handleCourtSetting(court.id);
                    }}
                  >
                    {court.isActive && (
                      <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                        {court.name}
                      </Text>
                    )}
                    {!court.isActive && (
                      <Text
                        variant="titleMedium"
                        style={{
                          fontWeight: "600",
                          textDecorationLine: "line-through",
                        }}
                      >
                        {court.name}
                      </Text>
                    )}
                    {/* {!court.isActive && <Badge size={22}>Disabled</Badge>} */}
                    {court.minimumRating && (
                      <Badge
                        size={22}
                        style={{
                          backgroundColor: theme.colors.primary,
                          marginLeft: 6,
                        }}
                      >
                        {court.minimumRating}
                      </Badge>
                    )}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          );
        })}

      {ratingSwitch && showRating && (
        <View
          style={{ flexDirection: "row", alignSelf: "center", marginBottom: 2 }}
        >
          <Text variant="labelSmall" style={{ marginRight: 4 }}>
            Show Ratings:
          </Text>
          <Switch
            value={showRatingEnabled}
            onValueChange={(value) => {
              setShowRatingEnabled(value);
            }}
            // disabled={!showRating}
            style={{ opacity: showRating ? 1 : 0.3 }}
          />
        </View>
      )}

      {sittingOutPlayers.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text
            variant="titleMedium"
            style={{
              fontWeight: "600",
              marginBottom: 12,
            }}
          >
            Sitting Out
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {sittingOutPlayers.map((player) => (
              <PlayerButton
                key={player.id}
                player={player}
                partner={getPartner(player.id)}
                stats={getPlayerStats(session, player.id)}
                selected={getPlayerSelected(player)}
                disabled={playerSelectDisabled(player)}
                showRating={showRatingEnabled}
                onPress={() => {
                  editing && player && togglePlayerSelected(player);
                }}
                onLongPress={() => handleLongPress(player)}
              />
            ))}
          </View>
        </View>
      )}

      {pausedPlayers.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text
            variant="titleMedium"
            style={{
              fontWeight: "600",
              marginBottom: 12,
            }}
          >
            Unavailable
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {pausedPlayers.map((player) => (
              <PlayerButton
                key={player.id}
                icon="pause"
                player={player}
                partner={getPartner(player.id)}
                stats={getPlayerStats(session, player.id)}
                selected={false}
                disabled={false}
                showRating={showRatingEnabled}
                onPress={() => {}}
                onLongPress={() => handleLongPress(player)}
              />
            ))}
          </View>
        </View>
      )}
      {editing && (
        <Portal>
          <FAB
            icon="swap-horizontal-bold"
            label="Swap Players"
            size="large"
            variant="tertiary"
            style={{
              position: "absolute",
              margin: 16,
              right: 16,
              bottom: 80, // Adjust based on your bottom navigation/safe area
              zIndex: 1000,
            }}
            visible={selectedPlayers.size === 2}
            disabled={selectedPlayers.size != 2}
            onPress={handleSwapPlayers}
          />
        </Portal>
      )}

      <Dialog
        visible={courtSettingDialogVisible}
        onDismiss={handleCloseCourtSetting}
        style={{ alignSelf: "center", width: "80%", maxWidth: 400 }}
      >
        <Dialog.Title>Court Settings</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
            Configure settings for Court {currentCourtId.slice(-1)}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Switch
              value={courtDisabled}
              onValueChange={(value) => {
                setCourtDisabled(value);
              }}
            />
            <Text variant="bodyMedium" style={{ marginLeft: 8 }}>
              Disable Court
            </Text>
          </View>
          <View
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              //marginBottom: 16,
            }}
          >
            <Checkbox.Item
              status={courtRatingEnabled ? "checked" : "unchecked"}
              onPress={() => {
                handleCourtRatingEnabledChange(!courtRatingEnabled);
              }}
              label="Enable minimum rating"
              labelVariant="labelMedium"
            />
            <Text variant="labelMedium" style={{ marginLeft: 16 }}>
              Limits this court to players at or above the assigned rating.
            </Text>
            <TextInput
              value={courtRatingInput}
              onChangeText={(value) => {
                setCourtRatingInput(value);
              }}
              keyboardType="numeric"
              mode="outlined"
              placeholder="e.g. 4.0"
              disabled={!courtRatingEnabled}
              style={{
                marginLeft: 16,
                opacity: courtRatingEnabled ? 1 : 0.5,
                width: 150,
              }}
            />
            <HelperText
              type="error"
              visible={courtRatingEnabled && !courtRatingInput}
            >
              Rating is required
            </HelperText>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleCloseCourtSetting}>Cancel</Button>
          <Button onPress={handleSaveCourtSetting}>Save</Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={playerDetailsDialogVisible}
        onDismiss={handleClosePlayerDetails}
        style={{ alignSelf: "center", width: "80%", maxWidth: 400 }}
      >
        {/* <Dialog.Title>Player Details</Dialog.Title> */}
        <Dialog.Content>
          {currentPlayerId &&
            (() => {
              const currentPlayer: Player = getPlayer(currentPlayerId);
              const partner = getPartner(currentPlayerId);
              const stats = getPlayerStats(session, currentPlayerId);
              const isPaused = isPlayerPaused(currentPlayerId);

              return (
                <View>
                  <Text
                    variant="headlineSmall"
                    style={{ marginBottom: 8, fontWeight: "600" }}
                  >
                    {currentPlayer.name}
                  </Text>
                  {currentPlayer.rating && (
                    <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                      Rating: {currentPlayer.rating.toFixed(2)}
                    </Text>
                  )}

                  {partner && (
                    <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                      Partner: {partner.name}
                    </Text>
                  )}

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      <Text variant="bodyMedium">
                        {isPaused ? "Player is " : "Player is "}
                      </Text>
                      <Text variant="bodyMedium" style={{ fontWeight: 600 }}>
                        {isPaused ? "paused" : "available"}
                      </Text>
                    </View>
                    <Button
                      mode={isPaused ? "contained" : "outlined"}
                      icon={isPaused ? "play" : "pause"}
                      onPress={() => handleTogglePlayerPause(currentPlayerId)}
                      compact={true}
                    >
                      {isPaused ? "Resume" : "Pause"}
                    </Button>
                  </View>

                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {isPaused
                      ? "Tap Resume to make player available for new games"
                      : "Tap Pause to mark player as unavailable for new games"}
                  </Text>

                  <Divider style={{ margin: 10 }} />

                  {/* Fixed Partnership Section */}
                  <View style={{ marginBottom: 16 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <Icon source="account-multiple-outline" size={20} />
                      <View style={{ flex: 1 }}>
                        <Text variant="titleSmall">Fixed Partnership</Text>
                        <Text
                          variant="labelSmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          Current partner for this session
                        </Text>
                      </View>
                    </View>

                    <Dropdown
                      style={{
                        height: 40,
                        backgroundColor: theme.colors.secondaryContainer,
                        borderBottomColor: theme.colors.secondary,
                        borderBottomWidth: 0.5,
                        paddingHorizontal: 8,
                        borderRadius: 4,
                      }}
                      containerStyle={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 4,
                      }}
                      itemTextStyle={{
                        color: theme.colors.onSurface,
                        fontSize: 14,
                      }}
                      placeholderStyle={{
                        color: theme.colors.onSurfaceVariant,
                        fontSize: 14,
                      }}
                      selectedTextStyle={{
                        color: theme.colors.onSurface,
                        fontSize: 14,
                      }}
                      inputSearchStyle={{
                        height: 40,
                        fontSize: 14,
                        color: theme.colors.onSurface,
                      }}
                      iconStyle={{
                        width: 20,
                        height: 20,
                      }}
                      data={getAvailablePartners(currentPlayerId).map(
                        (player) => ({
                          label: player.name,
                          value: player.id,
                        }),
                      )}
                      search
                      maxHeight={200}
                      labelField="label"
                      valueField="value"
                      placeholder="No partner selected"
                      searchPlaceholder="Search players..."
                      value={selectedPartnerId}
                      onChange={async (item) => {
                        const newPartnerId = item.value;
                        setSelectedPartnerId(newPartnerId);

                        // Automatically apply the partnership change
                        const currentPartner = getPartner(currentPlayerId);
                        const currentPartnerId = currentPartner?.id || null;

                        if (newPartnerId !== currentPartnerId) {
                          await handleUpdatePartnership(
                            currentPlayerId,
                            newPartnerId,
                          );
                        }
                      }}
                      renderLeftIcon={() =>
                        selectedPartnerId ? (
                          <IconButton
                            icon="close"
                            size={16}
                            onPress={async () => {
                              setSelectedPartnerId(null);

                              // Automatically remove the partnership
                              const currentPartner =
                                getPartner(currentPlayerId);
                              if (currentPartner) {
                                await handleUpdatePartnership(
                                  currentPlayerId,
                                  null,
                                );
                              }
                            }}
                          />
                        ) : null
                      }
                      disable={
                        getAvailablePartners(currentPlayerId).length === 0
                      }
                    />

                    {getAvailablePartners(currentPlayerId).length === 0 && (
                      <Text
                        variant="labelSmall"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          marginTop: 4,
                          fontStyle: "italic",
                        }}
                      >
                        No available players for partnership
                      </Text>
                    )}
                  </View>

                  <Divider style={{ margin: 10 }} />
                  {stats && (
                    <View style={{ marginBottom: 2 }}>
                      <Text
                        variant="bodyMedium"
                        style={{ marginBottom: 12, fontWeight: "500" }}
                      >
                        Session Statistics
                      </Text>
                      <PlayerStatsDisplay
                        player={currentPlayer}
                        stats={stats}
                        allPlayers={sessionPlayers}
                        compact={true}
                        showPlayingPercentage={true}
                        showMostFrequentPartner={true}
                      />
                    </View>
                  )}
                </View>
              );
            })()}
        </Dialog.Content>
        <Dialog.Actions>
          <Button mode="contained" onPress={handleClosePlayerDetails}>
            Close
          </Button>
        </Dialog.Actions>
      </Dialog>
    </SafeAreaView>
  );
};
