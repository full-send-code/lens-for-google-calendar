import { useEffect, useCallback, useMemo } from 'react';
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import { trySelectors } from '../../../utils/common';
import { startPerformanceTracking, endPerformanceTracking } from '../../../utils/logger';

interface CalendarActions {
  enableCalendar: () => Promise<void>;
  saveAs: () => Promise<void>;
  restore: () => Promise<void>;
  clear: () => Promise<void>;
  openPresetsMenu: (event?: React.MouseEvent<HTMLElement>) => Promise<void>;
  handleImport?: (importedGroups: any) => void;
  handleItemSelect?: (item: { text: string; value: string }) => void;
  handleItemDelete?: (item: { text: string; value: string }) => void;
}

/**
 * Keyboard shortcuts manager hook
 * Creates and manages global keyboard shortcuts for the calendar selector
 * Optimized with memoization and performance tracking
 */
export function useKeyboardShortcuts(actions: CalendarActions) {
  // Helper to trigger a click on an element with performance tracking
  const clickElement = useCallback((selector: string) => {
    startPerformanceTracking('keyboardShortcuts.clickElement');
    
    const element = trySelectors<HTMLElement>([selector]);
    if (element) {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
      endPerformanceTracking('keyboardShortcuts.clickElement');
      return true;
    }
    
    endPerformanceTracking('keyboardShortcuts.clickElement');
    return false;
  }, []);

  // Memoize shortcut visibility helpers
  const shortcutHelpers = useMemo(() => ({
    showShortcuts: () => {
      startPerformanceTracking('keyboardShortcuts.showHints');
      document.querySelectorAll('.kbd-hint').forEach(el => {
        (el as HTMLElement).style.boxShadow = 'inset 0 -2px 0 white, inset 0 -4px 0 red';
      });
      endPerformanceTracking('keyboardShortcuts.showHints');
    },
    
    hideShortcuts: () => {
      startPerformanceTracking('keyboardShortcuts.hideHints');
      document.querySelectorAll('.kbd-hint').forEach(el => {
        (el as HTMLElement).style.boxShadow = '';
      });
      endPerformanceTracking('keyboardShortcuts.hideHints');
    }
  }), []);

  // Memoize key action map to avoid recreation
  const keyMap = useMemo(() => ({
    'e': () => {
      startPerformanceTracking('keyboardShortcuts.enableCalendar');
      actions.enableCalendar();
      endPerformanceTracking('keyboardShortcuts.enableCalendar');
    },
    's': () => {
      startPerformanceTracking('keyboardShortcuts.saveAs');
      actions.saveAs();
      endPerformanceTracking('keyboardShortcuts.saveAs');
    },
    'r': () => {
      startPerformanceTracking('keyboardShortcuts.restore');
      actions.restore();
      endPerformanceTracking('keyboardShortcuts.restore');
    },
    'c': () => {
      startPerformanceTracking('keyboardShortcuts.clear');
      actions.clear();
      endPerformanceTracking('keyboardShortcuts.clear');
    },
    'p': () => {
      startPerformanceTracking('keyboardShortcuts.presets');
      // Try to click the presets button, fallback to direct action
      if (!clickElement('[data-action-button="Presets"]') && 
          !clickElement('#action-button-Presets')) {
        actions.openPresetsMenu();
      }
      endPerformanceTracking('keyboardShortcuts.presets');
    },
    'x': () => {
      startPerformanceTracking('keyboardShortcuts.customX');
      clickElement('[data-shortcut="x"]');
      endPerformanceTracking('keyboardShortcuts.customX');
    },
    'i': () => {
      startPerformanceTracking('keyboardShortcuts.customI');
      clickElement('[data-shortcut="i"]');
      endPerformanceTracking('keyboardShortcuts.customI');
    }
  }), [actions, clickElement]);
  useEffect(() => {
    startPerformanceTracking('keyboardShortcuts.setup');
    
    // Show hints when Ctrl+Alt is pressed
    Mousetrap.bindGlobal(['ctrl+alt', 'alt+ctrl'], () => {
      shortcutHelpers.showShortcuts();
      return false;
    }, 'keydown');
    
    // Hide hints when Ctrl is released
    Mousetrap.bindGlobal('ctrl', () => {
      shortcutHelpers.hideShortcuts();
    }, 'keyup');
    
    // Bind each key with Ctrl+Alt
    Object.entries(keyMap).forEach(([key, fn]) => {
      Mousetrap.bind(`ctrl+alt+${key}`, () => {
        fn();
        return false;
      });
    });
    
    endPerformanceTracking('keyboardShortcuts.setup');
    
    // Clean up keyboard shortcuts
    return () => {
      startPerformanceTracking('keyboardShortcuts.cleanup');
      Mousetrap.reset();
      endPerformanceTracking('keyboardShortcuts.cleanup');
    };
  }, [keyMap, shortcutHelpers]);
}
