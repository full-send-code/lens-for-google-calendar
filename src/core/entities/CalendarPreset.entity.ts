/**
 * Calendar Preset Entity
 * Simple representation of a saved calendar group
 */

import { PresetState } from './PresetState.interface';
import { Calendar } from './Calendar.entity';

export class CalendarPreset {
  private readonly _state: PresetState;

  constructor(name: string, calendarEmails: string[]) {
    this._state = {
      name: name.trim(),
      calendarEmails: [...calendarEmails], // Create a copy
      createdAt: new Date()
    };
  }

  // Getters
  get name(): string { return this._state.name; }
  get calendarEmails(): string[] { return [...this._state.calendarEmails]; } // Return copy
  get createdAt(): Date { return this._state.createdAt; }
  get lastUsedAt(): Date | undefined { return this._state.lastUsedAt; }

  // State mutations (return new instances)
  addCalendar(email: string): CalendarPreset {
    const newEmails = [...this._state.calendarEmails];
    if (!newEmails.includes(email)) {
      newEmails.push(email);
    }
    return this.withEmails(newEmails);
  }

  removeCalendar(email: string): CalendarPreset {
    const newEmails = this._state.calendarEmails.filter(e => e !== email);
    return this.withEmails(newEmails);
  }

  markAsUsed(): CalendarPreset {
    const newPreset = Object.create(CalendarPreset.prototype);
    newPreset._state = { ...this._state, lastUsedAt: new Date() };
    return newPreset;
  }

  // Queries
  containsCalendar(email: string): boolean {
    return this._state.calendarEmails.includes(email);
  }

  containsCalendarEntity(calendar: Calendar): boolean {
    return this.containsCalendar(calendar.email);
  }

  getMatchingCalendars(availableCalendars: Calendar[]): Calendar[] {
    return availableCalendars.filter(calendar => 
      this.containsCalendar(calendar.email)
    );
  }

  // Utility
  equals(other: CalendarPreset): boolean {
    return this._state.name === other._state.name;
  }

  toJSON(): PresetState {
    return { 
      name: this._state.name,
      calendarEmails: [...this._state.calendarEmails], // Return copy
      createdAt: this._state.createdAt,
      lastUsedAt: this._state.lastUsedAt
    };
  }

  static fromJSON(json: PresetState): CalendarPreset {
    const preset = Object.create(CalendarPreset.prototype);
    preset._state = { ...json };
    return preset;
  }

  private withEmails(emails: string[]): CalendarPreset {
    const preset = Object.create(CalendarPreset.prototype);
    preset._state = { ...this._state, calendarEmails: emails };
    return preset;
  }
}