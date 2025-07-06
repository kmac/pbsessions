import { colors } from '../theme';

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

export const DEFAULT_COURTS = [
  { number: 1, minimumRating: undefined, isActive: true },
  { number: 2, minimumRating: undefined, isActive: true },
  { number: 3, minimumRating: undefined, isActive: true },
];

// export const COURT_COLORS = [
//   colors.court1,
//   colors.court2,
//   colors.court3,
//   colors.court4,
//   colors.court5,
//   colors.court6,
// ];
