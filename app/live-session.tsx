import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Appbar,
  Button,
  Card,
  Chip,
  Icon,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { useAppSelector, useAppDispatch } from '../src/store';
import {
  generateNextRound,
  startRound,
  completeRound,
  endLiveSession,
  updatePlayerStats as updatePlayerStatsInStore,
  updateCourts
} from '@/src/store/slices/liveSessionSlice';
import {
  endSession as endSession,
} from '../src/store/slices/sessionsSlice';
import { SessionRoundManager } from '@/src/utils/sessionRoundManager';
import RoundGameCard from '@/src/components/RoundGameCard';
import RoundScoreEntryModal from '@/src/components/RoundScoreEntryModal';
import PlayerStatsModal from '@/src/components/PlayerStatsModal';
import BetweenRoundsModal from '@/src/components/BetweenRoundsModal';
import RoundTimer from '@/src/components/RoundTimer';
import { COURT_COLORS } from '@/src/theme';
import { Alert } from '@/src/utils/alert';
import { Court, SessionState } from '@/src/types';

export default function LiveSessionScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { currentSession } = useAppSelector((state) => state.liveSession);
  const { sessions } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [betweenRoundsVisible, setBetweenRoundsVisible] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<Date | null>(null);

  const sessionPlayers = players.filter(p => currentSession?.sessionId &&
    sessions.find(s => s.id === currentSession.sessionId)?.playerIds.includes(p.id));
  const session = sessions.find(s => s.id === currentSession?.sessionId);
  if (currentSession) {
    // currentSession.courts = session ? [...session.courts] :[];
    if (!currentSession.courts) {
      dispatch(updateCourts(session ? [...session.courts] : []));
    }
  }
  const showRatings = currentSession ? currentSession.showRatings : false;
  const scoring = currentSession ? currentSession.scoring : false;

  if (!currentSession || !session) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Surface style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          margin: 20
        }}>
          <Icon source="alert-circle-outline" size={48} />
          <Text variant="headlineSmall" style={{
            color: theme.colors.onSurfaceVariant,
            marginVertical: 20,
            textAlign: 'center'
          }}>
            No active session
          </Text>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            icon="arrow-left"
          >
            Back to Sessions
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  const roundAssigner = new SessionRoundManager(
    sessionPlayers,
    currentSession.courts,
    currentSession.playerStats
  );

  const currentRoundGames = currentSession.activeGames || [];
  const isRoundInProgress = currentRoundGames.length > 0 && currentRoundGames.some(g => g.startedAt && !g.isCompleted);
  const isRoundCompleted = currentRoundGames.length > 0 && currentRoundGames.every(g => g.isCompleted);
  const hasActiveRound = currentRoundGames.length > 0;

  const activeCourts = currentSession.courts ? currentSession.courts.filter(c => c.isActive) : [];
  const sittingOutThisRound = hasActiveRound
    ? currentRoundGames[0]?.sittingOutIds.length || 0
    : 0;
  const completedRounds = currentSession.currentGameNumber - 1;

  const handleGenerateNewRound = () => {
    const assignments = roundAssigner.generateGameAssignments();

    if (assignments.length === 0) {
      Alert.alert(
        'Cannot Generate Round',
        'Unable to create game assignments. Check player and court availability.',
        [{ text: 'OK' }]
      );
      return;
    }

    dispatch(generateNextRound({ assignments }));
    setBetweenRoundsVisible(true);
  };

  const handleStartRound = () => {
    dispatch(startRound());
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

  // const handleRoundNoScoring = () => {
  //   const scores: Map<string, { serveScore: number; receiveScore: number } | undefined> = new Map()
  //   currentRoundGames.forEach(game => {
  //     const score = undefined;
  //     scores.set(game.id, score);
  //     roundAssigner.updatePlayerStatsForGame(game, score);
  //   });
  //   //score?: { serveScore: number; receiveScore: number }
  //   dispatch(completeRound({ scores }));
  //
  //   currentRoundGames.forEach(game => {
  //     const score = scores[game.id];
  //     roundAssigner.updatePlayerStatsForGame(game, score || undefined);
  //   });
  //
  //   const updatedStats = roundAssigner.getPlayerStats();
  //   dispatch(updatePlayerStatsInStore(updatedStats));
  //
  //   setScoreModalVisible(false);
  //   setRoundStartTime(null);
  // };

  const handleRoundScoresSubmitted = (scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }) => {
    dispatch(completeRound({ scores }));

    currentRoundGames.forEach(game => {
      const score = scores[game.id];
      roundAssigner.updatePlayerStatsForGame(game, score || undefined);
    });

    const updatedStats = roundAssigner.getPlayerStats();
    dispatch(updatePlayerStatsInStore(updatedStats));

    setScoreModalVisible(false);
    setRoundStartTime(null);
  };

  const handleEndSession = () => {
    if (isRoundInProgress) {
      Alert.alert(
        'Round in Progress',
        'There is a round currently in progress. End session anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Session',
            style: 'destructive',
            onPress: () => {
              dispatch(endSession(currentSession.sessionId));
              dispatch(endLiveSession());
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'End Session',
        'Are you sure you want to end this session?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Session',
            onPress: () => {
              dispatch(endSession(currentSession.sessionId));
              dispatch(endLiveSession());
              router.back();
            },
          },
        ]
      );
    }
  };

  const getRoundActionButton = () => {
    if (!hasActiveRound) {
      return (
        <Button
          icon="play"
          mode="contained"
          onPress={handleGenerateNewRound}
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 12 }}
        >
          {completedRounds === 0 ? 'Generate First Round' : 'Generate Next Round'}
        </Button>
      );
    }

    if (isRoundCompleted) {
      return (
        <View style={{ marginBottom: 12 }}>
          <Chip
            icon="trophy"
            style={{
              alignSelf: 'center',
              marginBottom: 12,
              backgroundColor: theme.colors.tertiaryContainer
            }}
            textStyle={{
              color: theme.colors.onTertiaryContainer,
              fontWeight: '600'
            }}
          >
            Round {currentSession.currentGameNumber - 1} Completed
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
      <Button
        icon="play"
        mode="contained"
        onPress={handleStartRound}
        buttonColor={theme.colors.secondary}
        contentStyle={{ paddingVertical: 8 }}
        style={{ marginBottom: 12 }}
      >
        Start Round {currentSession.currentGameNumber}
      </Button>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={session.name}
        />
        <Button
          mode="contained-tonal"
          onPress={handleEndSession}
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
        <View style={{
          flexDirection: 'row',
          marginBottom: 16,
          gap: 8
        }}>
          <Surface style={{
            flex: 1,
            borderRadius: 8,
            padding: 12,
            alignItems: 'center'
          }}>
            <Text variant="headlineMedium" style={{
              fontWeight: 'bold',
              color: theme.colors.primary,
              marginBottom: 4
            }}>
              {sessionPlayers.length}
            </Text>
            <Text variant="labelMedium" style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center'
            }}>
              Total Players
            </Text>
          </Surface>

          <Surface style={{
            flex: 1,
            borderRadius: 8,
            padding: 12,
            alignItems: 'center'
          }}>
            <Text variant="headlineMedium" style={{
              fontWeight: 'bold',
              color: theme.colors.primary,
              marginBottom: 4
            }}>
              {activeCourts.length}
            </Text>
            <Text variant="labelMedium" style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center'
            }}>
              Active Courts
            </Text>
          </Surface>

          <Surface style={{
            flex: 1,
            borderRadius: 8,
            padding: 12,
            alignItems: 'center'
          }}>
            <Text variant="headlineMedium" style={{
              fontWeight: 'bold',
              color: theme.colors.primary,
              marginBottom: 4
            }}>
              {completedRounds}
            </Text>
            <Text variant="labelMedium" style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center'
            }}>
              Completed Rounds
            </Text>
          </Surface>

          <Surface style={{
            flex: 1,
            borderRadius: 8,
            padding: 12,
            alignItems: 'center'
          }}>
            <Text variant="headlineMedium" style={{
              fontWeight: 'bold',
              color: theme.colors.primary,
              marginBottom: 4
            }}>
              {sittingOutThisRound}
            </Text>
            <Text variant="labelMedium" style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center'
            }}>
              Sitting Out
            </Text>
          </Surface>
        </View>

        {/* Timer Display */}
        {isRoundInProgress && roundStartTime && (
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <RoundTimer startTime={roundStartTime} />
            </Card.Content>
          </Card>
        )}

        {/* Round Action Button */}
        <View style={{ marginBottom: 24 }}>
          {getRoundActionButton()}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              icon="trophy"
              mode="outlined"
              onPress={() => setStatsModalVisible(true)}
              style={{ flex: 1 }}
            >
              Player Stats
            </Button>

            {hasActiveRound && !isRoundInProgress && (
              <Button
                icon="cog"
                mode="outlined"
                onPress={() => setBetweenRoundsVisible(true)}
                style={{ flex: 1 }}
              >
                Adjust Round
              </Button>
            )}
          </View>
        </View>

        {/* Current Round Games */}
        {hasActiveRound && (
          <View style={{ marginBottom: 24 }}>
            <Text variant="titleLarge" style={{
              fontWeight: '600',
              marginBottom: 12
            }}>
              Round {isRoundCompleted ? currentSession.currentGameNumber - 1 : currentSession.currentGameNumber} Games
            </Text>
            {currentRoundGames.map((game, index) => (
              <RoundGameCard
                key={game.id}
                game={game}
                players={sessionPlayers}
                courtColor={COURT_COLORS[index % COURT_COLORS.length]}
                roundStatus={isRoundInProgress ? 'in-progress' : isRoundCompleted ? 'completed' : 'pending'}
              />
            ))}
          </View>
        )}

        {/* Sitting Out Players */}
        {hasActiveRound && sittingOutThisRound > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text variant="titleLarge" style={{
              fontWeight: '600',
              marginBottom: 12
            }}>
              Sitting Out This Round
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {currentRoundGames[0]?.sittingOutIds.map(playerId => {
                const player = sessionPlayers.find(p => p.id === playerId);
                return player ? (
                  <Chip key={player.id} icon="account">
                    {player.name}
                  </Chip>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Previous Rounds Summary */}
        {completedRounds > 0 && (
          <Card style={{ marginBottom: 24 }}>
            <Card.Content>
              <Text variant="titleLarge" style={{
                fontWeight: '600',
                marginBottom: 12
              }}>
                Session History
              </Text>

              <View style={{ gap: 8 }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text variant="bodyMedium" style={{
                    color: theme.colors.onSurfaceVariant
                  }}>
                    Rounds Completed:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {completedRounds}
                  </Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text variant="bodyMedium" style={{
                    color: theme.colors.onSurfaceVariant
                  }}>
                    Total Games:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {completedRounds * activeCourts.length}
                  </Text>
                </View>
              </View>

              <Button
                mode="text"
                onPress={() => setStatsModalVisible(true)}
                style={{ marginTop: 8 }}
              >
                View Detailed Stats
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <RoundScoreEntryModal
        visible={scoreModalVisible}
        games={currentRoundGames}
        players={sessionPlayers}
        onSave={handleRoundScoresSubmitted}
        onClose={() => setScoreModalVisible(false)}
      />

      <BetweenRoundsModal
        visible={betweenRoundsVisible}
        currentRound={isRoundCompleted ? currentSession.currentGameNumber : currentSession.currentGameNumber}
        games={currentRoundGames}
        // courts={[...session.courts]}
        allPlayers={sessionPlayers}
        playerStats={currentSession.playerStats}
        roundAssigner={roundAssigner}
        onStartRound={handleStartRound}
        onClose={() => setBetweenRoundsVisible(false)}
      />

      <PlayerStatsModal
        visible={statsModalVisible}
        players={sessionPlayers}
        stats={currentSession.playerStats}
        onClose={() => setStatsModalVisible(false)}
      />
    </SafeAreaView>
  );
}
