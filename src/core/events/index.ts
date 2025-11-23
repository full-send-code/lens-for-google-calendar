/**
 * Core Domain Events
 * Exports all domain events and event infrastructure
 */

export type { DomainEvent } from './DomainEvent.interface';
export type { CalendarDiscoveredEvent } from './CalendarDiscovered.event';
export type { CalendarVisibilityChangedEvent } from './CalendarVisibilityChanged.event';
export type { CalendarsAppliedEvent } from './CalendarsApplied.event';
export type { PresetSavedEvent } from './PresetSaved.event';
export type { PresetLoadedEvent } from './PresetLoaded.event';
export type { PresetDeletedEvent } from './PresetDeleted.event';
export type { PresetAppliedEvent } from './PresetApplied.event';
export type { ExtensionInitializedEvent } from './ExtensionInitialized.event';
export type { ErrorOccurredEvent } from './ErrorOccurred.event';
export type { DomainEventPublisher } from './DomainEventPublisher.interface';
export { DomainEventFactory } from './DomainEventFactory.factory';