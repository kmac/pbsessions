// src/components/SessionPlayerManager.tsx
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
import { useAppSelector } from '../store';
import {
  X,
  Check,
  Search,
  Users,
  User,
  Star,
  UserPlus
} from 'lucide-react-native';
import { Player, Group } from '../types';
import { colors } from '../theme';

interface SessionPlayerManagerProps {
  visible: boolean;
  selectedPlayerIds: string[];
  onSelectionChange: (playerIds: string[]) => void;
  onClose: () => void;
}

type ViewMode = 'players' | 'groups';

export default function SessionPlayerManager({
  visible,
  selectedPlayerIds,
  onSelectionChange,
  onClose
}: SessionPlayerManagerProps) {
  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);

  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [searchQuery, setSearchQuery] = useState('');

  const isPlayerSelected = (playerId: string) => {
    return selectedPlayerIds.includes(playerId);
  };

  const togglePlayer = (playerId: string) => {
    if (isPlayerSelected(playerId)) {
      onSelectionChange(selectedPlayerIds.filter(id => id !== playerId));
    } else {
      onSelectionChange([...selectedPlayerIds, playerId]);
    }
  };

  const toggleGroup = (group: Group) => {
    const groupPlayerIds = group.playerIds;
    const allSelected = groupPlayerIds.every(id => isPlayerSelected(id));

    if (allSelected) {
      // Remove all group players
      onSelectionChange(selectedPlayerIds.filter(id => !groupPlayerIds.includes(id)));
    } else {
      // Add all group players
      const newIds = [...selectedPlayerIds];
      groupPlayerIds.forEach(id => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      onSelectionChange(newIds);
    }
  };

  const getGroupPlayers = (group: Group) => {
    return players.filter(p => group.playerIds.includes(p.id));
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.email && player.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPlayers = players.filter(p => isPlayerSelected(p.id));

  const renderPlayer = ({ item }: { item: Player }) => {
    const isSelected = isPlayerSelected(item.id);

    return (
      <TouchableOpacity
        style={[styles.playerItem, isSelected && styles.playerItemSelected]}
        onPress={() => togglePlayer(item.id)}
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
          {(item.email || item.gender) && (
            <View style={styles.playerDetails}>
              {item.email && (
                <Text style={[styles.detailText, isSelected && styles.detailTextSelected]}>
                  {item.email}
                </Text>
              )}
              {item.gender && (
                <Text style={[styles.detailText, isSelected && styles.detailTextSelected]}>
                  {item.gender}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const groupPlayers = getGroupPlayers(item);
    const selectedCount = groupPlayers.filter(p => isPlayerSelected(p.id)).length;
    const isFullySelected = selectedCount === groupPlayers.length && groupPlayers.length > 0;
    const isPartiallySelected = selectedCount > 0 && selectedCount < groupPlayers.length;

    return (
      <TouchableOpacity
        style={[
          styles.groupItem,
          isFullySelected && styles.groupItemSelected,
          isPartiallySelected && styles.groupItemPartial
        ]}
        onPress={() => toggleGroup(item)}
      >
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text style={[
              styles.groupName,
              (isFullySelected || isPartiallySelected) && styles.groupNameSelected
            ]}>
              {item.name}
            </Text>
            <View style={styles.groupStats}>
              <Text style={[
                styles.groupPlayerCount,
                (isFullySelected || isPartiallySelected) && styles.groupPlayerCountSelected
              ]}>
                {selectedCount}/{groupPlayers.length}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text style={[
              styles.groupDescription,
              (isFullySelected || isPartiallySelected) && styles.groupDescriptionSelected
            ]}>
              {item.description}
            </Text>
          )}

          {groupPlayers.length > 0 && (
            <Text style={[
              styles.groupPlayersPreview,
              (isFullySelected || isPartiallySelected) && styles.groupPlayersPreviewSelected
            ]} numberOfLines={1}>
              {groupPlayers.map(p => p.name).join(', ')}
            </Text>
          )}
        </View>

        <View style={[
          styles.checkbox,
          isFullySelected && styles.checkboxSelected,
          isPartiallySelected && styles.checkboxPartial
        ]}>
          {isFullySelected && <Check size={16} color="white" />}
          {isPartiallySelected && (
            <View style={styles.partialIndicator} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'groups' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('groups')}
      >
        <Users size={16} color={viewMode === 'groups' ? 'white' : colors.primary} />
        <Text style={[
          styles.viewModeButtonText,
          viewMode === 'groups' && styles.viewModeButtonTextActive
        ]}>
          Groups ({groups.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'players' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('players')}
      >
        <User size={16} color={viewMode === 'players' ? 'white' : colors.primary} />
        <Text style={[
          styles.viewModeButtonText,
          viewMode === 'players' && styles.viewModeButtonTextActive
        ]}>
          Individual ({players.length})
        </Text>
      </TouchableOpacity>
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
          <View style={styles.headerInfo}>
            <Text style={styles.title}>SessionPlayerManager: Select Players</Text>
            <Text style={styles.subtitle}>
              {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ViewModeSelector />

        {viewMode === 'players' && (
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedPlayers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Selected Players ({selectedPlayers.length})
              </Text>
              <FlatList
                data={selectedPlayers}
                renderItem={renderPlayer}
                keyExtractor={(item) => `selected-${item.id}`}
                scrollEnabled={false}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {viewMode === 'groups' ? 'Available Groups' : 'Available Players'}
            </Text>

            {viewMode === 'groups' ? (
              groups.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={32} color={colors.gray} />
                  <Text style={styles.emptyText}>No groups available</Text>
                  <Text style={styles.emptySubtext}>Create groups to quickly add players</Text>
                </View>
              ) : (
                <FlatList
                  data={groups}
                  renderItem={renderGroup}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              )
            ) : (
              <FlatList
                data={filteredPlayers}
                renderItem={renderPlayer}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <UserPlus size={32} color={colors.gray} />
                    <Text style={styles.emptyText}>No players found</Text>
                    <Text style={styles.emptySubtext}>
                      {searchQuery ? 'Try a different search term' : 'Add players first'}
                    </Text>
                  </View>
                }
              />
            )}
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
  content: {
    flex: 1,
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
    marginBottom: 4,
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
    gap: 2,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailTextSelected: {
    color: colors.grayLight,
  },
  groupItem: {
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
  groupItemSelected: {
    backgroundColor: colors.primaryLight,
    shadowOpacity: 0.1,
  },
  groupItemPartial: {
    backgroundColor: colors.blueLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  groupNameSelected: {
    color: 'white',
  },
  groupStats: {
    alignItems: 'flex-end',
  },
  groupPlayerCount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  groupPlayerCountSelected: {
    color: 'white',
  },
  groupDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  groupDescriptionSelected: {
    color: colors.grayLight,
  },
  groupPlayersPreview: {
    fontSize: 12,
    color: colors.gray,
  },
  groupPlayersPreviewSelected: {
    color: colors.grayLight,
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
  checkboxPartial: {
    borderColor: colors.primary,
  },
  partialIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
    textAlign: 'center',
  },
});
