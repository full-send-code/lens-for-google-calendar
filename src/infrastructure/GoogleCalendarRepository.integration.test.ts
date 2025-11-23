/**
 * Integration Tests for GoogleCalendarRepository
 * Tests the orchestration of services and public interface behavior after cache removal
 */

import { GoogleCalendarRepository } from './GoogleCalendarRepository.repository';
import { Calendar } from '../core';
import { CalendarDOMSelector } from './CalendarDOMSelector.service';
import { CalendarDataExtractor } from './CalendarDataExtractor.service';
import { VirtualScrollHandler } from './VirtualScrollHandler.service';
import { CalendarVisibilityManager } from './CalendarVisibilityManager.service';

// Mock all the services
jest.mock('./CalendarDOMSelector.service');
jest.mock('./CalendarDataExtractor.service');
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
const mockVirtualScrollHandler = VirtualScrollHandler as jest.MockedClass<typeof VirtualScrollHandler>;
const mockCalendarVisibilityManager = CalendarVisibilityManager as jest.MockedClass<typeof CalendarVisibilityManager>;

describe('GoogleCalendarRepository Integration', () => {
  let repository: GoogleCalendarRepository;
  let mockDOMSelector: jest.Mocked<CalendarDOMSelector>;
  let mockDataExtractor: jest.Mocked<CalendarDataExtractor>;
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
      getScrollContainer: jest.fn().mockReturnValue(document.createElement('div')),
      getCheckboxFromCalendarElement: jest.fn().mockReturnValue(document.createElement('input'))
    } as any;
    
    mockDataExtractor = {
      extractCalendarData: jest.fn(),
      extractCalendarEmail: jest.fn(),
      extractCalendarName: jest.fn(),
      extractCalendarVisibility: jest.fn()
    } as any;
    
    mockScrollHandler = {
      scrollToDiscoverAllCalendars: jest.fn().mockResolvedValue(void 0),
      expandCollapsedSections: jest.fn().mockResolvedValue(void 0),
      scrollAndProcessCalendars: jest.fn().mockResolvedValue(void 0),
      simpleExpandCollapse: jest.fn().mockResolvedValue(void 0),
      simpleScrollAndCount: jest.fn().mockResolvedValue(1),
      simpleScrollAndDiscover: jest.fn().mockResolvedValue([document.createElement('div')]),
      discoverCalendars: jest.fn().mockResolvedValue([document.createElement('div')])
    } as any;
    
    mockVisibilityManager = {
      applyBatchVisibilityChanges: jest.fn().mockResolvedValue(void 0),
      setCalendarVisibility: jest.fn().mockResolvedValue(void 0),
      processCalendarElement: jest.fn().mockResolvedValue(void 0),
      verifyCalendarElementsState: jest.fn().mockResolvedValue(2), // Mock verification returning success count
      setCalendarVisibilityOptimized: jest.fn().mockResolvedValue(void 0)
    } as any;

    // Setup mocked class constructors to return our mock instances
    mockCalendarDOMSelector.mockImplementation(() => mockDOMSelector);
    mockCalendarDataExtractor.mockImplementation(() => mockDataExtractor);
    mockVirtualScrollHandler.mockImplementation(() => mockScrollHandler);
    mockCalendarVisibilityManager.mockImplementation(() => mockVisibilityManager);

    repository = new GoogleCalendarRepository();
  });

  describe('Service Integration', () => {
    it('should properly initialize all services', () => {
      expect(mockCalendarDOMSelector).toHaveBeenCalled();
      expect(mockCalendarDataExtractor).toHaveBeenCalled();
      expect(mockVirtualScrollHandler).toHaveBeenCalled();
      expect(mockCalendarVisibilityManager).toHaveBeenCalled();
    });
  });

  describe('discoverCalendars', () => {
    it('should perform full discovery without using cache', async () => {
      const calendarElement = document.createElement('div');
      
      // Mock simplified discovery
      mockScrollHandler.simpleScrollAndDiscover.mockResolvedValue([calendarElement]);
      
      // Mock data extraction
      const calendarData = { email: 'test@example.com', name: 'Test Calendar', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.discoverCalendars(false);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Calendar);
      expect(result[0].email).toBe('test@example.com');
      
      // Verify the simplified discovery flow
      expect(mockScrollHandler.discoverCalendars).toHaveBeenCalled();
      expect(mockDataExtractor.extractCalendarData).toHaveBeenCalledWith(calendarElement);
    });

    it('should return empty array when no calendars found', async () => {
      // Set up successful DOM operations that find no calendars
      mockDOMSelector.waitForCalendarList.mockResolvedValue(document.createElement('div'));
      mockDOMSelector.findCalendarContainers.mockReturnValue([]);
      mockDOMSelector.getCalendarElements.mockReturnValue([]);

      const result = await repository.discoverCalendars(true);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fall back to global search when no calendars discovered', async () => {
      const calendarElement = document.createElement('div');
      
      // Mock discoverCalendars to return empty (no calendars found)
      mockScrollHandler.discoverCalendars.mockResolvedValue([]);
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
    it('should use optimized scrolling approach for all visibility changes', async () => {
      const calendars = [
        new Calendar({ email: 'test1@example.com', name: 'Test 1', isVisible: true }),
        new Calendar({ email: 'test2@example.com', name: 'Test 2', isVisible: false })
      ];
      
      // Mock the scrollAndProcessCalendars method
      const mockProcessor = jest.fn().mockResolvedValue(void 0);
      mockScrollHandler.scrollAndProcessCalendars.mockImplementation(async (processor) => {
        // Simulate finding calendar elements and calling the processor
        const calendarElement1 = document.createElement('div');
        const calendarElement2 = document.createElement('div');
        await processor([calendarElement1, calendarElement2]);
      });

      await repository.applyCalendarVisibility(calendars);
      
      // Should call scrollAndProcessCalendars with a processor function
      expect(mockScrollHandler.scrollAndProcessCalendars).toHaveBeenCalled();
      
      // The processor should have been called with calendar elements
      // and processCalendarElement should have been called for each element
      expect(mockVisibilityManager.processCalendarElement).toHaveBeenCalledTimes(2);
      expect(mockVisibilityManager.processCalendarElement).toHaveBeenCalledWith(
        expect.any(Element),
        new Set(['test1@example.com'])
      );
    });

    it('should complete visibility application when everything succeeds', async () => {
      const calendars = [new Calendar({ email: 'test@example.com', name: 'Test', isVisible: true })];
      
      // Mock the scrollAndProcessCalendars method
      mockScrollHandler.scrollAndProcessCalendars.mockImplementation(async (processor) => {
        const calendarElement = document.createElement('div');
        await processor([calendarElement]);
      });

      // Should not throw
      await repository.applyCalendarVisibility(calendars);
      
      // Should have used the scrolling approach
      expect(mockScrollHandler.scrollAndProcessCalendars).toHaveBeenCalled();
      expect(mockVisibilityManager.processCalendarElement).toHaveBeenCalledWith(
        expect.any(Element),
        new Set(['test@example.com'])
      );
    });
  });

  describe('Public Interface Methods', () => {
    it('should delegate getCurrentCalendarStates to discoverCalendars', async () => {
      const calendarElement = document.createElement('div');
      mockScrollHandler.discoverCalendars.mockResolvedValue([calendarElement]);
      
      const calendarData = { email: 'test@example.com', name: 'Test', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.getCurrentCalendarStates();
      
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
    });

    it('should delegate getCurrentCalendarStatesFresh to discoverCalendars with force refresh', async () => {
      const calendarElement = document.createElement('div');
      mockScrollHandler.discoverCalendars.mockResolvedValue([calendarElement]);
      
      const calendarData = { email: 'fresh@example.com', name: 'Fresh Calendar', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.getCurrentCalendarStatesFresh();
      
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('fresh@example.com');
    });

    it('should delegate setCalendarVisibility to visibility manager', async () => {
      await repository.setCalendarVisibility('test@example.com', true);
      
      expect(mockVisibilityManager.setCalendarVisibility).toHaveBeenCalledWith('test@example.com', true);
    });
  });
});
