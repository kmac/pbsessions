// app/(tabs)/configuration.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Settings, Download, Upload, Trash2 } from 'lucide-react-native';
import { RootState } from '@/src/store';
import { StorageManager, StoredData } from '@/src/utils/storage';
import { colors } from '@/src/theme';
import { Alert } from '@/src/utils/alert'

export default function SettingsTab() {
  const dispatch = useDispatch();
  const { players } = useSelector((state: RootState) => state.players);
  const { groups } = useSelector((state: RootState) => state.groups);

  const handleExportData = async () => {
    try {
      const storage = StorageManager.getInstance();
      const data : StoredData = await storage.exportAllData();

      // In a real app, this would trigger a download or share
      Alert.alert(
        'Export Data',
        `TODO: Ready to export:\n• ${data.players.length} players\n• ${data.groups.length} groups\n• ${data.sessions.length} sessions.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all players, groups, and sessions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const storage = StorageManager.getInstance();
              await storage.clearAllData();
              // TODO? In a real app, you'd dispatch actions to clear Redux state too
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Settings size={32} color={colors.primary} />
        <Text style={styles.title}>Configuration</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{players.length}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{groups.length}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
          <Download size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleClearData}>
          <Trash2 size={20} color={colors.red} />
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Pickleball Sessions v1.0.0{'\n'}
          Organize and manage pickleball sessions with fair player rotation and team balancing.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: colors.grayLight,
    borderRadius: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  dangerButton: {
    borderColor: colors.red,
    backgroundColor: colors.redLight,
  },
  dangerButtonText: {
    color: colors.red,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
