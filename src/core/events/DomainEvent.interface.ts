/**
 * Base Domain Event Interface
 * All domain events must implement this interface
 */

export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}