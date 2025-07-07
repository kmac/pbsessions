// app/live-session.tsx (Complete Live Session Management)
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
  Pause,
  SkipForward,
  RotateCcw,
  Users,
  Trophy,
  Clock,
  Settings,
  Edit
} from 'lucide-react-native';
import {
  generateNextGame,
  completeGame,
  endLiveSession,
  updateGameScore,
  swapPlayers
} from '../src/store/slices/liveSessionSlice';
import { EnhancedSessionAlgorithm } from '../src/utils/enhancedSessionAlgorithm';
import { Game, Player, Court } from '../src/types';
import GameCard from '../src/components/GameCard';
import ScoreEntryModal from '../src/components/ScoreEntryModal';
import PlayerStatsModal from '../src/components/PlayerStatsModal';
import { colors, COURT_COLORS } from '../src/theme';
import { Alert } from '../src/utils/alert'

export default function LiveSessionScreen() {
  const dispatch = useAppDispatch();
  const { currentSession } = useAppSelector((state) => state.liveSession);
  const { sessions } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameInProgress, setGameInProgress] = useState<{ [gameId: string]: boolean }>({});

  if (!currentSession) {
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

  const session = sessions.find(s => s.id === currentSession.sessionId);
  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
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

  const sessionPlayers = players.filter(p => session.playerIds.includes(p.id));
  const algorithm = new EnhancedSessionAlgorithm(
    sessionPlayers,
    session.courts,
    currentSession.playerStats
  );

  const handleStartNextGame = () => {
    if (currentSession.activeGames.some(g => !g.isCompleted)) {
      Alert.alert(
        'Games in Progress',
        'Complete all current games before starting the next round.',
        [{ text: 'OK' }]
      );
      return;
    }

    const assignments = algorithm.generateGameAssignments(currentSession.currentGameNumber);

    if (assignments.length === 0) {
      Alert.alert(
        'Cannot Generate Games',
        'Unable to create game assignments. Check player and court availability.',
        [{ text: 'OK' }]
      );
      return;
    }

    dispatch(generateNextGame({ assignments }));
  };

  const handleGameStart = (game: Game) => {
    setGameInProgress({ ...gameInProgress, [game.id]: true });
  };

  const handleGameComplete = (game: Game, score?: { serveScore: number; receiveScore: number }) => {
    dispatch(completeGame({
      gameId: game.id,
      score
    }));

    const newInProgress = { ...gameInProgress };
    delete newInProgress[game.id];
    setGameInProgress(newInProgress);

    // Update algorithm stats
    algorithm.updatePlayerStats(game, true);
  };

  const handleScoreEntry = (game: Game) => {
    setSelectedGame(game);
    setScoreModalVisible(true);
  };

  const handleEndSession = () => {
    const incompleteGames = currentSession.activeGames.filter(g => !g.isCompleted);

    if (incompleteGames.length > 0) {
      Alert.alert(
        'Games in Progress',
        `There are ${incompleteGames.length} incomplete games. End session anyway?`,
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

  const activeGames = currentSession.activeGames || [];
  const completedGames = activeGames.filter(g => g.isCompleted);
  const inProgressGames = activeGames.filter(g => !g.isCompleted);
  const canStartNext = inProgressGames.length === 0;
  const totalGamesPlayed = completedGames.length;
  const playingPlayers = inProgressGames.length * 4;
  const sittingOutPlayers = sessionPlayers.length - playingPlayers;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <X size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{session.name}</Text>
          <Text style={styles.subtitle}>Game {currentSession.currentGameNumber}</Text>
        </View>
        <TouchableOpacity onPress={handleEndSession} style={styles.endButton}>
          <Text style={styles.endButtonText}>End</Text>
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
            <Text style={styles.statNumber}>{session.courts.filter(c => c.isActive).length}</Text>
            <Text style={styles.statLabel}>Active Courts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalGamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sittingOutPlayers}</Text>
            <Text style={styles.statLabel}>Sitting Out</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {canStartNext ? (
            <TouchableOpacity
              style={styles.startGameButton}
              onPress={handleStartNextGame}
            >
              <Play size={20} color="white" />
              <Text style={styles.startGameButtonText}>
                {activeGames.length === 0 ? 'Start First Game' : 'Start Next Game'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.waitingButton}
              disabled
            >
              <Clock size={20} color={colors.gray} />
              <Text style={styles.waitingButtonText}>
                Waiting for games to complete...
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStatsModalVisible(true)}
            >
              <Trophy size={16} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Player Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Games */}
        {inProgressGames.length > 0 && (
          <View style={styles.gamesSection}>
            <Text style={styles.sectionTitle}>Current Games</Text>
            {inProgressGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                players={sessionPlayers}
                courtColor={COURT_COLORS[index % COURT_COLORS.length]}
                isInProgress={gameInProgress[game.id]}
                onStart={() => handleGameStart(game)}
                onComplete={(score) => handleGameComplete(game, score)}
                onScoreEntry={() => handleScoreEntry(game)}
              />
            ))}
          </View>
        )}

        {/* Sitting Out Players */}
        {sittingOutPlayers > 0 && inProgressGames.length > 0 && (
          <View style={styles.sittingSection}>
            <Text style={styles.sectionTitle}>Sitting Out This Game</Text>
            <View style={styles.sittingPlayers}>
              {/* Get sitting out players from first game (they're all the same) */}
              {inProgressGames[0]?.sittingOutIds.map(playerId => {
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

        {/* Completed Games History */}
        {completedGames.length > 0 && (
          <View style={styles.gamesSection}>
            <Text style={styles.sectionTitle}>Completed Games ({completedGames.length})</Text>
            {completedGames.slice().reverse().map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                players={sessionPlayers}
                courtColor={COURT_COLORS[index % COURT_COLORS.length]}
                isCompleted={true}
                onScoreEntry={() => handleScoreEntry(game)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Score Entry Modal */}
      {selectedGame && (
        <ScoreEntryModal
          visible={scoreModalVisible}
          game={selectedGame}
          players={sessionPlayers}
          onSave={(score) => {
            if (!selectedGame.isCompleted) {
              handleGameComplete(selectedGame, score);
            } else {
              dispatch(updateGameScore({ gameId: selectedGame.id, score }));
            }
            setScoreModalVisible(false);
            setSelectedGame(null);
          }}
          onClose={() => {
            setScoreModalVisible(false);
            setSelectedGame(null);
          }}
        />
      )}

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
  actionContainer: {
    marginBottom: 24,
  },
  startGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  startGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grayLight,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  waitingButtonText: {
    color: colors.gray,
    fontSize: 16,
    fontWeight: '500',
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

