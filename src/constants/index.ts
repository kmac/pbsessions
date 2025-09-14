import { colors } from '../theme';

export const APP_CONFIG = {
  NAME: 'pbsessions',
  VERSION: '1.0.0',
  MIN_PLAYERS_PER_GAME: 4,
  MIN_PLAYERS_PER_SESSION: 4,
  MAX_PLAYERS_PER_SESSION: 128,
  MIN_COURTS: 1,
  MAX_COURTS: 32,
  DEFAULT_GAME_SCORE: 11,
  MIN_RATING: 0.0,
  MAX_RATING: 7.0,
  RATING_DECIMAL_PLACES: 2,
};

export const GAME_STATES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  // { label: 'Other', value: 'other' },
] as const;

export const DEFAULT_COURTS = [
  { number: 1, minimumRating: undefined, isActive: true },
  { number: 2, minimumRating: undefined, isActive: true },
  { number: 3, minimumRating: undefined, isActive: true },
];
