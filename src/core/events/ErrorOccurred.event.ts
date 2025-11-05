/**
 * Error Occurred Event
 * Fired when an error occurs in the domain layer
 */

import { DomainEvent } from './DomainEvent.interface';

export interface ErrorOccurredEvent extends DomainEvent {
  eventType: 'ErrorOccurred';
  error: Error;
  context: string;
}