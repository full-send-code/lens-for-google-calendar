import { useEffect } from 'react';
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import React from 'react';

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
        's': () => actions.saveAs(),
        'r': () => actions.restore(),
        'c': () => actions.clear(),
        'p': () => {
          // Create a simulated click event on the Presets button when using keyboard shortcut
          const presetsButton = document.querySelector('[data-action-button="Presets"]') || 
                               document.getElementById('action-button-Presets');
          if (presetsButton) {
            const syntheticEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            presetsButton.dispatchEvent(syntheticEvent);
          } else {
            actions.openPresetsMenu();
          }
        },
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
