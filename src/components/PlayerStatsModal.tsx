// src/components/PlayerStatsModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Trophy,
  Users,
  Clock,
  Star,
  BarChart3,
  TrendingUp,
  UserCheck
} from 'lucide-react-native';
import { Player, PlayerStats } from '../types';
import { colors } from '../theme';

interface PlayerStatsModalProps {
  visible: boolean;
  players: Player[];
  stats: PlayerStats[];
  onClose: () => void;
}

type SortOption = 'name' | 'gamesPlayed' | 'gamesSatOut' | 'totalScore';

export default function PlayerStatsModal({
  visible,
  players,
  stats,
  onClose
}: PlayerStatsModalProps) {
  const [sortBy, setSortBy] = useState<SortOption>('gamesPlayed');

  const getPlayerStats = (playerId: string): PlayerStats => {
    return stats.find(s => s.playerId === playerId) || {
      playerId,
      gamesPlayed: 0,
      gamesSatOut: 0,
      partners: {},
      totalScore: 0,
    };
  };

  const getPlayer = (playerId: string): Player | undefined => {
    return players.find(p => p.id === playerId);
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aStats = getPlayerStats(a.id);
    const bStats = getPlayerStats(b.id);

    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'gamesPlayed':
        return bStats.gamesPlayed - aStats.gamesPlayed;
      case 'gamesSatOut':
        return bStats.gamesSatOut - aStats.gamesSatOut;
      case 'totalScore':
        return bStats.totalScore - aStats.totalScore;
      default:
        return 0;
    }
  });

  const totalGames = Math.max(...stats.map(s => s.gamesPlayed + s.gamesSatOut), 0);
  const averageGamesPlayed = stats.length > 0
    ? stats.reduce((sum, s) => sum + s.gamesPlayed, 0) / stats.length
    : 0;

  const getSortButtonStyle = (option: SortOption) => [
    styles.sortButton,
    sortBy === option && styles.sortButtonActive
  ];

  const getSortButtonTextStyle = (option: SortOption) => [
    styles.sortButtonText,
    sortBy === option && styles.sortButtonTextActive
  ];

  const renderPlayerStat = ({ item }: { item: Player }) => {
    const playerStats = getPlayerStats(item.id);
    const totalParticipation = playerStats.gamesPlayed + playerStats.gamesSatOut;
    const playingPercentage = totalParticipation > 0
      ? (playerStats.gamesPlayed / totalParticipation) * 100
      : 0;

    const averageScore = playerStats.gamesPlayed > 0
      ? playerStats.totalScore / playerStats.gamesPlayed
      : 0;

    const partnerCount = Object.keys(playerStats.partners).length;
    const mostFrequentPartner = Object.entries(playerStats.partners)
      .sort(([,a], [,b]) => b - a)[0];

    return (
      <View style={styles.playerStatCard}>
        <View style={styles.playerStatHeader}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerStatName}>{item.name}</Text>
            {item.rating && (
              <View style={styles.ratingBadge}>
                <Star size={12} color={colors.orange} />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.playingPercentage}>
            <Text style={styles.playingPercentageText}>
              {playingPercentage.toFixed(0)}% playing
            </Text>
          </View>
        </View>

        <View style={styles.playerStatGrid}>
          <View style={styles.statItem}>
            <Trophy size={16} color={colors.green} />
            <Text style={styles.statValue}>{playerStats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>

          <View style={styles.statItem}>
            <Clock size={16} color={colors.orange} />
            <Text style={styles.statValue}>{playerStats.gamesSatOut}</Text>
            <Text style={styles.statLabel}>Sat Out</Text>
          </View>

          <View style={styles.statItem}>
            <Users size={16} color={colors.blue} />
            <Text style={styles.statValue}>{partnerCount}</Text>
            <Text style={styles.statLabel}>Partners</Text>
          </View>

          <View style={styles.statItem}>
            <BarChart3 size={16} color={colors.primary} />
            <Text style={styles.statValue}>{averageScore.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {mostFrequentPartner && (
          <View style={styles.partnerInfo}>
            <UserCheck size={14} color={colors.textSecondary} />
            <Text style={styles.partnerText}>
              Most partnered with{' '}
              <Text style={styles.partnerName}>
                {getPlayer(mostFrequentPartner[0])?.name || 'Unknown'}
              </Text>
              {' '}({mostFrequentPartner[1]} games)
            </Text>
          </View>
        )}
      </View>
    );
  };

  const SessionSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Session Summary</Text>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Users size={20} color={colors.primary} />
          <Text style={styles.summaryValue}>{players.length}</Text>
          <Text style={styles.summaryLabel}>Total Players</Text>
        </View>

        <View style={styles.summaryItem}>
          <Trophy size={20} color={colors.green} />
          <Text style={styles.summaryValue}>{totalGames}</Text>
          <Text style={styles.summaryLabel}>Total Games</Text>
        </View>

        <View style={styles.summaryItem}>
          <TrendingUp size={20} color={colors.orange} />
          <Text style={styles.summaryValue}>{averageGamesPlayed.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Avg Games/Player</Text>
        </View>
      </View>
    </View>
  );

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
          <Text style={styles.title}>Player Statistics</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <SessionSummary />

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortTitle}>Sort by:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortButtons}
            >
              <TouchableOpacity
                style={getSortButtonStyle('name')}
                onPress={() => setSortBy('name')}
              >
                <Text style={getSortButtonTextStyle('name')}>Name</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={getSortButtonStyle('gamesPlayed')}
                onPress={() => setSortBy('gamesPlayed')}
              >
                <Text style={getSortButtonTextStyle('gamesPlayed')}>Games Played</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={getSortButtonStyle('gamesSatOut')}
                onPress={() => setSortBy('gamesSatOut')}
              >
                <Text style={getSortButtonTextStyle('gamesSatOut')}>Sat Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={getSortButtonStyle('totalScore')}
                onPress={() => setSortBy('totalScore')}
              >
                <Text style={getSortButtonTextStyle('totalScore')}>Total Score</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Player Stats List */}
          <View style={styles.playersList}>
            <FlatList
              data={sortedPlayers}
              renderItem={renderPlayerStat}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sortContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sortTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  sortButtonTextActive: {
    color: 'white',
  },
  playersList: {
    marginHorizontal: 16,
  },
  playerStatCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  playerStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orangeLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.orange,
  },
  playingPercentage: {
    backgroundColor: colors.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playingPercentageText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.blue,
  },
  playerStatGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  partnerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  partnerName: {
    fontWeight: '500',
    color: colors.text,
  },
});
