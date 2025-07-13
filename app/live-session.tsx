// app/live-session.tsx (Updated with proper stats integration)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../src/store';
import {
  X,
  Play,
  Square,
  Clock,
  Users,
  Trophy,
  RotateCcw,
  Settings,
  Timer
} from 'lucide-react-native';
import {
  generateNextRound,
  startRound,
  completeRound,
  endLiveSession,
  // updateRoundScores,
  updatePlayerStats as updatePlayerStatsInStore
} from '../src/store/slices/liveSessionSlice';
/*

Modals:
RoundScoreEntryModal
PlayerStatsModal
BetweenRoundsModal

  󰊕  handleGenerateNewRound       --> setBetweenRoundsVisible(true);
  󰊕  handleStartRound             --> setBetweenRoundsVisible(false);
  󰊕  handleCompleteRound          --> setScoreModalVisible(true);
  󰊕  handleRoundScoresSubmitted   --> setScoreModalVisible(false)
                                  --> setBetweenRoundsVisible(true);
  󰊕  handleEndSession
         --> dispatch(endLiveSession());

*/
import { SessionRoundManager } from '@/src/utils/sessionRoundManager';
import RoundGameCard from '@/src/components/RoundGameCard';
import RoundScoreEntryModal from '@/src/components/RoundScoreEntryModal';
import PlayerStatsModal from '@/src/components/PlayerStatsModal';
import BetweenRoundsModal from '@/src/components/BetweenRoundsModal';
import RoundTimer from '@/src/components/RoundTimer';
import { colors, COURT_COLORS } from '@/src/theme';
import { Alert } from '@/src/utils/alert';

export default function LiveSessionScreen() {
  const dispatch = useAppDispatch();

  // Pull data from the store
  const { currentSession } = useAppSelector((state) => state.liveSession);
  const { sessions } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [betweenRoundsVisible, setBetweenRoundsVisible] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<Date | null>(null);

  // Create algorithm instance with current stats
  const sessionPlayers = players.filter(p => currentSession?.sessionId &&
    sessions.find(s => s.id === currentSession.sessionId)?.playerIds.includes(p.id));
  const session = sessions.find(s => s.id === currentSession?.sessionId);

  // Handle no sessions
  if (!currentSession || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active session</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to Sessions</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const roundAssigner = new SessionRoundManager(
    sessionPlayers,
    session.courts,
    currentSession.playerStats
  );

  // Current round state
  const currentRoundGames = currentSession.activeGames || [];
  const isRoundInProgress = currentRoundGames.length > 0 && currentRoundGames.some(g => g.startedAt && !g.isCompleted);
  const isRoundCompleted = currentRoundGames.length > 0 && currentRoundGames.every(g => g.isCompleted);
  const hasActiveRound = currentRoundGames.length > 0;

  // Statistics
  const activeCourts = session.courts.filter(c => c.isActive);
  // const playingPlayersThisRound = isRoundInProgress ? activeCourts.length * 4 : 0;
  const sittingOutThisRound = hasActiveRound
    ? currentRoundGames[0]?.sittingOutIds.length || 0
    : 0;
  const completedRounds = currentSession.currentGameNumber - 1;

  const handleGenerateNewRound = () => {
    const assignments = roundAssigner.generateGameAssignments(currentSession.currentGameNumber);

    if (assignments.length === 0) {
      Alert.alert(
        'Cannot Generate Round',
        'Unable to create game assignments. Check player and court availability.',
        [{ text: 'OK' }]
      );
      return;
    }

    dispatch(generateNextRound({ assignments }));

    // TODO do we always want to do this????
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
  };

  const handleRoundScoresSubmitted = (scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }) => {
    // Update the round completion in store
    dispatch(completeRound({ scores }));

    // Update algorithm stats for each completed game
    currentRoundGames.forEach(game => {
      const score = scores[game.id];
      roundAssigner.updatePlayerStatsForGame(game, score || undefined);
    });

    // Get updated stats from algorithm and save to store
    const updatedStats = roundAssigner.getPlayerStats();
    dispatch(updatePlayerStatsInStore(updatedStats));

    setScoreModalVisible(false);
    setRoundStartTime(null);

    // Show between rounds modal after a brief delay
    // setTimeout(() => {
    //   setBetweenRoundsVisible(true);
    // }, 500);
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
        <TouchableOpacity
          style={styles.generateRoundButton}
          onPress={handleGenerateNewRound}
        >
          <Play size={20} color="white" />
          <Text style={styles.generateRoundButtonText}>
            {completedRounds === 0 ? 'Generate First Round' : 'Generate Next Round'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (isRoundCompleted) {
      return (
        <View style={styles.roundCompletedContainer}>
          <View style={styles.roundCompletedBadge}>
            <Trophy size={16} color={colors.green} />
            <Text style={styles.roundCompletedText}>Round {currentSession.currentGameNumber - 1} Completed</Text>
          </View>
          <TouchableOpacity
            style={styles.generateRoundButton}
            onPress={handleGenerateNewRound}
          >
            <Play size={20} color="white" />
            <Text style={styles.generateRoundButtonText}>Generate Next Round</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isRoundInProgress) {
      return (
        <TouchableOpacity
          style={styles.completeRoundButton}
          onPress={handleCompleteRound}
        >
          <Square size={20} color="white" />
          <Text style={styles.completeRoundButtonText}>Complete Round</Text>
        </TouchableOpacity>
      );
    }

    // Round generated but not started
    return (
      <TouchableOpacity
        style={styles.startRoundButton}
        onPress={handleStartRound}
      >
        <Play size={20} color="white" />
        <Text style={styles.startRoundButtonText}>Start Round {currentSession.currentGameNumber}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <X size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{session.name}</Text>
          <Text style={styles.subtitle}>
            {hasActiveRound ? `Round ${currentSession.currentGameNumber}` : `${completedRounds} rounds completed`}
          </Text>
        </View>
        <TouchableOpacity onPress={handleEndSession} style={styles.endButton}>
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessionPlayers.length}</Text>
            <Text style={styles.statLabel}>Total Players</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeCourts.length}</Text>
            <Text style={styles.statLabel}>Active Courts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedRounds}</Text>
            <Text style={styles.statLabel}>Completed Rounds</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sittingOutThisRound}</Text>
            <Text style={styles.statLabel}>Sitting Out</Text>
          </View>
        </View>

        {/* Timer Display */}
        {isRoundInProgress && roundStartTime && (
          <View style={styles.timerContainer}>
            <RoundTimer startTime={roundStartTime} />
          </View>
        )}

        {/* Round Action Button */}
        <View style={styles.actionContainer}>
          {getRoundActionButton()}

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStatsModalVisible(true)}
            >
              <Trophy size={16} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Player Stats</Text>
            </TouchableOpacity>

            {hasActiveRound && !isRoundInProgress && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setBetweenRoundsVisible(true)}
              >
                <Settings size={16} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Adjust Round</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Current Round Games */}
        {hasActiveRound && (
          <View style={styles.gamesSection}>
            <Text style={styles.sectionTitle}>
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
          <View style={styles.sittingSection}>
            <Text style={styles.sectionTitle}>Sitting Out This Round</Text>
            <View style={styles.sittingPlayers}>
              {currentRoundGames[0]?.sittingOutIds.map(playerId => {
                const player = sessionPlayers.find(p => p.id === playerId);
                return player ? (
                  <View key={player.id} style={styles.sittingPlayerChip}>
                    <Users size={14} color={colors.gray} />
                    <Text style={styles.sittingPlayerName}>{player.name}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Previous Rounds Summary */}
        {completedRounds > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Session History</Text>
            <View style={styles.historyCard}>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Rounds Completed:</Text>
                <Text style={styles.historyValue}>{completedRounds}</Text>
              </View>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Total Games:</Text>
                <Text style={styles.historyValue}>{completedRounds * activeCourts.length}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewHistoryButton}
                onPress={() => setStatsModalVisible(true)}
              >
                <Text style={styles.viewHistoryButtonText}>View Detailed Stats</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Round Score Entry Modal */}
      <RoundScoreEntryModal
        visible={scoreModalVisible}
        games={currentRoundGames}
        players={sessionPlayers}
        onSave={handleRoundScoresSubmitted}
        onClose={() => setScoreModalVisible(false)}
      />

      {/* Between Rounds Modal */}
      <BetweenRoundsModal
        visible={betweenRoundsVisible}
        currentRound={isRoundCompleted ? currentSession.currentGameNumber : currentSession.currentGameNumber}
        games={currentRoundGames}
        allPlayers={sessionPlayers}
        onStartRound={handleStartRound}
        onClose={() => setBetweenRoundsVisible(false)}
      />

      {/* Player Stats Modal */}
      <PlayerStatsModal
        visible={statsModalVisible}
        players={sessionPlayers}
        stats={currentSession.playerStats}
        onClose={() => setStatsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#059669',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  endButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  endButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  timerContainer: {
    marginBottom: 16,
  },
  actionContainer: {
    marginBottom: 24,
  },
  generateRoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  generateRoundButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  startRoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  startRoundButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completeRoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  completeRoundButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  roundCompletedContainer: {
    marginBottom: 12,
  },
  roundCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenLight,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  roundCompletedText: {
    color: colors.green,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  gamesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sittingSection: {
    marginBottom: 24,
  },
  sittingPlayers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sittingPlayerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  sittingPlayerName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  historySection: {
    marginBottom: 24,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  viewHistoryButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  viewHistoryButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
