import { useEffect } from 'react';
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';

interface CalendarActions {
  enableCalendar: () => Promise<void>;
  toggleCalendar: () => Promise<void>;
  saveAs: () => Promise<void>;
  restore: () => Promise<void>;
  clear: () => Promise<void>;
  handleImport?: (importedGroups: any) => void;
  handleItemSelect?: (item: { text: string; value: string }) => void;
  handleItemDelete?: (item: { text: string; value: string }) => void;
}

export function useKeyboardShortcuts(actions: CalendarActions) {
  useEffect(() => {
    const setupKeyboardShortcuts = () => {
      // Helper to show keyboard hints
      const showShortcuts = () => {
        document.querySelectorAll('.kbd-hint').forEach(el => {
          (el as HTMLElement).style.boxShadow = 'inset 0 -2px 0 white, inset 0 -4px 0 red';
        });
      };
      
      const hideShortcuts = () => {
        document.querySelectorAll('.kbd-hint').forEach(el => {
          (el as HTMLElement).style.boxShadow = '';
        });
      };
      
      // Show hints when Ctrl+Alt is pressed
      Mousetrap.bindGlobal(['ctrl+alt', 'alt+ctrl'], () => {
        showShortcuts();
        return false;
      }, 'keydown');
      
      // Hide hints when Ctrl is released
      Mousetrap.bindGlobal('ctrl', () => {
        hideShortcuts();
      }, 'keyup');
      
      // Bind keys to actions
      const keyMap: Record<string, () => void> = {
        'e': () => actions.enableCalendar(),
        't': () => actions.toggleCalendar(),
        's': () => actions.saveAs(),
        'r': () => actions.restore(),
        'c': () => actions.clear(),
        'p': () => document.querySelector('[data-shortcut="p"]')?.dispatchEvent(new MouseEvent('click')),
        'x': () => document.querySelector('[data-shortcut="x"]')?.dispatchEvent(new MouseEvent('click')),
        'i': () => document.querySelector('[data-shortcut="i"]')?.dispatchEvent(new MouseEvent('click')),
      };
      
      // Bind each key with Ctrl+Alt
      Object.entries(keyMap).forEach(([key, fn]) => {
        Mousetrap.bind(`ctrl+alt+${key}`, () => {
          fn();
          return false;
        });
      });
    };
    
    // Initialize after component mounts
    setupKeyboardShortcuts();
    
    // Clean up keyboard shortcuts
    return () => {
      Mousetrap.reset();
    };
  }, [actions]);
}
