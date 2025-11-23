/**
 * Calendar Data Extractor Service
 * Handles extraction of calendar data from DOM elements
 */

import { CalendarState } from '../core';
import logger from './logger';

/**
 * Service responsible for extracting calendar data from DOM elements
 */
export class CalendarDataExtractor {
  // Google Calendar DOM selectors for data extraction
  private static readonly SELECTORS = {
    CALENDAR_CHECKBOX: 'input[type="checkbox"]',
    CALENDAR_CHECKBOX_ROLE: 'input[type="checkbox"][role="checkbox"]',
    CALENDAR_LABEL: '[aria-label], [title]'
  };

  /**
   * Extract calendar data from DOM element
   */
  extractCalendarData(element: Element): CalendarState | null {
    try {
      logger.debug('Extracting calendar data from element:', element);
      
      // Extract email (primary identifier)
      const email = this.extractCalendarEmail(element);
      logger.debug('Extracted email:', email);
      
      if (!email) {
        logger.debug('No email found, skipping element');
        return null;
      }

      // Extract name
      const name = this.extractCalendarName(element) || email;
      logger.debug('Extracted name:', name);

      // Extract visibility state
      const isVisible = this.extractCalendarVisibility(element);
      logger.debug('Extracted visibility:', isVisible);

      const result = { email, name, isVisible };
      logger.debug('Successfully extracted calendar data:', result);
      return result;
    } catch (error) {
      logger.warn('Failed to extract calendar data:', error);
      return null;
    }
  }

  /**
   * Extract calendar email from element
   */
  extractCalendarEmail(element: Element): string | null {
    // Try data-email attribute
    const emailAttr = element.getAttribute('data-email');
    if (emailAttr) return emailAttr;

    // Try data-id attribute (often contains Base64-encoded email)
    const dataId = element.getAttribute('data-id');
    if (dataId) {
      // Check if it's a direct email (must look like a valid email format)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (emailRegex.test(dataId)) return dataId;
      
      // Try to decode as Base64
      try {
        const decoded = atob(dataId);
        logger.debug('Decoded Base64 data-id:', dataId, '->', decoded);
        if (emailRegex.test(decoded)) {
          return decoded;
        }
      } catch (error) {
        // Not valid Base64, continue with other methods
        logger.debug('Failed to decode data-id as Base64:', dataId);
      }
      
      // If data-id exists but doesn't decode to a valid email format,
      // it might still be a valid calendar identifier (like for Holidays)
      // Use the data-id as the email identifier even if it doesn't look like an email
      if (dataId.length > 0) {
        logger.debug('Using data-id as calendar identifier:', dataId);
        return dataId;
      }
    }

    // Try to find email in aria-label or title
    const labelElement = element.querySelector(CalendarDataExtractor.SELECTORS.CALENDAR_LABEL);
    if (labelElement) {
      const ariaLabel = labelElement.getAttribute('aria-label') || '';
      const title = labelElement.getAttribute('title') || '';
      
      const emailMatch = (ariaLabel + ' ' + title).match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) return emailMatch[1];
    }

    // If no email found but we have a checkbox element, try to generate an ID from the aria-label
    const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (checkbox) {
      const ariaLabel = checkbox.getAttribute('aria-label') || '';
      if (ariaLabel) {
        // Generate a pseudo-email from the aria-label for calendars like "Holidays in United States"
        const cleanLabel = ariaLabel.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '.');
        const pseudoEmail = `${cleanLabel}@google.calendar`;
        logger.debug('Generated pseudo-email from aria-label:', ariaLabel, '->', pseudoEmail);
        return pseudoEmail;
      }
    }

    return null;
  }

  /**
   * Extract calendar name from element
   */
  extractCalendarName(element: Element): string | null {
    // Try aria-label first
    const labelElement = element.querySelector(CalendarDataExtractor.SELECTORS.CALENDAR_LABEL);
    if (labelElement) {
      const ariaLabel = labelElement.getAttribute('aria-label');
      if (ariaLabel) {
        // Remove email from label if present
        return ariaLabel.replace(/\s*\([^)]*@[^)]*\)/, '').trim();
      }
    }

    // Try text content
    const textContent = element.textContent?.trim();
    if (textContent) {
      // Remove email patterns from text content
      return textContent.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '').trim();
    }

    return null;
  }

  /**
   * Extract calendar visibility state from checkbox
   */
  extractCalendarVisibility(element: Element): boolean {
    // Try multiple checkbox selectors
    const selectors = [
      CalendarDataExtractor.SELECTORS.CALENDAR_CHECKBOX,
      CalendarDataExtractor.SELECTORS.CALENDAR_CHECKBOX_ROLE,
      'input[type="checkbox"]'
    ];

    for (const selector of selectors) {
      const checkbox = element.querySelector<HTMLInputElement>(selector);
      if (checkbox) {
        logger.debug(`Found checkbox with selector ${selector}, checked: ${checkbox.checked}`);
        return checkbox.checked || false;
      }
    }

    logger.debug('No checkbox found in element');
    return false;
  }
}
