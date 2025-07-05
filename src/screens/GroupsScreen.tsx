// src/screens/GroupsScreen.tsx
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
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Edit2, Trash2, Users, Users2, UserPlus } from 'lucide-react-native';
import { RootState } from '../store';
import { addGroup, updateGroup, removeGroup } from '../store/slices/groupsSlice';
import { Group } from '../types';
import GroupForm from '../components/GroupForm';
import PlayerSelectionModal from '../components/PlayerSelectionModal';
import { colors } from '../theme';

export default function GroupsScreen() {
  const dispatch = useDispatch();
  const { groups, loading } = useSelector((state: RootState) => state.groups);
  const { players } = useSelector((state: RootState) => state.players);

  const [modalVisible, setModalVisible] = useState(false);
  const [playerModalVisible, setPlayerModalVisible] = useState(false);
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
    setPlayerModalVisible(true);
  };

  const getGroupPlayers = (group: Group) => {
    return players.filter(player => group.playerIds.includes(player.id));
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const groupPlayers = getGroupPlayers(item);

    return (
      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.groupDescription}>{item.description}</Text>
            )}
          </View>
          <View style={styles.playerCount}>
            <Users size={16} color={colors.primary} />
            <Text style={styles.playerCountText}>{groupPlayers.length}</Text>
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
            <Text style={styles.actionButtonText}>Manage Players</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups ({groups.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add Group</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users2 size={48} color={colors.gray} />
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>
              Create groups to organize players for sessions
            </Text>
          </View>
        }
      />

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

      {selectedGroup && (
        <PlayerSelectionModal
          visible={playerModalVisible}
          group={selectedGroup}
          onClose={() => {
            setPlayerModalVisible(false);
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
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
  },
});

