import { AudioPlayer, createAudioPlayer } from "expo-audio";

let player: AudioPlayer | null = null;

export const playSound = (
  audioSource: any,
  loop: boolean = false,
): AudioPlayer | null => {
  try {
    player = createAudioPlayer(audioSource);
    player.loop = loop;
    player.play();
    return player;

  } catch (error) {
    console.error("Error playing sound:", error);
    return null;
  }
};

export const stopSound = (player: AudioPlayer) => {
  try {
    if (player) {
      player.pause();
      player.release();
    }
  } catch (error) {
    console.error("Error stopping sound:", error);
  }
};
