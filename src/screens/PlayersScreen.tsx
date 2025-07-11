// src/screens/PlayersScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Edit2, Trash2, Users } from 'lucide-react-native';
import { RootState } from '../store';
import { addPlayer, updatePlayer, removePlayer } from '../store/slices/playersSlice';
import { Player } from '../types';
import PlayerForm from '../components/PlayerForm';
import BulkAddModal from '../components/BulkAddModal';
import { colors } from '../theme';
import { Alert } from '../utils/alert'
import { APP_CONFIG } from '../../src/constants';

export default function PlayersScreen() {
  const dispatch = useDispatch();
  const { players, loading } = useSelector((state: RootState) => state.players);
  const groups = useSelector((state: RootState) => state.groups.groups);

  const [modalVisible, setModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const handleAddPlayer = (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(addPlayer(playerData));
    setModalVisible(false);
  };

  const handleUpdatePlayer = (playerData: Player) => {
    dispatch(updatePlayer(playerData));
    setEditingPlayer(null);
    setModalVisible(false);
  };

  const handleDeletePlayer = (player: Player) => {
    // Check if player is in any groups
    const playerGroups = groups.filter(group =>
      group.playerIds.includes(player.id)
    );

    if (playerGroups.length > 0) {
      Alert.alert(
        'Cannot Delete Player',
        `${player.name} is assigned to ${playerGroups.length} group(s). Remove them from all groups first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Player',
      `Are you sure you want to delete ${player.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(removePlayer(player.id)),
        },
      ]
    );
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setModalVisible(true);
  };

  const getPlayerGroupCount = (playerId: string) => {
    return groups.filter(group => group.playerIds.includes(playerId)).length;
  };

  const getPlayerDetails = (item: Player) => {
    let details = "";
    let separator = "";
    if (item.gender) {
      details = `${item.gender}`;
      separator = ", "
    }
    if (item.email) {
      details = details + separator + `${item.email}`;
      separator = ", "
    }
    if (item.phone) {
      details = details + separator + `${item.phone}`;
      separator = ", "
    }
    return details;
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        <View style={styles.playerDetails}>
          {item.rating && (
            <Text style={styles.rating}>Rating: {item.rating.toFixed(APP_CONFIG.RATING_DECIMAL_PLACES)}</Text>
          )}
          <Text style={styles.detail}>{getPlayerDetails(item)}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Users size={14} color={colors.gray} />
          <Text style={styles.groupCount}>
            {getPlayerGroupCount(item.id)} groups
          </Text>
        </View>
      </View>
      <View style={styles.playerActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditPlayer(item)}
        >
          <Edit2 size={18} color={colors.blue} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePlayer(item)}
        >
          <Trash2 size={18} color={colors.red} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Players ({players.length})</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addButton, styles.bulkButton]}
            onPress={() => setBulkModalVisible(true)}
          >
            <Text style={styles.bulkButtonText}>Bulk Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, styles.bulkButton]}
            onPress={() => {}}
          >
            <Text style={styles.bulkButtonText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Add Player</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={[...players].sort((a, b) => a.name.localeCompare(b.name))}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={48} color={colors.gray} />
            <Text style={styles.emptyText}>No players yet</Text>
            <Text style={styles.emptySubtext}>
              Add players to start organizing sessions
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PlayerForm
          player={editingPlayer}
          onSave={editingPlayer ? handleUpdatePlayer : handleAddPlayer}
          onCancel={() => {
            setModalVisible(false);
            setEditingPlayer(null);
          }}
        />
      </Modal>

      <BulkAddModal
        visible={bulkModalVisible}
        onClose={() => setBulkModalVisible(false)}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  bulkButton: {
    backgroundColor: colors.secondary,
  },
  importButton: {
    backgroundColor: colors.secondary,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  bulkButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  playerCard: {
    flexDirection: 'row',
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
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  playerDetails: {
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 2,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupCount: {
    fontSize: 12,
    color: colors.gray,
  },
  playerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
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
  },
});

