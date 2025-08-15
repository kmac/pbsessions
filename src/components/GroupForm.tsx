import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import GroupPlayerManager from '@/src/components/GroupPlayerManager';
import { useAppSelector } from '@/src/store';
import { Group, Player } from '../types';
import { Alert } from '../utils/alert'

interface GroupFormProps {
  group: Group | null;
  onSave: (group: Group | Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function GroupForm({ group, onSave, onCancel }: GroupFormProps) {
  const theme = useTheme();
  const [playerManagerVisible, setPlayerManagerVisible] = useState(false);
  const { players : allPlayers} = useAppSelector((state) => state.players);

  const [formData, setFormData] = useState({
      name: group?.name || '',
      description: group?.description || '',
      playerIds: group?.playerIds || [],
  });

  useEffect(() => {
    setFormData({
      name: group?.name || '',
      description: group?.description || '',
      playerIds: group?.playerIds || [],
    });
  }, [group]);

  const currentGroupPlayers = allPlayers.filter(player =>
    formData.playerIds.includes(player.id)
  );

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Group name is required');
      return;
    }

    const groupData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      playerIds: formData.playerIds || [],
    };

    if (group) {
      onSave({ ...group, ...groupData });
    } else {
      onSave(groupData);
    }
  };

  const handleSaveGroupPlayers = (gp: Player[]) => {
    // if (!players || !Array.isArray(players)) {
    //   console.error('Players is not an array:', players);
    //   return;
    // }
    const newPlayerIds: string[] = gp.map(p => p.id);
    setFormData({ ...formData, playerIds: newPlayerIds });
    setPlayerManagerVisible(false);
  };

  const handleManagePlayers = () => {
    setPlayerManagerVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={onCancel} />
        <Appbar.Content
          title={group ? 'Edit Group' : 'Add Group'}
          titleStyle={{ fontWeight: '600' }}
        />
        <Button
          icon="content-save"
          mode="contained"
          onPress={handleSave}
          style={{ marginRight: 8 }}
        >
          Save
        </Button>
      </Appbar.Header>

      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={{
          padding: 16,
          borderRadius: 12,
          marginBottom: 16
        }}>
          <View style={{
            flexDirection: 'column',
            columnGap: 12,
          }}>
            <Text
              variant="labelLarge"
              style={{
                marginBottom: 8,
                color: theme.colors.onSurface
              }}
            >
              Group Name *
            </Text>
            <TextInput
              mode="outlined"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter group name"
              autoFocus={!group}
              style={{ marginBottom: 16 }}
            />

            <Text
              variant="labelLarge"
              style={{
                marginBottom: 8,
                color: theme.colors.onSurface
              }}
            >
              Description
            </Text>

            <Text
              variant="labelLarge"
              style={{
                marginBottom: 8,
                color: theme.colors.onSurface
              }}
            >
              playerIds: {group ? group.playerIds.length : 'no' }
            </Text>

            <TextInput
              mode="outlined"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter group description (optional)"
              multiline
              numberOfLines={4}
              contentStyle={{ minHeight: 100 }}
            />

            {formData.playerIds && (
              <View style={{ marginVertical: 12 }}>
                <Text variant="labelMedium" style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 4
                }}>
                  Players ({formData.playerIds.length}):
                </Text>
                <Text variant="bodyMedium" numberOfLines={2} style={{
                  color: theme.colors.onSurfaceVariant
                }}>
                  {currentGroupPlayers.map(p => p.name).sort((a, b) => a.localeCompare(b)).join(', ')}
                </Text>
              </View>
            )}
            <Button
              icon="account-multiple-plus-outline"
              mode="outlined"
              onPress={() => handleManagePlayers()}
            >
              {formData.playerIds.length > 0 ? 'Manage Players' : 'Add Players'}
            </Button>

          </View>
        </Surface>
      </ScrollView>

      <GroupPlayerManager
        visible={playerManagerVisible}
        //groupName={group ? group.name : ""}
        groupName={formData.name || "New Group"}
        groupPlayers={currentGroupPlayers}
        onSave={gp => {
          handleSaveGroupPlayers(gp);
        }}
        onCancel={() => {
          setPlayerManagerVisible(false);
        }}
      />

    </SafeAreaView>
  );
}
