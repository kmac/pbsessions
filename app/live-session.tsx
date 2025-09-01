import React, { useState, useEffect } from "react";
import { View, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Icon,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { SessionCoordinator } from "@/src/services/sessionCoordinator";
import RoundComponent from "@/src/components/RoundComponent";
import RoundScoreEntryModal from "@/src/components/RoundScoreEntryModal";
import PlayerStatsModal from "@/src/components/PlayerStatsModal";
import BetweenRoundsModal from "@/src/components/BetweenRoundsModal";
import RoundTimer from "@/src/components/RoundTimer";
import { getSessionPlayers, logSession } from "@/src/utils/util";
import { Alert } from "@/src/utils/alert";
import { Player, Results, SessionState } from "@/src/types";

import {
  applyNextRoundThunk,
  completeRoundThunk,
  startRoundThunk,
  endSessionThunk,
} from "@/src/store/actions/sessionActions";
import {
  getCurrentRound,
  getCurrentRoundNumber,
} from "@/src/services/sessionService";

export default function LiveSessionScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // useAppSelector, useAppDispatch is redux
  // const { liveSession: currentSession } = useAppSelector((state) => state.liveSession);
  const { sessions } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  // useState is react
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [betweenRoundsVisible, setBetweenRoundsVisible] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<Date | null>(null);

  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);

  // TODO we should have a way to look this up - probably need to use redux since it will be global
  const liveSession = sessions.find((s) => s.state === SessionState.Live);

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

  // if (!liveSession.courts) {
  //   dispatch(updateCourts(liveSession ? [...liveSession.courts] : []));
  // }

  const currentRoundNumber = getCurrentRoundNumber(liveSession, true);
  const currentRound = getCurrentRound(liveSession, true);

  const hasActiveRound = currentRoundNumber > 0;

  const isRoundInProgress =
    currentRound.games.length > 0 &&
    currentRound.games.some((g) => g.startedAt && !g.isCompleted);

  const isRoundCompleted =
    currentRound.games.length > 0 &&
    currentRound.games.every((g) => g.isCompleted);

  const numCompletedRounds = isRoundCompleted
    ? currentRoundNumber
    : currentRoundNumber - 1;

  const activeCourts = liveSession.courts
    ? liveSession.courts.filter((c) => c.isActive)
    : [];
  const numSittingOut = hasActiveRound
    ? currentRound.sittingOutIds.length || 0
    : 0;

  const liveSessionPlayers: Player[] = liveSession
    ? getSessionPlayers(liveSession, players)
    : [];

  const liveData = liveSession.liveData;

  const showRatings = liveSession.showRatings;
  const scoring = liveSession.scoring;

  const handleGenerateNewRound = () => {
    const sessionCoordinator = new SessionCoordinator(
      liveSession,
      liveSessionPlayers,
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
    setBetweenRoundsVisible(true);
  };

  const handleStartRound = () => {
    dispatch(startRoundThunk({ sessionId: liveSession.id }));
    setRoundStartTime(new Date());
    setBetweenRoundsVisible(false);
  };

  const handleCompleteRound = () => {
    if (!isRoundInProgress) {
      return;
    }
    setScoreModalVisible(true);
    // if (scoring) {
    //   setScoreModalVisible(true);
    // } else {
    //   handleRoundScoresSubmitted(null);
    // }
  };

  const handleRoundScoresSubmitted = (results: Results) => {
    const sessionCoordinator = new SessionCoordinator(
      liveSession,
      liveSessionPlayers,
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
    setRoundStartTime(null);
  };

  const endSession = () => {
    const handleEndSession = () => {
      logSession(liveSession, "Ending session");
      dispatch(endSessionThunk({ sessionId: liveSession.id }));
      setLiveSessionId(null);
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
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 12 }}
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
            contentStyle={{ paddingVertical: 8 }}
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
          buttonColor={theme.colors.tertiary}
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 12 }}
        >
          Complete Round
        </Button>
      );
    }

    return (
      <View
        style={{
          flexDirection: "column",
          columnGap: 12,
        }}
      >
        <Button
          icon="pencil-box"
          mode="contained"
          onPress={() => {
            setBetweenRoundsVisible(true);
          }}
          buttonColor={theme.colors.secondary}
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 12 }}
        >
          Edit Round {currentRoundNumber}
        </Button>
        <Button
          icon="play"
          mode="contained"
          onPress={handleStartRound}
          buttonColor={theme.colors.secondary}
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 12 }}
        >
          Start Round {currentRoundNumber}
        </Button>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* TODO remove this?  it must be in the uppper level */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={`Live Session: ${liveSession.name}`} />
        <Button
          mode="contained-tonal"
          icon="account-edit"
          onPress={() => {
            /* TODO */
          }}
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
      </Appbar.Header>

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

        {/* Timer Display */}
        {/*{isRoundInProgress && roundStartTime && (
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <RoundTimer startTime={roundStartTime} />
            </Card.Content>
          </Card>
        )}*/}

        {/* Round Action Button */}
        <View style={{ marginBottom: 24 }}>{getRoundActionButton()}</View>

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
              Round{" "}
              {isRoundCompleted
                ? `${currentRoundNumber} (Complete)`
                : `${currentRoundNumber} Games`}
            </Text>

            <RoundComponent editing={false} session={liveSession} />
          </View>
        )}

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
                  icon="trophy"
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

      <BetweenRoundsModal
        visible={betweenRoundsVisible}
        session={liveSession}
        onStartRound={handleStartRound}
        onClose={() => setBetweenRoundsVisible(false)}
      />

      <PlayerStatsModal
        visible={statsModalVisible}
        players={liveSessionPlayers}
        stats={liveData.playerStats}
        onClose={() => setStatsModalVisible(false)}
      />
    </SafeAreaView>
  );
}
