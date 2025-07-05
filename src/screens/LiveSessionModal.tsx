// src/screens/LiveSessionModal.tsx (Placeholder)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play } from 'lucide-react-native';
import { colors } from '../theme';

export default function LiveSessionModal() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Play size={48} color={colors.gray} />
        <Text style={styles.title}>Live Session</Text>
        <Text style={styles.subtitle}>Live game management coming soon...</Text>
      </View>
    </SafeAreaView>
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
});


