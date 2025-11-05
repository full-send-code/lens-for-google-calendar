import { GoogleCalendarRepository } from './GoogleCalendarRepository.repository';
import { Calendar } from '../core';
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
        
        // Should not throw and should try other methods
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBeNull();
      });

      it('should handle data-id that decodes to non-email string', () => {
        const element = document.createElement('div');
        // Base64 encoded 'not-an-email-address'
        element.setAttribute('data-id', 'bm90LWFuLWVtYWlsLWFkZHJlc3M=');
        mockDOMUtils.query.mockReturnValue(null);
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBeNull();
      });

      it('should prioritize data-email over data-id', () => {
        const element = document.createElement('div');
        element.setAttribute('data-email', 'direct@example.com');
        element.setAttribute('data-id', 'dGVzdHVzZXJAZXhhbXBsZS5jb20='); // Base64 encoded different email
        
        const email = (repository as any).extractCalendarEmail(element);
        expect(email).toBe('direct@example.com');
      });

      it('should fallback to aria-label extraction when data attributes fail', () => {
        const element = document.createElement('div');
        element.setAttribute('data-id', 'invalidbase64');
        
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
        
        const elementWithNonEmailBase64 = document.createElement('div');
        elementWithNonEmailBase64.setAttribute('data-id', 'bm90LWFuLWVtYWls'); // Base64: 'not-an-email'
        
        mockDOMUtils.queryAll.mockReturnValue([elementWithInvalidBase64, elementWithNonEmailBase64]);

        const calendars = await repository.discoverCalendars();
        expect(calendars).toEqual([]);
      });
    });
  });

  describe('basic functionality', () => {
    it('should return empty array when no calendar items found', async () => {
      mockDOMUtils.waitForElementMutation.mockResolvedValue(document.createElement('div'));
      mockDOMUtils.queryAll.mockReturnValue([]);

      const calendars = await repository.discoverCalendars();
      expect(calendars).toEqual([]);
    });

    it('should throw error if calendar list not found', async () => {
      mockDOMUtils.waitForElementMutation.mockRejectedValue(new Error('Element not found'));

      await expect(repository.discoverCalendars()).rejects.toThrow('Failed to discover calendars');
    });
  });
});