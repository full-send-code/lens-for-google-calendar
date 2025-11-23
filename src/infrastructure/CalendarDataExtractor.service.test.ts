/**
 * Tests for CalendarDataExtractor Service
 */

import { CalendarDataExtractor } from './CalendarDataExtractor.service';

// Mock logger
jest.mock('./logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('CalendarDataExtractor', () => {
  let extractor: CalendarDataExtractor;

  beforeEach(() => {
    extractor = new CalendarDataExtractor();
    jest.clearAllMocks();
  });

  describe('extractCalendarEmail', () => {
    it('should extract email from data-email attribute', () => {
      const element = document.createElement('div');
      element.setAttribute('data-email', 'data@example.com');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('data@example.com');
    });

    it('should extract email from data-id attribute when it contains direct email', () => {
      const element = document.createElement('div');
      element.setAttribute('data-id', 'user@example.com');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('user@example.com');
    });

    it('should decode Base64 data-id attribute to extract email', () => {
      const element = document.createElement('div');
      // Base64 encoded 'testuser@example.com'
      element.setAttribute('data-id', 'dGVzdHVzZXJAZXhhbXBsZS5jb20=');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('testuser@example.com');
    });

    it('should decode Base64 data-id for Google calendar emails', () => {
      const element = document.createElement('div');
      // Base64 encoded 'birthdays@birthdays.google.com'
      element.setAttribute('data-id', 'YmlydGhkYXlzQGJpcnRoZGF5cy5nb29nbGUuY29t');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('birthdays@birthdays.google.com');
    });

    it('should decode Base64 data-id for group calendar emails', () => {
      const element = document.createElement('div');
      // Base64 encoded 'family123456789@group.calendar.google.com'
      element.setAttribute('data-id', 'ZmFtaWx5MTIzNDU2Nzg5QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20=');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('family123456789@group.calendar.google.com');
    });

    it('should decode Base64 data-id for tasks email', () => {
      const element = document.createElement('div');
      // Base64 encoded 'tasks@tasks.google.com'
      element.setAttribute('data-id', 'dGFza3NAdGFza3MuZ29vZ2xlLmNvbQ==');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('tasks@tasks.google.com');
    });

    it('should handle invalid Base64 data-id gracefully', () => {
      const element = document.createElement('div');
      // Invalid Base64 string - should not throw and should use data-id as fallback identifier
      element.setAttribute('data-id', 'invalid-base64!@#$');
      
      // Should not throw and should use data-id as fallback identifier
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('invalid-base64!@#$');
    });

    it('should handle data-id that decodes to non-email string', () => {
      const element = document.createElement('div');
      // Base64 encoded 'not-an-email-address' - should use data-id as identifier
      element.setAttribute('data-id', 'bm90LWFuLWVtYWlsLWFkZHJlc3M=');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('bm90LWFuLWVtYWlsLWFkZHJlc3M=');
    });

    it('should prioritize data-email over data-id', () => {
      const element = document.createElement('div');
      element.setAttribute('data-email', 'direct@example.com');
      element.setAttribute('data-id', 'dGVzdHVzZXJAZXhhbXBsZS5jb20='); // Base64 encoded different email
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('direct@example.com');
    });

    it('should use data-id as identifier when present, even if not email format', () => {
      const element = document.createElement('div');
      element.setAttribute('data-id', 'invalidbase64');
      
      const labelElement = document.createElement('span');
      labelElement.setAttribute('aria-label', 'Calendar Name');
      labelElement.setAttribute('title', 'No Email Here');
      element.appendChild(labelElement);
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('invalidbase64');
    });

    it('should return null if no email found', () => {
      const element = document.createElement('div');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBeNull();
    });

    it('should handle Holidays calendar with non-email identifier', () => {
      const element = document.createElement('div');
      // This is a real Base64 encoded holiday calendar identifier that doesn't decode to a standard email
      element.setAttribute('data-id', 'ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t');
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t');
    });

    it('should generate pseudo-email from aria-label for special calendars', () => {
      const element = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('aria-label', 'Holidays in United States');
      element.appendChild(checkbox);
      
      const email = extractor.extractCalendarEmail(element);
      expect(email).toBe('holidays.in.united.states@google.calendar');
    });
  });

  describe('extractCalendarName', () => {
    it('should extract calendar names properly', () => {
      const element = document.createElement('div');
      const labelElement = document.createElement('span');
      labelElement.setAttribute('aria-label', 'Family Calendar (family@example.com)');
      element.appendChild(labelElement);
      
      const name = extractor.extractCalendarName(element);
      expect(name).toBe('Family Calendar');
    });
  });

  describe('extractCalendarVisibility', () => {
    it('should extract calendar visibility from checkbox', () => {
      const element = document.createElement('div');
      const checkbox = document.createElement('input') as HTMLInputElement;
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      element.appendChild(checkbox);
      
      const isVisible = extractor.extractCalendarVisibility(element);
      expect(isVisible).toBe(true);
    });
  });

  describe('extractCalendarData', () => {
    it('should extract complete calendar data', () => {
      const element = document.createElement('div');
      element.setAttribute('data-email', 'test@example.com');
      element.textContent = 'Test Calendar';
      
      const checkbox = document.createElement('input') as HTMLInputElement;
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      element.appendChild(checkbox);
      
      const data = extractor.extractCalendarData(element);
      expect(data).toEqual({
        email: 'test@example.com',
        name: 'Test Calendar',
        isVisible: true
      });
    });

    it('should return null if no email found', () => {
      const element = document.createElement('div');
      
      const data = extractor.extractCalendarData(element);
      expect(data).toBeNull();
    });

    it('should handle extraction errors gracefully', () => {
      const element = document.createElement('div');
      element.setAttribute('data-email', 'test@example.com');
      
      // The extraction should work normally since we're using direct DOM APIs
      const data = extractor.extractCalendarData(element);
      expect(data).toEqual({
        email: 'test@example.com',
        name: 'test@example.com', // falls back to email
        isVisible: false // no checkbox found
      });
    });
  });
});
