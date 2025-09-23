import { useState, useEffect, useCallback } from "react";
import { View, Modal, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  Dialog,
  FAB,
  List,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { SessionState, Player } from "@/src/types";
import PlayerStatsModal from "@/src/components/PlayerStatsModal";
import RoundComponent from "@/src/components/RoundComponent";
import TopDescription from "@/src/components/TopDescription";
import { SessionCoordinator } from "@/src/services/sessionCoordinator";
import { getCurrentRoundInfo } from "@/src/services/sessionService";
import { getSessionPlayers, getSessionPausedPlayers } from "@/src/utils/util";
import { Alert } from "@/src/utils/alert";
import { updateCurrentRoundThunk } from "@/src/store/actions/sessionActions";
import {
  registerCourtUpdateCallback,
  unregisterCourtUpdateCallback,
} from "@/src/store/middleware/courtUpdateListener";

interface BetweenRoundsModalProps {
  visible: boolean;
  sessionId: string;
  onStartRound: () => void;
  onClose: () => void;
  onEditSession?: () => void; // Add new prop for edit session callback
}

export default function BetweenRoundsModal({
  visible,
  sessionId,
  onStartRound,
  onClose,
  onEditSession,
}: BetweenRoundsModalProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;
  const [selectedPlayers, setSelectedPlayers] = useState(
    new Map<string, Player>(),
  );
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [helpDialogVisible, setHelpDialogVisible] = useState(false);
  const [canSwapPlayers, setCanSwapPlayers] = useState(false);
  const [swapPlayersHandler, setSwapPlayersHandler] = useState<
    (() => void) | null
  >(null);

  const { players } = useAppSelector((state) => state.players);
  const { sessions } = useAppSelector((state) => state.sessions);

  const handleSwapPlayersChange = useCallback(
    (canSwap: boolean, handler: () => void) => {
      setCanSwapPlayers(canSwap);
      setSwapPlayersHandler(() => handler);
    },
    [],
  );

  // Use useCallback to ensure we always get fresh session data
  const handleReshufflePlayers = useCallback(
    () => {
      console.debug("handleReshufflePlayers: in callback");

      // Get fresh session data on each call
      const currentSession = sessions.find((s) => s.id === sessionId);

      if (!currentSession || currentSession.state !== SessionState.Live) {
        return;
      }

      const sessionPlayers: Player[] = getSessionPlayers(
        currentSession,
        players,
      );

      const { currentRound } = getCurrentRoundInfo(currentSession.liveData);

      const sessionCoordinator = new SessionCoordinator(
        currentSession,
        sessionPlayers,
        getSessionPausedPlayers(currentSession, players),
      );
      const roundAssignment =
        sessionCoordinator.generateRoundAssignment();

      if (roundAssignment.gameAssignments.length === 0) {
        Alert.alert(
          "Cannot Generate Round",
          "Unable to create game assignments. Check player and court availability.",
          [{ text: "OK" }],
        );
        return;
      }

      dispatch(
        updateCurrentRoundThunk({
          sessionId: sessionId,
          assignment: roundAssignment,
        }),
      );
      setSelectedPlayers(new Map());
    },
    [sessionId, sessions, players, dispatch],
  );

  // Register court update callback when component mounts
  useEffect(() => {
    const handleCourtUpdate = () => {
      handleReshufflePlayers();
    };

    registerCourtUpdateCallback(sessionId, handleCourtUpdate);

    // Cleanup on unmount
    return () => {
      unregisterCourtUpdateCallback(sessionId);
    };
  }, [sessionId, handleReshufflePlayers]);

  // Get current session for rendering
  const currentSession = sessions.find((s) => s.id === sessionId);

  // Early return if session not found
  if (!currentSession) {
    return null;
  }

  const { liveData, roundIndex, currentRound } = getCurrentRoundInfo(
    currentSession.liveData,
  );

  const playerStats = liveData.playerStats;
  const sessionPlayers: Player[] = getSessionPlayers(currentSession, players);

  return (
    <>
      <Modal
        visible={visible && !statsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
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
                  New Round: {roundIndex}
                </Text>
              }
            />
            {onEditSession && (
              <Appbar.Action icon="pencil" onPress={onEditSession} />
            )}
            <Appbar.Action
              icon="help-circle"
              onPress={() => {
                setHelpDialogVisible(true);
              }}
            />
          </Appbar.Header>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <Surface
              style={{
                padding: 16,
                elevation: 1,
                marginBottom: 2,
              }}
            >
              <View style={{ flexDirection: "column", marginBottom: 8 }}>
                <TopDescription
                  visible={true}
                  description="Configure players and court settings for this round."
                />

                <RoundComponent
                  session={currentSession}
                  editing={true}
                  ratingSwitch={true}
                  onSwapPlayersChange={handleSwapPlayersChange}
                />

                <View // Action buttons
                  style={{
                    flexDirection: isSmallScreen ? "column" : "row",
                    alignContent: "space-between",
                    gap: 12,
                  }}
                >
                  <Button
                    icon="play"
                    mode="contained"
                    onPress={onStartRound}
                    contentStyle={{ padding: 2 }}
                    style={isSmallScreen ? { flex: 1 } : undefined}
                  >
                    Start
                  </Button>
                  <Button
                    icon="refresh"
                    mode="outlined"
                    onPress={() => {
                      handleReshufflePlayers();
                    }}
                    contentStyle={{ padding: 2 }}
                    style={isSmallScreen ? { flex: 1 } : undefined}
                  >
                    Reshuffle
                  </Button>
                  <Button
                    icon="chart-box"
                    mode="outlined"
                    onPress={() => {
                      setStatsModalVisible(true);
                    }}
                    contentStyle={{ padding: 2 }}
                    style={isSmallScreen ? { flex: 1 } : undefined}
                  >
                    {isSmallScreen ? "Stats" : "Player Stats"}
                  </Button>

                  {onEditSession && (
                    <Button
                      icon="pencil"
                      mode="outlined"
                      onPress={onEditSession}
                      contentStyle={{ padding: 2 }}
                      style={isSmallScreen ? { flex: 1 } : undefined}
                    >
                      Edit Session
                    </Button>
                  )}
                </View>
              </View>
            </Surface>
          </ScrollView>

          {canSwapPlayers && (
            <FAB
              icon="swap-horizontal-bold"
              label="Swap Players"
              size="large"
              variant="tertiary"
              style={{
                position: "absolute",
                margin: 16,
                right: 16,
                bottom: 100,
              }}
              onPress={() => swapPlayersHandler && swapPlayersHandler()}
            />
          )}

          <Dialog
            visible={helpDialogVisible}
            style={{
              alignSelf: "center",
              width: "80%",
              maxWidth: 400,
              position: "absolute",
              top: "20%",
              zIndex: 1000,
            }}
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
                    title="Start Round"
                    description="Select the 'Start Round' button to begin playing."
                  />
                  <List.Item
                    title="Swap any Players"
                    description="Select any two players to enable the swap action. You can swap active or sitting-out players."
                  />
                  <List.Item
                    title="Courts"
                    description="Select any court to enable/disable/modify the court parameters."
                  />
                  <List.Item
                    title="Edit Session"
                    description="Modify session settings like courts, players, or session details."
                  />
                </Card>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setHelpDialogVisible(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </SafeAreaView>
      </Modal>

      <PlayerStatsModal
        visible={statsModalVisible}
        players={sessionPlayers}
        stats={playerStats}
        onClose={() => setStatsModalVisible(false)}
      />
    </>
  );
}
