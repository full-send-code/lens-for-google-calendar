/**
 * Core Domain Index
 * Exports all domain layer components
 */

// Entities
export { Calendar } from './entities/Calendar.entity';
export type { CalendarState } from './entities/CalendarState.interface';
export { CalendarPreset } from './entities/CalendarPreset.entity';
export type { PresetState } from './entities/PresetState.interface';

// Repository Interfaces
export type { CalendarRepository } from './repositories/Calendar.repository';
export type { PresetRepository } from './repositories/Preset.repository';

// Domain Events
export type { DomainEvent } from './events/DomainEvent.interface';
export type { CalendarDiscoveredEvent } from './events/CalendarDiscovered.event';
export type { CalendarVisibilityChangedEvent } from './events/CalendarVisibilityChanged.event';
export type { CalendarsAppliedEvent } from './events/CalendarsApplied.event';
export type { PresetSavedEvent } from './events/PresetSaved.event';
export type { PresetLoadedEvent } from './events/PresetLoaded.event';
export type { PresetDeletedEvent } from './events/PresetDeleted.event';
export type { PresetAppliedEvent } from './events/PresetApplied.event';
export type { ExtensionInitializedEvent } from './events/ExtensionInitialized.event';
export type { ErrorOccurredEvent } from './events/ErrorOccurred.event';
export type { DomainEventPublisher } from './events/DomainEventPublisher.interface';
export { DomainEventFactory } from './events/DomainEventFactory.factory';