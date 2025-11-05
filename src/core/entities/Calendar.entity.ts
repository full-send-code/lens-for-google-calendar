/**
 * Calendar Entity
 * Simple immutable representation of a Google Calendar
 */

import { CalendarState } from './CalendarState.interface';

export class Calendar {
  private readonly _state: CalendarState;

  constructor(state: CalendarState) {
    this._state = { ...state };
  }

  // Getters
  get email(): string { return this._state.email; }
  get name(): string { return this._state.name; }
  get isVisible(): boolean { return this._state.isVisible; }

  // State mutations (return new instances)
  show(): Calendar {
    return new Calendar({ ...this._state, isVisible: true });
  }

  hide(): Calendar {
    return new Calendar({ ...this._state, isVisible: false });
  }

  toggle(): Calendar {
    return new Calendar({ ...this._state, isVisible: !this._state.isVisible });
  }

  // Utility
  equals(other: Calendar): boolean {
    return this._state.email === other._state.email;
  }

  toJSON(): CalendarState {
    return { ...this._state };
  }

  static fromJSON(json: CalendarState): Calendar {
    return new Calendar(json);
  }
}