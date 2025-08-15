import { useRef, useState, useEffect } from "react";
import { View, Modal, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  Dialog,
  List,
  useTheme,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  RoundAssignment,
  Session,
  SessionState,
  Player,
  Round,
} from "@/src/types";
import PlayerStatsModal from "@/src/components/PlayerStatsModal";
import RoundComponent from "@/src/components/RoundComponent";
import { SessionCoordinator } from "@/src/services/sessionCoordinator";
import { getSessionPlayers } from "@/src/utils/util";
import { Alert } from "@/src/utils/alert";
import { updateCurrentRoundThunk } from "@/src/store/actions/sessionActions";

interface BetweenRoundsModalProps {
  visible: boolean;
  session: Session;
  onStartRound: () => void;
  onClose: () => void;
}

export default function BetweenRoundsModal({
  visible,
  session,
  onStartRound,
  onClose,
}: BetweenRoundsModalProps) {
  const theme = useTheme();
  const [selectedPlayers, setSelectedPlayers] = useState(
    new Map<string, Player>(),
  );
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [helpDialogVisible, setHelpDialogVisible] = useState(false);

  const { players } = useAppSelector((state) => state.players);

  const liveData = session.liveData
    ? session.liveData
    : { rounds: [], playerStats: [] };
  const roundNumber = liveData.rounds.length;
  const currentRound: Round =
    roundNumber > 0
      ? liveData.rounds[roundNumber]
      : { games: [], sittingOutIds: [] };
  const games = currentRound.games;
  const playerStats = liveData.playerStats;
  const sessionPlayers: Player[] = session
    ? getSessionPlayers(session, players)
    : [];

  // TODO use these:
  const showRating = session ? session.showRatings : false;
  const scoring = session ? session.scoring : false;

  const getPlayer = (playerId: string) =>
    sessionPlayers.find((p) => p.id === playerId);

  const sittingOutPlayers: Player[] = currentRound.sittingOutIds
    .map((id) => getPlayer(id))
    .filter((p) => p != undefined);

  const isLive = () => {
    return session.state === SessionState.Live;
  };

  function handleReshufflePlayers(excludeSitting: boolean) {
    if (!isLive()) {
      return;
    }
    let sittingOut = undefined;
    if (excludeSitting) {
      sittingOut = sittingOutPlayers;
    }
    const sessionCoordinator = new SessionCoordinator(session, sessionPlayers);
    const roundAssignment = sessionCoordinator.generateRoundAssignment();
    if (roundAssignment.gameAssignments.length === 0) {
      Alert.alert(
        "Cannot Generate Round",
        "Unable to create game assignments. Check player and court availability.",
        [{ text: "OK" }],
      );
      return;
    }
    updateCurrentRoundThunk({
      sessionId: session.id,
      assignment: roundAssignment,
    });

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
        <Appbar.Action
          icon="account-group"
          onPress={() => {
            setHelpDialogVisible(true);
          }}
        />
        <Appbar.Action
          icon="help-circle"
          onPress={() => {
            setHelpDialogVisible(true);
          }}
        />
      </Appbar.Header>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <RoundComponent editing={true} liveSession={session} />
          <View // Action buttons
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
        style={{ alignSelf: "center", width: "80%", maxWidth: 400 }}
        onDismiss={() => {
          setHelpDialogVisible(false);
        }}
      >
        <Dialog.Title>Help: New Round</Dialog.Title>
        <Dialog.Content>
          <View
            style={{
              marginTop: 20,
            }}
          >
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
