/**
 * Use Cases Index
 * Exports all application use cases
 */

export { ClearCalendarsUseCase } from './ClearCalendars.usecase';
export { EnableCalendarUseCase } from './EnableCalendar.usecase';
export { ApplyPresetUseCase } from './ApplyPreset.usecase';
export { SavePresetUseCase } from './SavePreset.usecase';
export { DeletePresetUseCase } from './DeletePreset.usecase';
export { ImportPresetsUseCase } from './ImportPresets.usecase';
export type { PresetImportData } from './ImportPresets.usecase';
export { ExportPresetsUseCase } from './ExportPresets.usecase';
export type { PresetExportData } from './ExportPresets.usecase';

// Dependency Registration
export { createUseCaseDependencies, type UseCaseDependencies, USECASE_TOKENS } from './dependencies';