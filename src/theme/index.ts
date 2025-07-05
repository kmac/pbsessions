// src/theme/index.ts
export const colors = {
  // Primary colors
  primary: '#2563eb',        // Blue-600
  primaryLight: '#3b82f6',   // Blue-500
  primaryDark: '#1d4ed8',    // Blue-700

  // Secondary colors
  secondary: '#059669',      // Emerald-600
  secondaryLight: '#10b981', // Emerald-500
  secondaryDark: '#047857',  // Emerald-700

  // Accent colors
  blue: '#2563eb',
  blueLight: '#dbeafe',
  red: '#dc2626',
  redLight: '#fee2e2',
  orange: '#ea580c',
  orangeLight: '#fed7aa',
  green: '#059669',
  greenLight: '#dcfce7',

  // Neutral colors
  text: '#111827',           // Gray-900
  textSecondary: '#4b5563',  // Gray-600
  gray: '#9ca3af',          // Gray-400
  grayLight: '#f3f4f6',     // Gray-100
  border: '#e5e7eb',        // Gray-200
  background: '#f9fafb',    // Gray-50

  // Status colors
  success: '#059669',
  warning: '#ea580c',
  error: '#dc2626',
  info: '#2563eb',

  // Court colors (for visual differentiation)
  court1: '#3b82f6',        // Blue
  court2: '#059669',        // Green
  court3: '#dc2626',        // Red
  court4: '#ea580c',        // Orange
  court5: '#7c3aed',        // Purple
  court6: '#db2777',        // Pink
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// src/constants/index.ts
export const APP_CONFIG = {
  VERSION: '1.0.0',
  MIN_PLAYERS_PER_SESSION: 4,
  MAX_PLAYERS_PER_SESSION: 24,
  MIN_COURTS: 1,
  MAX_COURTS: 6,
  DEFAULT_GAME_SCORE: 11,
  MIN_RATING: 0.0,
  MAX_RATING: 10.0,
  RATING_DECIMAL_PLACES: 1,
};

export const GAME_STATES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
] as const;

export const COURT_COLORS = [
  colors.court1,
  colors.court2,
  colors.court3,
  colors.court4,
  colors.court5,
  colors.court6,
];

export const DEFAULT_COURTS = [
  { number: 1, minimumRating: undefined, isActive: true },
  { number: 2, minimumRating: undefined, isActive: true },
  { number: 3, minimumRating: undefined, isActive: true },
];

// src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
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

// Package.json dependencies to add:
/*
{
  "dependencies": {
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/bottom-tabs": "^6.5.8",
    "@react-navigation/native-stack": "^6.9.13",
    "@react-native-picker/picker": "^2.4.10",
    "@react-native-async-storage/async-storage": "^1.19.0",
    "@reduxjs/toolkit": "^1.9.5",
    "react-redux": "^8.1.1",
    "lucide-react-native": "^0.268.0",
    "react-native-safe-area-context": "^4.6.3",
    "react-native-screens": "^3.22.0"
  }
}
*/

