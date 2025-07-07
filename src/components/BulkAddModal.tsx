// src/components/BulkAddModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { X, Plus, Trash2, Users } from 'lucide-react-native';
import { addMultiplePlayers } from '../store/slices/playersSlice';
import { Player } from '../types';
import { colors } from '../theme';
import { Alert } from '../utils/alert'

interface BulkAddModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PlayerInput {
  id: string;
  name: string;
  email: string;
  rating: string;
}

export default function BulkAddModal({ visible, onClose }: BulkAddModalProps) {
  const dispatch = useDispatch();
  const [players, setPlayers] = useState<PlayerInput[]>([
    { id: '1', name: '', email: '', rating: '' },
  ]);

  const addPlayerRow = () => {
    const newId = (players.length + 1).toString();
    setPlayers([...players, { id: newId, name: '', email: '', rating: '' }]);
  };

  const removePlayerRow = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayer = (id: string, field: keyof PlayerInput, value: string) => {
    setPlayers(players.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleSave = () => {
    const validPlayers = players.filter(p => p.name.trim());

    if (validPlayers.length === 0) {
      Alert.alert('No Players', 'Please enter at least one player name');
      return;
    }

    const playersToAdd: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>[] = validPlayers.map(p => {
      const rating = p.rating ? parseFloat(p.rating) : undefined;
      if (p.rating && (isNaN(rating!) || rating! < 0 || rating! > 10)) {
        Alert.alert('Invalid Rating', `Rating for ${p.name} must be between 0 and 10`);
        throw new Error('Invalid rating');
      }

      return {
        name: p.name.trim(),
        email: p.email.trim() || undefined,
        rating,
      };
    });

    try {
      dispatch(addMultiplePlayers(playersToAdd));
      Alert.alert('Success', `Added ${playersToAdd.length} players`);

      // Reset form
      setPlayers([{ id: '1', name: '', email: '', rating: '' }]);
      onClose();
    } catch (error) {
      // Alert was already shown for validation error
    }
  };

  const handleCancel = () => {
    setPlayers([{ id: '1', name: '', email: '', rating: '' }]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Bulk Add Players</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Users size={20} color="white" />
            <Text style={styles.saveButtonText}>Add All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Add multiple players at once. Only name is required.
            </Text>
          </View>

          {players.map((player, index) => (
            <View key={player.id} style={styles.playerRow}>
              <View style={styles.playerHeader}>
                <Text style={styles.playerNumber}>Player {index + 1}</Text>
                {players.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removePlayerRow(player.id)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={16} color={colors.red} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={player.name}
                    onChangeText={(text) => updatePlayer(player.id, 'name', text)}
                    placeholder="Player name"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={player.email}
                    onChangeText={(text) => updatePlayer(player.id, 'email', text)}
                    placeholder="Email (optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Rating</Text>
                  <TextInput
                    style={styles.input}
                    value={player.rating}
                    onChangeText={(text) => updatePlayer(player.id, 'rating', text)}
                    placeholder="0.0"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={addPlayerRow} style={styles.addRowButton}>
            <Plus size={20} color={colors.primary} />
            <Text style={styles.addRowText}>Add Another Player</Text>
          </TouchableOpacity>
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
  },
  cancelButton: {
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
  form: {
    flex: 1,
    padding: 16,
  },
  instructions: {
    backgroundColor: colors.blueLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  instructionsText: {
    color: colors.blue,
    fontSize: 14,
    textAlign: 'center',
  },
  playerRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  removeButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'white',
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  addRowText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

