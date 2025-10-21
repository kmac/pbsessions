import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Text,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router";
import { Timer } from "@/src/components/Timer";
import { Alert } from "@/src/utils/alert";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { SessionState, Player, Results } from "@/src/types";
import {
  completeRoundThunk,
  applyNextRoundThunk,
} from "@/src/store/actions/sessionActions";
import {
  getCurrentRound,
  getCurrentRoundIndex,
} from "@/src/services/sessionService";
import { RoundAssigner } from "@/src/services/roundAssigner";
import { RoundScoreEntryModal } from "@/src/components/RoundScoreEntryModal";
import {
  filterPausedPlayers,
  getSessionPlayers,
  getSessionPausedPlayers,
} from "@/src/utils/util";

export default function TimerScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const [scoreModalVisible, setScoreModalVisible] = useState(false);

  const { sessions } = useAppSelector((state) => state.sessions);
  const { players: allPlayers } = useAppSelector((state) => state.players);

  const liveSession = sessions.find((s) => s.state === SessionState.Live);

  const handleTimerComplete = (totalTimeElapsed: number) => {
    const minutes = Math.floor(totalTimeElapsed / 60);
    Alert.alert(
      "Timer Complete!",
      `Time's up! ${minutes} minute${minutes !== 1 ? "s" : ""} elapsed.`
    );
  };

  const handleCompleteRound = () => {
    if (!liveSession) {
      return;
    }

    const currentRound = getCurrentRound(liveSession, true);
    const isRoundInProgress =
      currentRound.games.length > 0 &&
      currentRound.games.some((g) => g.startedAt && !g.isCompleted);

    if (!isRoundInProgress) {
      Alert.alert(
        "No Round in Progress",
        "There is no active round to complete.",
        [{ text: "OK" }]
      );
      return;
    }

    if (liveSession.scoring) {
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
    if (!liveSession) {
      return;
    }

    const currentRound = getCurrentRound(liveSession, true);
    const liveSessionPlayers: Player[] = getSessionPlayers(
      liveSession,
      allPlayers
    );
    const liveSessionPausedPlayers: Player[] = getSessionPausedPlayers(
      liveSession,
      allPlayers
    );

    const roundAssigner = new RoundAssigner(
      liveSession,
      filterPausedPlayers(liveSessionPlayers, liveSessionPausedPlayers)
    );
    const updatedPlayerStats = roundAssigner.updateStatsForRound(
      currentRound.games,
      results
    );

    dispatch(
      completeRoundThunk({
        sessionId: liveSession.id,
        results: results,
        updatedPlayerStats: updatedPlayerStats,
      })
    );

    setScoreModalVisible(false);

    // Generate next round and navigate to between-rounds
    const nextRoundAssignment = roundAssigner.generateRoundAssignment();
    if (nextRoundAssignment.gameAssignments.length === 0) {
      Alert.alert(
        "Cannot Generate Round",
        "Unable to create game assignments for the next round. Please check player and court availability.",
        [{ text: "OK" }]
      );
      router.back();
      return;
    }

    dispatch(
      applyNextRoundThunk({
        sessionId: liveSession.id,
        assignment: nextRoundAssignment,
      })
    );

    router.push({
      pathname: "/between-rounds",
      params: {
        sessionId: liveSession.id,
        canEditSession: "true",
      },
    });
  };

  const currentRound = liveSession ? getCurrentRound(liveSession, true) : null;
  const isRoundInProgress =
    liveSession &&
    currentRound &&
    currentRound.games.length > 0 &&
    currentRound.games.some((g) => g.startedAt && !g.isCompleted);

  const liveSessionPlayers: Player[] = liveSession
    ? getSessionPlayers(liveSession, allPlayers)
    : [];

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content
            title={
              <Text
                variant="titleLarge"
                style={{
                  alignItems: "center",
                  fontWeight: "600",
                }}
              >
                Timer
              </Text>
            }
          />
        </Appbar.Header>

        <ScrollView
          contentContainerStyle={{
            padding: 16,
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
          }}
        >
          <Timer
            visible={true}
            minutes={15}
            seconds={0}
            onComplete={handleTimerComplete}
          />

          {isRoundInProgress && (
            <Button
              icon="stop"
              mode="contained"
              onPress={handleCompleteRound}
              style={{ marginTop: 24, minWidth: 200 }}
              // contentStyle={{ paddingVertical: 8 }}
            >
              Complete Round
            </Button>
          )}
        </ScrollView>
      </SafeAreaView>

      {liveSession && currentRound && (
        <RoundScoreEntryModal
          visible={scoreModalVisible}
          games={currentRound.games}
          players={liveSessionPlayers}
          courts={liveSession.courts}
          onSave={handleRoundScoresSubmitted}
          onClose={() => setScoreModalVisible(false)}
        />
      )}
    </>
  );
}

