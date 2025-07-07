// src/components/CourtManager.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Save,
  MapPin,
  Plus,
  Minus,
  Settings,
  Star,
  Trash2
} from 'lucide-react-native';
import { Court } from '../types';
import { colors, COURT_COLORS } from '../theme';
import { APP_CONFIG } from '../constants';
import { Alert } from '../utils/alert'

interface CourtManagerProps {
  visible: boolean;
  courts: Court[];
  onCourtsChange: (courts: Court[]) => void;
  onClose: () => void;
}

export default function CourtManager({
  visible,
  courts,
  onCourtsChange,
  onClose
}: CourtManagerProps) {
  const [localCourts, setLocalCourts] = useState<Court[]>(courts);

  const handleSave = () => {
    const activeCourts = localCourts.filter(c => c.isActive);
    if (activeCourts.length === 0) {
      Alert.alert('Validation Error', 'At least one court must be active');
      return;
    }

    onCourtsChange(localCourts);
    onClose();
  };

  const addCourt = () => {
    if (localCourts.length >= APP_CONFIG.MAX_COURTS) {
      Alert.alert('Maximum Courts', `Cannot have more than ${APP_CONFIG.MAX_COURTS} courts`);
      return;
    }

    const newCourt: Court = {
      id: `court${localCourts.length + 1}`,
      number: localCourts.length + 1,
      minimumRating: undefined,
      isActive: true,
    };
    setLocalCourts([...localCourts, newCourt]);
  };

  const removeCourt = (courtId: string) => {
    if (localCourts.length <= 1) {
      Alert.alert('Cannot Remove', 'Must have at least one court');
      return;
    }

    setLocalCourts(localCourts.filter(c => c.id !== courtId));
  };

  const updateCourt = (courtId: string, updates: Partial<Court>) => {
    setLocalCourts(localCourts.map(court =>
      court.id === courtId ? { ...court, ...updates } : court
    ));
  };

  const toggleCourt = (courtId: string) => {
    const court = localCourts.find(c => c.id === courtId);
    if (!court) return;

    const activeCourts = localCourts.filter(c => c.isActive);
    if (court.isActive && activeCourts.length === 1) {
      Alert.alert('Cannot Deactivate', 'At least one court must be active');
      return;
    }

    updateCourt(courtId, { isActive: !court.isActive });
  };

  const setMinimumRating = (courtId: string, rating: string) => {
    const numRating = rating ? parseFloat(rating) : undefined;
    if (rating && (isNaN(numRating!) || numRating! < 0 || numRating! > 10)) {
      return;
    }
    updateCourt(courtId, { minimumRating: numRating });
  };

  const activeCourts = localCourts.filter(c => c.isActive);

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
          <Text style={styles.title}>Court Configuration</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{localCourts.length}</Text>
              <Text style={styles.summaryLabel}>Total Courts</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{activeCourts.length}</Text>
              <Text style={styles.summaryLabel}>Active Courts</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{activeCourts.length * 4}</Text>
              <Text style={styles.summaryLabel}>Players per Game</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Courts</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addCourt}
                disabled={localCourts.length >= APP_CONFIG.MAX_COURTS}
              >
                <Plus size={16} color={localCourts.length >= APP_CONFIG.MAX_COURTS ? colors.gray : colors.primary} />
                <Text style={[
                  styles.addButtonText,
                  localCourts.length >= APP_CONFIG.MAX_COURTS && styles.addButtonTextDisabled
                ]}>
                  Add Court
                </Text>
              </TouchableOpacity>
            </View>

            {localCourts.map((court, index) => (
              <View key={court.id} style={[
                styles.courtCard,
                !court.isActive && styles.courtCardInactive
              ]}>
                <View style={styles.courtHeader}>
                  <View style={styles.courtTitleRow}>
                    <View style={[
                      styles.courtIndicator,
                      { backgroundColor: COURT_COLORS[index % COURT_COLORS.length] }
                    ]} />
                    <Text style={[
                      styles.courtTitle,
                      !court.isActive && styles.courtTitleInactive
                    ]}>
                      Court {court.number}
                    </Text>
                    <Switch
                      value={court.isActive}
                      onValueChange={() => toggleCourt(court.id)}
                      trackColor={{ false: colors.grayLight, true: colors.primaryLight }}
                      thumbColor={court.isActive ? colors.primary : colors.gray}
                    />
                  </View>

                  {localCourts.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeCourt(court.id)}
                    >
                      <Trash2 size={16} color={colors.red} />
                    </TouchableOpacity>
                  )}
                </View>

                {court.isActive && (
                  <View style={styles.courtSettings}>
                    <View style={styles.ratingContainer}>
                      <View style={styles.ratingHeader}>
                        <Star size={16} color={colors.orange} />
                        <Text style={styles.ratingLabel}>Minimum Rating</Text>
                      </View>
                      <TextInput
                        style={styles.ratingInput}
                        value={court.minimumRating?.toString() || ''}
                        onChangeText={(text) => setMinimumRating(court.id, text)}
                        placeholder="Optional"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <Text style={styles.ratingHelp}>
                      Only players with this rating or higher can be assigned to this court
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {activeCourts.some(c => c.minimumRating) && (
            <View style={styles.ratingInfo}>
              <View style={styles.infoHeader}>
                <Settings size={20} color={colors.orange} />
                <Text style={styles.infoTitle}>Rating Requirements</Text>
              </View>
              <Text style={styles.infoText}>
                Courts with minimum ratings will prioritize players based on skill level.
                Players without ratings will be assigned to courts without minimum requirements.
              </Text>
            </View>
          )}
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
    backgroundColor: 'white',
  },
  closeButton: {
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
  content: {
    flex: 1,
    padding: 16,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  addButtonTextDisabled: {
    color: colors.gray,
  },
  courtCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  courtCardInactive: {
    backgroundColor: colors.grayLight,
    opacity: 0.7,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courtTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  courtIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  courtTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  courtTitleInactive: {
    color: colors.gray,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  courtSettings: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  ratingInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: 'white',
    width: 80,
    textAlign: 'center',
  },
  ratingHelp: {
    fontSize: 12,
    color: colors.gray,
    fontStyle: 'italic',
  },
  ratingInfo: {
    backgroundColor: colors.orangeLight,
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.orange,
  },
  infoText: {
    fontSize: 14,
    color: colors.orange,
    lineHeight: 20,
  },
});
