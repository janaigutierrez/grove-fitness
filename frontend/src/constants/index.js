// Re-export all constants for easy import
export { default as colors } from './colors';
export { default as spacing } from './spacing';

// App-wide constants
export const APP_NAME = 'Grove Fitness';
export const APP_VERSION = '1.0.0';

// Timer constants
export const DEFAULT_REST_TIME = 60; // seconds
export const WARNING_TIME_THRESHOLD = 10; // seconds
export const DANGER_TIME_THRESHOLD = 5; // seconds

// Workout constants
export const MIN_WORKOUT_DURATION = 5; // minutes
export const MAX_WORKOUT_DURATION = 180; // minutes
export const DEFAULT_WORKOUT_DURATION = 30; // minutes

// Weight constants
export const MIN_WEIGHT = 0; // kg
export const MAX_WEIGHT = 500; // kg

// User limits
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_NAME_LENGTH = 100;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Chart constants
export const WEIGHT_HISTORY_DEFAULT_LIMIT = 30;
export const CHART_HEIGHT = 220;

// Animation durations (ms)
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// AI personalities
export const AI_PERSONALITIES = [
  { value: 'motivador', label: 'Motivador', icon: 'flame', color: '#ff6b6b' },
  { value: 'analítico', label: 'Analítico', icon: 'analytics', color: '#4A90E2' },
  { value: 'bestia', label: 'Bestia', icon: 'fitness', color: '#2D5016' },
  { value: 'relajado', label: 'Relajado', icon: 'leaf', color: '#4CAF50' },
];

// Days of week
export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes', short: 'LU' },
  { key: 'tuesday', label: 'Martes', short: 'MA' },
  { key: 'wednesday', label: 'Miércoles', short: 'MI' },
  { key: 'thursday', label: 'Jueves', short: 'JU' },
  { key: 'friday', label: 'Viernes', short: 'VI' },
  { key: 'saturday', label: 'Sábado', short: 'SA' },
  { key: 'sunday', label: 'Domingo', short: 'DO' },
];
