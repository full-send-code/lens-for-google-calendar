/**
 * Infrastructure Layer Index
 * Exports all infrastructure implementations and utilities
 */

// Repository Implementations
export { GoogleCalendarRepository } from './GoogleCalendarRepository.repository';
export { ChromeStorageRepository } from './ChromeStorageRepository.repository';

// Specialized Calendar Services
export { CalendarDOMSelector } from './CalendarDOMSelector.service';
export { CalendarDataExtractor } from './CalendarDataExtractor.service';
export { VirtualScrollHandler } from './VirtualScrollHandler.service';
export { CalendarVisibilityManager } from './CalendarVisibilityManager.service';

// Utility Services
export { JsonImportExportService } from './JsonImportExport.service';

// Dependency Registration
export { createInfrastructureDependencies, type InfrastructureDependencies, INFRASTRUCTURE_TOKENS } from './dependencies';