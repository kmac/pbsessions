import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Surface, Text, useTheme, IconButton } from "react-native-paper";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { initializeTimerSound, playTimerCompleteSound, stopTimerSound, cleanupTimerSound } from "@/src/utils/soundUtil";

interface TimerProps {
  visible: boolean;
  minutes: number;
  seconds: number;
  onComplete: (totalTimeElapsed: number) => void;
}

export const Timer: React.FC<TimerProps> = ({
  visible,
  minutes,
  seconds,
  onComplete,
}) => {
  const theme = useTheme();
  const initialDuration = minutes * 60 + seconds;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState(minutes);
  const [timerKey, setTimerKey] = useState(0);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);

  // Initialize sound when component mounts
  useEffect(() => {
    initializeTimerSound();
    return () => {
      stopTimerSound();
      cleanupTimerSound();
    };
  }, []);

  if (!visible) {
    return null;
  }

  const handleIncrement = () => {
    if (!isPlaying) {
      setCurrentMinutes((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (!isPlaying && currentMinutes > 0) {
      setCurrentMinutes((prev) => Math.max(0, prev - 1));
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMinutes(minutes);
    setTimerKey((prev) => prev + 1);
    stopTimerSound();
    setIsAlarmPlaying(false);
  };

  const handleStopAlarm = () => {
    stopTimerSound();
    setIsAlarmPlaying(false);
  };

  const handleTimerPress = () => {
    setIsPlaying((prev) => !prev);
  };

  const currentDuration = currentMinutes * 60 + seconds;

  return (
    <Surface
      style={{
        padding: 20,
        borderRadius: 8,
        backgroundColor: theme.colors.elevation.level2,
        alignItems: "center",
      }}
    >
      {!isPlaying && (
        <View style={styles.controls}>
          <IconButton
            icon="minus"
            size={32}
            onPress={handleDecrement}
            disabled={currentMinutes <= 0}
          />
          <Text variant="headlineMedium" style={styles.minutesText}>
            {currentMinutes} min
          </Text>
          <IconButton
            icon="plus"
            size={32}
            onPress={handleIncrement}
          />
        </View>
      )}

      <TouchableOpacity onPress={handleTimerPress} activeOpacity={0.7}>
        <CountdownCircleTimer
          key={timerKey}
          isPlaying={isPlaying}
          duration={currentDuration}
          colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
          colorsTime={[currentDuration * 0.7, currentDuration * 0.5, currentDuration * 0.2, 0]}
          onComplete={() => {
            playTimerCompleteSound(true); // true = loop
            setIsAlarmPlaying(true);
            onComplete(currentDuration);
            setIsPlaying(false);
          }}
          size={200}
          strokeWidth={12}
        >
          {({ remainingTime }) => {
            const mins = Math.floor(remainingTime / 60);
            const secs = remainingTime % 60;
            return (
              <View style={styles.timerContent}>
                <Text variant="displayLarge" style={styles.timeText}>
                  {mins}:{secs.toString().padStart(2, "0")}
                </Text>
                <Text variant="bodyMedium" style={styles.statusText}>
                  {isPlaying ? "Tap to Pause" : "Tap to Start"}
                </Text>
              </View>
            );
          }}
        </CountdownCircleTimer>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", gap: 8 }}>
      <IconButton
        icon="refresh"
        size={28}
        onPress={handleReset}
        style={styles.resetButton}
        mode="contained-tonal"
      />
      {isAlarmPlaying && (
        <IconButton
          icon="bell-off"
          size={28}
          onPress={handleStopAlarm}
          style={styles.stopAlarmButton}
          mode="contained"
          iconColor={theme.colors.onError}
          containerColor={theme.colors.error}
        />
      )}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  minutesText: {
    minWidth: 100,
    textAlign: "center",
    fontWeight: "bold",
  },
  timerContent: {
    alignItems: "center",
  },
  timeText: {
    fontWeight: "bold",
    fontSize: 48,
  },
  statusText: {
    opacity: 0.7,
    marginTop: 4,
  },
  resetButton: {
    marginTop: 16,
  },
  stopAlarmButton: {
    marginTop: 16,
  },
});
