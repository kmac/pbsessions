import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Icon,
  Menu,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { updateSession } from "@/src/store/slices/sessionsSlice";
import { SessionCoordinator } from "@/src/services/sessionCoordinator";
import RoundComponent from "@/src/components/RoundComponent";
import RoundScoreEntryModal from "@/src/components/RoundScoreEntryModal";
import PlayerStatsModal from "@/src/components/PlayerStatsModal";
import BetweenRoundsModal from "@/src/components/BetweenRoundsModal";
import EditSessionModal from "@/src/components/EditSessionModal";
import { getSessionPlayers, logSession } from "@/src/utils/util";
import { Alert } from "@/src/utils/alert";
import { Player, Results, Session, SessionState } from "@/src/types";

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
  const { sessions } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  // useState is react
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [betweenRoundsVisible, setBetweenRoundsVisible] = useState(false);
  const [editSessionModalVisible, setEditSessionModalVisible] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<Date | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

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
    if (scoring) {
      setScoreModalVisible(true);
    } else {
      const results: Results = { scores: {} };
      currentRound.games.forEach((game) => {
        results.scores[game.id] = null;
      });
      handleRoundScoresSubmitted(results);
    }
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
          //buttonColor={theme.colors.secondary}
          contentStyle={{ paddingVertical: 2 }}
          //style={{ marginBottom: 12 }}
        >
          Start Round
        </Button>
        <Button
          icon="pencil"
          mode="outlined"
          onPress={() => {
            setBetweenRoundsVisible(true);
          }}
          //buttonColor={theme.colors.secondary}
          contentStyle={{ paddingVertical: 2 }}
          //style={{ marginBottom: 12 }}
        >
          Edit Round
        </Button>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "400",
              }}
            >
              Session: {liveSession.name}
            </Text>
          }
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              openEditSessionModal();
            }}
            title="Edit Session"
            leadingIcon="account-edit"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              endSession();
            }}
            title="End Session"
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

            <RoundComponent editing={false} session={liveSession} />
          </View>
        )}

        {/* Round Action Button */}
        <View style={{ marginBottom: 24 }}>{getRoundActionButton()}</View>

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
        sessionId={liveSession.id}
        onStartRound={handleStartRound}
        onClose={() => setBetweenRoundsVisible(false)}
        onEditSession={openEditSessionModal}
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
    </SafeAreaView>
  );
}
