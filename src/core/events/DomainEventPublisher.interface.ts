/**
 * Domain Event Publisher Interface
 * Contract for publishing and subscribing to domain events
 */

import { DomainEvent } from './DomainEvent.interface';

export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): void;
  unsubscribe(eventType: string, handler: Function): void;
}