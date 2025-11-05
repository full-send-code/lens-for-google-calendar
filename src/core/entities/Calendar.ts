/**
 * Core Calendar Entity
 * Represents a single Google Calendar with its properties and behaviors
 * Part of the Domain Layer - contains business logic but no external dependencies
 */

export interface CalendarState {
  id: string;
  name: string;
  email: string;
  isVisible: boolean;
  isOwned: boolean;
  color?: string;
  description?: string;
}

export class Calendar {
  private _state: CalendarState;

  constructor(state: CalendarState) {
    this.validateState(state);
    this._state = { ...state };
  }

  // Getters for immutable access
  get id(): string { return this._state.id; }
  get name(): string { return this._state.name; }
  get email(): string { return this._state.email; }
  get isVisible(): boolean { return this._state.isVisible; }
  get isOwned(): boolean { return this._state.isOwned; }
  get color(): string | undefined { return this._state.color; }
  get description(): string | undefined { return this._state.description; }

  // Business logic methods
  public show(): Calendar {
    return new Calendar({ ...this._state, isVisible: true });
  }

  public hide(): Calendar {
    return new Calendar({ ...this._state, isVisible: false });
  }

  public toggle(): Calendar {
    return new Calendar({ ...this._state, isVisible: !this._state.isVisible });
  }

  public updateColor(color: string): Calendar {
    return new Calendar({ ...this._state, color });
  }

  public updateDescription(description: string): Calendar {
    return new Calendar({ ...this._state, description });
  }

  // Validation
  private validateState(state: CalendarState): void {
    if (!state.id || state.id.trim() === '') {
      throw new Error('Calendar ID cannot be empty');
    }
    if (!state.email || !this.isValidEmail(state.email)) {
      throw new Error('Calendar email must be valid');
    }
    if (!state.name || state.name.trim() === '') {
      throw new Error('Calendar name cannot be empty');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Equality and comparison
  public equals(other: Calendar): boolean {
    return this._state.id === other._state.id;
  }

  public isSameAs(other: Calendar): boolean {
    return JSON.stringify(this._state) === JSON.stringify(other._state);
  }

  // Serialization
  public toJSON(): CalendarState {
    return { ...this._state };
  }

  public static fromJSON(json: CalendarState): Calendar {
    return new Calendar(json);
  }

  // String representation for debugging
  public toString(): string {
    return `Calendar(${this._state.name} <${this._state.email}> - ${this._state.isVisible ? 'visible' : 'hidden'})`;
  }
}