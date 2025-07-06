// src/components/GameCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Play,
  Pause,
  Square,
  Edit,
  Trophy,
  Clock,
  Users,
  ChevronRight
} from 'lucide-react-native';
import { Game, Player } from '../types';
import { colors } from '../theme';

interface GameCardProps {
  game: Game;
  players: Player[];
  courtColor: string;
  isInProgress?: boolean;
  isCompleted?: boolean;
  onStart?: () => void;
  onComplete?: (score?: { serveScore: number; receiveScore: number }) => void;
  onScoreEntry?: () => void;
}

export default function GameCard({
  game,
  players,
  courtColor,
  isInProgress = false,
  isCompleted = false,
  onStart,
  onComplete,
  onScoreEntry
}: GameCardProps) {
  const getPlayer = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  const servePlayer1 = getPlayer(game.serveTeam.player1Id);
  const servePlayer2 = getPlayer(game.serveTeam.player2Id);
  const receivePlayer1 = getPlayer(game.receiveTeam.player1Id);
  const receivePlayer2 = getPlayer(game.receiveTeam.player2Id);

  const hasScore = game.score && (game.score.serveScore > 0 || game.score.receiveScore > 0);
  const actuallyCompleted = game.isCompleted || isCompleted;

  const handleGameAction = () => {
    if (actuallyCompleted) {
      onScoreEntry?.();
    } else if (isInProgress) {
      if (onComplete) {
        Alert.alert(
          'Complete Game',
          'Mark this game as completed?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enter Score',
              onPress: () => onScoreEntry?.(),
            },
            {
              text: 'Complete Without Score',
              onPress: () => onComplete(),
            },
          ]
        );
      }
    } else {
      onStart?.();
    }
  };

  const getActionButton = () => {
    if (actuallyCompleted) {
      return (
        <TouchableOpacity style={styles.actionButton} onPress={onScoreEntry}>
          <Edit size={16} color={colors.blue} />
          <Text style={styles.editScoreText}>
            {hasScore ? 'Edit Score' : 'Add Score'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (isInProgress) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={handleGameAction}
        >
          <Square size={16} color="white" />
          <Text style={styles.actionButtonText}>Complete</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.startButton]}
        onPress={handleGameAction}
      >
        <Play size={16} color="white" />
        <Text style={styles.actionButtonText}>Start</Text>
      </TouchableOpacity>
    );
  };

  const getStatusIndicator = () => {
    if (actuallyCompleted) {
      return (
        <View style={[styles.statusBadge, styles.completedBadge]}>
          <Trophy size={12} color={colors.green} />
          <Text style={styles.completedBadgeText}>Completed</Text>
        </View>
      );
    }

    if (isInProgress) {
      return (
        <View style={[styles.statusBadge, styles.inProgressBadge]}>
          <Clock size={12} color={colors.orange} />
          <Text style={styles.inProgressBadgeText}>In Progress</Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, styles.pendingBadge]}>
        <Pause size={12} color={colors.gray} />
        <Text style={styles.pendingBadgeText}>Pending</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.courtInfo}>
          <View style={[styles.courtIndicator, { backgroundColor: courtColor }]} />
          <Text style={styles.courtText}>Court {game.courtId.slice(-1)}</Text>
        </View>
        {getStatusIndicator()}
      </View>

      {/* Score Display */}
      {hasScore && (
        <View style={styles.scoreContainer}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{game.score!.serveScore}</Text>
            <Text style={styles.scoreDivider}>-</Text>
            <Text style={styles.scoreNumber}>{game.score!.receiveScore}</Text>
          </View>
        </View>
      )}

      {/* Teams */}
      <View style={styles.teamsContainer}>
        {/* Serve Team */}
        <View style={[styles.teamSection, styles.serveTeam]}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamLabel}>Serve</Text>
            {hasScore && game.score!.serveScore > game.score!.receiveScore && (
              <Trophy size={14} color={colors.green} />
            )}
          </View>
          <View style={styles.teamPlayers}>
            <View style={styles.playerRow}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={styles.playerName}>
                {servePlayer1?.name || 'Player 1'}
              </Text>
              {servePlayer1?.rating && (
                <Text style={styles.playerRating}>
                  {servePlayer1.rating.toFixed(1)}
                </Text>
              )}
            </View>
            <View style={styles.playerRow}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={styles.playerName}>
                {servePlayer2?.name || 'Player 2'}
              </Text>
              {servePlayer2?.rating && (
                <Text style={styles.playerRating}>
                  {servePlayer2.rating.toFixed(1)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* VS Divider */}
        <View style={styles.vsDivider}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Receive Team */}
        <View style={[styles.teamSection, styles.receiveTeam]}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamLabel}>Receive</Text>
            {hasScore && game.score!.receiveScore > game.score!.serveScore && (
              <Trophy size={14} color={colors.green} />
            )}
          </View>
          <View style={styles.teamPlayers}>
            <View style={styles.playerRow}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={styles.playerName}>
                {receivePlayer1?.name || 'Player 1'}
              </Text>
              {receivePlayer1?.rating && (
                <Text style={styles.playerRating}>
                  {receivePlayer1.rating.toFixed(1)}
                </Text>
              )}
            </View>
            <View style={styles.playerRow}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={styles.playerName}>
                {receivePlayer2?.name || 'Player 2'}
              </Text>
              {receivePlayer2?.rating && (
                <Text style={styles.playerRating}>
                  {receivePlayer2.rating.toFixed(1)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {getActionButton()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  courtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courtIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  courtText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedBadge: {
    backgroundColor: colors.greenLight,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.green,
  },
  inProgressBadge: {
    backgroundColor: colors.orangeLight,
  },
  inProgressBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.orange,
  },
  pendingBadge: {
    backgroundColor: colors.grayLight,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreDivider: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamSection: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.grayLight,
  },
  serveTeam: {
    backgroundColor: colors.blueLight,
  },
  receiveTeam: {
    backgroundColor: colors.greenLight,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  teamPlayers: {
    gap: 4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  playerRating: {
    fontSize: 12,
    color: colors.orange,
    fontWeight: '500',
  },
  vsDivider: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  startButton: {
    backgroundColor: colors.green,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  editScoreText: {
    color: colors.blue,
    fontWeight: '500',
    fontSize: 14,
  },
});
