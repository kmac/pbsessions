import React, { useCallback, useState, useEffect } from "react";
import { View, ScrollView, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Icon,
  Menu,
  Surface,
  Switch,
  Text,
  useTheme,
  Modal,
  TextInput,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { updateSession } from "@/src/store/slices/sessionsSlice";
import { SessionCoordinator } from "@/src/services/sessionCoordinator";
import { RoundComponent } from "@/src/components/RoundComponent";
import { RoundScoreEntryModal } from "@/src/components/RoundScoreEntryModal";
import { PlayerStatsModal } from "@/src/components/PlayerStatsModal";
import { EditSessionModal } from "@/src/components/EditSessionModal";
import { getRoundNumber } from "@/src/services/sessionService";
import {
  getSessionPlayers,
  getSessionPausedPlayers,
  logSession,
} from "@/src/utils/util";
import { Alert } from "@/src/utils/alert";
import { Player, Results, Score, Session, SessionState } from "@/src/types";

import {
  applyNextRoundThunk,
  completeRoundThunk,
  startRoundThunk,
  endSessionThunk,
} from "@/src/store/actions/sessionActions";
import {
  getCurrentRound,
  getCurrentRoundIndex,
  SessionService,
} from "@/src/services/sessionService";

export default function LiveSessionScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const params = useLocalSearchParams<{ action?: string }>();

  // useAppSelector, useAppDispatch is redux
  const { sessions } = useAppSelector((state) => state.sessions);
  const { players: allPlayers } = useAppSelector((state) => state.players);

  // useState is react
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [editSessionModalVisible, setEditSessionModalVisible] = useState(false);
  const [pulldownMenuVisible, setPulldownMenuVisible] = useState(false);
  const [generateRoundsMenuVisible, setGenerateRoundsMenuVisible] =
    useState(false);
  const [generateRoundsModalVisible, setGenerateRoundsModalVisible] =
    useState(false);
  const [generateNumberOfRounds, setGenerateNumberOfRounds] = useState("10");
  const [generateSimulateScoring, setGenerateSimulateScoring] =
    useState<boolean>(false);

  // TODO we should have a way to look this up - probably need to use redux since it will be global
  const liveSession = sessions.find((s) => s.state === SessionState.Live);

  // Handle action parameters from modal routes
  useEffect(() => {
    if (params.action === "startRound" && liveSession) {
      dispatch(startRoundThunk({ sessionId: liveSession.id }));
      // Clear the action parameter
      router.setParams({ action: undefined });
    } else if (params.action === "editSession" && liveSession) {
      setEditSessionModalVisible(true);
      // Clear the action parameter
      router.setParams({ action: undefined });
    }
  }, [params.action, liveSession, dispatch]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If no modals open, handle session navigation
        if (liveSession) {
          const isRoundInProgress = liveSession.liveData?.rounds.some((round) =>
            round.games.some((game) => game.startedAt && !game.isCompleted),
          );

          if (isRoundInProgress) {
            Alert.alert(
              "Session in Progress",
              "You have games in progress. Are you sure you want to leave?",
              [
                { text: "Stay", style: "cancel" },
                {
                  text: "Leave",
                  style: "destructive",
                  onPress: () => router.navigate("/sessions"),
                },
              ],
            );
          } else {
            Alert.alert(
              "Leave Session",
              "Are you sure you want to leave this live session?",
              [
                { text: "Stay", style: "cancel" },
                {
                  text: "Leave",
                  onPress: () => router.navigate("/sessions"),
                },
              ],
            );
          }
          // Prevent default back action
          return true;
        }

        // No live session, allow normal navigation
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [
      // scoreModalVisible,
      // statsModalVisible,
      // betweenRoundsVisible,
      // editSessionModalVisible,
      // generateRoundsModalVisible,
      liveSession,
    ]),
  );

  if (!liveSession || !liveSession.liveData) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Surface
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            margin: 20,
          }}
        >
          <Icon source="alert-circle-outline" size={48} />
          <Text
            variant="headlineSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginVertical: 20,
              textAlign: "center",
            }}
          >
            No active session
          </Text>
          <Button
            mode="outlined"
            onPress={() => router.navigate("/sessions")}
            icon="arrow-left"
          >
            Back to Sessions
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  const currentRoundIndex = getCurrentRoundIndex(liveSession);
  const currentRoundNumber = getRoundNumber(currentRoundIndex);
  const currentRound = getCurrentRound(liveSession, true);

  const hasActiveRound =
    currentRoundIndex >= 0 && currentRound.games.length > 0;

  const isRoundInProgress =
    hasActiveRound &&
    currentRound.games.some((g) => g.startedAt && !g.isCompleted);

  const isRoundCompleted =
    currentRound.games.length > 0 &&
    currentRound.games.every((g) => g.isCompleted);

  const numCompletedRounds = isRoundCompleted
    ? currentRoundIndex
    : currentRoundIndex - 1;

  const activeCourts = liveSession.courts
    ? liveSession.courts.filter((c) => c.isActive)
    : [];
  const numSittingOut = hasActiveRound
    ? currentRound.sittingOutIds.length || 0
    : 0;

  const liveSessionPlayers: Player[] = liveSession
    ? getSessionPlayers(liveSession, allPlayers)
    : [];

  const liveSessionPausedPlayers: Player[] = liveSession
    ? getSessionPausedPlayers(liveSession, allPlayers)
    : [];

  const liveData = liveSession.liveData;

  const showRatings = liveSession.showRatings;
  const scoring = liveSession.scoring;

  // Session editing functions
  const openEditSessionModal = () => {
    setEditSessionModalVisible(true);
  };

  const closeEditSessionModal = () => {
    setEditSessionModalVisible(false);
  };

  const handleSaveSession = (
    sessionData:
      | Session
      | Omit<Session, "id" | "state" | "createdAt" | "updatedAt">,
  ) => {
    const data = sessionData as Session;
    dispatch(updateSession(data));
    closeEditSessionModal();
  };

  const handleGenerateNewRound = () => {
    const sessionCoordinator = new SessionCoordinator(
      liveSession,
      liveSessionPlayers,
      liveSessionPausedPlayers,
    );
    const roundAssignment = sessionCoordinator.generateRoundAssignment();
    if (roundAssignment.gameAssignments.length === 0) {
      Alert.alert(
        "Cannot Generate Round",
        "Unable to create game assignments. Check player and court availability.",
        [{ text: "OK" }],
      );
      return;
    }
    dispatch(
      applyNextRoundThunk({
        sessionId: liveSession.id,
        assignment: roundAssignment,
      }),
    );
    router.push({
      pathname: "/between-rounds",
      params: {
        sessionId: liveSession.id,
        canEditSession: "true",
      },
    });
  };

  const handleStartRound = () => {
    dispatch(startRoundThunk({ sessionId: liveSession.id }));
  };

  const handleCompleteRound = () => {
    if (!isRoundInProgress) {
      return;
    }
    if (scoring) {
      setScoreModalVisible(true);
    } else {
      const results: Results = { scores: {} };
      currentRound.games.forEach((game) => {
        results.scores[game.id] = null;
      });
      handleRoundScoresSubmitted(results);
      // handleGenerateNewRound();
    }
  };

  const handleRoundScoresSubmitted = (results: Results) => {
    const sessionCoordinator = new SessionCoordinator(
      liveSession,
      liveSessionPlayers,
      liveSessionPausedPlayers,
    );
    const updatedPlayerStats = sessionCoordinator.updateStatsForRound(
      currentRound.games,
      results,
    );
    dispatch(
      completeRoundThunk({
        sessionId: liveSession.id,
        results: results,
        updatedPlayerStats: updatedPlayerStats,
      }),
    );
    setScoreModalVisible(false);
  };

  const endSession = () => {
    const handleEndSession = () => {
      logSession(liveSession, "Ending session");
      dispatch(endSessionThunk({ sessionId: liveSession.id }));
      router.navigate("/sessions");
    };
    if (isRoundInProgress) {
      Alert.alert(
        "Round in Progress",
        "There is a round currently in progress. End session anyway?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End Session",
            style: "destructive",
            onPress: handleEndSession,
          },
        ],
      );
    } else {
      Alert.alert("End Session", "Are you sure you want to end this session?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          onPress: handleEndSession,
        },
      ]);
    }
  };

  const getRoundActionButton = () => {
    //
    // Returns one element, depending on current state
    //
    if (!hasActiveRound) {
      return (
        <Button
          icon="play"
          mode="contained"
          onPress={handleGenerateNewRound}
          contentStyle={{ paddingVertical: 2 }}
          // style={{ marginBottom: 12 }}
        >
          {numCompletedRounds <= 0
            ? "Generate First Round"
            : `Generate Next Round (${numCompletedRounds})`}
        </Button>
      );
    }

    if (isRoundCompleted) {
      return (
        <View style={{ marginBottom: 12 }}>
          <Chip
            icon="trophy"
            style={{
              alignSelf: "center",
              marginBottom: 12,
              backgroundColor: theme.colors.tertiaryContainer,
            }}
            textStyle={{
              color: theme.colors.onTertiaryContainer,
              fontWeight: "600",
            }}
          >
            Round {currentRoundNumber} Completed
          </Chip>
          <Button
            icon="play"
            mode="contained"
            onPress={handleGenerateNewRound}
            contentStyle={{ paddingVertical: 2 }}
          >
            Generate Next Round
          </Button>
        </View>
      );
    }

    if (isRoundInProgress) {
      return (
        <Button
          icon="stop"
          mode="contained"
          onPress={handleCompleteRound}
          // buttonColor={theme.colors.tertiary}
          contentStyle={{ paddingVertical: 2 }}
          // style={{ marginBottom: 12 }}
        >
          {/* {scoring ? "Complete Round" : "Generate Next Round"} */}
          Complete Round
        </Button>
      );
    }

    return (
      <View
        style={{
          flexDirection: "row",
          columnGap: 12,
        }}
      >
        <Button
          icon="play"
          mode="contained"
          onPress={handleStartRound}
          contentStyle={{ paddingVertical: 2 }}
        >
          Start Round
        </Button>
        <Button
          icon="pencil"
          mode="outlined"
          onPress={() => {
            router.push({
              pathname: "/between-rounds",
              params: {
                sessionId: liveSession.id,
                canEditSession: "true",
              },
            });
          }}
          contentStyle={{ paddingVertical: 2 }}
        >
          Lineup
        </Button>
      </View>
    );
  };

  const openGenerateRoundsModal = () => {
    setGenerateRoundsModalVisible(true);
  };

  const closeGenerateRoundsModal = () => {
    setGenerateRoundsModalVisible(false);
    setGenerateNumberOfRounds("1");
  };

  const handleGenerateMultipleRounds = () => {
    const numRounds = parseInt(generateNumberOfRounds);
    if (isNaN(numRounds) || numRounds < 1 || numRounds > 20) {
      Alert.alert(
        "Invalid Number",
        "Please enter a valid number of rounds (1-20).",
        [{ text: "OK" }],
      );
      return;
    }

    let successfulRounds = 0;
    let currentSession = { ...liveSession };

    const simulateScore = (): Score => {
      const randomOutcome = Math.floor(Math.random() * 10);
      let score: Score = {
        serveScore: 0,
        receiveScore: 0,
      };
      if (randomOutcome <= 4) {
        // serve-side wins
        score.serveScore = 11;
        score.receiveScore = Math.floor(Math.random() * 10);
      } else {
        // receive-side wins
        score.receiveScore = 11;
        score.serveScore = Math.floor(Math.random() * 10);
      }
      return score;
    };

    const generateNextRound = () => {
      // Check if finished
      if (successfulRounds >= numRounds) {
        // Update our session with all the new rounds.
        dispatch(updateSession(currentSession));
        Alert.alert(
          "Rounds Generated",
          `Successfully generated ${successfulRounds} round${successfulRounds > 1 ? "s" : ""}. You can view them using the session history.`,
          [{ text: "OK" }],
        );
        closeGenerateRoundsModal();
        return;
      }

      try {
        let sc = new SessionCoordinator(
          currentSession,
          liveSessionPlayers,
          liveSessionPausedPlayers,
        );
        const roundAssignment = sc.generateRoundAssignment();

        if (roundAssignment.gameAssignments.length === 0) {
          Alert.alert(
            "Round Generation Stopped",
            `Generated ${successfulRounds} rounds. Cannot generate more rounds - unable to create valid game assignments.`,
            [{ text: "OK" }],
          );
          closeGenerateRoundsModal();
          return;
        }

        currentSession = SessionService.applyNextRound(
          currentSession,
          roundAssignment,
        );
        if (!currentSession) {
          Alert.alert(
            "Round Generation Error",
            `Error generating round ${successfulRounds + 1}: no current session.`,
            [{ text: "OK" }],
          );
          closeGenerateRoundsModal();
        }
        // refresh our coordinator for updated session
        sc = new SessionCoordinator(
          currentSession,
          liveSessionPlayers,
          liveSessionPausedPlayers,
        );

        // Update player stats and complete the round
        const currentRoundGames = getCurrentRound(currentSession, true).games;
        const results: Results = { scores: {} };
        currentRoundGames.forEach((game) => {
          results.scores[game.id] = generateSimulateScoring
            ? simulateScore()
            : null;
        });

        const updatedPlayerStats = sc.updateStatsForRound(
          currentRoundGames,
          results,
        );

        currentSession = SessionService.completeRound(
          currentSession,
          results,
          updatedPlayerStats,
        );
        if (!currentSession) {
          Alert.alert(
            "Round Generation Error",
            `Error completing round ${successfulRounds + 1}: no current session`,
            [{ text: "OK" }],
          );
          closeGenerateRoundsModal();
        }

        successfulRounds++;
        generateNextRound();
      } catch (error) {
        Alert.alert(
          "Round Generation Error",
          `Error generating round ${successfulRounds + 1}: ${error}`,
          [{ text: "OK" }],
        );
        closeGenerateRoundsModal();
      }
    };

    // Start generating rounds
    generateNextRound();
  };

  const handleGenerateMultipleRoundsViaThunks = () => {
    const numRounds = parseInt(generateNumberOfRounds);
    if (isNaN(numRounds) || numRounds < 1 || numRounds > 20) {
      Alert.alert(
        "Invalid Number",
        "Please enter a valid number of rounds (1-20).",
        [{ text: "OK" }],
      );
      return;
    }

    let successfulRounds = 0;
    let currentSession = { ...liveSession };

    const simulateScore = (): Score => {
      const randomOutcome = Math.floor(Math.random() * 10);
      let score: Score = {
        serveScore: 0,
        receiveScore: 0,
      };
      if (randomOutcome <= 4) {
        // serve-side wins
        score.serveScore = 11;
        score.receiveScore = Math.floor(Math.random() * 10);
      } else {
        // receive-side wins
        score.receiveScore = 11;
        score.serveScore = Math.floor(Math.random() * 10);
      }
      return score;
    };

    const generateNextRound = () => {
      if (successfulRounds >= numRounds) {
        // Update our session with all the new rounds.
        dispatch(updateSession(currentSession));

        Alert.alert(
          "Rounds Generated",
          `Successfully generated ${successfulRounds} round${successfulRounds > 1 ? "s" : ""}. You can view them using the session history.`,
          [{ text: "OK" }],
        );
        closeGenerateRoundsModal();
        return;
      }

      try {
        let sc = new SessionCoordinator(
          currentSession,
          liveSessionPlayers,
          liveSessionPausedPlayers,
        );
        const roundAssignment = sc.generateRoundAssignment();

        if (roundAssignment.gameAssignments.length === 0) {
          Alert.alert(
            "Round Generation Stopped",
            `Generated ${successfulRounds} rounds. Cannot generate more rounds - unable to create valid game assignments.`,
            [{ text: "OK" }],
          );
          closeGenerateRoundsModal();
          return;
        }

        currentSession = SessionService.applyNextRound(
          currentSession,
          roundAssignment,
        );
        if (!currentSession) {
          Alert.alert(
            "Round Generation Error",
            `Generated ${successfulRounds} rounds. Error generating round ${successfulRounds + 1}.`,
            [{ text: "OK" }],
          );
          closeGenerateRoundsModal();
        }
        // refresh our coordinator for updated session
        sc = new SessionCoordinator(
          currentSession,
          liveSessionPlayers,
          liveSessionPausedPlayers,
        );

        // Update player stats and complete the round
        const currentRoundGames = getCurrentRound(currentSession, true).games;
        const results: Results = { scores: {} };
        currentRoundGames.forEach((game) => {
          results.scores[game.id] = generateSimulateScoring
            ? simulateScore()
            : null;
        });

        const updatedPlayerStats = sc.updateStatsForRound(
          currentRoundGames,
          results,
        );

        currentSession = SessionService.completeRound(
          currentSession,
          results,
          updatedPlayerStats,
        );
        if (!currentSession) {
          Alert.alert(
            "Round Generation Error",
            `Generated ${successfulRounds} rounds. Error completing round ${successfulRounds + 1}.`,
            [{ text: "OK" }],
          );
          closeGenerateRoundsModal();
        }

        successfulRounds++;
        generateNextRound();
      } catch (error) {
        Alert.alert(
          "Round Generation Error",
          `Successfully generated ${successfulRounds} rounds. Error generating round ${successfulRounds + 1}: ${error}`,
          [{ text: "OK" }],
        );
        closeGenerateRoundsModal();
      }
    };

    // Start generating rounds
    generateNextRound();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={
            <>
              <Text
                variant="titleLarge"
                style={{
                  alignItems: "center",
                  fontWeight: "600",
                }}
              >
                Live Session
              </Text>
              <Text
                variant="titleSmall"
                style={{
                  alignItems: "center",
                  fontWeight: "400",
                }}
              >
                {liveSession.name}
              </Text>
            </>
          }
        />
        <Menu
          visible={pulldownMenuVisible}
          onDismiss={() => setPulldownMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setPulldownMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setPulldownMenuVisible(false);
              openEditSessionModal();
            }}
            title="Edit Session"
            leadingIcon="account-edit"
          />
          <Menu.Item
            onPress={() => {
              setPulldownMenuVisible(false);
              endSession();
            }}
            title="End Session"
            leadingIcon="stop"
          />
          <Menu.Item
            onPress={() => {
              setPulldownMenuVisible(false);
              openGenerateRoundsModal();
            }}
            title="Generate Rounds"
            leadingIcon="stop"
          />
        </Menu>
      </Appbar.Header>

      {/*<View style={{ flexDirection: "row" }}>
        <Button
          mode="contained-tonal"
          icon="account-edit"
          onPress={openEditSessionModal}
          style={{ marginRight: 8 }}
        >
          Edit Session
        </Button>
        <Button
          mode="contained-tonal"
          onPress={endSession}
          style={{ marginRight: 8 }}
        >
          End Session
        </Button>
      </View>*/}

      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Stats */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 16,
            gap: 8,
          }}
        >
          <Surface
            style={{
              flex: 1,
              borderRadius: 8,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text
              variant="headlineMedium"
              style={{
                fontWeight: "bold",
                color: theme.colors.primary,
                marginBottom: 4,
              }}
            >
              {liveSessionPlayers.length}
            </Text>
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              Total Players
            </Text>
          </Surface>

          <Surface
            style={{
              flex: 1,
              borderRadius: 8,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text
              variant="headlineMedium"
              style={{
                fontWeight: "bold",
                color: theme.colors.primary,
                marginBottom: 4,
              }}
            >
              {activeCourts.length}
            </Text>
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              Active Courts
            </Text>
          </Surface>

          <Surface
            style={{
              flex: 1,
              borderRadius: 8,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text
              variant="headlineMedium"
              style={{
                fontWeight: "bold",
                color: theme.colors.primary,
                marginBottom: 4,
              }}
            >
              {Math.max(0, numCompletedRounds)}
            </Text>
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              Completed Rounds
            </Text>
          </Surface>

          <Surface
            style={{
              flex: 1,
              borderRadius: 8,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text
              variant="headlineMedium"
              style={{
                fontWeight: "bold",
                color: theme.colors.primary,
                marginBottom: 4,
              }}
            >
              {numSittingOut}
            </Text>
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              Sitting Out
            </Text>
          </Surface>
        </View>

        {/* Current Round Games */}
        {hasActiveRound && (
          <View style={{ marginBottom: 24 }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              {isRoundCompleted
                ? `Round ${currentRoundNumber} (Complete)`
                : `Round ${currentRoundNumber} Games`}
            </Text>

            {isRoundInProgress && (
              <Surface
                style={{
                  backgroundColor: theme.colors.tertiaryContainer,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 12,
                    marginBottom: 12,
                    gap: 12,
                  }}
                >
                  <Icon source="autorenew" size={26} />
                  <Text
                    variant="bodyMedium"
                    style={{
                      fontWeight: "500",
                      fontStyle: "italic",
                      fontSize: 16,
                    }}
                  >
                    Games in progress...
                  </Text>
                </View>
              </Surface>
            )}

            <RoundComponent
              key={currentRoundIndex}
              session={liveSession}
              editing={false}
              ratingSwitch={true}
            />

            {isRoundInProgress && currentRound.games.length > 3 && (
              <Surface
                style={{
                  backgroundColor: theme.colors.tertiaryContainer,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 12,
                    marginBottom: 12,
                    gap: 12,
                  }}
                >
                  <Icon source="autorenew" size={26} />
                  <Text
                    variant="bodyMedium"
                    style={{
                      fontWeight: "500",
                      fontStyle: "italic",
                      fontSize: 16,
                    }}
                  >
                    Games in progress...
                  </Text>
                </View>
              </Surface>
            )}
          </View>
        )}

        {/* Round Action Button */}
        <View style={{ marginBottom: 20 }}>{getRoundActionButton()}</View>

        {/* Previous Rounds Summary */}
        {numCompletedRounds > 0 && (
          <Card style={{ marginBottom: 24, marginTop: 12 }}>
            <Card.Content>
              <Text
                variant="titleLarge"
                style={{
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                Session History
              </Text>

              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Rounds Completed:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                    {numCompletedRounds}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Total Games:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                    {numCompletedRounds * activeCourts.length}
                  </Text>
                </View>
                <Button
                  icon="chart-box"
                  mode="outlined"
                  onPress={() => setStatsModalVisible(true)}
                >
                  Player Stats
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <RoundScoreEntryModal
        visible={scoreModalVisible}
        games={currentRound.games}
        players={liveSessionPlayers}
        courts={liveSession.courts}
        onSave={handleRoundScoresSubmitted}
        onClose={() => setScoreModalVisible(false)}
      />

      <EditSessionModal
        visible={editSessionModalVisible}
        session={liveSession}
        onSave={handleSaveSession}
        onCancel={closeEditSessionModal}
      />

      <PlayerStatsModal
        visible={statsModalVisible}
        players={liveSessionPlayers}
        stats={liveData.playerStats}
        onClose={() => setStatsModalVisible(false)}
      />

      <Modal
        visible={generateRoundsModalVisible}
        onDismiss={closeGenerateRoundsModal}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          margin: 20,
          borderRadius: 8,
          padding: 20,
        }}
      >
        <Text
          variant="headlineSmall"
          style={{
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Generate Rounds
        </Text>

        <Text
          variant="bodyMedium"
          style={{
            marginBottom: 16,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          Enter the number of rounds to generate.
        </Text>

        <TextInput
          label="Number of Rounds"
          value={generateNumberOfRounds}
          onChangeText={setGenerateNumberOfRounds}
          keyboardType="numeric"
          mode="outlined"
          style={{ marginBottom: 20 }}
        />
        {__DEV__ && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text variant="bodyMedium" style={{ marginRight: 8 }}>
              Simulate Scoring:
            </Text>
            <Switch
              value={generateSimulateScoring}
              onValueChange={(value) => setGenerateSimulateScoring(value)}
            />
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Button
            mode="outlined"
            onPress={closeGenerateRoundsModal}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleGenerateMultipleRounds}
            style={{ flex: 1 }}
          >
            Generate Rounds
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
