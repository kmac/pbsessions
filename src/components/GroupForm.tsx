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
import { Group } from '../types';
import { Alert } from '../utils/alert'

interface GroupFormProps {
  group?: Group | null;
  onSave: (group: Group | Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function GroupForm({ group, onSave, onCancel }: GroupFormProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
      });
    }
  }, [group]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Group name is required');
      return;
    }

    const groupData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      playerIds: group?.playerIds || [],
    };

    if (group) {
      onSave({ ...group, ...groupData });
    } else {
      onSave(groupData);
    }
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
          <TextInput
            mode="outlined"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Enter group description (optional)"
            multiline
            numberOfLines={4}
            contentStyle={{ minHeight: 100 }}
          />
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}
