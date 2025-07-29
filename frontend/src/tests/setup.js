// Test setup for React components
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('../config/environment.js', () => ({
  default: {
    API_BASE_URL: 'http://localhost:8000',
    API_TIMEOUT: 30000,
    APP_NAME: 'SkillMap AI',
    APP_VERSION: '1.0.0',
    ENABLE_DEBUG_MODE: true,
    ENABLE_ANALYTICS: false,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_FILE_TYPES: ['.pdf'],
    TOAST_DURATION: 3000,
    ANIMATION_DURATION: 200,
    IS_DEVELOPMENT: true,
    IS_PRODUCTION: false,
  },
  validateEnvironment: vi.fn(() => true),
  getEnvironmentInfo: vi.fn(() => ({
    environment: 'development',
    apiUrl: 'http://localhost:8000',
    version: '1.0.0',
    debugMode: true,
  })),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock API calls
vi.mock('../api.js', () => ({
  API: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  signup: vi.fn(),
  login: vi.fn(),
  uploadResume: vi.fn(),
  getProgress: vi.fn(),
  saveProgress: vi.fn(),
  getAllProgress: vi.fn(),
  deleteProgress: vi.fn(),
  renameProgress: vi.fn(),
  toggleStep: vi.fn(),
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock File and FileReader for file upload tests
global.File = class MockFile {
  constructor(fileBits, fileName, options = {}) {
    this.name = fileName;
    this.size = fileBits.length;
    this.type = options.type || '';
    this.lastModified = Date.now();
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.readAsDataURL = vi.fn();
    this.readAsText = vi.fn();
    this.result = null;
    this.onload = null;
    this.onerror = null;
  }
};
