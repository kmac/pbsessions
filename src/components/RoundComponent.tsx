import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  FAB,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { Court, Game, Session, Player, PlayerStats } from "@/src/types";
import {
  getCurrentRound,
  getCurrentRoundNumber,
} from "@/src/services/sessionService";
import {
  updateCourtInSessionThunk,
  updateCurrentRoundThunk,
} from "@/src/store/actions/sessionActions";
import {
  PlayerRenderData,
  RoundRender,
} from "@/src/components/render/RoundRender";
import { getSessionPlayers } from "@/src/utils/util";
import { Alert } from "@/src/utils/alert";

interface RoundComponentProps {
  editing: boolean;
  session: Session;
}

export default function RoundComponent({
  editing,
  session,
}: RoundComponentProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const [selectedPlayers, setSelectedPlayers] = useState(
    new Map<string, Player>(),
  );
  const [selectedCourts, setSelectedCourts] = useState(new Set<string>());
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [courtSettingDialogVisible, setCourtSettingDialogVisible] =
    useState(false);
  const [currentCourtId, setCurrentCourtId] = useState<string>("");
  const [ratingInput, setRatingInput] = useState<string>("");
  const [ratingEnabled, setRatingEnabled] = useState<boolean>(false);
  const [courtDisabled, setCourtDisabled] = useState<boolean>(false);

  const { players } = useAppSelector((state) => state.players);

  const courts = session ? session.courts : [];
  const sessionPlayers: Player[] = session
    ? getSessionPlayers(session, players)
    : [];
  const currentRound = getCurrentRound(session, false);

  const showRating = session ? session.showRatings : false;
  const scoring = session ? session.scoring : false;

  const chipMode = editing ? "outlined" : "flat";

  const getPlayer = (playerId: string): Player => {
    const player = sessionPlayers.find((p) => p.id === playerId);
    if (!player) {
      throw new Error(
        `Player with ID "${playerId}" not found in session players`,
      );
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
      if (selectedPlayers.has(player.id)) {
        selectedPlayers.delete(player.id);
        setSelectedPlayers(new Map(selectedPlayers));
      } else {
        if (!playerSelectDisabled(player)) {
          setSelectedPlayers(new Map(selectedPlayers.set(player.id, player)));
        }
      }
    }
  };

  const getCourtSelected = (courtId: string | undefined): boolean => {
    if (!courtId) {
      return false;
    }
    return selectedCourts.has(courtId);
  };

  const toggleCourtSelected = (courtId: string) => {
    if (courtId) {
      if (selectedCourts.has(courtId)) {
        selectedCourts.delete(courtId);
        setSelectedCourts(new Set(selectedCourts));
      } else {
        if (!courtSelectDisabled(courtId)) {
          setSelectedCourts(new Set(selectedCourts.add(courtId)));
        }
      }
    }
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

    // Clear selected players
    setSelectedPlayers(new Map());
  };

  const handleSetCourtRating = () => {
    selectedCourts.forEach((courtId) => {
      const court = getCourt(courtId);
      if (court.minimumRating) {
        setCourtMinimumRating(courtId, undefined);
      } else {
        setCourtMinimumRating(courtId, 4.0);
      }
    });
    setSelectedCourts(new Set());
  };

  const handleCourtSetting = (courtId: string) => {
    const court = getCourt(courtId);
    setCurrentCourtId(courtId);
    setRatingInput(court.minimumRating?.toString() || "");
    setRatingEnabled(court.minimumRating ? true : false);
    //setCourtDisabled(!!court?.disabled);
    setCourtSettingDialogVisible(true);
  };

  const handleSaveCourtRating = () => {
    const court = getCourt(currentCourtId);
    const rating =
      ratingEnabled && ratingInput.trim() !== ""
        ? parseFloat(ratingInput)
        : undefined;
    const updatedCourt = {
      ...court,
      minimumRating: rating,
    };

    dispatch(
      updateCourtInSessionThunk({
        sessionId: session.id,
        court: updatedCourt,
      }),
    );

    setCourtSettingDialogVisible(false);
    setCurrentCourtId("");
    setRatingInput("");
    setRatingEnabled(false);
    setCourtDisabled(false);
  };

  const handleCancelCourtRating = () => {
    setCourtSettingDialogVisible(false);
    setCurrentCourtId("");
    setRatingInput("");
    setRatingEnabled(false);
    setCourtDisabled(false);
  };

  const handleRatingEnabledChange = (enabled: boolean) => {
    setRatingEnabled(enabled);
    if (!enabled) {
      setRatingInput("");
    }
  };

  const renderSidePlayerScore = (score: number | undefined, side: string) => {
    return (
      <View>
        {score ? (
          <Chip elevated={true}>
            <Text variant="titleMedium">{score}</Text>
          </Chip>
        ) : (
          false && (
            <Text
              variant="labelMedium"
              style={{
                //fontWeight: "bold",
                marginBottom: 4,
                color: theme.colors.onPrimaryContainer,
              }}
            >
              {side}
            </Text>
          )
        )}
      </View>
    );
  };

  const renderSidePlayers = (
    player1: Player,
    player2: Player,
    score: number | undefined,
    side: "Serve" | "Receive",
  ) => {
    return (
      <Surface
        style={{
          flexDirection: "row",
          flex: 1,
          gap: 10,
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.primaryContainer,
        }}
      >
        {side === "Receive" && renderSidePlayerScore(score, side)}

        <View
          style={{
            flexDirection: "column",
            alignItems: "stretch",
            gap: 5,
          }}
        >
          <Chip
            mode={chipMode}
            disabled={playerSelectDisabled(player1)}
            elevated={!playerSelectDisabled(player1)}
            selected={getPlayerSelected(player1)}
            onPress={() => {
              editing && player1 && togglePlayerSelected(player1);
            }}
          >
            {player1?.name}
            {showRating &&
              player1?.rating &&
              ` (${player1?.rating.toFixed(2)})`}
          </Chip>
          <Chip
            mode={chipMode}
            disabled={playerSelectDisabled(player2)}
            elevated={!playerSelectDisabled(player2)}
            selected={getPlayerSelected(player2)}
            onPress={() => {
              editing && player2 && togglePlayerSelected(player2);
            }}
          >
            {player2?.name}
            {showRating &&
              player2?.rating &&
              ` (${player2?.rating.toFixed(2)})`}
          </Chip>
        </View>

        {side === "Serve" && renderSidePlayerScore(score, side)}
      </Surface>
    );
  };

  const renderCourtAssignmentOrig = ({ item: game }: { item: Game }) => {
    const servePlayer1 = getPlayer(game.serveTeam.player1Id);
    const servePlayer2 = getPlayer(game.serveTeam.player2Id);
    const receivePlayer1 = getPlayer(game.receiveTeam.player1Id);
    const receivePlayer2 = getPlayer(game.receiveTeam.player2Id);

    const roundRender = new RoundRender(theme, showRating, chipMode);

    return (
      <Card style={{ marginBottom: 12 }}>
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
              //disabled={!editing}
              // selected={getCourtSelected(item.courtId)}
              // onPress={() => {
              //   item.courtId && toggleCourtSelected(item.courtId);
              // }}
              onPress={() => {
                editing && game.courtId && handleCourtSetting(game.courtId);
              }}
            >
              <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                {getCourt(game.courtId).name
                  ? getCourt(game.courtId).name
                  : "Court"}
                {/*getCourtMinimumRating(item.courtId) && ` (${getCourtMinimumRating(item.courtId)})`*/}
              </Text>
              {getCourtMinimumRating(game.courtId) && (
                <Badge size={22}>{getCourtMinimumRating(game.courtId)}</Badge>
              )}
            </Chip>
            {/*
            <Button icon="tune-variant" mode="outlined"
              onPress={() => {
                item.courtId && handleCourtSetting(item.courtId);
              }}>
              Court {item.courtId.slice(-1)}{" "}
            </Button>
            */}
          </View>

          <View
            style={{ flexDirection: "row", alignItems: "center", columnGap: 6 }}
          >
            {/*{renderSidePlayers(
              servePlayer1!,
              servePlayer2!,
              game.score?.serveScore,
              "Serve",
            )}
            {renderSidePlayers(
              receivePlayer1!,
              receivePlayer2!,
              game.score?.receiveScore,
              "Receive",
            )}*/}
            {roundRender.renderSide(
              {
                player: servePlayer1!,
                selected: getPlayerSelected(servePlayer1),
                selectDisabled: playerSelectDisabled(servePlayer1),
                onSelected: () => {
                  editing && togglePlayerSelected(servePlayer1);
                },
              },
              {
                player: servePlayer2!,
                selected: getPlayerSelected(servePlayer2),
                selectDisabled: playerSelectDisabled(servePlayer2),
                onSelected: () => {
                  editing && togglePlayerSelected(servePlayer2);
                },
              },
              game.score?.serveScore,
              "Serve",
            )}
            {roundRender.renderSide(
              {
                player: receivePlayer1!,
                selected: getPlayerSelected(receivePlayer1),
                selectDisabled: playerSelectDisabled(receivePlayer1),
                onSelected: () => {
                  editing && togglePlayerSelected(receivePlayer1);
                },
              },
              {
                player: receivePlayer2!,
                selected: getPlayerSelected(receivePlayer2),
                selectDisabled: playerSelectDisabled(receivePlayer2),
                onSelected: () => {
                  editing && togglePlayerSelected(receivePlayer2);
                },
              },
              game.score?.receiveScore,
              "Receive",
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderCourtAssignment = ({ item: game }: { item: Game }) => {
    const servePlayer1 = getPlayer(game.serveTeam.player1Id);
    const servePlayer2 = getPlayer(game.serveTeam.player2Id);
    const receivePlayer1 = getPlayer(game.receiveTeam.player1Id);
    const receivePlayer2 = getPlayer(game.receiveTeam.player2Id);

    const roundRender = new RoundRender(theme, showRating, chipMode);

    return roundRender.renderGame(
      {
        player: servePlayer1,
        selected: getPlayerSelected(servePlayer1),
        selectDisabled: playerSelectDisabled(servePlayer1),
        onSelected: () => editing && togglePlayerSelected(servePlayer1),
      },
      {
        player: servePlayer2,
        selected: getPlayerSelected(servePlayer2),
        selectDisabled: playerSelectDisabled(servePlayer2),
        onSelected: () => editing && togglePlayerSelected(servePlayer2),
      },
      {
        player: receivePlayer1,
        selected: getPlayerSelected(receivePlayer1),
        selectDisabled: playerSelectDisabled(receivePlayer1),
        onSelected: () => editing && togglePlayerSelected(receivePlayer1),
      },
      {
        player: receivePlayer2,
        selected: getPlayerSelected(receivePlayer2),
        selectDisabled: playerSelectDisabled(receivePlayer2),
        onSelected: () => editing && togglePlayerSelected(receivePlayer2),
      },
      getCourt(game.courtId),
      game.score,
      editing ? handleCourtSetting : undefined,
    );
  };

  return (
    <SafeAreaView>
      <View style={{ marginBottom: 24 }}>
        {/*<Text
          variant="titleMedium"
          style={{
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          Courts
        </Text>
        */}
        <FlatList
          data={currentRound.games ? currentRound.games : []}
          renderItem={renderCourtAssignment}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
        {editing && (
          <FAB
            icon="swap-horizontal-bold"
            label="Swap Players"
            size="large"
            variant="tertiary"
            style={{
              position: "absolute",
              margin: 16,
              right: 0,
              bottom: 30,
              // position: 'absolute',
              // margin: 16,
              // marginTop: 40,
              // right: 0,
              // bottom: 0,
            }}
            visible={selectedPlayers.size === 2}
            disabled={selectedPlayers.size != 2}
            onPress={handleSwapPlayers}
          />
        )}
      </View>

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
                {player.name} (
                {getPlayerStats(session, player.id)?.gamesSatOut || 0})
                {showRating &&
                  player.rating &&
                  ` (${player.rating.toFixed(2)})`}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {editing && (
        <FAB
          icon="swap-horizontal-bold"
          label="Assign Court Rating"
          size="large"
          variant="tertiary"
          style={{
            position: "absolute",
            margin: 16,
            right: 0,
            bottom: 30,
          }}
          visible={selectedCourts.size === 1}
          disabled={selectedCourts.size != 1}
          onPress={handleSetCourtRating}
        />
      )}

      <Dialog
        visible={courtSettingDialogVisible}
        onDismiss={handleCancelCourtRating}
        style={{ alignSelf: "center", width: "80%", maxWidth: 400 }}
      >
        <Dialog.Title>Court Settings</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
            Configure settings for Court {currentCourtId.slice(-1)}
          </Text>

          {/*
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Switch
                  value={courtDisabled}
                  onValueChange={setCourtDisabled}
                />
                <Text variant="bodyMedium" style={{ marginLeft: 8 }}>
                  Disable Court
                </Text>
              </View>
              */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Checkbox
              status={ratingEnabled ? "checked" : "unchecked"}
              onPress={() => handleRatingEnabledChange(!ratingEnabled)}
            />
            <Text variant="bodyMedium" style={{ marginLeft: 8 }}>
              Enable minimum rating requirement
            </Text>
          </View>

          <TextInput
            label="Minimum Rating"
            value={ratingInput}
            onChangeText={setRatingInput}
            keyboardType="numeric"
            mode="outlined"
            placeholder="e.g. 4.0"
            disabled={!ratingEnabled}
            style={{
              opacity: ratingEnabled ? 1 : 0.5,
              width: 150,
            }}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleCancelCourtRating}>Cancel</Button>
          <Button onPress={handleSaveCourtRating}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </SafeAreaView>
  );
}
