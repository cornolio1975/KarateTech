/**
 * Configuration for Bracket System
 * Customize tournament settings and rules
 */

export const BRACKET_CONFIG = {
  // Tournament Information
  tournament: {
    name: 'Goju-Ryu Karate Championship 2026',
    location: 'Singapore',
    date: '2026-07-15',
    organization: 'Kelab Senshi',
  },

  // Bracket Settings
  brackets: {
    // Include/exclude weight categories
    enabledCategories: [
      'U-50kg',
      'U-55kg',
      'U-60kg',
      'U-65kg',
      'U-70kg',
      'U-75kg',
      'U-80kg',
      'U-85kg',
      '+85kg',
    ],

    // Minimum athletes required for a bracket
    minAthletes: 2,

    // Maximum athletes per bracket (optional)
    maxAthletes: null,

    // Enable mixed gender brackets
    mixedGender: false,
  },

  // Medical Requirements
  medical: {
    // Only include cleared athletes
    requireClearance: true,

    // Allowed clearance statuses
    allowedStatuses: ['Cleared'],
  },

  // Tournament Format
  format: {
    // Single-elimination, double-elimination, round-robin
    type: 'single-elimination',

    // Number of matches per round
    matchesPerRound: null, // null = unlimited

    // Rest time between rounds (minutes)
    restTime: 15,

    // Match duration (minutes)
    matchDuration: 3,
  },

  // Seeding Configuration
  seeding: {
    // Use ranking/rating for seeding
    enabled: false,

    // Randomize seeding
    randomize: true,

    // Avoid same-club matchups in first round
    avoidSameClub: true,
  },

  // Display Settings
  display: {
    // Show athlete details
    showAthleteDetails: true,

    // Show club information
    showClub: true,

    // Show medical clearance status
    showMedicalStatus: false,

    // Show match predictions/analytics
    showAnalytics: false,
  },

  // Export Settings
  export: {
    // Default export format
    format: 'csv',

    // Include timestamps
    includeTimestamps: true,

    // Include statistics
    includeStatistics: true,
  },
};

/**
 * Bracket rules and constraints
 */
export const BRACKET_RULES = {
  // Minimum bracket size requirements
  minSize: {
    individual: 2,
    pairs: 4,
  },

  // Maximum bracket size
  maxSize: null,

  // Bye (automatic advance) allowed
  allowByes: true,

  // Walkover allowed
  allowWalkover: true,

  // Draw allowed
  allowDraw: false,

  // Best-of format
  bestOf: 1,
};

/**
 * UI Theme Configuration
 */
export const UI_THEME = {
  colors: {
    male: '#3B82F6', // Blue
    female: '#EC4899', // Pink
    primary: '#0F172A', // Slate-900
    secondary: '#1E293B', // Slate-800
    success: '#22C55E', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
  },

  // Animation settings
  animations: {
    enabled: true,
    duration: 300, // ms
  },
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000, // ms
  retries: 3,
};

/**
 * Export configuration
 */
export const EXPORT_CONFIG = {
  // CSV export settings
  csv: {
    delimiter: ',',
    quote: '"',
    includeHeaders: true,
  },

  // JSON export settings
  json: {
    pretty: true,
    indent: 2,
  },

  // PDF export settings (if available)
  pdf: {
    pageSize: 'A4',
    orientation: 'portrait',
    margin: 10,
  },
};

/**
 * Get configuration by environment
 */
export function getConfig(environment: 'development' | 'production' = 'development') {
  const config = { ...BRACKET_CONFIG };

  if (environment === 'production') {
    // Production-specific settings
    config.display.showAnalytics = false;
  }

  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: typeof BRACKET_CONFIG): boolean {
  // Check required fields
  if (!config.tournament.name) {
    console.warn('Tournament name is not set');
    return false;
  }

  // Check bracket settings
  if (config.brackets.minAthletes < 2) {
    console.warn('Minimum athletes should be at least 2');
    return false;
  }

  return true;
}
