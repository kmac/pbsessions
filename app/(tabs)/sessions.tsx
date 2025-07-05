// app/(tabs)/sessions.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Calendar, Play } from 'lucide-react-native';
import { colors } from '../../src/theme';

export default function SessionsTab() {
  const handleStartLiveSession = () => {
    // Navigate to live session modal
    router.push('/live-session');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Calendar size={48} color={colors.gray} />
        <Text style={styles.title}>Sessions</Text>
        <Text style={styles.subtitle}>Session management coming soon...</Text>

        {/* Demo button to test live session navigation */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleStartLiveSession}
        >
          <Play size={20} color="white" />
          <Text style={styles.demoButtonText}>Demo Live Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  demoButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});


