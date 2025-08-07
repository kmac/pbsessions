import React, { useState } from "react";
import { View, Modal, ScrollView, StyleSheet, FlatList } from "react-native";
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
  Icon,
  IconButton,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import {
  updateGames,
  updateCourts,
} from "@/src/store/slices/liveSessionSlice";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { Court, Game, LiveSession, Player, PlayerStats } from "@/src/types";
import { getEmptyLiveSession, getLiveSessionPlayers } from "@/src/utils/util";
import { Alert } from "@/src/utils/alert";
const theme = useTheme();

interface RoundProps {
  editing: boolean;
  roundNumber: number;
}

export default function Round({
  editing,
  roundNumber,
}: RoundProps) {
  const dispatch = useAppDispatch();
  const [selectedPlayers, setSelectedPlayers] = useState(new Map<string, Player>());
  const [selectedCourts, setSelectedCourts] = useState(new Set<string>());
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [courtSettingDialogVisible, setCourtSettingDialogVisible] = useState(false);
  const [currentCourtId, setCurrentCourtId] = useState<string>("");
  const [ratingInput, setRatingInput] = useState<string>("");
  const [ratingEnabled, setRatingEnabled] = useState<boolean>(false);
  const [courtDisabled, setCourtDisabled] = useState<boolean>(false);
  const { currentLiveSession: currentSession } = useAppSelector((state) => state.liveSession);
  const { appConfig } = useAppSelector((state) => state.appConfig);

  const { sessions } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);
  const games = currentSession ? currentSession.activeGames : [];
  const courts = currentSession ? currentSession.courts : [];
  const sessionPlayers: Player[] = currentSession ? getLiveSessionPlayers(currentSession, sessions, players) : [];

  const showRating = currentSession ? currentSession.showRatings : false;
  const scoring = currentSession ? currentSession.scoring : false;

  const chipMode = editing ? "outlined" : "flat";

  function getPlayer(playerId: string) {
    return sessionPlayers.find((p) => p.id === playerId);
  }

  function getCourt(courtId: string): Court | undefined {
    return courts?.find((c) => c.id === courtId);
  }

  function getCourtMinimumRating(courtId: string): string | undefined {
    const court = getCourt(courtId);
    if (court && court.minimumRating) {
      return court.minimumRating.toFixed(2);
    }
    return undefined;
  }

  function updateCourt(court: Court) {
    if (!courts) {
      return;
    }
    const newCourts = [...courts];
    for (let index = 0; index < courts.length; index++) {
      if (court.id === newCourts[index].id) {
        newCourts[index] = court;
      }
    }
    dispatch(updateCourts(newCourts));
  }

  function setCourtMinimumRating(courtId: string, rating: number | undefined) {
    const court = getCourt(courtId);
    if (!court) {
      return;
    }
    const updatedCourt = { ...court, minimumRating: rating };
    updateCourt(updatedCourt);
  }

  // const playingPlayers = games.flatMap(game => [
  //   game.serveTeam.player1Id,
  //   game.serveTeam.player2Id,
  //   game.receiveTeam.player1Id,
  //   game.receiveTeam.player2Id,
  // ]).map(getPlayer).filter(Boolean) as Player[];
  //

  const sittingOutPlayers =
    games.length > 0
      ? (games[0].sittingOutIds.map(getPlayer).filter(Boolean) as Player[])
      : [];

  function getSittingOutPlayers() {
  }

  function playerSelectDisabled(player: Player | undefined) {
    if (!player) {
      return true;
    }
    if (selectedPlayers.has(player.id)) {
      return false;
    }
    return selectedPlayers.size >= 2;
  }

  function getPlayerSelected(player: Player | undefined): boolean {
    if (!player) {
      return false;
    }
    return selectedPlayers.has(player.id);
  }

  function togglePlayerSelected(player: Player) {
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
  }

  function getCourtSelected(courtId: string | undefined): boolean {
    if (!courtId) {
      return false;
    }
    return selectedCourts.has(courtId);
  }

  function toggleCourtSelected(courtId: string) {
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
  }

  function courtSelectDisabled(courtId: string | undefined) {
    if (!courtId) {
      return true;
    }
    if (selectedCourts.has(courtId)) {
      return false;
    }
    return selectedCourts.size >= 1;
  }

  function handleSwapPlayers() {
    if (selectedPlayers.size !== 2) {
      return;
    }

    const playerIds = Array.from(selectedPlayers.keys());
    const [playerId1, playerId2] = playerIds;

    // Find positions of both players in the games
    function findPlayerPosition(id: string) {
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
        const sittingIndex = game.sittingOutIds.indexOf(id);
        if (sittingIndex !== -1)
          return { gameIndex, position: `sittingOut.${sittingIndex}` };
      }
      return null;
    };

    const position1 = findPlayerPosition(playerId1);
    const position2 = findPlayerPosition(playerId2);

    if (!position1 || !position2) {
      console.error("Could not find positions for selected players");
      return;
    }

    // Create new games array with swapped players
    const newGames = games.map((game, gameIndex) => {
      const newGame = { ...game };

      // Helper function to set player at position
      function setPlayerAtPosition(pos: string, playerId: string) {
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
          newGame.sittingOutIds = [...newGame.sittingOutIds];
          newGame.sittingOutIds[index] = playerId;
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

    // Update the store with new games
    dispatch(updateGames(newGames));

    // Clear selected players
    setSelectedPlayers(new Map());
  }


  function handleSetCourtRating() {
    selectedCourts.forEach((courtId) => {
      const court = getCourt(courtId);
      if (court?.minimumRating) {
        setCourtMinimumRating(courtId, undefined);
      } else {
        setCourtMinimumRating(courtId, 4.0);
      }
    });
    setSelectedCourts(new Set());
  }

  // function handleCourtSetting(courtId: string) {
  //     const court = getCourt(courtId);
  //     if (court?.minimumRating) {
  //       setCourtMinimumRating(courtId, undefined);
  //     } else {
  //       setCourtMinimumRating(courtId, 4.0);
  //     }
  // }

  function handleCourtSetting(courtId: string) {
    const court = getCourt(courtId);
    setCurrentCourtId(courtId);
    setRatingInput(court?.minimumRating?.toString() || "");
    setRatingEnabled(!!court?.minimumRating);
    //setCourtDisabled(!!court?.disabled);
    setCourtSettingDialogVisible(true);
  }

  function handleSaveCourtRating() {
    const court = getCourt(currentCourtId);
    if (!court) return;

    const rating = ratingEnabled && ratingInput.trim() !== "" ? parseFloat(ratingInput) : undefined;
    const updatedCourt = {
      ...court,
      minimumRating: rating,
      //disabled: courtDisabled
    };

    updateCourt(updatedCourt);
    setCourtSettingDialogVisible(false);
    setCurrentCourtId("");
    setRatingInput("");
    setRatingEnabled(false);
    setCourtDisabled(false);
  }

  function handleCancelCourtRating() {
    setCourtSettingDialogVisible(false);
    setCurrentCourtId("");
    setRatingInput("");
    setRatingEnabled(false);
    setCourtDisabled(false);
  }

  function handleRatingEnabledChange(enabled: boolean) {
    setRatingEnabled(enabled);
    if (!enabled) {
      setRatingInput("");
    }
  }

  const renderCourtAssignmentItem = ({ item, }: { item: Game; }) => {
    return renderCourtAssignment(item);
  }

  function renderCourtAssignment(game: Game) {
    const servePlayer1 = getPlayer(game.serveTeam.player1Id);
    const servePlayer2 = getPlayer(game.serveTeam.player2Id);
    const receivePlayer1 = getPlayer(game.receiveTeam.player1Id);
    const receivePlayer2 = getPlayer(game.receiveTeam.player2Id);

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
                {getCourt(game.courtId)?.name ? getCourt(game.courtId)?.name : "Court"}
                {/*getCourtMinimumRating(item.courtId) && ` (${getCourtMinimumRating(item.courtId)})`*/}
              </Text>
              {getCourtMinimumRating(game.courtId) && (<Badge size={22}>{getCourtMinimumRating(game.courtId)}</Badge>)}
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
            <Surface  // Serve side
              style={styles.courtSurface}
            >
              <Text variant="labelMedium" style={{
                fontWeight: "600",
                marginBottom: 4,
                color: theme.colors.onPrimaryContainer,
              }}
              >
                <Text variant="labelLarge" style={{
                  fontWeight: "bold",
                  marginBottom: 4,
                  color: theme.colors.onPrimaryContainer,
                }}>
                  {game.score ? ` : ${game.score?.serveScore}` : 'Serve'}
                </Text>
              </Text>
              <View style={{ flexDirection: "column", alignItems: "stretch", gap: 5 }}>
                <Chip
                  mode={chipMode}
                  //disabled={!editing || playerSelectDisabled(servePlayer1)}
                  disabled={playerSelectDisabled(servePlayer1)}
                  selected={getPlayerSelected(servePlayer1)}
                  onPress={() => {
                    editing && servePlayer1 && togglePlayerSelected(servePlayer1);
                  }}
                >
                  {servePlayer1?.name}
                  {showRating &&
                    servePlayer1?.rating &&
                    ` (${servePlayer1?.rating.toFixed(2)})`}
                </Chip>
                <Chip
                  mode={chipMode}
                  disabled={playerSelectDisabled(servePlayer2)}
                  selected={getPlayerSelected(servePlayer2)}
                  onPress={() => {
                    editing && servePlayer2 && togglePlayerSelected(servePlayer2);
                  }}
                >
                  {servePlayer2?.name}
                  {showRating &&
                    servePlayer2?.rating &&
                    ` (${servePlayer2?.rating.toFixed(2)})`}
                </Chip>
              </View>
            </Surface>
            <Surface  // Receive side
              style={styles.courtSurface}
            >
              <Text
                variant="labelMedium"
                style={{
                  fontWeight: "600",
                  marginBottom: 4,
                  color: theme.colors.onSecondaryContainer,
                }}
              >
                <Text variant="labelLarge" style={{
                  fontWeight: "bold",
                  marginBottom: 4,
                  color: theme.colors.onPrimaryContainer,
                }}>
                  {game.score ? ` : ${game.score?.receiveScore}` : 'Receive'}
                </Text>
              </Text>
              <View style={{ flexDirection: "column", gap: 5 }}>
                <Chip
                  mode={chipMode}
                  disabled={playerSelectDisabled(receivePlayer1)}
                  selected={getPlayerSelected(receivePlayer1)}
                  onPress={() => {
                    editing && receivePlayer1 && togglePlayerSelected(receivePlayer1);
                  }}
                >
                  {receivePlayer1?.name}
                  {showRating && receivePlayer1?.rating && ` (${receivePlayer1?.rating.toFixed(2)})`}
                </Chip>
                <Chip
                  mode={chipMode}
                  disabled={playerSelectDisabled(receivePlayer2)}
                  selected={getPlayerSelected(receivePlayer2)}
                  onPress={() => {
                    editing && receivePlayer2 && togglePlayerSelected(receivePlayer2);
                  }}
                >
                  {receivePlayer2?.name}
                  {showRating && receivePlayer2?.rating && ` (${receivePlayer2?.rating.toFixed(2)})`}
                </Chip>
              </View>
            </Surface>
          </View>
        </Card.Content>
      </Card>
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
          data={games ? games : []}
          renderItem={renderCourtAssignmentItem}
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
                {player.name}
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
        style={{ alignSelf: 'center', width: '80%', maxWidth: 400 }}
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

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
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
              width: 150
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

const styles = StyleSheet.create({
  courtSurface: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryContainer,
  },
});
