// src/components/ScoreEntryModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Save, Trophy, Plus, Minus } from 'lucide-react-native';
import { Game, Player } from '../types';
import { colors } from '../theme';
import { Alert } from '../utils/alert'

interface ScoreEntryModalProps {
  visible: boolean;
  game: Game;
  players: Player[];
  onSave: (score: { serveScore: number; receiveScore: number }) => void;
  onClose: () => void;
}

export default function ScoreEntryModal({
  visible,
  game,
  players,
  onSave,
  onClose
}: ScoreEntryModalProps) {
  const [serveScore, setServeScore] = useState(0);
  const [receiveScore, setReceiveScore] = useState(0);

  useEffect(() => {
    if (game.score) {
      setServeScore(game.score.serveScore);
      setReceiveScore(game.score.receiveScore);
    } else {
      setServeScore(0);
      setReceiveScore(0);
    }
  }, [game]);

  const getPlayer = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  const servePlayer1 = getPlayer(game.serveTeam.player1Id);
  const servePlayer2 = getPlayer(game.serveTeam.player2Id);
  const receivePlayer1 = getPlayer(game.receiveTeam.player1Id);
  const receivePlayer2 = getPlayer(game.receiveTeam.player2Id);

  const handleSave = () => {
    if (serveScore < 0 || receiveScore < 0) {
      Alert.alert('Invalid Score', 'Scores cannot be negative');
      return;
    }

    if (serveScore > 99 || receiveScore > 99) {
      Alert.alert('Invalid Score', 'Scores cannot exceed 99');
      return;
    }

    onSave({ serveScore, receiveScore });
  };

  const adjustScore = (team: 'serve' | 'receive', delta: number) => {
    if (team === 'serve') {
      const newScore = Math.max(0, Math.min(99, serveScore + delta));
      setServeScore(newScore);
    } else {
      const newScore = Math.max(0, Math.min(99, receiveScore + delta));
      setReceiveScore(newScore);
    }
  };

  const winner = serveScore > receiveScore ? 'serve' : receiveScore > serveScore ? 'receive' : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Game Score</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.courtInfo}>
            <Text style={styles.courtText}>Court {game.courtId.slice(-1)}</Text>
            <Text style={styles.gameText}>Game #{game.gameNumber}</Text>
          </View>

          {/* Score Entry */}
          <View style={styles.scoreSection}>
            {/* Serve Team */}
            <View style={[styles.teamScoreContainer, styles.serveTeamContainer]}>
              <View style={styles.teamHeader}>
                <Text style={styles.teamTitle}>Serve Team</Text>
                {winner === 'serve' && <Trophy size={16} color={colors.green} />}
              </View>

              <View style={styles.teamPlayers}>
                <Text style={styles.playerName}>{servePlayer1?.name || 'Player 1'}</Text>
                <Text style={styles.playerName}>{servePlayer2?.name || 'Player 2'}</Text>
              </View>

              <View style={styles.scoreControls}>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => adjustScore('serve', -1)}
                >
                  <Minus size={20} color={colors.primary} />
                </TouchableOpacity>

                <View style={styles.scoreInputContainer}>
                  <TextInput
                    style={styles.scoreInput}
                    value={serveScore.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      if (num >= 0 && num <= 99) {
                        setServeScore(num);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => adjustScore('serve', 1)}
                >
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* VS Divider */}
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
                <Text style={styles.playerName}>{receivePlayer1?.name || 'Player 1'}</Text>
                <Text style={styles.playerName}>{receivePlayer2?.name || 'Player 2'}</Text>
              </View>

              <View style={styles.scoreControls}>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => adjustScore('receive', -1)}
                >
                  <Minus size={20} color={colors.primary} />
                </TouchableOpacity>

                <View style={styles.scoreInputContainer}>
                  <TextInput
                    style={styles.scoreInput}
                    value={receiveScore.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      if (num >= 0 && num <= 99) {
                        setReceiveScore(num);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => adjustScore('receive', 1)}
                >
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Winner Declaration */}
          {winner && (serveScore > 0 || receiveScore > 0) && (
            <View style={styles.winnerContainer}>
              <Trophy size={24} color={colors.green} />
              <Text style={styles.winnerText}>
                {winner === 'serve' ? 'Serve Team' : 'Receive Team'} Wins!
              </Text>
            </View>
          )}

          {/* Quick Score Buttons */}
          <View style={styles.quickScoreSection}>
            <Text style={styles.quickScoreTitle}>Common Scores</Text>
            <View style={styles.quickScoreButtons}>
              {[
                { serve: 11, receive: 9 },
                { serve: 11, receive: 7 },
                { serve: 11, receive: 5 },
                { serve: 9, receive: 11 },
                { serve: 7, receive: 11 },
                { serve: 5, receive: 11 }
              ].map((score, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickScoreButton}
                  onPress={() => {
                    setServeScore(score.serve);
                    setReceiveScore(score.receive);
                  }}
                >
                  <Text style={styles.quickScoreText}>
                    {score.serve} - {score.receive}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.saveFullButton} onPress={handleSave}>
              <Save size={20} color="white" />
              <Text style={styles.saveFullButtonText}>Save Score</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
  courtInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  courtText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  gameText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  teamScoreContainer: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
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
    marginBottom: 12,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  teamPlayers: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playerName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreInputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
  },
  vsDivider: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray,
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenLight,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.green,
  },
  quickScoreSection: {
    marginBottom: 32,
  },
  quickScoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  quickScoreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickScoreButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickScoreText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
  },
  saveFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveFullButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
});
