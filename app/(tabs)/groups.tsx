// app/(tabs)/groups.tsx (Enhanced Groups Tab)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { Plus, Edit2, Trash2, Users, UserPlus, ExternalLink } from 'lucide-react-native';
import { addGroup, updateGroup, removeGroup } from '../../src/store/slices/groupsSlice';
import { Group } from '../../src/types';
import GroupForm from '../../src/components/GroupForm';
import GroupPlayerManager from '../../src/components/GroupPlayerManager';
import { colors } from '../../src/theme';

export default function GroupsTab() {
  const dispatch = useAppDispatch();
  const { groups, loading } = useAppSelector((state) => state.groups);
  const { players } = useAppSelector((state) => state.players);

  const [modalVisible, setModalVisible] = useState(false);
  const [playerManagerVisible, setPlayerManagerVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handleAddGroup = (groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(addGroup(groupData));
    setModalVisible(false);
  };

  const handleUpdateGroup = (groupData: Group) => {
    dispatch(updateGroup(groupData));
    setEditingGroup(null);
    setModalVisible(false);
  };

  const handleDeleteGroup = (group: Group) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(removeGroup(group.id)),
        },
      ]
    );
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setModalVisible(true);
  };

  const handleManagePlayers = (group: Group) => {
    setSelectedGroup(group);
    setPlayerManagerVisible(true);
  };

  const navigateToPlayers = () => {
    router.push('/');
  };

  const getGroupPlayers = (group: Group) => {
    return players.filter(player => group.playerIds.includes(player.id));
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const groupPlayers = getGroupPlayers(item);
    const averageRating = groupPlayers.length > 0
      ? groupPlayers.reduce((sum, p) => sum + (p.rating || 0), 0) / groupPlayers.filter(p => p.rating).length
      : 0;

    return (
      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.groupDescription}>{item.description}</Text>
            )}
          </View>
          <View style={styles.groupStats}>
            <View style={styles.playerCount}>
              <Users size={16} color={colors.primary} />
              <Text style={styles.playerCountText}>{groupPlayers.length}</Text>
            </View>
            {averageRating > 0 && (
              <View style={styles.averageRating}>
                <Text style={styles.averageRatingText}>
                  Avg: {averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {groupPlayers.length > 0 && (
          <View style={styles.playersPreview}>
            <Text style={styles.playersLabel}>Players:</Text>
            <Text style={styles.playersText} numberOfLines={2}>
              {groupPlayers.map(p => p.name).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.groupActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.playersButton]}
            onPress={() => handleManagePlayers(item)}
          >
            <UserPlus size={16} color={colors.blue} />
            <Text style={styles.actionButtonText}>
              {groupPlayers.length === 0 ? 'Add Players' : 'Manage Players'}
            </Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditGroup(item)}
            >
              <Edit2 size={16} color={colors.blue} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteGroup(item)}
            >
              <Trash2 size={16} color={colors.red} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Users size={48} color={colors.gray} />
      <Text style={styles.emptyText}>No groups yet</Text>
      <Text style={styles.emptySubtext}>
        Create groups to organize players for sessions
      </Text>

      {players.length === 0 && (
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={navigateToPlayers}
        >
          <ExternalLink size={16} color={colors.primary} />
          <Text style={styles.navigateButtonText}>Add Players First</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Groups ({groups.length})</Text>
          {players.length > 0 && (
            <Text style={styles.subtitle}>{players.length} players available</Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {players.length === 0 ? (
            <TouchableOpacity
              style={styles.navigateToPlayersButton}
              onPress={navigateToPlayers}
            >
              <ExternalLink size={16} color={colors.primary} />
              <Text style={styles.navigateToPlayersText}>Add Players</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addButtonText}>Add Group</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />

      {/* Group Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <GroupForm
          group={editingGroup}
          onSave={editingGroup ? handleUpdateGroup : handleAddGroup}
          onCancel={() => {
            setModalVisible(false);
            setEditingGroup(null);
          }}
        />
      </Modal>

      {/* Player Manager Modal */}
      {selectedGroup && (
        <GroupPlayerManager
          visible={playerManagerVisible}
          group={selectedGroup}
          onClose={() => {
            setPlayerManagerVisible(false);
            setSelectedGroup(null);
          }}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'white',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  navigateToPlayersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  navigateToPlayersText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  groupStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  playerCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  averageRating: {
    backgroundColor: colors.orangeLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  averageRatingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.orange,
  },
  playersPreview: {
    marginBottom: 12,
  },
  playersLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray,
    marginBottom: 4,
  },
  playersText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blueLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.blue,
  },
  editButton: {
    backgroundColor: colors.blueLight,
  },
  deleteButton: {
    backgroundColor: colors.redLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 20,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  navigateButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

