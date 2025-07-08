// src/components/RoundScoreEntryModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Save, Trophy, Plus, Minus, SkipForward } from 'lucide-react-native';
import { Game, Player } from '../types';
import { colors, COURT_COLORS } from '../theme';

interface RoundScoreEntryModalProps {
  visible: boolean;
  games: Game[];
  players: Player[];
  onSave: (scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }) => void;
  onClose: () => void;
}

interface CourtScore {
  gameId: string;
  courtNumber: string;
  serveScore: number;
  receiveScore: number;
  hasScore: boolean;
  serveTeam: [Player | undefined, Player | undefined];
  receiveTeam: [Player | undefined, Player | undefined];
}

export default function RoundScoreEntryModal({
  visible,
  games,
  players,
  onSave,
  onClose
}: RoundScoreEntryModalProps) {
  const [courtScores, setCourtScores] = useState<CourtScore[]>([]);

  useEffect(() => {
    if (games.length > 0) {
      const scores = games.map(game => {
        const getPlayer = (playerId: string) => players.find(p => p.id === playerId);

        return {
          gameId: game.id,
          courtNumber: game.courtId.slice(-1),
          serveScore: game.score?.serveScore || 0,
          receiveScore: game.score?.receiveScore || 0,
          hasScore: !!game.score,
          serveTeam: [
            getPlayer(game.serveTeam.player1Id),
            getPlayer(game.serveTeam.player2Id)
          ] as [Player | undefined, Player | undefined],
          receiveTeam: [
            getPlayer(game.receiveTeam.player1Id),
            getPlayer(game.receiveTeam.player2Id)
          ] as [Player | undefined, Player | undefined],
        };
      });
      setCourtScores(scores);
    }
  }, [games, players]);

  const updateCourtScore = (gameId: string, field: 'serveScore' | 'receiveScore', value: number) => {
    setCourtScores(prev => prev.map(court =>
      court.gameId === gameId
        ? {
            ...court,
            [field]: Math.max(0, Math.min(99, value)),
            hasScore: true
          }
        : court
    ));
  };

  const toggleCourtScore = (gameId: string) => {
    setCourtScores(prev => prev.map(court =>
      court.gameId === gameId
        ? {
            ...court,
            hasScore: !court.hasScore,
            serveScore: court.hasScore ? 0 : court.serveScore,
            receiveScore: court.hasScore ? 0 : court.receiveScore,
          }
        : court
    ));
  };

  const adjustScore = (gameId: string, team: 'serve' | 'receive', delta: number) => {
    const court = courtScores.find(c => c.gameId === gameId);
    if (!court) return;

    const currentScore = team === 'serve' ? court.serveScore : court.receiveScore;
    updateCourtScore(gameId, team === 'serve' ? 'serveScore' : 'receiveScore', currentScore + delta);
  };

  const setCommonScore = (gameId: string, serveScore: number, receiveScore: number) => {
    setCourtScores(prev => prev.map(court =>
      court.gameId === gameId
        ? {
            ...court,
            serveScore,
            receiveScore,
            hasScore: true
          }
        : court
    ));
  };

  const handleSave = () => {
    const scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null } = {};

    courtScores.forEach(court => {
      if (court.hasScore && (court.serveScore > 0 || court.receiveScore > 0)) {
        scores[court.gameId] = {
          serveScore: court.serveScore,
          receiveScore: court.receiveScore,
        };
      } else {
        scores[court.gameId] = null;
      }
    });

    onSave(scores);
  };

  const getWinner = (court: CourtScore) => {
    if (!court.hasScore || (court.serveScore === 0 && court.receiveScore === 0)) {
      return null;
    }
    return court.serveScore > court.receiveScore ? 'serve' :
           court.receiveScore > court.serveScore ? 'receive' : 'tie';
  };

  const renderCourtScore = (court: CourtScore, index: number) => {
    const winner = getWinner(court);
    const courtColor = COURT_COLORS[index % COURT_COLORS.length];

    return (
      <View key={court.gameId} style={styles.courtContainer}>
        <View style={styles.courtHeader}>
          <View style={styles.courtTitleRow}>
            <View style={[styles.courtIndicator, { backgroundColor: courtColor }]} />
            <Text style={styles.courtTitle}>Court {court.courtNumber}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.scoreToggle,
              court.hasScore ? styles.scoreToggleActive : styles.scoreToggleInactive
            ]}
            onPress={() => toggleCourtScore(court.gameId)}
          >
            <Text style={[
              styles.scoreToggleText,
              court.hasScore ? styles.scoreToggleTextActive : styles.scoreToggleTextInactive
            ]}>
              {court.hasScore ? 'Remove Score' : 'Add Score'}
            </Text>
          </TouchableOpacity>
        </View>

        {court.hasScore && (
          <>
            {/* Score Entry */}
            <View style={styles.scoreSection}>
              {/* Serve Team */}
              <View style={[styles.teamScoreContainer, styles.serveTeamContainer]}>
                <View style={styles.teamHeader}>
                  <Text style={styles.teamTitle}>Serve Team</Text>
                  {winner === 'serve' && <Trophy size={16} color={colors.green} />}
                </View>

                <View style={styles.teamPlayers}>
                  <Text style={styles.playerName}>
                    {court.serveTeam[0]?.name || 'Player 1'}
                  </Text>
                  <Text style={styles.playerName}>
                    {court.serveTeam[1]?.name || 'Player 2'}
                  </Text>
                </View>

                <View style={styles.scoreControls}>
                  <TouchableOpacity
                    style={styles.scoreButton}
                    onPress={() => adjustScore(court.gameId, 'serve', -1)}
                  >
                    <Minus size={16} color={colors.primary} />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.scoreInput}
                    value={court.serveScore.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      if (num >= 0 && num <= 99) {
                        updateCourtScore(court.gameId, 'serveScore', num);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />

                  <TouchableOpacity
                    style={styles.scoreButton}
                    onPress={() => adjustScore(court.gameId, 'serve', 1)}
                  >
                    <Plus size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* VS */}
              <View style={styles.vsDivider}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Receive Team */}
              <View style={[styles.teamScoreContainer, styles.receiveTeamContainer]}>
                <View style={styles.teamHeader}>
                  <Text style={styles.teamTitle}>Receive Team</Text>
                  {winner === 'receive' && <Trophy size={16} color={colors.green} />}
                </View>

                <View style={styles.teamPlayers}>
                  <Text style={styles.playerName}>
                    {court.receiveTeam[0]?.name || 'Player 1'}
                  </Text>
                  <Text style={styles.playerName}>
                    {court.receiveTeam[1]?.name || 'Player 2'}
                  </Text>
                </View>

                <View style={styles.scoreControls}>
                  <TouchableOpacity
                    style={styles.scoreButton}
                    onPress={() => adjustScore(court.gameId, 'receive', -1)}
                  >
                    <Minus size={16} color={colors.primary} />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.scoreInput}
                    value={court.receiveScore.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      if (num >= 0 && num <= 99) {
                        updateCourtScore(court.gameId, 'receiveScore', num);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />

                  <TouchableOpacity
                    style={styles.scoreButton}
                    onPress={() => adjustScore(court.gameId, 'receive', 1)}
                  >
                    <Plus size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Score Buttons */}
            <View style={styles.quickScoreSection}>
              <Text style={styles.quickScoreTitle}>Quick Scores</Text>
              <View style={styles.quickScoreButtons}>
                {[
                  { serve: 11, receive: 9 },
                  { serve: 11, receive: 7 },
                  { serve: 9, receive: 11 },
                  { serve: 7, receive: 11 }
                ].map((score, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickScoreButton}
                    onPress={() => setCommonScore(court.gameId, score.serve, score.receive)}
                  >
                    <Text style={styles.quickScoreText}>
                      {score.serve} - {score.receive}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  const courtsWithScores = courtScores.filter(c => c.hasScore).length;
  const totalCourts = courtScores.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Round Scores</Text>
            <Text style={styles.subtitle}>
              {courtsWithScores} of {totalCourts} courts with scores
            </Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Complete</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Enter scores for completed games or skip scoring for games that didn't finish.
            </Text>
          </View>

          {courtScores.map(renderCourtScore)}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.completeAllButton} onPress={handleSave}>
              <Trophy size={20} color="white" />
              <Text style={styles.completeAllButtonText}>Complete Round</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 8,
  },
  headerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructions: {
    backgroundColor: colors.blueLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionsText: {
    color: colors.blue,
    fontSize: 14,
    textAlign: 'center',
  },
  courtContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  courtTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courtIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  courtTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scoreToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  scoreToggleActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  scoreToggleInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.gray,
  },
  scoreToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreToggleTextActive: {
    color: 'white',
  },
  scoreToggleTextInactive: {
    color: colors.gray,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamScoreContainer: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  serveTeamContainer: {
    backgroundColor: colors.blueLight,
  },
  receiveTeamContainer: {
    backgroundColor: colors.greenLight,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  teamTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  teamPlayers: {
    alignItems: 'center',
    marginBottom: 16,
  },
  playerName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vsDivider: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray,
  },
  quickScoreSection: {
    alignItems: 'center',
  },
  quickScoreTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quickScoreButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickScoreButton: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickScoreText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 16,
    marginBottom: 32,
  },
  completeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
