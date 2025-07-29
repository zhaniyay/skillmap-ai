// Environment configuration for the frontend application
// This file centralizes all environment-dependent settings

const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Application Settings
  APP_NAME: import.meta.env.VITE_APP_NAME || 'SkillMap AI',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Feature Flags
  ENABLE_DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // File Upload Settings
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: (import.meta.env.VITE_ALLOWED_FILE_TYPES || '.pdf').split(','),
  
  // UI Settings
  TOAST_DURATION: parseInt(import.meta.env.VITE_TOAST_DURATION) || 3000,
  ANIMATION_DURATION: parseInt(import.meta.env.VITE_ANIMATION_DURATION) || 200,
  
  // Development Settings
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

// Validation function to check if all required environment variables are set
export const validateEnvironment = () => {
  const requiredVars = [];
  const missingVars = [];
  
  // Check for required environment variables
  requiredVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars);
    if (config.IS_PRODUCTION) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
  
  // Log configuration in development
  if (config.IS_DEVELOPMENT && config.ENABLE_DEBUG_MODE) {
    console.log('Environment Configuration:', {
      ...config,
      // Don't log sensitive information
    });
  }
  
  return true;
};

// Helper function to get environment-specific settings
export const getEnvironmentInfo = () => ({
  environment: config.IS_PRODUCTION ? 'production' : config.IS_DEVELOPMENT ? 'development' : 'unknown',
  apiUrl: config.API_BASE_URL,
  version: config.APP_VERSION,
  debugMode: config.ENABLE_DEBUG_MODE,
});

export default config;
