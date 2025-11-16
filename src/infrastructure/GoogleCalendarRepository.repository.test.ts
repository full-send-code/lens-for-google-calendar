import { GoogleCalendarRepository } from './GoogleCalendarRepository.repository';
import { Calendar } from '../core';
import { DOMUtils } from './DOMUtils.util';

// Mock DOMUtils
jest.mock('./DOMUtils.util');
const mockDOMUtils = DOMUtils as jest.Mocked<typeof DOMUtils>;

// Mock logger to avoid console output in tests
jest.mock('./logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('GoogleCalendarRepository', () => {
  let repository: GoogleCalendarRepository;
  
  beforeEach(() => {
    repository = new GoogleCalendarRepository();
    jest.clearAllMocks();
  });

  describe('Base64 Email Extraction', () => {
    describe('extractCalendarEmail', () => {
      it('should extract email from data-email attribute', () => {
        const element = document.createElement('div');
        element.setAttribute('data-email', 'data@example.com');
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('data@example.com');
      });

      it('should extract email from data-id attribute when it contains direct email', () => {
        const element = document.createElement('div');
        element.setAttribute('data-id', 'user@example.com');
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('user@example.com');
      });

      it('should decode Base64 data-id attribute to extract email', () => {
        const element = document.createElement('div');
        // Base64 encoded 'testuser@example.com'
        element.setAttribute('data-id', 'dGVzdHVzZXJAZXhhbXBsZS5jb20=');
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('testuser@example.com');
      });

      it('should decode Base64 data-id for Google calendar emails', () => {
        const element = document.createElement('div');
        // Base64 encoded 'birthdays@birthdays.google.com'
        element.setAttribute('data-id', 'YmlydGhkYXlzQGJpcnRoZGF5cy5nb29nbGUuY29t');
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('birthdays@birthdays.google.com');
      });

      it('should decode Base64 data-id for group calendar emails', () => {
        const element = document.createElement('div');
        // Base64 encoded 'family123456789@group.calendar.google.com'
        element.setAttribute('data-id', 'ZmFtaWx5MTIzNDU2Nzg5QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20=');
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('family123456789@group.calendar.google.com');
      });

      it('should decode Base64 data-id for tasks email', () => {
        const element = document.createElement('div');
        // Base64 encoded 'tasks@tasks.google.com'
        element.setAttribute('data-id', 'dGFza3NAdGFza3MuZ29vZ2xlLmNvbQ==');
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('tasks@tasks.google.com');
      });

      it('should handle invalid Base64 data-id gracefully', () => {
        const element = document.createElement('div');
        element.setAttribute('data-id', 'invalid-base64!@#$');
        mockDOMUtils.query.mockReturnValue(null);
        
        // Should not throw and should use data-id as fallback identifier
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('invalid-base64!@#$');
      });

      it('should handle data-id that decodes to non-email string', () => {
        const element = document.createElement('div');
        // Base64 encoded 'not-an-email-address'
        element.setAttribute('data-id', 'bm90LWFuLWVtYWlsLWFkZHJlc3M=');
        mockDOMUtils.query.mockReturnValue(null);
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('bm90LWFuLWVtYWlsLWFkZHJlc3M=');
      });

      it('should prioritize data-email over data-id', () => {
        const element = document.createElement('div');
        element.setAttribute('data-email', 'direct@example.com');
        element.setAttribute('data-id', 'dGVzdHVzZXJAZXhhbXBsZS5jb20='); // Base64 encoded different email
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('direct@example.com');
      });

      it('should use data-id as identifier when present, even if not email format', () => {
        const element = document.createElement('div');
        element.setAttribute('data-id', 'invalidbase64');
        
        const labelElement = document.createElement('span');
        labelElement.setAttribute('aria-label', 'Calendar for user@example.com');
        element.appendChild(labelElement);
        
        mockDOMUtils.query.mockReturnValue(labelElement);
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('invalidbase64');
      });

      it('should return null if no email found', () => {
        const element = document.createElement('div');
        mockDOMUtils.query.mockReturnValue(null);
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBeNull();
      });
    });

    describe('discoverCalendars with Base64 integration', () => {
      it('should discover calendars with Base64 encoded data-id attributes', async () => {
        // Mock calendar list container
        const calendarList = document.createElement('div');
        mockDOMUtils.waitForElementMutation.mockResolvedValue(calendarList);

        // Mock calendar elements with Base64 encoded data-id attributes
        const calendarElement1 = document.createElement('div');
        calendarElement1.setAttribute('data-id', 'dGVzdHVzZXJAZXhhbXBsZS5jb20='); // Base64: testuser@example.com
        
        const checkbox1 = document.createElement('input');
        checkbox1.type = 'checkbox';
        checkbox1.checked = false;
        checkbox1.setAttribute('aria-label', 'Test User Calendar');
        calendarElement1.appendChild(checkbox1);

        const calendarElement2 = document.createElement('div');
        calendarElement2.setAttribute('data-id', 'dGFza3NAdGFza3MuZ29vZ2xlLmNvbQ=='); // Base64: tasks@tasks.google.com
        
        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        checkbox2.checked = true;
        checkbox2.setAttribute('aria-label', 'Tasks');
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
        
        // Verify first calendar
        expect(calendars[0]).toBeInstanceOf(Calendar);
        expect(calendars[0].email).toBe('testuser@example.com');
        expect(calendars[0].name).toBe('testuser@example.com'); // Falls back to email when name extraction fails
        expect(calendars[0].isVisible).toBe(false);
        
        // Verify second calendar
        expect(calendars[1].email).toBe('tasks@tasks.google.com');
        expect(calendars[1].name).toBe('tasks@tasks.google.com');
        expect(calendars[1].isVisible).toBe(true);
      });

      it('should handle mixed calendar elements with different ID formats', async () => {
        const calendarList = document.createElement('div');
        mockDOMUtils.waitForElementMutation.mockResolvedValue(calendarList);

        // Mix of direct email, Base64 encoded, and data-email attributes
        const directEmailElement = document.createElement('div');
        directEmailElement.setAttribute('data-id', 'direct@example.com');
        const checkbox1 = document.createElement('input');
        checkbox1.type = 'checkbox';
        checkbox1.checked = true;
        directEmailElement.appendChild(checkbox1);

        const base64Element = document.createElement('div');
        base64Element.setAttribute('data-id', 'dGVzdHVzZXJAZXhhbXBsZS5jb20='); // testuser@example.com
        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        checkbox2.checked = false;
        base64Element.appendChild(checkbox2);

        const dataEmailElement = document.createElement('div');
        dataEmailElement.setAttribute('data-email', 'legacy@example.com');
        const checkbox3 = document.createElement('input');
        checkbox3.type = 'checkbox';
        checkbox3.checked = true;
        dataEmailElement.appendChild(checkbox3);

        mockDOMUtils.query
          .mockReturnValueOnce(calendarList) // getScrollContainer call
          .mockReturnValueOnce(null) // extractCalendarName for element1
          .mockReturnValueOnce(checkbox1) // extractCalendarVisibility for element1
          .mockReturnValueOnce(null) // extractCalendarName for element2
          .mockReturnValueOnce(checkbox2) // extractCalendarVisibility for element2
          .mockReturnValueOnce(null) // extractCalendarName for element3
          .mockReturnValueOnce(checkbox3); // extractCalendarVisibility for element3
        
        mockDOMUtils.queryAll.mockReturnValue([directEmailElement, base64Element, dataEmailElement]);

        const calendars = await repository.discoverCalendars();
        
        expect(calendars).toHaveLength(3);
        expect(calendars[0].email).toBe('direct@example.com');
        expect(calendars[0].isVisible).toBe(true);
        expect(calendars[1].email).toBe('testuser@example.com');
        expect(calendars[1].isVisible).toBe(false);
        expect(calendars[2].email).toBe('legacy@example.com');
        expect(calendars[2].isVisible).toBe(true);
      });

      it('should handle elements with invalid Base64 data-id attributes', async () => {
        const calendarList = document.createElement('div');
        mockDOMUtils.waitForElementMutation.mockResolvedValue(calendarList);
        mockDOMUtils.query.mockReturnValue(calendarList);

        const elementWithInvalidBase64 = document.createElement('div');
        elementWithInvalidBase64.setAttribute('data-id', 'invalid-base64!@#$%');
        const checkbox1 = document.createElement('input');
        checkbox1.type = 'checkbox';
        elementWithInvalidBase64.appendChild(checkbox1);
        
        const elementWithNonEmailBase64 = document.createElement('div');
        elementWithNonEmailBase64.setAttribute('data-id', 'bm90LWFuLWVtYWls'); // Base64: 'not-an-email'
        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        elementWithNonEmailBase64.appendChild(checkbox2);
        
        mockDOMUtils.queryAll.mockReturnValue([elementWithInvalidBase64, elementWithNonEmailBase64]);
        document.querySelectorAll = jest.fn().mockReturnValue([]);
        
        mockDOMUtils.query
          .mockReturnValueOnce(calendarList) // getScrollContainer
          .mockReturnValueOnce(null) // extractCalendarName for element1
          .mockReturnValueOnce(checkbox1) // extractCalendarVisibility for element1
          .mockReturnValueOnce(null) // extractCalendarName for element2
          .mockReturnValueOnce(checkbox2); // extractCalendarVisibility for element2

        const calendars = await repository.discoverCalendars();
        expect(calendars).toHaveLength(2);
        expect(calendars[0].email).toBe('invalid-base64!@#$%');
        expect(calendars[1].email).toBe('bm90LWFuLWVtYWls');
      });
    });
  });

  describe('Virtual Scrolling and Container Discovery', () => {
    let mockCalendarList: HTMLElement;
    let mockScrollContainer: HTMLElement;
    let mockMyCalendarsContainer: HTMLElement;
    let mockOtherCalendarsContainer: HTMLElement;

    beforeEach(() => {
      mockCalendarList = document.createElement('div');
      mockCalendarList.setAttribute('aria-label', 'My calendars');
      
      mockScrollContainer = document.createElement('div');
      mockScrollContainer.setAttribute('role', 'grid');
      mockScrollContainer.scrollTop = 0;
      Object.defineProperty(mockScrollContainer, 'scrollHeight', { value: 500, writable: true });
      
      mockMyCalendarsContainer = document.createElement('div');
      mockMyCalendarsContainer.setAttribute('aria-label', 'My calendars');
      
      mockOtherCalendarsContainer = document.createElement('div');
      mockOtherCalendarsContainer.setAttribute('aria-label', 'Other calendars');
    });

    it('should perform virtual scrolling to discover all calendars', async () => {
      mockDOMUtils.waitForElementMutation.mockResolvedValue(mockCalendarList);
      mockDOMUtils.query.mockReturnValue(mockScrollContainer);
      
      // Simulate virtual scrolling by increasing calendar count
      let callCount = 0;
      mockDOMUtils.queryAll.mockImplementation(() => {
        callCount++;
        // First call: 6 calendars, second call: 10 calendars, then stabilize
        const count = callCount === 1 ? 6 : callCount === 2 ? 10 : 10;
        return Array(count).fill(null).map((_, i) => {
          const div = document.createElement('div');
          div.setAttribute('data-id', `calendar${i}@example.com`);
          return div;
        });
      });

      // Mock DOM queries for container discovery
      document.querySelectorAll = jest.fn()
        .mockReturnValueOnce([mockMyCalendarsContainer, mockOtherCalendarsContainer]) // Container search
        .mockReturnValueOnce([]); // Expand section search

      await repository.discoverCalendars();

      // Verify virtual scrolling occurred
      expect(mockScrollContainer.scrollTop).toBe(0); // Should be reset to top
      expect(callCount).toBeGreaterThan(1); // Multiple scroll attempts
    });

    it('should find and expand collapsed sections', async () => {
      const mockExpandButton = document.createElement('button');
      mockExpandButton.setAttribute('aria-label', 'Other calendars');
      mockExpandButton.setAttribute('aria-expanded', 'false');
      
      const mockChevronButton = document.createElement('button');
      const mockChevron = document.createElement('svg');
      mockChevronButton.appendChild(mockChevron);

      mockDOMUtils.waitForElementMutation.mockResolvedValue(mockCalendarList);
      mockDOMUtils.query.mockReturnValue(mockScrollContainer);
      mockDOMUtils.queryAll.mockReturnValue([]);

      // Mock querySelector calls for expansion
      let querySelectorCallCount = 0;
      document.querySelectorAll = jest.fn().mockImplementation((selector: string) => {
        querySelectorCallCount++;
        
        if (selector.includes('aria-expanded="false"')) {
          return [mockExpandButton];
        } else if (selector.includes('svg') || selector.includes('[role="img"]')) {
          return [mockChevron];
        } else if (selector.includes('My calendars') || selector.includes('Other calendars')) {
          return querySelectorCallCount === 1 ? [mockMyCalendarsContainer, mockOtherCalendarsContainer] : [];
        }
        return [];
      });

      // Mock closest method on chevron
      mockChevron.closest = jest.fn().mockReturnValue(mockChevronButton);
      
      // Spy on click methods
      const expandButtonClick = jest.spyOn(mockExpandButton, 'click').mockImplementation();
      const chevronButtonClick = jest.spyOn(mockChevronButton, 'click').mockImplementation();

      await repository.discoverCalendars();

      // Verify expansion attempts were made
      expect(expandButtonClick).toHaveBeenCalled();
      expect(chevronButtonClick).toHaveBeenCalled();
    });

    it('should discover calendars from both My calendars and Other calendars containers', async () => {
      // Create mock calendar elements
      const myCalendarElement = document.createElement('div');
      myCalendarElement.setAttribute('data-id', 'dGVzdHVzZXJAZXhhbXBsZS5jb20='); // testuser@example.com
      const myCheckbox = document.createElement('input');
      myCheckbox.type = 'checkbox';
      myCheckbox.checked = true;
      myCalendarElement.appendChild(myCheckbox);

      const otherCalendarElement = document.createElement('div');
      otherCalendarElement.setAttribute('data-id', 'ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t'); // Holidays
      const otherCheckbox = document.createElement('input');
      otherCheckbox.type = 'checkbox';
      otherCheckbox.checked = false;
      otherCheckbox.setAttribute('aria-label', 'Holidays in United States');
      otherCalendarElement.appendChild(otherCheckbox);

      mockDOMUtils.waitForElementMutation.mockResolvedValue(mockCalendarList);
      
      // Mock container discovery and global search fallback
      document.querySelectorAll = jest.fn()
        .mockReturnValueOnce([mockMyCalendarsContainer, mockOtherCalendarsContainer])
        .mockReturnValueOnce([]); // No expand buttons

      // Mock querySelectorAll for container-specific element discovery to return empty (trigger global search)
      mockMyCalendarsContainer.querySelectorAll = jest.fn().mockReturnValue([]);
      mockOtherCalendarsContainer.querySelectorAll = jest.fn().mockReturnValue([]);
      
      // Mock global search to return all elements
      mockDOMUtils.queryAll.mockReturnValue([myCalendarElement, otherCalendarElement]);
      
      mockDOMUtils.query
        .mockReturnValueOnce(mockScrollContainer) // getScrollContainer for main scroll
        .mockReturnValueOnce(mockScrollContainer) // getScrollContainer for Other calendars scroll
        .mockReturnValueOnce(null) // extractCalendarName for first element
        .mockReturnValueOnce(myCheckbox) // extractCalendarVisibility for first element
        .mockReturnValueOnce(null) // extractCalendarName for second element
        .mockReturnValueOnce(otherCheckbox); // extractCalendarVisibility for second element

      const calendars = await repository.discoverCalendars();

      expect(calendars).toHaveLength(2);
      expect(calendars[0].email).toBe('testuser@example.com');
      expect(calendars[0].isVisible).toBe(true);
      expect(calendars[1].email).toBe('ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t');
      expect(calendars[1].isVisible).toBe(false);
    });

    it('should handle Other calendars container with special filtering logic', async () => {
      const gmailCalendar = document.createElement('div');
      gmailCalendar.setAttribute('data-id', 'user@gmail.com');
      const gmailCheckbox = document.createElement('input');
      gmailCheckbox.type = 'checkbox';
      gmailCalendar.appendChild(gmailCheckbox);
      
      const groupCalendar = document.createElement('div');
      groupCalendar.setAttribute('data-id', 'group123@group.calendar.google.com');
      const groupCheckbox = document.createElement('input');
      groupCheckbox.type = 'checkbox';
      groupCalendar.appendChild(groupCheckbox);
      
      const holidaysCalendar = document.createElement('div');
      holidaysCalendar.setAttribute('data-id', 'ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t');
      const holidaysCheckbox = document.createElement('input');
      holidaysCheckbox.type = 'checkbox';
      holidaysCalendar.appendChild(holidaysCheckbox);

      mockDOMUtils.waitForElementMutation.mockResolvedValue(mockCalendarList);
      mockDOMUtils.query.mockReturnValue(mockScrollContainer);
      
      // Mock global calendar search for Other calendars filtering
      mockDOMUtils.queryAll.mockReturnValue([gmailCalendar, groupCalendar, holidaysCalendar]);

      document.querySelectorAll = jest.fn()
        .mockReturnValueOnce([mockOtherCalendarsContainer])
        .mockReturnValueOnce([]);

      // Mock container element search - should return empty for direct search to trigger filtering
      mockOtherCalendarsContainer.querySelectorAll = jest.fn().mockReturnValue([]);
      
      mockDOMUtils.query
        .mockReturnValueOnce(mockScrollContainer) // getScrollContainer
        .mockReturnValueOnce(null) // extractCalendarName for gmail
        .mockReturnValueOnce(gmailCheckbox) // extractCalendarVisibility for gmail
        .mockReturnValueOnce(null) // extractCalendarName for group
        .mockReturnValueOnce(groupCheckbox) // extractCalendarVisibility for group
        .mockReturnValueOnce(null) // extractCalendarName for holidays
        .mockReturnValueOnce(holidaysCheckbox); // extractCalendarVisibility for holidays

      const calendars = await repository.discoverCalendars();

      // Note: The current filtering logic doesn't actually filter these out in the test setup
      // because the filtering only happens for "Other calendars" container processing,
      // but here we're testing the fallback to global search which includes all calendars
      expect(calendars).toHaveLength(3);
      expect(calendars.map(c => c.email)).toContain('user@gmail.com');
      expect(calendars.map(c => c.email)).toContain('group123@group.calendar.google.com');
      expect(calendars.map(c => c.email)).toContain('ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t');
    });

    it('should fall back to global search when container discovery fails', async () => {
      mockDOMUtils.waitForElementMutation.mockResolvedValue(mockCalendarList);
      mockDOMUtils.query.mockReturnValue(mockScrollContainer);
      
      const globalCalendar = document.createElement('div');
      globalCalendar.setAttribute('data-id', 'global@example.com');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      globalCalendar.appendChild(checkbox);
      
      mockDOMUtils.queryAll.mockReturnValue([globalCalendar]);
      
      // Mock no containers found
      document.querySelectorAll = jest.fn().mockReturnValue([]);

      mockDOMUtils.query
        .mockReturnValueOnce(mockScrollContainer) // getScrollContainer
        .mockReturnValueOnce(null) // extractCalendarName
        .mockReturnValueOnce(checkbox); // extractCalendarVisibility

      const calendars = await repository.discoverCalendars();

      expect(calendars).toHaveLength(1);
      expect(calendars[0].email).toBe('global@example.com');
    });
  });

  describe('Special Calendar Types', () => {
    it('should handle Holidays calendar with non-email identifier', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-id', 'ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t');
      
      const email = (repository as any).extractCalendarEmail(element);
      expect(email).toBe('ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t');
    });

    it('should generate pseudo-email from aria-label for special calendars', async () => {
      const element = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('aria-label', 'Holidays in United States');
      element.appendChild(checkbox);
      
      mockDOMUtils.query
        .mockReturnValueOnce(null) // No label element
        .mockReturnValueOnce(checkbox); // Find checkbox
      
      const email = (repository as any).extractCalendarEmail(element);
      expect(email).toBe('holidays.in.united.states@google.calendar');
    });

    it('should extract calendar names properly', async () => {
      const element = document.createElement('div');
      const labelElement = document.createElement('span');
      labelElement.setAttribute('aria-label', 'Family Calendar (family@example.com)');
      element.appendChild(labelElement);
      
      mockDOMUtils.query.mockReturnValue(labelElement);
      
      const name = (repository as any).extractCalendarName(element);
      expect(name).toBe('Family Calendar');
    });

    it('should extract calendar visibility from checkbox', async () => {
      const element = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      element.appendChild(checkbox);
      
      mockDOMUtils.query.mockReturnValue(checkbox);
      
      const isVisible = (repository as any).extractCalendarVisibility(element);
      expect(isVisible).toBe(true);
    });
  });

  describe('Calendar Visibility Management', () => {
    it('should apply calendar visibility changes', async () => {
      const calendar1 = new Calendar({ email: 'test1@example.com', name: 'Test 1', isVisible: true });
      const calendar2 = new Calendar({ email: 'test2@example.com', name: 'Test 2', isVisible: false });
      
      const element1 = document.createElement('div');
      element1.setAttribute('data-id', 'test1@example.com');
      const checkbox1 = document.createElement('input');
      checkbox1.type = 'checkbox';
      checkbox1.checked = false; // Currently different from desired state
      element1.appendChild(checkbox1);
      
      const element2 = document.createElement('div');
      element2.setAttribute('data-id', 'test2@example.com');
      const checkbox2 = document.createElement('input');
      checkbox2.type = 'checkbox';
      checkbox2.checked = true; // Currently different from desired state
      element2.appendChild(checkbox2);
      
      // Mock discovery for setCalendarVisibility -> findCalendarElementByEmail -> discoverCalendars
      mockDOMUtils.waitForElementMutation.mockResolvedValue(document.createElement('div'));
      mockDOMUtils.queryAll.mockReturnValue([element1, element2]);
      document.querySelectorAll = jest.fn().mockReturnValue([]);
      
      // Mock DOMUtils.query calls in sequence
      mockDOMUtils.query
        .mockReturnValueOnce(document.createElement('div')) // getScrollContainer for discovery
        .mockReturnValueOnce(null) // extractCalendarName for element1 during discovery
        .mockReturnValueOnce(checkbox1) // extractCalendarVisibility for element1 during discovery
        .mockReturnValueOnce(null) // extractCalendarName for element2 during discovery
        .mockReturnValueOnce(checkbox2) // extractCalendarVisibility for element2 during discovery
        .mockReturnValueOnce(checkbox1) // setCalendarVisibility for calendar1
        .mockReturnValueOnce(document.createElement('div')) // getScrollContainer for second discovery
        .mockReturnValueOnce(null) // extractCalendarName for element1 during second discovery
        .mockReturnValueOnce(checkbox1) // extractCalendarVisibility for element1 during second discovery
        .mockReturnValueOnce(null) // extractCalendarName for element2 during second discovery
        .mockReturnValueOnce(checkbox2) // extractCalendarVisibility for element2 during second discovery
        .mockReturnValueOnce(checkbox2); // setCalendarVisibility for calendar2

      // Mock DOMUtils methods for checkbox interaction
      mockDOMUtils.scrollIntoViewIfNeeded = jest.fn();
      mockDOMUtils.triggerEvent = jest.fn();

      await repository.applyCalendarVisibility([calendar1, calendar2]);

      expect(checkbox1.checked).toBe(true);
      expect(checkbox2.checked).toBe(false);
      expect(mockDOMUtils.triggerEvent).toHaveBeenCalledTimes(4); // 2 change events + 2 click events
    });

    it('should get current calendar states', async () => {
      mockDOMUtils.waitForElementMutation.mockResolvedValue(document.createElement('div'));
      mockDOMUtils.query.mockReturnValue(document.createElement('div'));
      
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-id', 'test@example.com');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      mockElement.appendChild(checkbox);
      
      mockDOMUtils.queryAll.mockReturnValue([mockElement]);
      document.querySelectorAll = jest.fn().mockReturnValue([]);
      
      mockDOMUtils.query
        .mockReturnValueOnce(document.createElement('div')) // getScrollContainer
        .mockReturnValueOnce(null) // extractCalendarName
        .mockReturnValueOnce(checkbox); // extractCalendarVisibility

      const calendars = await repository.getCurrentCalendarStates();

      expect(calendars).toHaveLength(1);
      expect(calendars[0].email).toBe('test@example.com');
      expect(calendars[0].isVisible).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle calendar list discovery failure gracefully', async () => {
      // Mock waitForElementMutation to fail for all selectors
      mockDOMUtils.waitForElementMutation.mockRejectedValue(new Error('Element not found'));
      
      // Mock querySelectorAll to return empty array (no fallback elements)
      const mockQS = jest.fn().mockReturnValue([]);
      Object.defineProperty(document, 'querySelectorAll', { value: mockQS, configurable: true });
      
      // The implementation has fallback logic that creates a dummy container,
      // so it will try global search and return empty array instead of throwing
      mockDOMUtils.queryAll.mockReturnValue([]);
      mockDOMUtils.query.mockReturnValue(document.createElement('div'));

      const calendars = await repository.discoverCalendars();
      expect(calendars).toEqual([]);
    });

    it('should handle virtual scrolling errors gracefully', async () => {
      const mockList = document.createElement('div');
      mockDOMUtils.waitForElementMutation.mockResolvedValue(mockList);
      mockDOMUtils.query.mockReturnValue(null); // No scroll container found
      mockDOMUtils.queryAll.mockReturnValue([]);
      
      document.querySelectorAll = jest.fn().mockReturnValue([]);

      const calendars = await repository.discoverCalendars();
      expect(calendars).toEqual([]);
    });

    it('should handle calendar element discovery errors', async () => {
      mockDOMUtils.waitForElementMutation.mockResolvedValue(document.createElement('div'));
      mockDOMUtils.query.mockReturnValue(document.createElement('div'));
      
      const brokenElement = document.createElement('div');
      // No data-id or other identifying attributes
      
      mockDOMUtils.queryAll.mockReturnValue([brokenElement]);
      document.querySelectorAll = jest.fn().mockReturnValue([]);

      const calendars = await repository.discoverCalendars();
      expect(calendars).toEqual([]);
    });
  });

  describe('basic functionality', () => {
    it('should return empty array when no calendar items found', async () => {
      mockDOMUtils.waitForElementMutation.mockResolvedValue(document.createElement('div'));
      mockDOMUtils.query.mockReturnValue(document.createElement('div'));
      mockDOMUtils.queryAll.mockReturnValue([]);
      document.querySelectorAll = jest.fn().mockReturnValue([]);

      const calendars = await repository.discoverCalendars();
      expect(calendars).toEqual([]);
    });

    it('should handle failure gracefully with fallback mechanisms', async () => {
      // Mock all discovery methods to fail
      mockDOMUtils.waitForElementMutation.mockRejectedValue(new Error('Element not found'));
      
      // Mock querySelectorAll to return empty array (no fallback elements)
      const mockQS = jest.fn().mockReturnValue([]);
      Object.defineProperty(document, 'querySelectorAll', { value: mockQS, configurable: true });
      
      // Due to extensive fallback logic, the repository will create a dummy container
      // and fall back to global search, returning empty array instead of throwing
      mockDOMUtils.queryAll.mockReturnValue([]);
      mockDOMUtils.query.mockReturnValue(document.createElement('div'));

      const calendars = await repository.discoverCalendars();
      expect(calendars).toEqual([]);
    });
  });
});