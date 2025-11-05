// Jest setup file for test environment configuration
import '@testing-library/jest-dom';

// Mock Chrome extension APIs
(global as any).chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
};

// Mock jQuery globally (for legacy code if needed)
(global as any).jQuery = jest.fn();
(global as any).$ = (global as any).jQuery;
