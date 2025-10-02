import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/src/store";
import { addPlayer } from "../slices/playersSlice";
import { Player } from "@/src/types";

export const addPlayerThunk = createAsyncThunk<
  Player,
  Omit<Player, "id" | "createdAt" | "updatedAt">
>(
  "players/addPlayerThunk",
  async (playerData, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;

      // Check if player with same name already exists
      const existingPlayer = state.players.players.find(
        (p) => p.name.toLowerCase() === playerData.name.trim().toLowerCase(),
      );

      if (existingPlayer) {
        return rejectWithValue("A player with this name already exists");
      }

      // Validate rating if provided
      if (playerData.rating !== undefined) {
        if (
          isNaN(playerData.rating) ||
          playerData.rating < 1 ||
          playerData.rating > 5
        ) {
          return rejectWithValue("Rating must be between 1.0 and 5.0");
        }
      }

      // Validate required fields
      if (!playerData.name.trim()) {
        return rejectWithValue("Player name is required");
      }

      // Create the player using the existing addPlayer action
      const addPlayerAction = dispatch(addPlayer(playerData));
      const newPlayer = addPlayerAction.payload;

      return newPlayer;
    } catch (error: unknown) {
      let message: string = "Failed to add player";
      if (typeof error === "string") {
        message = error;
      } else if (error instanceof Error) {
        message = error.message;
      }
      console.error(`Add player action failed: ${message}`);
      return rejectWithValue(message);
    }
  },
);
