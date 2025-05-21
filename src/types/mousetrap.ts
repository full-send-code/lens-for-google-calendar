import Mousetrap from "mousetrap";

// Types for Mousetrap library
declare module 'mousetrap' {
  // Define the ExtendedKeyboardEvent type that's missing
  interface ExtendedKeyboardEvent extends KeyboardEvent {
    returnValue: boolean;
  }
  
  interface MousetrapStatic {
    bindGlobal(
      keys: string | string[],
      callback: (e: ExtendedKeyboardEvent, combo: string) => any,
      action?: string
    ): typeof Mousetrap;
    stopCallback: (
      e: ExtendedKeyboardEvent,
      element: Element,
      combo: string
    ) => boolean;
  }
}
