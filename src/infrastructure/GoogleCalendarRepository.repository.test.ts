/**
 * GoogleCalendarRepository Public API Tests
 * 
 * This file tests the public interface contract of the GoogleCalendarRepository.
 * The detailed functionality is tested in specialized service test files:
 * - CalendarDataExtractor.service.test.ts (18 tests)  
 * - GoogleCalendarRepository.integration.test.ts (13 tests)
 * 
 * This test ensures the public API remains stable after decomposition.
 */

import { GoogleCalendarRepository } from './GoogleCalendarRepository.repository';

describe('GoogleCalendarRepository Public API', () => {
  let repository: GoogleCalendarRepository;
  
  beforeEach(() => {
    repository = new GoogleCalendarRepository();
  });

  describe('Service Contract', () => {
    it('should initialize without errors', () => {
      expect(repository).toBeDefined();
      expect(repository).toBeInstanceOf(GoogleCalendarRepository);
    });

    it('should expose all required public methods', () => {
      // Core interface methods
      expect(typeof repository.discoverCalendars).toBe('function');
      expect(typeof repository.applyCalendarVisibility).toBe('function');
      expect(typeof repository.getCurrentCalendarStates).toBe('function');
      expect(typeof repository.getCurrentCalendarStatesFresh).toBe('function');
      expect(typeof repository.setCalendarVisibility).toBe('function');
      
      // Utility methods
      expect(typeof repository.clearCache).toBe('function');
      expect(typeof repository.logPerformanceMetrics).toBe('function');
      expect(typeof repository.findCalendarElementByEmail).toBe('function');
    });

    it('should provide synchronous cache management', () => {
      // These methods should be synchronous and not throw
      expect(() => repository.clearCache()).not.toThrow();
      expect(() => repository.logPerformanceMetrics()).not.toThrow();
    });
  });

  describe('Method Signatures', () => {
    it('should have correct discoverCalendars signature', () => {
      expect(repository.discoverCalendars.length).toBe(0); // has default parameter, so length is 0
    });

    it('should have correct getCurrentCalendarStates signature', () => {
      expect(repository.getCurrentCalendarStates.length).toBe(0); // no parameters
    });

    it('should have correct setCalendarVisibility signature', () => {
      expect(repository.setCalendarVisibility.length).toBe(2); // email, visible parameters
    });
  });
});
