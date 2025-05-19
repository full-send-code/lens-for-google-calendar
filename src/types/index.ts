// Types for the Google Calendar Selector app
export interface CalendarGroup {
  [key: string]: string[];
}

export interface CalendarItem {
  id: string;
  name?: string;
  element?: HTMLElement;
}

export interface OverlayOptions {
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  target?: HTMLElement;
  scrollBarOffset?: number;
}

export interface ScrollOptions {
  animate?: boolean;
  animateDuration?: number;
  restoreOriginalScroll?: boolean;
  scrollIncrement?: number;
  restoreScroll?: boolean;
}

export interface ShortcutItem {
  enabled: boolean;
  pre: string;
  key: string;
  post: string;
  label: string;
  text: string;
}

export interface ButtonItem {
  text: string;
  tooltip: string;
  click: () => Promise<void>;
}

export interface DropdownItem {
  text: string;
  value: string;
}

export interface OperationStatus {
  current: string[];
  state: Record<string, any>;
}
