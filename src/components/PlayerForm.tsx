// src/components/PlayerForm.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { X, Save } from 'lucide-react-native';
import { Player } from '../types';
import { colors } from '../theme';

interface PlayerFormProps {
  player?: Player | null;
  onSave: (player: Player | Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function PlayerForm({ player, onSave, onCancel }: PlayerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    rating: '',
  });

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        email: player.email || '',
        phone: player.phone || '',
        gender: player.gender || '',
        rating: player.rating?.toString() || '',
      });
    }
  }, [player]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Player name is required');
      return;
    }

    const rating = formData.rating ? parseFloat(formData.rating) : undefined;
    if (formData.rating && (isNaN(rating!) || rating! < 0 || rating! > 10)) {
      Alert.alert('Validation Error', 'Rating must be a number between 0 and 10');
      return;
    }

    const playerData = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      gender: formData.gender || undefined,
      rating,
    };

    if (player) {
      onSave({ ...player, ...playerData });
    } else {
      onSave(playerData);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {player ? 'Edit Player' : 'Add Player'}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={20} color="white" />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter player name"
            autoFocus={!player}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select gender" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Rating (0.0 - 10.0)</Text>
          <TextInput
            style={styles.input}
            value={formData.rating}
            onChangeText={(text) => setFormData({ ...formData, rating: text })}
            placeholder="Enter DUPR-style rating"
            keyboardType="decimal-pad"
          />
          <Text style={styles.helpText}>
            Optional: DUPR-style rating for skill-based court assignments
          </Text>
        </View>
      </ScrollView>
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
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  helpText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
});

