/**
 * Presentation Layer Dependency Registration
 * 
 * This module is responsible for registering all presentation-level dependencies:
 * - UI components configuration
 * - Theme and styling setup
 * - Component-specific services
 * - Presentation-specific utilities
 */

import type { CalendarExtensionAppProps } from './CalendarExtensionApp';
import type { ReactElement } from 'react';

/**
 * Presentation dependency registry
 * Contains configuration and utilities for the presentation layer
 */
export interface PresentationDependencies {
  // Theme configuration
  themeConfig: {
    colorPrimary: string;
    borderRadius: number;
    fontSize: number;
  };
  
  // Notification configuration
  notificationConfig: {
    placement: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
    duration: number;
    maxCount: number;
  };
  
  // Component factory function
  createCalendarExtensionApp: (props: CalendarExtensionAppProps) => ReactElement;
}

/**
 * Create and configure all presentation dependencies
 */
export function createPresentationDependencies(): PresentationDependencies {
  // Theme configuration for consistent styling
  const themeConfig = {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontSize: 14,
  };
  
  // Notification system configuration
  const notificationConfig = {
    placement: 'topRight' as const,
    duration: 4, // seconds
    maxCount: 3, // maximum notifications shown at once
  };
  
  // Component factory function (if needed for complex initialization)
  const createCalendarExtensionApp = (props: CalendarExtensionAppProps) => {
    // For now, this is just a pass-through, but could be enhanced with:
    // - Error boundaries
    // - Performance monitoring
    // - Analytics tracking
    // - Additional providers
    return props as any; // This would actually return JSX.Element in real implementation
  };
  
  return {
    themeConfig,
    notificationConfig,
    createCalendarExtensionApp,
  };
}

/**
 * Presentation dependency tokens for type-safe access
 */
export const PRESENTATION_TOKENS = {
  THEME_CONFIG: 'themeConfig',
  NOTIFICATION_CONFIG: 'notificationConfig',
  CALENDAR_EXTENSION_APP: 'createCalendarExtensionApp',
} as const;