import { GoogleCalendarRepository } from './GoogleCalendarRepository.repository';
import { Calendar, CalendarState } from '../core';
import { DOMUtils } from './DOMUtils.util';

// Mock DOMUtils
jest.mock('./DOMUtils.util');
const mockDOMUtils = DOMUtils as jest.Mocked<typeof DOMUtils>;

describe('GoogleCalendarRepository', () => {
  let repository: GoogleCalendarRepository;
  
  beforeEach(() => {
    repository = new GoogleCalendarRepository();
    jest.clearAllMocks();
  });

  describe('discoverCalendars', () => {
    it('should return empty array when no calendar items found', async () => {
      mockDOMUtils.waitForElementMutation.mockResolvedValue(document.createElement('div'));
      mockDOMUtils.queryAll.mockReturnValue([]);

      const calendars = await repository.discoverCalendars();
      expect(calendars).toEqual([]);
    });

    it('should discover calendars from Google Calendar DOM', async () => {
      // Mock calendar list container
      const calendarList = document.createElement('div');
      mockDOMUtils.waitForElementMutation.mockResolvedValue(calendarList);

      // Mock calendar elements
      const calendarElement1 = document.createElement('div');
      calendarElement1.setAttribute('data-email', 'work@example.com');
      calendarElement1.setAttribute('aria-label', 'Work Calendar');
      
      const checkbox1 = document.createElement('input');
      checkbox1.type = 'checkbox';
      checkbox1.checked = true;
      calendarElement1.appendChild(checkbox1);

      const calendarElement2 = document.createElement('div');
      calendarElement2.setAttribute('data-id', 'personal@example.com');
      calendarElement2.textContent = 'Personal Calendar';
      
      const checkbox2 = document.createElement('input');
      checkbox2.type = 'checkbox';
      checkbox2.checked = false;
      calendarElement2.appendChild(checkbox2);

      // Mock scroll container and calendar elements discovery
      mockDOMUtils.query
        .mockReturnValueOnce(calendarList) // getScrollContainer call
        .mockReturnValueOnce(null) // extractCalendarName for element1 - no label element
        .mockReturnValueOnce(checkbox1) // extractCalendarVisibility for element1
        .mockReturnValueOnce(null) // extractCalendarName for element2 - no label element  
        .mockReturnValueOnce(checkbox2); // extractCalendarVisibility for element2
      
      mockDOMUtils.queryAll.mockReturnValue([calendarElement1, calendarElement2]);

      const calendars = await repository.discoverCalendars();
      
      expect(calendars).toHaveLength(2);
      expect(calendars[0]).toBeInstanceOf(Calendar);
      expect(calendars[0].email).toBe('work@example.com');
      expect(calendars[0].name).toBe('work@example.com'); // Falls back to email when name extraction fails
      expect(calendars[0].isVisible).toBe(true);
      
      expect(calendars[1].email).toBe('personal@example.com');
      expect(calendars[1].name).toBe('Personal Calendar'); // Extracted from textContent
      expect(calendars[1].isVisible).toBe(false);
    });

    it('should handle calendars without explicit names gracefully', async () => {
      const calendarList = document.createElement('div');
      mockDOMUtils.waitForElementMutation.mockResolvedValue(calendarList);

      const calendarElement = document.createElement('div');
      calendarElement.setAttribute('data-email', 'test@example.com');
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = false;
      calendarElement.appendChild(checkbox);

      mockDOMUtils.query.mockReturnValue(calendarList);
      mockDOMUtils.queryAll.mockReturnValue([calendarElement]);

      const calendars = await repository.discoverCalendars();
      
      expect(calendars).toHaveLength(1);
      expect(calendars[0].name).toBe('test@example.com'); // Falls back to email
      expect(calendars[0].isVisible).toBe(false);
    });

    it('should handle virtual scrolling to discover all calendars', async () => {
      const calendarList = document.createElement('div');
      const scrollContainer = document.createElement('div');
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 0, writable: true });
      
      mockDOMUtils.waitForElementMutation.mockResolvedValue(calendarList);
      mockDOMUtils.query.mockReturnValue(scrollContainer);

      // Mock multiple calendar discovery calls
      const calendarElement = document.createElement('div');
      calendarElement.setAttribute('data-email', 'test@example.com');
      
      mockDOMUtils.queryAll
        .mockReturnValueOnce([]) // First call (initial)
        .mockReturnValueOnce([calendarElement]); // After scroll

      const calendars = await repository.discoverCalendars();
      expect(calendars).toHaveLength(1);
    });

    it('should throw error if calendar list not found', async () => {
      mockDOMUtils.waitForElementMutation.mockRejectedValue(new Error('Element not found'));

      await expect(repository.discoverCalendars()).rejects.toThrow('Failed to discover calendars');
    });
  });

  describe('applyCalendarVisibility', () => {
    it('should apply visibility changes to multiple calendars', async () => {
      const calendar1: CalendarState = { email: 'test1@example.com', name: 'Test 1', isVisible: true };
      const calendar2: CalendarState = { email: 'test2@example.com', name: 'Test 2', isVisible: false };
      
      const calendars = [new Calendar(calendar1), new Calendar(calendar2)];

      // Mock calendar elements
      const element1 = document.createElement('div');
      element1.setAttribute('data-email', 'test1@example.com');
      const checkbox1 = document.createElement('input');
      checkbox1.type = 'checkbox';
      checkbox1.checked = false; // Currently hidden, should be shown
      element1.appendChild(checkbox1);

      const element2 = document.createElement('div');
      element2.setAttribute('data-email', 'test2@example.com');
      const checkbox2 = document.createElement('input');
      checkbox2.type = 'checkbox';
      checkbox2.checked = true; // Currently shown, should be hidden
      element2.appendChild(checkbox2);

      // Mock calendar discovery and element finding
      mockDOMUtils.waitForElementMutation.mockResolvedValue(document.createElement('div'));
      mockDOMUtils.query.mockReturnValue(document.createElement('div'));
      mockDOMUtils.queryAll.mockReturnValue([element1, element2]);

      jest.spyOn(repository as any, 'findCalendarElementByEmail')
        .mockResolvedValueOnce(element1)
        .mockResolvedValueOnce(element2);

      mockDOMUtils.query
        .mockReturnValueOnce(checkbox1) // First calendar checkbox
        .mockReturnValueOnce(checkbox2); // Second calendar checkbox

      await repository.applyCalendarVisibility(calendars);

      // Since the checkboxes start in opposite states and we toggle them,
      // they should end up in the desired states
      expect(checkbox1.checked).toBe(true); // Was false, should be true
      expect(checkbox2.checked).toBe(false); // Was true, should be false
    });

    it('should throw error if calendar element not found', async () => {
      const calendar = new Calendar({ email: 'missing@example.com', name: 'Missing', isVisible: true });
      
      jest.spyOn(repository as any, 'findCalendarElementByEmail').mockResolvedValue(null);

      await expect(repository.applyCalendarVisibility([calendar]))
        .rejects.toThrow('Calendar element not found for email: missing@example.com');
    });
  });

  describe('getCurrentCalendarStates', () => {
    it('should return current calendar states', async () => {
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test', isVisible: true })
      ];

      jest.spyOn(repository, 'discoverCalendars').mockResolvedValue(mockCalendars);

      const result = await repository.getCurrentCalendarStates();
      expect(result).toEqual(mockCalendars);
    });
  });

  describe('private methods', () => {
    describe('extractCalendarEmail', () => {
      it('should extract email from data-email attribute', () => {
        const element = document.createElement('div');
        element.setAttribute('data-email', 'data@example.com');
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('data@example.com');
      });

      it('should extract email from data-id attribute', () => {
        const element = document.createElement('div');
        element.setAttribute('data-id', 'user@example.com');
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('user@example.com');
      });

      it('should extract email from aria-label', () => {
        const element = document.createElement('div');
        const labelElement = document.createElement('span');
        labelElement.setAttribute('aria-label', 'Calendar for user@example.com');
        element.appendChild(labelElement);
        
        mockDOMUtils.query.mockReturnValue(labelElement);
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('user@example.com');
      });

      it('should return null if no email found', () => {
        const element = document.createElement('div');
        mockDOMUtils.query.mockReturnValue(null);
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBeNull();
      });
    });

    describe('extractCalendarName', () => {
      it('should extract name from aria-label', () => {
        const element = document.createElement('div');
        const labelElement = document.createElement('span');
        labelElement.setAttribute('aria-label', 'Work Calendar (work@example.com)');
        element.appendChild(labelElement);
        
        mockDOMUtils.query.mockReturnValue(labelElement);
        
        const name = (repository as any).extractCalendarName(element);
        expect(name).toBe('Work Calendar');
      });

      it('should extract name from text content', () => {
        const element = document.createElement('div');
        element.textContent = 'Personal Calendar user@example.com';
        
        mockDOMUtils.query.mockReturnValue(null);
        
        const name = (repository as any).extractCalendarName(element);
        expect(name).toBe('Personal Calendar');
      });

      it('should return null if no name found', () => {
        const element = document.createElement('div');
        mockDOMUtils.query.mockReturnValue(null);
        
        const name = (repository as any).extractCalendarName(element);
        expect(name).toBeNull();
      });
    });

    describe('extractCalendarVisibility', () => {
      it('should return true for checked checkbox', () => {
        const element = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        
        mockDOMUtils.query.mockReturnValue(checkbox);
        
        const isVisible = (repository as any).extractCalendarVisibility(element);
        expect(isVisible).toBe(true);
      });

      it('should return false for unchecked checkbox', () => {
        const element = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = false;
        
        mockDOMUtils.query.mockReturnValue(checkbox);
        
        const isVisible = (repository as any).extractCalendarVisibility(element);
        expect(isVisible).toBe(false);
      });

      it('should return false if no checkbox found', () => {
        const element = document.createElement('div');
        mockDOMUtils.query.mockReturnValue(null);
        
        const isVisible = (repository as any).extractCalendarVisibility(element);
        expect(isVisible).toBe(false);
      });
    });

    describe('setCalendarVisibility', () => {
      it('should toggle checkbox when visibility differs', async () => {
        const element = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = false;
        element.appendChild(checkbox);

        jest.spyOn(repository as any, 'findCalendarElementByEmail').mockResolvedValue(element);
        mockDOMUtils.query.mockReturnValue(checkbox);

        await (repository as any).setCalendarVisibility('test@example.com', true);

        expect(checkbox.checked).toBe(true);
      });

      it('should not toggle checkbox when visibility matches', async () => {
        const element = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        element.appendChild(checkbox);

        jest.spyOn(repository as any, 'findCalendarElementByEmail').mockResolvedValue(element);
        mockDOMUtils.query.mockReturnValue(checkbox);

        const originalChecked = checkbox.checked;
        await (repository as any).setCalendarVisibility('test@example.com', true);

        expect(checkbox.checked).toBe(originalChecked);
      });

      it('should throw error if calendar element not found', async () => {
        jest.spyOn(repository as any, 'findCalendarElementByEmail').mockResolvedValue(null);

        await expect((repository as any).setCalendarVisibility('missing@example.com', true))
          .rejects.toThrow('Calendar element not found for email: missing@example.com');
      });

      it('should throw error if checkbox not found', async () => {
        const element = document.createElement('div');
        jest.spyOn(repository as any, 'findCalendarElementByEmail').mockResolvedValue(element);
        mockDOMUtils.query.mockReturnValue(null);

        await expect((repository as any).setCalendarVisibility('test@example.com', true))
          .rejects.toThrow('Calendar checkbox not found for email: test@example.com');
      });
    });

    describe('findCalendarElementByEmail', () => {
      it('should find calendar element by email', async () => {
        const element = document.createElement('div');
        element.setAttribute('data-email', 'target@example.com');
        
        jest.spyOn(repository, 'discoverCalendars').mockResolvedValue([]);
        mockDOMUtils.queryAll.mockReturnValue([element]);
        jest.spyOn(repository as any, 'extractCalendarEmail').mockReturnValue('target@example.com');

        const result = await (repository as any).findCalendarElementByEmail('target@example.com');
        expect(result).toBeTruthy();
        expect(result?.getAttribute('data-email')).toBe('target@example.com');
      });

      it('should return null if element not found', async () => {
        jest.spyOn(repository, 'discoverCalendars').mockResolvedValue([]);
        mockDOMUtils.queryAll.mockReturnValue([]);

        const result = await (repository as any).findCalendarElementByEmail('missing@example.com');
        expect(result).toBeNull();
      });
    });
  });

  describe('error handling', () => {
    it('should handle DOM query failures gracefully', async () => {
      mockDOMUtils.waitForElementMutation.mockRejectedValue(new Error('DOM error'));

      await expect(repository.discoverCalendars()).rejects.toThrow('Failed to discover calendars');
    });

    it('should handle malformed DOM elements', async () => {
      const calendarList = document.createElement('div');
      mockDOMUtils.waitForElementMutation.mockResolvedValue(calendarList);
      mockDOMUtils.query.mockReturnValue(calendarList);

      const malformedElement = document.createElement('div');
      // Element without required attributes
      mockDOMUtils.queryAll.mockReturnValue([malformedElement]);

      const calendars = await repository.discoverCalendars();
      expect(calendars).toEqual([]);
    });
  });
});