// Main App component that replaces Vue instance
import React, { useState, useEffect } from 'react';
import { Container, Grid, Snackbar, Alert } from '@mui/material';
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import ActionButton from './ActionButton';
import ExportDialog from './ExportDialog';
import ImportDialog from './ImportDialog';
import PresetMenu from './PresetMenu';
import CalendarManager from '../calendar_manager';
import { ButtonItem, DropdownItem, CalendarGroup } from '../types';

// Setup Mousetrap type
declare module 'mousetrap' {
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

const App: React.FC = () => {
  const [groups, setGroups] = useState<CalendarGroup>(CalendarManager.groups || {});
  const [message, setMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);

  // Setup actions
  const actions = {
    enableCalendar: async () => {
      const name = prompt('Calendar name to enable:');
      if (name) {
        await CalendarManager.enableCalendar(name);
        showMessage(`Enabled calendar: ${name}`);
      }
    },
    
    toggleCalendar: async () => {
      const name = prompt('Calendar name to toggle:');
      if (name) {
        await CalendarManager.toggleCalendar(name);
        showMessage(`Toggled calendar: ${name}`);
      }
    },
    
    saveAs: async () => {
      const name = prompt('Save calendar selection as:');
      if (name) {
        await CalendarManager.saveCalendarSelections(name);
        refreshGroupsState();
        showMessage(`Saved calendar selection as: ${name}`);
      }
    },
    
    restore: async () => {
      CalendarManager.restoreCalendarSelections();
      showMessage('Restored last saved calendar selection');
    },
    
    clear: async () => {
      await CalendarManager.disableAll();
      showMessage('Disabled all calendars');
    },
  };

  // Define buttons
  const buttons: ButtonItem[] = [
    { text: '&Enable', tooltip: 'Enable a calendar by name', click: actions.enableCalendar },
    { text: '&Toggle', tooltip: 'Toggle a calendar by name', click: actions.toggleCalendar },
    { text: '&Save as', tooltip: 'Save current selection as a preset', click: actions.saveAs },
    { text: '&Restore', tooltip: 'Restore last saved preset', click: actions.restore },
    { text: '&Clear All', tooltip: 'Disable all calendars', click: actions.clear },
  ];

  // Helper functions
  const refreshGroupsState = () => {
    setGroups({ ...CalendarManager.groups });
    
    // Update dropdown items
    const items: DropdownItem[] = [];
    for (const key in CalendarManager.groups) {
      if (!key.startsWith('__') && !key.startsWith('saved_')) {
        items.push({
          text: key,
          value: key
        });
      }
    }
    
    setDropdownItems(items);
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setShowSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  const handleImport = (importedGroups: CalendarGroup) => {
    CalendarManager.setGroups(importedGroups);
    refreshGroupsState();
    showMessage('Imported presets successfully');
  };

  const handleItemSelect = (item: DropdownItem) => {
    CalendarManager.showGroup(item.value);
    showMessage(`Loaded preset: ${item.text}`);
  };

  const handleItemDelete = (item: DropdownItem) => {
    if (confirm(`Delete preset "${item.text}"?`)) {
      CalendarManager.deleteGroup(item.value);
      refreshGroupsState();
      showMessage(`Deleted preset: ${item.text}`);
    }
  };

  // Setup keyboard shortcuts
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
        'e': actions.enableCalendar,
        't': actions.toggleCalendar,
        's': actions.saveAs,
        'r': actions.restore,
        'c': actions.clear,
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
    
    // Update CM.onGroupsChange to refresh our state when groups change
    CalendarManager.onGroupsChange = refreshGroupsState;
    
    // Initial state refresh
    refreshGroupsState();
    
    // Clean up keyboard shortcuts
    return () => {
      Mousetrap.reset();
    };
  }, []);

  // Sync with Chrome storage (optional implementation)
  useEffect(() => {
    // Load from storage
    try {
      if (chrome && chrome.storage) {
        chrome.storage.sync.get(['gcSelector_groups'], (items) => {
          if (items.gcSelector_groups) {
            try {
              const loadedGroups = JSON.parse(items.gcSelector_groups);
              CalendarManager.setGroups(loadedGroups);
            } catch (e) {
              console.error('Error parsing saved groups:', e);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Not running in Chrome extension environment');
    }
    
    // Save to storage when groups change
    const saveGroups = () => {
      try {
        if (chrome && chrome.storage) {
          const exportedGroups = JSON.stringify(CalendarManager.exportGroups(true));
          chrome.storage.sync.set({ gcSelector_groups: exportedGroups });
        }
      } catch (e) {
        console.warn('Unable to save to Chrome storage:', e);
      }
    };
    
    CalendarManager.onGroupsChange = () => {
      refreshGroupsState();
      saveGroups();
    };
  }, []);

  return (
    <Container maxWidth={false}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <div>
            {buttons.map((button) => (
              <ActionButton
                key={button.text}
                text={button.text}
                tooltip={button.tooltip}
                onClick={button.click}
              />
            ))}
            
            <div style={{ display: 'inline-block', marginLeft: '8px' }}>
              <PresetMenu
                items={dropdownItems}
                onItemSelect={handleItemSelect}
                onItemDelete={handleItemDelete}
              />
              <span style={{ marginLeft: '8px' }}>
                <ImportDialog onImport={handleImport} />
                <ExportDialog groups={groups} />
              </span>
            </div>
          </div>
        </Grid>
      </Grid>
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="info">
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default App;
