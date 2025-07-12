// src/components/PlayerSelectionModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { X, Check, Plus } from 'lucide-react-native';
import { RootState } from '../store';
import { addPlayerToGroup, removePlayerFromGroup } from '../store/slices/groupsSlice';
import { Group, Player } from '../types';
import { colors } from '../theme';
import { Alert } from '../utils/alert'



// UNUSED???



interface PlayerSelectionModalProps {
  visible: boolean;
  group: Group;
  onClose: () => void;
}

export default function PlayerSelectionModal({
  visible,
  group,
  onClose
}: PlayerSelectionModalProps) {
  const dispatch = useDispatch();
  const { players } = useSelector((state: RootState) => state.players);

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

  const renderPlayer = ({ item }: { item: Player }) => {
    const isSelected = isPlayerInGroup(item.id);

    return (
      <TouchableOpacity
        style={[styles.playerItem, isSelected && styles.playerItemSelected]}
        onPress={() => handleTogglePlayer(item)}
      >
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isSelected && styles.playerNameSelected]}>
            {item.name}
          </Text>
          {item.rating && (
            <Text style={[styles.playerRating, isSelected && styles.playerRatingSelected]}>
              Rating: {item.rating.toFixed(1)}
            </Text>
          )}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

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
            <Text style={styles.title}>PlayerSelectionModal: {group.name}</Text>
            <Text style={styles.subtitle}>
              {groupPlayerCount} player{groupPlayerCount !== 1 ? 's' : ''} selected
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Plus size={48} color={colors.gray} />
              <Text style={styles.emptyText}>No players available</Text>
              <Text style={styles.emptySubtext}>
                Add players first to assign them to groups
              </Text>
            </View>
          }
        />
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
  listContainer: {
    padding: 16,
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
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  playerNameSelected: {
    color: 'white',
  },
  playerRating: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  playerRatingSelected: {
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
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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


