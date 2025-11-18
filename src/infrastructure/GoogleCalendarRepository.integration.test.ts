/**
 * Integration Tests for GoogleCalendarRepository
 * Tests the orchestration of services and public interface behavior
 */

import { GoogleCalendarRepository } from './GoogleCalendarRepository.repository';
import { Calendar } from '../core';
import { CalendarDOMSelector } from './CalendarDOMSelector.service';
import { CalendarDataExtractor } from './CalendarDataExtractor.service';
import { CalendarCacheManager } from './CalendarCacheManager.service';
import { VirtualScrollHandler } from './VirtualScrollHandler.service';
import { CalendarVisibilityManager } from './CalendarVisibilityManager.service';

// Mock all the services
jest.mock('./CalendarDOMSelector.service');
jest.mock('./CalendarDataExtractor.service');
jest.mock('./CalendarCacheManager.service');
jest.mock('./VirtualScrollHandler.service');
jest.mock('./CalendarVisibilityManager.service');

// Mock logger
jest.mock('./logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockCalendarDOMSelector = CalendarDOMSelector as jest.MockedClass<typeof CalendarDOMSelector>;
const mockCalendarDataExtractor = CalendarDataExtractor as jest.MockedClass<typeof CalendarDataExtractor>;
const mockCalendarCacheManager = CalendarCacheManager as jest.MockedClass<typeof CalendarCacheManager>;
const mockVirtualScrollHandler = VirtualScrollHandler as jest.MockedClass<typeof VirtualScrollHandler>;
const mockCalendarVisibilityManager = CalendarVisibilityManager as jest.MockedClass<typeof CalendarVisibilityManager>;

describe('GoogleCalendarRepository Integration', () => {
  let repository: GoogleCalendarRepository;
  let mockDOMSelector: jest.Mocked<CalendarDOMSelector>;
  let mockDataExtractor: jest.Mocked<CalendarDataExtractor>;
  let mockCacheManager: jest.Mocked<CalendarCacheManager>;
  let mockScrollHandler: jest.Mocked<VirtualScrollHandler>;
  let mockVisibilityManager: jest.Mocked<CalendarVisibilityManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances
    mockDOMSelector = {
      waitForCalendarList: jest.fn().mockResolvedValue(document.createElement('div')),
      findCalendarContainers: jest.fn().mockReturnValue([]),
      getCalendarElements: jest.fn().mockReturnValue([]),
      getCalendarElementsInContainer: jest.fn().mockReturnValue([]),
      getScrollContainer: jest.fn().mockReturnValue(document.createElement('div'))
    } as any;
    
    mockDataExtractor = {
      extractCalendarData: jest.fn(),
      extractCalendarEmail: jest.fn(),
      extractCalendarName: jest.fn(),
      extractCalendarVisibility: jest.fn()
    } as any;
    
    mockCacheManager = {
      getCachedCalendars: jest.fn().mockReturnValue(null),
      setCachedCalendars: jest.fn(),
      getCachedElement: jest.fn(),
      isCacheValid: jest.fn().mockReturnValue(false),
      clearCache: jest.fn(),
      invalidateCache: jest.fn(),
      logPerformanceMetrics: jest.fn()
    } as any;
    
    mockScrollHandler = {
      scrollToDiscoverAllCalendars: jest.fn().mockResolvedValue(void 0),
      expandCollapsedSections: jest.fn().mockResolvedValue(void 0)
    } as any;
    
    mockVisibilityManager = {
      applyBatchVisibilityChanges: jest.fn().mockResolvedValue(void 0),
      setCalendarVisibility: jest.fn().mockResolvedValue(void 0),
      findCalendarElementByEmail: jest.fn().mockReturnValue(null)
    } as any;

    // Setup mocked class constructors to return our mock instances
    mockCalendarDOMSelector.mockImplementation(() => mockDOMSelector);
    mockCalendarDataExtractor.mockImplementation(() => mockDataExtractor);
    mockCalendarCacheManager.mockImplementation(() => mockCacheManager);
    mockVirtualScrollHandler.mockImplementation(() => mockScrollHandler);
    mockCalendarVisibilityManager.mockImplementation(() => mockVisibilityManager);

    repository = new GoogleCalendarRepository();
  });

  describe('Service Integration', () => {
    it('should properly initialize all services', () => {
      expect(mockCalendarDOMSelector).toHaveBeenCalled();
      expect(mockCalendarDataExtractor).toHaveBeenCalled();
      expect(mockCalendarCacheManager).toHaveBeenCalled();
      expect(mockVirtualScrollHandler).toHaveBeenCalled();
      expect(mockCalendarVisibilityManager).toHaveBeenCalled();
    });
  });

  describe('discoverCalendars', () => {
    it('should use cached calendars when available and not forcing refresh', async () => {
      const cachedCalendars = [
        new Calendar({ email: 'test1@example.com', name: 'Test 1', isVisible: true }),
        new Calendar({ email: 'test2@example.com', name: 'Test 2', isVisible: false })
      ];
      
      mockCacheManager.getCachedCalendars.mockReturnValue(cachedCalendars);

      const result = await repository.discoverCalendars(false);
      
      expect(result).toBe(cachedCalendars);
      expect(mockCacheManager.getCachedCalendars).toHaveBeenCalled();
      // Should not call DOM operations if cache hit
      expect(mockDOMSelector.waitForCalendarList).not.toHaveBeenCalled();
    });

    it('should perform full discovery when forcing refresh or cache miss', async () => {
      const calendarListElement = document.createElement('div');
      const containerElement = document.createElement('div');
      const calendarElement = document.createElement('div');
      
      // Mock cache miss
      mockCacheManager.getCachedCalendars.mockReturnValue(null);
      
      // Mock DOM operations
      mockDOMSelector.waitForCalendarList.mockResolvedValue(calendarListElement);
      mockDOMSelector.findCalendarContainers.mockReturnValue([containerElement]);
      mockDOMSelector.getCalendarElementsInContainer.mockReturnValue([calendarElement]);
      
      // Mock data extraction
      const calendarData = { email: 'test@example.com', name: 'Test Calendar', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.discoverCalendars(true);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Calendar);
      expect(result[0].email).toBe('test@example.com');
      
      // Verify the full discovery flow
      expect(mockDOMSelector.waitForCalendarList).toHaveBeenCalled();
      expect(mockScrollHandler.scrollToDiscoverAllCalendars).toHaveBeenCalledWith(calendarListElement);
      expect(mockScrollHandler.expandCollapsedSections).toHaveBeenCalled();
      expect(mockDOMSelector.findCalendarContainers).toHaveBeenCalled();
      expect(mockDOMSelector.getCalendarElementsInContainer).toHaveBeenCalledWith(containerElement);
      expect(mockDataExtractor.extractCalendarData).toHaveBeenCalledWith(calendarElement);
      expect(mockCacheManager.setCachedCalendars).toHaveBeenCalled();
    });

    it('should return empty array when no calendars found', async () => {
      // Force cache miss
      mockCacheManager.getCachedCalendars.mockReturnValue(null);
      // Set up successful DOM operations that find no calendars
      mockDOMSelector.waitForCalendarList.mockResolvedValue(document.createElement('div'));
      mockDOMSelector.findCalendarContainers.mockReturnValue([]);
      mockDOMSelector.getCalendarElements.mockReturnValue([]);

      const result = await repository.discoverCalendars(true);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fall back to global search when no containers found', async () => {
      const calendarElement = document.createElement('div');
      
      mockCacheManager.getCachedCalendars.mockReturnValue(null);
      mockDOMSelector.waitForCalendarList.mockResolvedValue(document.createElement('div'));
      mockDOMSelector.findCalendarContainers.mockReturnValue([]);
      mockDOMSelector.getCalendarElements.mockReturnValue([calendarElement]);
      
      const calendarData = { email: 'fallback@example.com', name: 'Fallback Calendar', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.discoverCalendars(true);
      
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('fallback@example.com');
      expect(mockDOMSelector.getCalendarElements).toHaveBeenCalled();
    });
  });

  describe('applyCalendarVisibility', () => {
    it('should ensure discovery and delegate to visibility manager', async () => {
      const calendars = [
        new Calendar({ email: 'test1@example.com', name: 'Test 1', isVisible: true }),
        new Calendar({ email: 'test2@example.com', name: 'Test 2', isVisible: false })
      ];
      
      mockCacheManager.getCachedCalendars.mockReturnValue(calendars);

      await repository.applyCalendarVisibility(calendars);
      
      expect(mockVisibilityManager.applyBatchVisibilityChanges).toHaveBeenCalledWith(calendars);
    });

    it('should complete visibility application when everything succeeds', async () => {
      const calendars = [new Calendar({ email: 'test@example.com', name: 'Test', isVisible: true })];
      
      // Set up successful discovery (using cache)
      mockCacheManager.getCachedCalendars.mockReturnValue(calendars);
      // Set up successful visibility operations
      mockVisibilityManager.applyBatchVisibilityChanges.mockResolvedValue();

      // Should not throw
      await repository.applyCalendarVisibility(calendars);
      
      // Should have called the visibility manager
      expect(mockVisibilityManager.applyBatchVisibilityChanges).toHaveBeenCalledWith(calendars);
    });
  });

  describe('Public Interface Methods', () => {
    it('should delegate getCurrentCalendarStates to discoverCalendars with cache', async () => {
      const cachedCalendars = [new Calendar({ email: 'test@example.com', name: 'Test', isVisible: true })];
      mockCacheManager.getCachedCalendars.mockReturnValue(cachedCalendars);

      const result = await repository.getCurrentCalendarStates();
      
      expect(result).toBe(cachedCalendars);
      expect(mockCacheManager.getCachedCalendars).toHaveBeenCalled();
    });

    it('should delegate getCurrentCalendarStatesFresh to discoverCalendars with force refresh', async () => {
      const calendarElement = document.createElement('div');
      mockCacheManager.getCachedCalendars.mockReturnValue(null);
      mockDOMSelector.waitForCalendarList.mockResolvedValue(document.createElement('div'));
      mockDOMSelector.findCalendarContainers.mockReturnValue([document.createElement('div')]);
      mockDOMSelector.getCalendarElementsInContainer.mockReturnValue([calendarElement]);
      
      const calendarData = { email: 'fresh@example.com', name: 'Fresh Calendar', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.getCurrentCalendarStatesFresh();
      
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('fresh@example.com');
      // Should bypass cache
      expect(mockDOMSelector.waitForCalendarList).toHaveBeenCalled();
    });

    it('should delegate clearCache to cache manager', () => {
      repository.clearCache();
      
      expect(mockCacheManager.clearCache).toHaveBeenCalled();
    });

    it('should delegate logPerformanceMetrics to cache manager', () => {
      repository.logPerformanceMetrics();
      
      expect(mockCacheManager.logPerformanceMetrics).toHaveBeenCalled();
    });

    it('should delegate findCalendarElementByEmail to visibility manager', async () => {
      const element = document.createElement('div');
      mockVisibilityManager.findCalendarElementByEmail.mockResolvedValue(element);

      const result = await repository.findCalendarElementByEmail('test@example.com');
      
      expect(result).toBe(element);
      expect(mockVisibilityManager.findCalendarElementByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should delegate setCalendarVisibility to visibility manager', async () => {
      await repository.setCalendarVisibility('test@example.com', true);
      
      expect(mockVisibilityManager.setCalendarVisibility).toHaveBeenCalledWith('test@example.com', true);
    });
  });
});
