// src/components/GroupPlayerManager.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../store';
import {
  X,
  Check,
  Plus,
  Search,
  User,
  Users,
  Star,
  Mail,
  Phone
} from 'lucide-react-native';
import { addPlayerToGroup, removePlayerFromGroup } from '../store/slices/groupsSlice';
import { addPlayer } from '../store/slices/playersSlice';
import { Group, Player } from '../types';
import QuickPlayerForm from './QuickPlayerForm';
import { colors } from '../theme';
import { Alert } from '../utils/alert'

interface GroupPlayerManagerProps {
  visible: boolean;
  group: Group;
  onClose: () => void;
}

type ViewMode = 'select' | 'add';

export default function GroupPlayerManager({
  visible,
  group,
  onClose
}: GroupPlayerManagerProps) {
  const dispatch = useAppDispatch();
  const { players } = useAppSelector((state) => state.players);

  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const isPlayerInGroup = (playerId: string) => {
    return group.playerIds.includes(playerId);
  };

  const handleTogglePlayer = (player: Player) => {
    if (isPlayerInGroup(player.id)) {
      dispatch(removePlayerFromGroup({ groupId: group.id, playerId: player.id }));
    } else {
      dispatch(addPlayerToGroup({ groupId: group.id, playerId: player.id }));
    }
  };

  const handleQuickAddPlayer = (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Add player to store
    dispatch(addPlayer(playerData));

    // Get the new player ID (this is a simplified approach - in production you'd handle this better)
    const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to group immediately
    setTimeout(() => {
      const allPlayers = players;
      const newPlayer = allPlayers[allPlayers.length - 1]; // Get the last added player
      if (newPlayer && !isPlayerInGroup(newPlayer.id)) {
        dispatch(addPlayerToGroup({ groupId: group.id, playerId: newPlayer.id }));
      }
    }, 100);

    setShowQuickAdd(false);
    Alert.alert('Success', `${playerData.name} has been added to the group!`);
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.email && player.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupPlayers = players.filter(player => isPlayerInGroup(player.id));
  const availablePlayers = filteredPlayers.filter(player => !isPlayerInGroup(player.id));

  const renderPlayerItem = ({ item, showActions = true }: {
    item: Player;
    showActions?: boolean;
  }) => {
    const isSelected = isPlayerInGroup(item.id);

    return (
      <TouchableOpacity
        style={[styles.playerItem, isSelected && styles.playerItemSelected]}
        onPress={() => showActions && handleTogglePlayer(item)}
        disabled={!showActions}
      >
        <View style={styles.playerInfo}>
          <View style={styles.playerHeader}>
            <Text style={[styles.playerName, isSelected && styles.playerNameSelected]}>
              {item.name}
            </Text>
            {item.rating && (
              <View style={styles.ratingBadge}>
                <Star size={12} color={colors.orange} />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.playerDetails}>
            {item.email && (
              <View style={styles.detailRow}>
                <Mail size={12} color={colors.gray} />
                <Text style={[styles.detailText, isSelected && styles.detailTextSelected]}>
                  {item.email}
                </Text>
              </View>
            )}
            {item.phone && (
              <View style={styles.detailRow}>
                <Phone size={12} color={colors.gray} />
                <Text style={[styles.detailText, isSelected && styles.detailTextSelected]}>
                  {item.phone}
                </Text>
              </View>
            )}
            {item.gender && (
              <Text style={[styles.genderText, isSelected && styles.detailTextSelected]}>
                {item.gender}
              </Text>
            )}
          </View>
        </View>

        {showActions && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Check size={16} color="white" />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'select' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('select')}
      >
        <Users size={16} color={viewMode === 'select' ? 'white' : colors.primary} />
        <Text style={[
          styles.viewModeButtonText,
          viewMode === 'select' && styles.viewModeButtonTextActive
        ]}>
          Select Existing
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'add' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('add')}
      >
        <Plus size={16} color={viewMode === 'add' ? 'white' : colors.primary} />
        <Text style={[
          styles.viewModeButtonText,
          viewMode === 'add' && styles.viewModeButtonTextActive
        ]}>
          Add New
        </Text>
      </TouchableOpacity>
    </View>
  );

  const SelectExistingView = () => (
    <>
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {groupPlayers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Selected Players ({groupPlayers.length})
          </Text>
          <FlatList
            data={groupPlayers}
            renderItem={({ item }) => renderPlayerItem({ item })}
            keyExtractor={(item) => `selected-${item.id}`}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Available Players ({availablePlayers.length})
        </Text>

        {availablePlayers.length === 0 ? (
          <View style={styles.emptySection}>
            {searchQuery ? (
              <Text style={styles.emptyText}>No players match your search</Text>
            ) : (
              <>
                <Text style={styles.emptyText}>All players are already in this group</Text>
                <TouchableOpacity
                  style={styles.switchToAddButton}
                  onPress={() => setViewMode('add')}
                >
                  <Plus size={16} color={colors.primary} />
                  <Text style={styles.switchToAddText}>Add New Player</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <FlatList
            data={availablePlayers}
            renderItem={({ item }) => renderPlayerItem({ item })}
            keyExtractor={(item) => `available-${item.id}`}
            scrollEnabled={false}
          />
        )}
      </View>
    </>
  );

  const AddNewView = () => (
    <View style={styles.addNewContainer}>
      <View style={styles.addNewHeader}>
        <User size={32} color={colors.primary} />
        <Text style={styles.addNewTitle}>Add New Player to Group</Text>
        <Text style={styles.addNewSubtitle}>
          Add a new player and they'll be automatically added to "{group.name}"
        </Text>
      </View>

      <TouchableOpacity
        style={styles.quickAddButton}
        onPress={() => setShowQuickAdd(true)}
      >
        <Plus size={20} color="white" />
        <Text style={styles.quickAddButtonText}>Add New Player</Text>
      </TouchableOpacity>

      {groupPlayers.length > 0 && (
        <View style={styles.currentPlayersPreview}>
          <Text style={styles.previewTitle}>Current players in this group:</Text>
          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
            {groupPlayers.map(player => (
              <View key={player.id} style={styles.previewPlayerItem}>
                <Text style={styles.previewPlayerName}>{player.name}</Text>
                {player.rating && (
                  <Text style={styles.previewPlayerRating}>
                    {player.rating.toFixed(1)}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const groupPlayerCount = group.playerIds.length;

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
            <Text style={styles.title}>{group.name}</Text>
            <Text style={styles.subtitle}>
              {groupPlayerCount} player{groupPlayerCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ViewModeSelector />

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'select' ? <SelectExistingView /> : <AddNewView />}
        </ScrollView>

        {/* Quick Add Player Modal */}
        <Modal
          visible={showQuickAdd}
          animationType="slide"
          presentationStyle="formSheet"
        >
          <QuickPlayerForm
            onSave={handleQuickAddPlayer}
            onCancel={() => setShowQuickAdd(false)}
            groupName={group.name}
          />
        </Modal>
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
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.grayLight,
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  viewModeButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  switchToAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  switchToAddText: {
    color: colors.primary,
    fontWeight: '600',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  playerItemSelected: {
    backgroundColor: colors.primaryLight,
    shadowOpacity: 0.1,
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  playerNameSelected: {
    color: 'white',
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
  playerDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailTextSelected: {
    color: colors.grayLight,
  },
  genderText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addNewContainer: {
    padding: 16,
  },
  addNewHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  addNewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  addNewSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  quickAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  currentPlayersPreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  previewScroll: {
    maxHeight: 200,
  },
  previewPlayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  previewPlayerName: {
    fontSize: 14,
    color: colors.text,
  },
  previewPlayerRating: {
    fontSize: 12,
    color: colors.orange,
    fontWeight: '500',
  },
});

