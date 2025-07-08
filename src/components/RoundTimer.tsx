// src/components/RoundTimer.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Timer, Clock } from 'lucide-react-native';
import { colors } from '../theme';

interface RoundTimerProps {
  startTime: Date;
}

export default function RoundTimer({ startTime }: RoundTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - startTime.getTime();
      setElapsed(Math.floor(elapsedMs / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerCard}>
        <View style={styles.timerHeader}>
          <Timer size={20} color={colors.orange} />
          <Text style={styles.timerLabel}>Round Timer</Text>
        </View>
        <Text style={styles.timerDisplay}>{formatTime(elapsed)}</Text>
        <View style={styles.timerSubtext}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.startTimeText}>
            Started at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timerDisplay: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.orange,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  timerSubtext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
