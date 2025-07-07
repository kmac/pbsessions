// src/components/QuickPlayerForm.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { X, Save, UserPlus } from 'lucide-react-native';
import { Player } from '../types';
import { validatePlayerName, validateEmail, validatePhone, validateRating } from '../utils/validation';
import { colors } from '../theme';
import { Alert } from '../utils/alert'

interface QuickPlayerFormProps {
  onSave: (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  groupName: string;
}

export default function QuickPlayerForm({ onSave, onCancel, groupName }: QuickPlayerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    rating: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate name
    const nameValidation = validatePlayerName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error!;
    }

    // Validate email if provided
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Validate phone if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    // Validate rating if provided
    const ratingValidation = validateRating(formData.rating);
    if (!ratingValidation.isValid) {
      newErrors.rating = ratingValidation.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const rating = formData.rating ? parseFloat(formData.rating) : undefined;

    const playerData = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      gender: formData.gender || undefined,
      rating,
    };

    onSave(playerData);
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Add New Player</Text>
          <Text style={styles.subtitle}>to "{groupName}"</Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={20} color="white" />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.formHeader}>
          <UserPlus size={32} color={colors.primary} />
          <Text style={styles.formTitle}>Player Information</Text>
          <Text style={styles.formSubtitle}>
            This player will be automatically added to the group
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="Enter player name"
            autoFocus
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="Enter email address (optional)"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="Enter phone number (optional)"
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.gender}
              onValueChange={(value) => updateField('gender', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select gender (optional)" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Rating (0.0 - 10.0)</Text>
          <TextInput
            style={[styles.input, errors.rating && styles.inputError]}
            value={formData.rating}
            onChangeText={(text) => updateField('rating', text)}
            placeholder="Enter DUPR-style rating (optional)"
            keyboardType="decimal-pad"
          />
          {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
          <Text style={styles.helpText}>
            Optional: DUPR-style rating for skill-based court assignments
          </Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveFullButton} onPress={handleSave}>
            <UserPlus size={20} color="white" />
            <Text style={styles.saveFullButtonText}>Add to {groupName}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelFullButton} onPress={onCancel}>
            <Text style={styles.cancelFullButtonText}>Cancel</Text>
          </TouchableOpacity>
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
    backgroundColor: 'white',
  },
  cancelButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  formHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
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
  inputError: {
    borderColor: colors.red,
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
  errorText: {
    fontSize: 12,
    color: colors.red,
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  actionSection: {
    marginTop: 24,
    gap: 12,
  },
  saveFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveFullButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelFullButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
  },
  cancelFullButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
});

