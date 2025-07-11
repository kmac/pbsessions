import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Play, Users, RotateCcw, CheckCircle } from 'lucide-react-native';
import { Game, Player } from '../types';
import { colors, COURT_COLORS } from '../theme';

interface BetweenRoundsModalProps {
  visible: boolean;
  currentRound: number;
  games: Game[];
  allPlayers: Player[];
  onStartRound: () => void;
  onClose: () => void;
}

export default function BetweenRoundsModal({
  visible,
  currentRound,
  games,
  allPlayers,
  onStartRound,
  onClose
}: BetweenRoundsModalProps) {
  const getPlayer = (playerId: string) => allPlayers.find(p => p.id === playerId);

  const playingPlayers = games.flatMap(game => [
    game.serveTeam.player1Id,
    game.serveTeam.player2Id,
    game.receiveTeam.player1Id,
    game.receiveTeam.player2Id,
  ]).map(getPlayer).filter(Boolean) as Player[];

  const sittingOutPlayers = games.length > 0
    ? games[0].sittingOutIds.map(getPlayer).filter(Boolean) as Player[]
    : [];

  const renderCourtAssignment = ({ item, index }: { item: Game; index: number }) => {
    const servePlayer1 = getPlayer(item.serveTeam.player1Id);
    const servePlayer2 = getPlayer(item.serveTeam.player2Id);
    const receivePlayer1 = getPlayer(item.receiveTeam.player1Id);
    const receivePlayer2 = getPlayer(item.receiveTeam.player2Id);

    const courtColor = COURT_COLORS[index % COURT_COLORS.length];

    return (
      <View style={styles.courtCard}>
        <View style={styles.courtHeader}>
          <View style={styles.courtTitleRow}>
            <View style={[styles.courtIndicator, { backgroundColor: courtColor }]} />
            <Text style={styles.courtTitle}>Court {item.courtId.slice(-1)}</Text>
          </View>
        </View>

        <View style={styles.teamsPreview}>
          <View style={[styles.teamPreview, styles.serveTeamPreview]}>
            <Text style={styles.teamLabel}>Serve</Text>
            <Text style={styles.teamPlayers}>
              {servePlayer1?.name} & {servePlayer2?.name}
            </Text>
            <View style={styles.teamRatings}>
              {servePlayer1?.rating && (
                <Text style={styles.ratingText}>{servePlayer1.rating.toFixed(1)}</Text>
              )}
              {servePlayer2?.rating && (
                <Text style={styles.ratingText}>{servePlayer2.rating.toFixed(1)}</Text>
              )}
            </View>
          </View>

          <View style={styles.vsDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={[styles.teamPreview, styles.receiveTeamPreview]}>
            <Text style={styles.teamLabel}>Receive</Text>
            <Text style={styles.teamPlayers}>
              {receivePlayer1?.name} & {receivePlayer2?.name}
            </Text>
            <View style={styles.teamRatings}>
              {receivePlayer1?.rating && (
                <Text style={styles.ratingText}>{receivePlayer1.rating.toFixed(1)}</Text>
              )}
              {receivePlayer2?.rating && (
                <Text style={styles.ratingText}>{receivePlayer2.rating.toFixed(1)}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

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
            <Text style={styles.title}>BetweenRoundsModal: Round {currentRound} Ready</Text>
            {/* This is UNIQUE */}
            <Text style={styles.subtitle}>Review assignments and start when ready</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Round Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <CheckCircle size={20} color={colors.green} />
              <Text style={styles.summaryTitle}>Round {currentRound} Generated</Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Playing:</Text>
                <Text style={styles.summaryValue}>{playingPlayers.length} players</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Courts:</Text>
                <Text style={styles.summaryValue}>{games.length} courts</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sitting out:</Text>
                <Text style={styles.summaryValue}>{sittingOutPlayers.length} players</Text>
              </View>
            </View>
          </View>

          {/* Court Assignments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Court Assignments</Text>
            <FlatList
              data={games}
              renderItem={renderCourtAssignment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          {/* Sitting Out Players */}
          {sittingOutPlayers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sitting Out This Round</Text>
              <View style={styles.sittingOutContainer}>
                {sittingOutPlayers.map(player => (
                  <View key={player.id} style={styles.sittingPlayerChip}>
                    <Users size={14} color={colors.gray} />
                    <Text style={styles.sittingPlayerName}>{player.name}</Text>
                    {player.rating && (
                      <Text style={styles.sittingPlayerRating}>
                        {player.rating.toFixed(1)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Future Enhancement Note */}
          <View style={styles.futureSection}>
            <View style={styles.futureHeader}>
              <RotateCcw size={16} color={colors.orange} />
              <Text style={styles.futureTitle}>Manual Adjustments</Text>
            </View>
            <Text style={styles.futureText}>
              Player swapping and manual sit-out selection coming in future updates.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.startRoundButton} onPress={onStartRound}>
              <Play size={20} color="white" />
              <Text style={styles.startRoundButtonText}>Start Round {currentRound}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.adjustButton} onPress={onClose}>
              <Text style={styles.adjustButtonText}>Make Adjustments</Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryStats: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  courtCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  courtHeader: {
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  teamsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamPreview: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  serveTeamPreview: {
    backgroundColor: colors.blueLight,
  },
  receiveTeamPreview: {
    backgroundColor: colors.greenLight,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  teamPlayers: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  teamRatings: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    fontSize: 9,
    color: colors.orange,
    fontWeight: '500',
  },
  vsDivider: {
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray,
  },
  sittingOutContainer: {
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
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sittingPlayerRating: {
    fontSize: 10,
    color: colors.orange,
    fontWeight: '500',
  },
  futureSection: {
    backgroundColor: colors.orangeLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  futureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  futureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.orange,
  },
  futureText: {
    fontSize: 12,
    color: colors.orange,
    lineHeight: 16,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  startRoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startRoundButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  adjustButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
  },
  adjustButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
});
