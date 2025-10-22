import React, { useState, useEffect } from "react";
import { AudioPlayer } from "expo-audio";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import {
  Surface,
  Text,
  useTheme,
  IconButton,
} from "react-native-paper";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { router } from "expo-router";
import { playSound, stopSound } from "@/src/utils/soundUtil";

interface TimerComponentProps {
  visible: boolean;
  minutes?: number;
  onComplete?: (totalTimeElapsed: number) => void;
}

export const TimerComponent: React.FC<TimerComponentProps> = ({
  visible,
  minutes,
  onComplete,
}) => {
  const theme = useTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState(minutes ? minutes : 15);
  const [timerKey, setTimerKey] = useState(0);
  const [player, setPlayer] = useState<AudioPlayer | null>(null);

  const audioSource = require("@/assets/sounds/alarm.mp3");

  // Cleanup sound when component unmounts
  useEffect(() => {
    return () => {
      if (player) {
        stopSound(player);
      }
    };
  }, [player]);

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
    setCurrentMinutes((prev) => prev);
    setTimerKey((prev) => prev + 1);
    if (player) {
      stopSound(player);
      setPlayer(null);
    }
  };

  const handleStopAlarm = () => {
    if (player) {
      stopSound(player);
      setPlayer(null);
    }
  };

  const handleTimerPress = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const currentDuration = currentMinutes * 60;

  return (
    <View>
      <Surface
        style={{
          padding: 20,
          borderRadius: 8,
          backgroundColor: theme.colors.elevation.level2,
          alignItems: "center",
        }}
      >
        {!isPlaying && !player && (
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
            <IconButton icon="plus" size={32} onPress={handleIncrement} />
          </View>
        )}

        <TouchableOpacity onPress={handleTimerPress} activeOpacity={0.7}>
          <CountdownCircleTimer
            key={timerKey}
            isPlaying={isPlaying}
            duration={currentDuration}
            // duration={10}
            colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
            colorsTime={[
              currentDuration * 0.7,
              currentDuration * 0.5,
              currentDuration * 0.2,
              0,
            ]}
            onComplete={() => {
              setPlayer(playSound(audioSource, true)); // true = loop
              onComplete && onComplete(currentDuration);
              setIsPlaying(false);

              // Navigate to timer tab when alarm goes off
              router.navigate("/timer");
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
          {player && (
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
    </View>
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
