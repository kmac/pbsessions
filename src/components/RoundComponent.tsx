import React, { useEffect, useState } from "react";
import { View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Checkbox,
  Badge,
  Card,
  Chip,
  Dialog,
  FAB,
  HelperText,
  Portal,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  Court,
  Game,
  Session,
  Player,
  PlayerStats,
} from "@/src/types";
import {
  getCurrentRound,
  getCurrentRoundNumber,
} from "@/src/services/sessionService";
import {
  updateCourtInSessionThunk,
  updateCurrentRoundThunk,
} from "@/src/store/actions/sessionActions";
import {
  getPlayerText,
  getPlayerRating,
  RoundGameCard,
} from "@/src/components/RoundGameCard";
import { getSessionPlayers } from "@/src/utils/util";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import { Alert } from "@/src/utils/alert";

interface RoundComponentProps {
  editing: boolean;
  session: Session;
  roundNumber?: number;
  onSwapPlayersChange?: (canSwap: boolean, swapHandler: () => void) => void;
}

export default function RoundComponent({
  editing,
  session,
  roundNumber,
  onSwapPlayersChange,
}: RoundComponentProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const [selectedPlayers, setSelectedPlayers] = useState(
    new Map<string, Player>(),
  );
  const [selectedCourts, setSelectedCourts] = useState(new Set<string>());
  const [courtSettingDialogVisible, setCourtSettingDialogVisible] =
    useState(false);
  const [currentCourtId, setCurrentCourtId] = useState<string>("");
  const [courtRatingInput, setCourtRatingInput] = useState<string>("");
  const [courtRatingEnabled, setCourtRatingEnabled] = useState<boolean>(false);
  const [courtDisabled, setCourtDisabled] = useState<boolean>(false);

  const { players } = useAppSelector((state) => state.players);

  const courts = session ? session.courts : [];
  const disabledCourts = courts.filter((court) => court.isActive === false);

  const sessionPlayers: Player[] = session
    ? getSessionPlayers(session, players)
    : [];
  const currentRound = getCurrentRound(session, false, roundNumber);

  const showRating = session?.showRatings ?? false;
  const [showRatingEnabled, setShowRatingEnabled] = useState<boolean>(showRating);

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

  const getPlayerStats = (
    session: Session,
    playerId: string,
  ): PlayerStats | undefined => {
    return session.liveData?.playerStats.find(
      (stat) => stat.playerId === playerId,
    );
  };

  const getCourt = (courtId: string): Court => {
    const court = courts?.find((c) => c.id === courtId);
    if (!court) {
      throw new Error(`Court with ID "${courtId}" not found in session courts`);
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
          roundNumber: getCurrentRoundNumber(session),
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

  const renderCourtAssignment = (game: Game) => {
    const servePlayer1 = getPlayer(game.serveTeam.player1Id);
    const servePlayer2 = getPlayer(game.serveTeam.player2Id);
    const receivePlayer1 = getPlayer(game.receiveTeam.player1Id);
    const receivePlayer2 = getPlayer(game.receiveTeam.player2Id);

    return (
      <RoundGameCard
        servePlayer1Data={{
          player: servePlayer1,
          stats: getPlayerStats(session, servePlayer1.id),
          selected: getPlayerSelected(servePlayer1),
          selectDisabled: playerSelectDisabled(servePlayer1),
          onSelected: () => editing && togglePlayerSelected(servePlayer1),
        }}
        servePlayer2Data={{
          player: servePlayer2,
          stats: getPlayerStats(session, servePlayer2.id),
          selected: getPlayerSelected(servePlayer2),
          selectDisabled: playerSelectDisabled(servePlayer2),
          onSelected: () => editing && togglePlayerSelected(servePlayer2),
        }}
        receivePlayer1Data={{
          player: receivePlayer1,
          stats: getPlayerStats(session, receivePlayer1.id),
          selected: getPlayerSelected(receivePlayer1),
          selectDisabled: playerSelectDisabled(receivePlayer1),
          onSelected: () => editing && togglePlayerSelected(receivePlayer1),
        }}
        receivePlayer2Data={{
          player: receivePlayer2,
          stats: getPlayerStats(session, receivePlayer2.id),
          selected: getPlayerSelected(receivePlayer2),
          selectDisabled: playerSelectDisabled(receivePlayer2),
          onSelected: () => editing && togglePlayerSelected(receivePlayer2),
        }}
        court={getCourt(game.courtId)}
        score={game.score}
        chipMode={chipMode}
        showRating={showRatingEnabled}
        handleCourtSetting={editing ? handleCourtSetting : undefined}
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
        {(currentRound.games || []).map((game) => (
          <View
            style={{
              marginLeft: 0,
            }}
            key={game.id}
          >
            {renderCourtAssignment(game)}
          </View>
        ))}
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

      {showRating && (
        <View style={{ flexDirection: "row", alignSelf: "center", marginBottom: 2 }}>
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
              <Chip
                mode={chipMode}
                disabled={playerSelectDisabled(player)}
                selected={getPlayerSelected(player)}
                onPress={() => {
                  editing && player && togglePlayerSelected(player);
                }}
              >
                <View
                  style={{
                    // flexDirection: isNarrowScreen() ? "column" : "row",
                    flexDirection: "column",
                  }}
                >
                  {getPlayerText(
                    `${player.name} (${getPlayerStats(session, player.id)?.gamesSatOut || 0})`,
                  )}
                  {showRatingEnabled &&
                    player.rating &&
                    getPlayerRating(player.rating, theme)}
                </View>
              </Chip>
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

    </SafeAreaView>
  );
}
