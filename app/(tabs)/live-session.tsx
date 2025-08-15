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
import { useAppSelector, useAppDispatch } from '@/src/store';
import {
  completeRound,
  endLiveSession,
  generateNextRound,
  startRound,
  updateGames,
  updatePlayerStats,
  updateCourts
} from '@/src/store/slices/liveSessionSlice';
import {
  endSession as endSession,
} from '@/src/store/slices/sessionsSlice';
import { SessionRoundManager } from '@/src/utils/sessionRoundManager';
//import RoundGameCard from '@/src/components/RoundGameCard';
import Round from "@/src/components/Round";
import RoundScoreEntryModal from '@/src/components/RoundScoreEntryModal';
import PlayerStatsModal from '@/src/components/PlayerStatsModal';
import BetweenRoundsModal from '@/src/components/BetweenRoundsModal';
import RoundTimer from '@/src/components/RoundTimer';
import { getEmptyLiveSession, getLiveSessionPlayers } from '@/src/utils/util';
import { Alert } from '@/src/utils/alert';
import { Court, Game, LiveSession, Player, SessionState } from '@/src/types';

export default function LiveSessionScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // useAppSelector, useAppDispatch is redux
  const { liveSession: currentSession } = useAppSelector((state) => state.liveSession);
  const liveSession: LiveSession = currentSession ? currentSession : getEmptyLiveSession();
  const { sessions } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  // useState is react
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [betweenRoundsVisible, setBetweenRoundsVisible] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<Date | null>(null);

  const liveSessionPlayers: Player[] = getLiveSessionPlayers(liveSession, sessions, players);

  const session = sessions.find(s => s.id === liveSession.sessionId);
  if (currentSession && !currentSession.courts) {
    dispatch(updateCourts(session ? [...session.courts] : []));
  }
  const showRatings = liveSession.showRatings;
  const scoring = liveSession.scoring;

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
            onPress={() => router.push('/sessions')}
            icon="arrow-left"
          >
            Back to Sessions
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  const currentRoundGames = liveSession.activeGames;
  const isRoundInProgress = currentRoundGames.length > 0 && currentRoundGames.some(g => g.startedAt && !g.isCompleted);
  const isRoundCompleted = currentRoundGames.length > 0 && currentRoundGames.every(g => g.isCompleted);
  const hasActiveRound = currentRoundGames.length > 0;
  const completedRounds = liveSession.currentGameNumber - 1;
  const currentGameNumber = isRoundCompleted ? completedRounds : liveSession.currentGameNumber;

  const activeCourts = liveSession.courts ? liveSession.courts.filter(c => c.isActive) : [];
  const numSittingOut = hasActiveRound ? currentRoundGames[0]?.sittingOutIds.length || 0 : 0;

  const handleGenerateNewRound = () => {

    const sessionRoundManager = new SessionRoundManager(liveSession, liveSessionPlayers);
    const assignments = sessionRoundManager.generateGameAssignments();

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

  const handleRoundScoresSubmitted = (scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }) => {
    dispatch(completeRound({ scores }));

    const sessionRoundManager = new SessionRoundManager(liveSession, liveSessionPlayers);
    currentRoundGames.forEach(game => {
      const score = scores[game.id];
      sessionRoundManager.updatePlayerStatsForGame(game, score || undefined);
    });

    const updatedStats = sessionRoundManager.getPlayerStats();
    dispatch(updatePlayerStats(updatedStats));

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
              dispatch(endSession(liveSession.sessionId));
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
              dispatch(endSession(liveSession.sessionId));
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
            Round {liveSession.currentGameNumber - 1} Completed
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
      <View style={{
        flexDirection: 'column',
        columnGap: 12,
      }}>
        <Button
          icon="pencil-box"
          mode="contained"
          onPress={() => { setBetweenRoundsVisible(true) }}
          buttonColor={theme.colors.secondary}
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 12 }}
        >
          Edit Round {liveSession.currentGameNumber}
        </Button>
        <Button
          icon="play"
          mode="contained"
          onPress={handleStartRound}
          buttonColor={theme.colors.secondary}
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 12 }}
        >
          Start Round {liveSession.currentGameNumber}
        </Button>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>

      {/* TODO remove this?  it must be in the uppper level */}
      <Appbar.Header>
        {/*<Appbar.BackAction onPress={() => router.back()} />*/}
        <Appbar.Content
          title={`Live Session: ${session.name}`}
        />
        <Button
          mode="contained-tonal"
          icon="account-edit"
          onPress={() => { /* TODO */ }}
          style={{ marginRight: 8 }}
        >
          Edit Session
        </Button>
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
              {liveSessionPlayers.length}
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
              {numSittingOut}
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
        </View>

        {/* Current Round Games */}
        {hasActiveRound && (
          <View style={{ marginBottom: 24 }}>
            <Text variant="titleLarge" style={{
              fontWeight: '600',
              marginBottom: 12
            }}>
              Round {isRoundCompleted ? `${liveSession.currentGameNumber - 1} (Complete)` : `${liveSession.currentGameNumber} Games`}
            </Text>

            <Round
              editing={false}
              roundNumber={currentGameNumber}
            />
          </View>
        )}

        {/* Previous Rounds Summary */}
        {completedRounds > 0 && (
          <Card style={{ marginBottom: 24, marginTop: 12 }}>
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
        games={currentRoundGames}
        players={liveSessionPlayers}
        onSave={handleRoundScoresSubmitted}
        onClose={() => setScoreModalVisible(false)}
      />

      <BetweenRoundsModal
        visible={betweenRoundsVisible}
        onStartRound={handleStartRound}
        onClose={() => setBetweenRoundsVisible(false)}
      />

      <PlayerStatsModal
        visible={statsModalVisible}
        players={liveSessionPlayers}
        stats={liveSession.playerStats}
        onClose={() => setStatsModalVisible(false)}
      />
    </SafeAreaView>
  );
}
