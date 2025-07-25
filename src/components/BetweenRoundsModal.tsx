import React, { useState } from "react";
import { View, Modal, ScrollView, FlatList } from "react-native";
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
  HelperText,
  Icon,
  IconButton,
  List,
  Surface,
  Switch,
  Text,
  TextInput,
  Tooltip,
  useTheme,
} from "react-native-paper";
import {
  updateCurrentSessionGames,
  updateCourts,
} from "@/src/store/slices/liveSessionSlice";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { Court, Game, Player, PlayerStats } from "../types";
import PlayerStatsModal from "@/src/components/PlayerStatsModal";
import Round from "@/src/components/Round";
import { SessionRoundManager } from "@/src/utils/sessionRoundManager";
import { getLiveSessionPlayers } from "@/src/utils/util";
import { Alert } from "@/src/utils/alert";

interface BetweenRoundsModalProps {
  visible: boolean;
  onStartRound: () => void;
  onClose: () => void;
}

export default function BetweenRoundsModal({
  visible,
  onStartRound,
  onClose,
}: BetweenRoundsModalProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [selectedPlayers, setSelectedPlayers] = useState(new Map<string, Player>());
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [helpDialogVisible, setHelpDialogVisible] = useState(false);

  const { currentSession } = useAppSelector((state) => state.liveSession);
  const { sessions } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  const games = currentSession ? currentSession.activeGames : [];
  const courts = currentSession ? currentSession.courts : [];
  const playerStats = currentSession ? currentSession.playerStats : [];
  const sessionPlayers: Player[] = currentSession ? getLiveSessionPlayers(currentSession, sessions, players) : [];
  const roundNumber = currentSession ? currentSession.currentGameNumber : 0;

  const roundAssigner = new SessionRoundManager(sessionPlayers, courts, playerStats);

  // TODO use these:
  const showRating = currentSession ? currentSession.showRatings : false;
  const scoring = currentSession ? currentSession.scoring : false;

  const getPlayer = (playerId: string) =>
    sessionPlayers.find((p) => p.id === playerId);

  const sittingOutPlayers =
    games.length > 0
      ? (games[0].sittingOutIds.map(getPlayer).filter(Boolean) as Player[])
      : [];

  function handleReshufflePlayers(excludeSitting: boolean) {
    let sittingOut = undefined;
    if (excludeSitting) {
      sittingOut = sittingOutPlayers;
    }
    const assignments = roundAssigner.generateGameAssignments(sittingOut);

    if (assignments.length === 0) {
      Alert.alert(
        "Cannot Generate Round",
        "Unable to create game assignments. Check player and court availability.",
        [{ text: "OK" }],
      );
      return;
    }

    const newGames: Game[] = assignments.map((assignment, index) => ({
      id: games[index].id,
      sessionId: games[index].sessionId,
      gameNumber: roundNumber,
      courtId: assignment.court.id,
      serveTeam: {
        player1Id: assignment.serveTeam[0].id,
        player2Id: assignment.serveTeam[1].id,
      },
      receiveTeam: {
        player1Id: assignment.receiveTeam[0].id,
        player2Id: assignment.receiveTeam[1].id,
      },
      sittingOutIds: assignment.sittingOut.map((p) => p.id),
      isCompleted: false,
    }));

    dispatch(updateCurrentSessionGames(newGames));

    // Clear selected players after reshuffling since assignments have changed
    setSelectedPlayers(new Map());
  }


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={onClose} />
        <Appbar.Content title={`New Games: Round ${roundNumber}`} />
        <Appbar.Action icon="account-group" onPress={() => { setHelpDialogVisible(true) }} />
        <Appbar.Action icon="help-circle" onPress={() => { setHelpDialogVisible(true) }} />
      </Appbar.Header>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Round
            editing={true}
            roundNumber={roundNumber}
          />
          <View  // Action buttons
            style={{
              flexDirection: "row",
              alignContent: "space-between",
              columnGap: 12,
            }}
          >
            <Button
              icon="play"
              mode="contained"
              onPress={onStartRound}
              contentStyle={{ padding: 2 }}
            >
              Start Round {roundNumber}
            </Button>
            <Button
              icon="refresh"
              mode="outlined"
              onPress={() => {
                handleReshufflePlayers(false);
              }}
              contentStyle={{ padding: 2 }}
            >
              Reshuffle
            </Button>
            <Button
              icon="chart-box"
              mode="elevated"
              onPress={() => {
                setStatsModalVisible(true);
              }}
              contentStyle={{ padding: 2 }}
            >
              Show Player Stats
            </Button>
          </View>
        </ScrollView>

      </SafeAreaView>

      <Dialog
        visible={helpDialogVisible}
        style={{ alignSelf: 'center', width: '80%', maxWidth: 400 }}
        onDismiss={() => { setHelpDialogVisible(false) }}
      >
        <Dialog.Title>Help: New Round</Dialog.Title>
        <Dialog.Content>
          <View style={{
            marginTop: 20,
          }}>
            <Card>
              <List.Item
                title="Swap"
                description="Select any two players to enable swap action. You can swap active or sitting-out players."
              />
              <List.Item
                title="Courts"
                description="Select any court to modify court parameters."
              />
              <List.Item
                title="Start Round"
                description="Select the 'Start Round' button to begin playing."
              />
            </Card>
          </View>
        </Dialog.Content>
      </Dialog>

      <PlayerStatsModal
        visible={statsModalVisible}
        players={sessionPlayers}
        stats={playerStats}
        onClose={() => setStatsModalVisible(false)}
      />
    </Modal>
  );
}
