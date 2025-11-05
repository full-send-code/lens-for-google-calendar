/**
 * Use Cases Layer Dependency Registration
 * 
 * This module is responsible for registering all use case dependencies:
 * - Application use cases
 * - Use case orchestration
 * - Application-specific services
 */

import { CalendarRepository, PresetRepository } from '../core';
import {
  ClearCalendarsUseCase,
  EnableCalendarUseCase,
  ApplyPresetUseCase,
  ImportPresetsUseCase,
  ExportPresetsUseCase
} from './';

/**
 * Use case dependency registry
 * Contains all application use cases with their dependencies injected
 */
export interface UseCaseDependencies {
  clearCalendarsUseCase: ClearCalendarsUseCase;
  enableCalendarUseCase: EnableCalendarUseCase;
  applyPresetUseCase: ApplyPresetUseCase;
  importPresetsUseCase: ImportPresetsUseCase;
  exportPresetsUseCase: ExportPresetsUseCase;
}

/**
 * Create and wire all use case dependencies
 * Takes repository dependencies from infrastructure layer
 */
export function createUseCaseDependencies(
  calendarRepository: CalendarRepository,
  presetRepository: PresetRepository
): UseCaseDependencies {
  
  // Create use cases with injected dependencies
  const clearCalendarsUseCase = new ClearCalendarsUseCase(calendarRepository);
  const enableCalendarUseCase = new EnableCalendarUseCase(calendarRepository);
  const applyPresetUseCase = new ApplyPresetUseCase(calendarRepository, presetRepository);
  const importPresetsUseCase = new ImportPresetsUseCase(presetRepository);
  const exportPresetsUseCase = new ExportPresetsUseCase(presetRepository);

  return {
    clearCalendarsUseCase,
    enableCalendarUseCase,
    applyPresetUseCase,
    importPresetsUseCase,
    exportPresetsUseCase
  };
}

/**
 * Use case dependency tokens for type-safe access
 */
export const USECASE_TOKENS = {
  CLEAR_CALENDARS_USE_CASE: 'clearCalendarsUseCase',
  ENABLE_CALENDAR_USE_CASE: 'enableCalendarUseCase',
  APPLY_PRESET_USE_CASE: 'applyPresetUseCase',
  IMPORT_PRESETS_USE_CASE: 'importPresetsUseCase',
  EXPORT_PRESETS_USE_CASE: 'exportPresetsUseCase'
} as const;