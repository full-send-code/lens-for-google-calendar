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
      scrollAndProcessCalendars: jest.fn().mockResolvedValue(void 0)
    } as any;
    
    mockVisibilityManager = {
      applyBatchVisibilityChanges: jest.fn().mockResolvedValue(void 0),
      setCalendarVisibility: jest.fn().mockResolvedValue(void 0),
      findCalendarElementByEmail: jest.fn().mockReturnValue(null),
      processCalendarElement: jest.fn().mockResolvedValue(void 0)
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
      const calendarListElement = document.createElement('div');
      const containerElement = document.createElement('div');
      const calendarElement = document.createElement('div');
      
      // Mock DOM operations
      mockDOMSelector.waitForCalendarList.mockResolvedValue(calendarListElement);
      mockDOMSelector.findCalendarContainers.mockReturnValue([containerElement]);
      mockDOMSelector.getCalendarElementsInContainer.mockReturnValue([calendarElement]);
      
      // Mock data extraction
      const calendarData = { email: 'test@example.com', name: 'Test Calendar', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.discoverCalendars(false);
      
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

    it('should fall back to global search when no containers found', async () => {
      const calendarElement = document.createElement('div');
      
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
    it('should use scroll-and-process approach with container searching', async () => {
      const calendars = [
        new Calendar({ email: 'test1@example.com', name: 'Test 1', isVisible: true }),
        new Calendar({ email: 'test2@example.com', name: 'Test 2', isVisible: false })
      ];
      
      const myCalendarsContainer = document.createElement('div');
      myCalendarsContainer.setAttribute('aria-label', 'My calendars');
      
      const otherCalendarsContainer = document.createElement('div');
      otherCalendarsContainer.setAttribute('aria-label', 'Other calendars');
      
      mockDOMSelector.findCalendarContainers.mockReturnValue([
        myCalendarsContainer,
        otherCalendarsContainer
      ]);

      await repository.applyCalendarVisibility(calendars);
      
      // Should find containers
      expect(mockDOMSelector.findCalendarContainers).toHaveBeenCalled();
      
      // Should call scrollAndProcessCalendars for each container
      expect(mockScrollHandler.scrollAndProcessCalendars).toHaveBeenCalledTimes(2);
    });

    it('should complete visibility application when everything succeeds', async () => {
      const calendars = [new Calendar({ email: 'test@example.com', name: 'Test', isVisible: true })];
      
      const myCalendarsContainer = document.createElement('div');
      myCalendarsContainer.setAttribute('aria-label', 'My calendars');
      
      mockDOMSelector.findCalendarContainers.mockReturnValue([myCalendarsContainer]);

      // Should not throw
      await repository.applyCalendarVisibility(calendars);
      
      // Should have processed containers
      expect(mockScrollHandler.scrollAndProcessCalendars).toHaveBeenCalled();
    });
  });

  describe('Public Interface Methods', () => {
    it('should delegate getCurrentCalendarStates to discoverCalendars', async () => {
      const calendarElement = document.createElement('div');
      mockDOMSelector.waitForCalendarList.mockResolvedValue(document.createElement('div'));
      mockDOMSelector.findCalendarContainers.mockReturnValue([document.createElement('div')]);
      mockDOMSelector.getCalendarElementsInContainer.mockReturnValue([calendarElement]);
      
      const calendarData = { email: 'test@example.com', name: 'Test', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.getCurrentCalendarStates();
      
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
    });

    it('should delegate getCurrentCalendarStatesFresh to discoverCalendars with force refresh', async () => {
      const calendarElement = document.createElement('div');
      mockDOMSelector.waitForCalendarList.mockResolvedValue(document.createElement('div'));
      mockDOMSelector.findCalendarContainers.mockReturnValue([document.createElement('div')]);
      mockDOMSelector.getCalendarElementsInContainer.mockReturnValue([calendarElement]);
      
      const calendarData = { email: 'fresh@example.com', name: 'Fresh Calendar', isVisible: true };
      mockDataExtractor.extractCalendarData.mockReturnValue(calendarData);

      const result = await repository.getCurrentCalendarStatesFresh();
      
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('fresh@example.com');
      expect(mockDOMSelector.waitForCalendarList).toHaveBeenCalled();
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
