import React, { useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import {
  Appbar,
  Button,
  Card,
  IconButton,
  Menu,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { addMultiplePlayers } from '../store/slices/playersSlice';
import { Player } from '../types';
import { Alert } from '../utils/alert'

interface BulkAddModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PlayerInput {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  rating: string;
}

export default function BulkAddModal({ visible, onClose }: BulkAddModalProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [players, setPlayers] = useState<PlayerInput[]>([
    { id: '1', name: '', email: '', phone: '', gender: undefined, rating: '' },
  ]);

  const addPlayerRow = () => {
    const newId = (players.length + 1).toString();
    setPlayers([...players, { id: newId, name: '', email: '', phone: '', gender: undefined, rating: '' }]);
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
        phone: p.phone?.trim() || undefined,
        gender: p.gender,
        rating,
      };
    });

    try {
      dispatch(addMultiplePlayers(playersToAdd));
      Alert.alert('Success', `Added ${playersToAdd.length} players`);

      // Reset form
      setPlayers([{ id: '1', name: '', email: '', phone: '', gender: undefined, rating: '' }]);
      onClose();
    } catch (error) {
      // Alert was already shown for validation error
    }
  };

  const handleCancel = () => {
    setPlayers([{ id: '1', name: '', email: '', phone: '', gender: undefined, rating: '' }]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleCancel} />
          <Appbar.Content
            title="Bulk Add Players"
            titleStyle={{ fontWeight: '600' }}
          />
          <Button
            icon="account-multiple-plus"
            mode="contained"
            onPress={handleSave}
            style={{ marginRight: 8 }}
          >
            Add All
          </Button>
        </Appbar.Header>

        <ScrollView
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Surface
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 24,
              backgroundColor: theme.colors.primaryContainer
            }}
          >
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onPrimaryContainer,
                textAlign: 'center'
              }}
            >
              Add multiple players at once. Only name is required.
            </Text>
          </Surface>

          {players.map((player, index) => (
            <Card key={player.id} style={{ marginBottom: 16 }}>
              <Card.Content>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                    Player {index + 1}
                  </Text>
                  {players.length > 1 && (
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => removePlayerRow(player.id)}
                    />
                  )}
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text
                    variant="labelMedium"
                    style={{
                      marginBottom: 4,
                      color: theme.colors.onSurface
                    }}
                  >
                    Name *
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={player.name}
                    onChangeText={(text) => updatePlayer(player.id, 'name', text)}
                    placeholder="Player name"
                    dense
                  />
                </View>

                <View style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginBottom: 12
                }}>
                  <View style={{ flex: 2 }}>
                    <Text
                      variant="labelMedium"
                      style={{
                        marginBottom: 4,
                        color: theme.colors.onSurface
                      }}
                    >
                      Email
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={player.email}
                      onChangeText={(text) => updatePlayer(player.id, 'email', text)}
                      placeholder="Email (optional)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      dense
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text
                      variant="labelMedium"
                      style={{
                        marginBottom: 4,
                        color: theme.colors.onSurface
                      }}
                    >
                      Phone
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={player.phone}
                      onChangeText={(text) => updatePlayer(player.id, 'phone', text)}
                      placeholder="Phone (optional)"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      dense
                    />
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row',
                  gap: 12
                }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="labelMedium"
                      style={{
                        marginBottom: 4,
                        color: theme.colors.onSurface
                      }}
                    >
                      Gender
                    </Text>
                    <Surface style={{
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.outline
                    }}>
                      <Picker
                        selectedValue={player.gender}
                        onValueChange={(value) => updatePlayer(player.id, 'gender', value)}
                        style={{ height: 40 }}
                      >
                        <Picker.Item label="Select" value="" />
                        <Picker.Item label="Male" value="male" />
                        <Picker.Item label="Female" value="female" />
                        <Picker.Item label="Other" value="other" />
                      </Picker>
                    </Surface>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="labelMedium"
                      style={{
                        marginBottom: 4,
                        color: theme.colors.onSurface
                      }}
                    >
                      Rating
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={player.rating}
                      onChangeText={(text) => updatePlayer(player.id, 'rating', text)}
                      placeholder="0.0"
                      keyboardType="decimal-pad"
                      dense
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}

          <Button
            icon="plus"
            mode="outlined"
            onPress={addPlayerRow}
            style={{
              borderStyle: 'dashed',
              borderWidth: 2,
              borderColor: theme.colors.primary,
              marginTop: 8
            }}
            contentStyle={{ paddingVertical: 8 }}
          >
            Add Another Player
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
