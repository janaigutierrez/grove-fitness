/**
 * Simple logger utility for consistent logging
 * Can be easily disabled in production
 */

const isDevelopment = process.env.EXPO_PUBLIC_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  success: (message, ...args) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },

  error: (message, ...args) => {
    // Always log errors, even in production
    console.error(`❌ ${message}`, ...args);
  },

  api: {
    request: (method, url) => {
      if (isDevelopment) {
        console.log(`📤 ${method} ${url}`);
      }
    },

    response: (status, data) => {
      if (isDevelopment) {
        console.log(`📥 Response (${status}):`, data);
      }
    },

    error: (error) => {
      console.error('❌ API Error:', error);
    }
  }
};

export default logger;
