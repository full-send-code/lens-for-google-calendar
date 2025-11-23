import React from 'react';
import { createRoot } from 'react-dom/client';
import logger from './infrastructure/logger';
import { CalendarExtensionApp } from './presentation/CalendarExtensionApp';
import { initializeCalendarExtension } from './main';

// Configuration object (simplified from original)
const CALENDAR_SELECTOR_CONFIG = {
  timing: {
    readyStateCheckInterval: 10,
    uiInsertionDelay: 1000
  }
};

function createExtensionContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'lens-extension-root';
  return container;
}

function insertReactUI(): void {
  if (document.getElementById('lens-extension-root')) {
    logger.warn('Lens extension already loaded');
    return;
  }

  try {
    // Initialize dependency injection
    const dependencies = initializeCalendarExtension();
    
    // Create container and append to body for floating position
    const container = createExtensionContainer();
    document.body.appendChild(container);

    // Create React root and render main application with dependencies
    const root = createRoot(container);
    root.render(
      <CalendarExtensionApp
        clearCalendarsUseCase={dependencies.clearCalendarsUseCase}
        enableCalendarUseCase={dependencies.enableCalendarUseCase}
        applyPresetUseCase={dependencies.applyPresetUseCase}
        savePresetUseCase={dependencies.savePresetUseCase}
        deletePresetUseCase={dependencies.deletePresetUseCase}
        importPresetsUseCase={dependencies.importPresetsUseCase}
        exportPresetsUseCase={dependencies.exportPresetsUseCase}
        presetRepository={dependencies.presetRepository}
        calendarRepository={dependencies.calendarRepository}
      />
    );
    
    logger.info('Calendar extension UI successfully mounted as floating action button');
    
  } catch (error) {
    logger.error('Failed to mount calendar extension UI:', error);
  }
}

// Initialize when DOM is ready and Chrome extension context exists
if (chrome && chrome.runtime) {
  chrome.runtime.sendMessage({}, function (_response: any) {
    const readyStateCheckInterval = setInterval(function () {
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);
        
        // Wait a bit for Google Calendar to load, then insert UI
        setTimeout(() => {
          insertReactUI();
        }, CALENDAR_SELECTOR_CONFIG.timing.uiInsertionDelay);
      }
    }, CALENDAR_SELECTOR_CONFIG.timing.readyStateCheckInterval);
  });
}

// Export for ES module compatibility
export {};