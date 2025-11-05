import React from 'react';
import { createRoot } from 'react-dom/client';
import logger from './logger';
import { MinimalExtension } from './presentation/components/MinimalExtension';

// Configuration object (simplified from original)
const CALENDAR_SELECTOR_CONFIG = {
  selectors: {
    uiInsertionLocation: 'header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)'
  },
  timing: {
    readyStateCheckInterval: 10,
    uiInsertionDelay: 1000
  }
};

function createExtensionContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'lens-extension-root';
  container.style.display = 'inline-block';
  return container;
}

function insertReactUI(): void {
  if (document.getElementById('lens-extension-root')) {
    logger.warn('Lens extension already loaded');
    return;
  }

  try {
    // Find the Google Calendar header insertion point
    const insertionPoint = document.querySelector(CALENDAR_SELECTOR_CONFIG.selectors.uiInsertionLocation);
    
    if (!insertionPoint) {
      logger.error('Could not find Google Calendar insertion point');
      return;
    }

    // Create container and insert into DOM
    const container = createExtensionContainer();
    insertionPoint.appendChild(container);

    // Create React root and render minimal component
    const root = createRoot(container);
    root.render(<MinimalExtension />);
    
    logger.info('React extension UI successfully mounted');
    
  } catch (error) {
    logger.error('Failed to mount React extension UI:', error);
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