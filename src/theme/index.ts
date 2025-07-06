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

export const COURT_COLORS = [
  '#3b82f6',  // Blue
  '#059669',  // Green
  '#dc2626',  // Red
  '#ea580c',  // Orange
  '#7c3aed',  // Purple
  '#db2777',  // Pink
];
