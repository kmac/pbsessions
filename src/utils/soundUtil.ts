import { Audio } from "expo-av";

let timerCompleteSound: Audio.Sound | null = null;

export const initializeTimerSound = async () => {
  try {
    // Set audio mode for playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Using a free notification sound URL
    // You can replace this with a local sound file by importing it
    const { sound } = await Audio.Sound.createAsync(
      require("@/assets/sounds/alarm.mp3"),
    );
    // const { sound } = await Audio.Sound.createAsync(
    //   // Using a simple notification sound
    //   // Alternative: require("@/assets/sounds/timer-complete.mp3") if you add a local file
    //   {
    //     uri: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
    //   },
    //   { shouldPlay: false }
    // );

    timerCompleteSound = sound;
  } catch (error) {
    console.error("Error initializing timer sound:", error);
  }
};

export const playTimerCompleteSound = async (loop: boolean = false) => {
  try {
    if (!timerCompleteSound) {
      await initializeTimerSound();
    }

    if (timerCompleteSound) {
      // Reset to beginning if already played
      await timerCompleteSound.setPositionAsync(0);
      // Set looping if requested
      await timerCompleteSound.setIsLoopingAsync(loop);
      await timerCompleteSound.playAsync();
    }
  } catch (error) {
    console.error("Error playing timer complete sound:", error);
  }
};

export const stopTimerSound = async () => {
  try {
    if (timerCompleteSound) {
      await timerCompleteSound.stopAsync();
      await timerCompleteSound.setPositionAsync(0);
    }
  } catch (error) {
    console.error("Error stopping timer sound:", error);
  }
};

export const cleanupTimerSound = async () => {
  try {
    if (timerCompleteSound) {
      await timerCompleteSound.unloadAsync();
      timerCompleteSound = null;
    }
  } catch (error) {
    console.error("Error cleaning up timer sound:", error);
  }
};
