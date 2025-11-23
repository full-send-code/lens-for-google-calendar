/**
 * Infrastructure Layer Dependency Registration
 * 
 * This module is responsible for registering all infrastructure-level dependencies:
 * - Repository implementations
 * - External service integrations  
 * - Utility services
 * - Infrastructure-specific configuration
 */

import { CalendarRepository, PresetRepository } from '../core';
import { 
  GoogleCalendarRepository, 
  ChromeStorageRepository, 
  JsonImportExportService 
} from './';

/**
 * Infrastructure dependency registry
 * Contains factory functions for creating infrastructure dependencies
 */
export interface InfrastructureDependencies {
  calendarRepository: CalendarRepository;
  presetRepository: PresetRepository;
  jsonImportExportService: typeof JsonImportExportService;
}

/**
 * Create and wire all infrastructure dependencies
 * Each dependency is created as a singleton to maintain state and avoid recreation overhead
 */
export function createInfrastructureDependencies(): InfrastructureDependencies {
  // Create repository implementations
  const calendarRepository: CalendarRepository = new GoogleCalendarRepository();
  const presetRepository: PresetRepository = new ChromeStorageRepository();
  
  return {
    calendarRepository,
    presetRepository,
    jsonImportExportService: JsonImportExportService
  };
}

/**
 * Infrastructure dependency tokens for type-safe access
 */
export const INFRASTRUCTURE_TOKENS = {
  CALENDAR_REPOSITORY: 'calendarRepository',
  PRESET_REPOSITORY: 'presetRepository', 
  JSON_IMPORT_EXPORT_SERVICE: 'jsonImportExportService'
} as const;