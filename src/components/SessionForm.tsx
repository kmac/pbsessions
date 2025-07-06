// src/components/SessionForm.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../store';
import {
  X,
  Save,
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  Minus,
  Settings
} from 'lucide-react-native';
import { Session, Court, Player, Group } from '../types';
import { validateSessionSize } from '../utils/validation';
import SessionPlayerManager from './SessionPlayerManager';
import CourtManager from './CourtManager';
import { colors } from '../theme';

interface SessionFormProps {
  session?: Session | null;
  onSave: (session: Session | Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function SessionForm({ session, onSave, onCancel }: SessionFormProps) {
  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);

  const [formData, setFormData] = useState({
    name: '',
    dateTime: new Date().toISOString(),
    playerIds: [] as string[],
    courts: [
      { id: 'court1', number: 1, minimumRating: undefined, isActive: true },
      { id: 'court2', number: 2, minimumRating: undefined, isActive: true },
      { id: 'court3', number: 3, minimumRating: undefined, isActive: true },
    ] as Court[],
  });

  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [showCourtManager, setShowCourtManager] = useState(false);

  useEffect(() => {
    if (session) {
      setFormData({
        name: session.name,
        dateTime: session.dateTime,
        playerIds: session.playerIds,
        courts: session.courts,
      });
    } else {
      // Set default date/time to next hour
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      setFormData(prev => ({ ...prev, dateTime: now.toISOString() }));
    }
  }, [session]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Session name is required');
      return;
    }

    const activeCourts = formData.courts.filter(c => c.isActive);
    if (activeCourts.length === 0) {
      Alert.alert('Validation Error', 'At least one court must be active');
      return;
    }

    const validation = validateSessionSize(formData.playerIds.length, activeCourts.length);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    const sessionData = {
      name: formData.name.trim(),
      dateTime: formData.dateTime,
      playerIds: formData.playerIds,
      courts: formData.courts,
      isLive: false,
    };

    if (session) {
      onSave({ ...session, ...sessionData });
    } else {
      onSave(sessionData);
    }

    if (validation.warning) {
      Alert.alert('Session Created', validation.warning);
    }
  };

  const formatTimeForInput = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(',', '');
  };

  const getSelectedPlayers = () => {
    return players.filter(p => formData.playerIds.includes(p.id));
  };

  const getActiveCourts = () => {
    return formData.courts.filter(c => c.isActive);
  };

  const updatePlayerIds = (playerIds: string[]) => {
    setFormData({ ...formData, playerIds });
  };

  const updateCourts = (courts: Court[]) => {
    setFormData({ ...formData, courts });
  };

  const selectedPlayers = getSelectedPlayers();
  const activeCourts = getActiveCourts();
  const validation = validateSessionSize(selectedPlayers.length, activeCourts.length);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {session ? 'Edit Session' : 'New Session'}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={20} color="white" />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Session Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Session Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter session name"
            autoFocus={!session}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date & Time *</Text>
          <View style={styles.dateTimeContainer}>
            <Calendar size={20} color={colors.gray} />
            <Text style={styles.dateTimeDisplay}>
              {formatTimeForInput(formData.dateTime)}
            </Text>
          </View>
          <Text style={styles.helpText}>
            Tap to change date and time (coming soon)
          </Text>
        </View>

        {/* Players Section */}
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Players ({selectedPlayers.length})</Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => setShowPlayerManager(true)}
            >
              <Users size={16} color={colors.primary} />
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>

          {selectedPlayers.length === 0 ? (
            <View style={styles.emptyPlayers}>
              <Users size={32} color={colors.gray} />
              <Text style={styles.emptyText}>No players selected</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowPlayerManager(true)}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={styles.addButtonText}>Add Players</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.playersPreview}>
              <Text style={styles.playersText}>
                {selectedPlayers.map(p => p.name).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Courts Section */}
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Courts ({activeCourts.length} active)</Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => setShowCourtManager(true)}
            >
              <Settings size={16} color={colors.primary} />
              <Text style={styles.manageButtonText}>Configure</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.courtsPreview}>
            {formData.courts.map(court => (
              <View
                key={court.id}
                style={[
                  styles.courtChip,
                  !court.isActive && styles.courtChipInactive
                ]}
              >
                <MapPin
                  size={14}
                  color={court.isActive ? colors.green : colors.gray}
                />
                <Text style={[
                  styles.courtChipText,
                  !court.isActive && styles.courtChipTextInactive
                ]}>
                  Court {court.number}
                  {court.minimumRating ? ` (${court.minimumRating.toFixed(1)}+)` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Validation Summary */}
        {selectedPlayers.length > 0 && activeCourts.length > 0 && (
          <View style={styles.validationSummary}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Session Summary</Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Players:</Text>
                <Text style={styles.summaryValue}>{selectedPlayers.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Active Courts:</Text>
                <Text style={styles.summaryValue}>{activeCourts.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Playing per game:</Text>
                <Text style={styles.summaryValue}>{activeCourts.length * 4}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sitting out:</Text>
                <Text style={styles.summaryValue}>
                  {Math.max(0, selectedPlayers.length - (activeCourts.length * 4))}
                </Text>
              </View>
            </View>

            {validation.warning && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>{validation.warning}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Player Manager Modal */}
      <SessionPlayerManager
        visible={showPlayerManager}
        selectedPlayerIds={formData.playerIds}
        onSelectionChange={updatePlayerIds}
        onClose={() => setShowPlayerManager(false)}
      />

      {/* Court Manager Modal */}
      <CourtManager
        visible={showCourtManager}
        courts={formData.courts}
        onCourtsChange={updateCourts}
        onClose={() => setShowCourtManager(false)}
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
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  dateTimeDisplay: {
    fontSize: 16,
    color: colors.text,
  },
  helpText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  manageButtonText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 12,
  },
  emptyPlayers: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginVertical: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  playersPreview: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playersText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  courtsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  courtChipInactive: {
    backgroundColor: colors.grayLight,
  },
  courtChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.green,
  },
  courtChipTextInactive: {
    color: colors.gray,
  },
  validationSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryHeader: {
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryStats: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  warningContainer: {
    backgroundColor: colors.orangeLight,
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    color: colors.orange,
    textAlign: 'center',
  },
});

