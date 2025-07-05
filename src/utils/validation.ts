// src/utils/validation.ts (Updated with additional validation)
import { APP_CONFIG } from '../constants';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)\+\.]/g, '');
  // Check if it's a valid phone number (basic check)
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(cleanPhone);
};

export const validateRating = (rating: string): { isValid: boolean; error?: string } => {
  if (!rating.trim()) return { isValid: true }; // Optional field

  const numRating = parseFloat(rating);
  if (isNaN(numRating)) {
    return { isValid: false, error: 'Rating must be a number' };
  }

  if (numRating < APP_CONFIG.MIN_RATING || numRating > APP_CONFIG.MAX_RATING) {
    return {
      isValid: false,
      error: `Rating must be between ${APP_CONFIG.MIN_RATING} and ${APP_CONFIG.MAX_RATING}`
    };
  }

  return { isValid: true };
};

export const validatePlayerName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }

  return { isValid: true };
};

export const validateGroupName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: 'Group name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Group name must be at least 2 characters' };
  }

  if (name.trim().length > 30) {
    return { isValid: false, error: 'Group name must be less than 30 characters' };
  }

  return { isValid: true };
};

export const validateSessionSize = (playerCount: number, courtCount: number): {
  isValid: boolean;
  error?: string;
  warning?: string;
} => {
  const minRequired = courtCount * 4;

  if (playerCount < APP_CONFIG.MIN_PLAYERS_PER_SESSION) {
    return {
      isValid: false,
      error: `Minimum ${APP_CONFIG.MIN_PLAYERS_PER_SESSION} players required`
    };
  }

  if (playerCount > APP_CONFIG.MAX_PLAYERS_PER_SESSION) {
    return {
      isValid: false,
      error: `Maximum ${APP_CONFIG.MAX_PLAYERS_PER_SESSION} players allowed`
    };
  }

  if (playerCount < minRequired) {
    return {
      isValid: false,
      error: `Need at least ${minRequired} players for ${courtCount} court(s)`
    };
  }

  const playingPlayers = courtCount * 4;
  const sittingOut = playerCount - playingPlayers;

  if (sittingOut > playingPlayers) {
    return {
      isValid: true,
      warning: `${sittingOut} players will sit out each game (more than playing)`
    };
  }

  return { isValid: true };
};

// Utility to check if player name already exists
export const isPlayerNameTaken = (
  name: string,
  existingPlayers: { name: string; id: string }[],
  excludeId?: string
): boolean => {
  return existingPlayers.some(
    player =>
      player.name.toLowerCase().trim() === name.toLowerCase().trim() &&
      player.id !== excludeId
  );
};

