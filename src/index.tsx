import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/Root/App';
import { findHeaderElement, findCalendarContainer, clearSelectorCache } from './utils/domSelectors';
import * as Logger from './utils/logger';
import { createMutationObserver, getCachedElement } from './utils/domOperations';
import { throttle } from './utils/common';

// Variable to avoid multiple inject attempts
let appInjected = false;
let injectAttempts = 0;
const MAX_INJECT_ATTEMPTS = 10;

// Function to inject our React app into the page
function injectReactApp() {
  Logger.startPerformanceTracking('injectReactApp');
  
  // Avoid multiple injections
  if (appInjected) {
    return;
  }
  
  // Check if we already injected
  const existingApp = document.getElementById('google-calendar-selector-app');
  if (existingApp) {
    appInjected = true;
    Logger.info('React app already injected');
    return;
  }
  
  injectAttempts++;
  Logger.info(`Injecting React app into Google Calendar (attempt ${injectAttempts}/${MAX_INJECT_ATTEMPTS})`);
  
  // Clear selector cache to ensure fresh elements
  clearSelectorCache();
  
  // Look for the Calendar container
  const calendarContainer = findCalendarContainer();
                           
  if (!calendarContainer) {
    Logger.warn('Could not find Google Calendar container, will retry later');
    
    // Stop trying after max attempts
    if (injectAttempts >= MAX_INJECT_ATTEMPTS) {
      Logger.error(`Failed to inject after ${MAX_INJECT_ATTEMPTS} attempts, giving up`);
      return;
    }
    
    // Try again after a delay
    setTimeout(injectReactApp, 500);
    return;
  }
  
  // Look for the header element where we'll inject our button row
  const headerElement = findHeaderElement();
  
  if (!headerElement) {
    Logger.warn('Could not find Google Calendar header, will retry later');
    
    // Stop trying after max attempts
    if (injectAttempts >= MAX_INJECT_ATTEMPTS) {
      Logger.error(`Failed to inject after ${MAX_INJECT_ATTEMPTS} attempts, giving up`);
      return;
    }
    
    // Try again after a delay
    setTimeout(injectReactApp, 500);
    return;
  }
  
  // Create container for our React app
  const appContainer = document.createElement('div');
  appContainer.id = 'google-calendar-selector-app';
  appContainer.style.display = 'flex';
  appContainer.style.alignItems = 'center';
  appContainer.style.marginLeft = '8px';
  
  // Insert our container after the header element
  headerElement.parentNode?.insertBefore(appContainer, headerElement.nextSibling);
  
  // Mount React app
  const root = ReactDOM.createRoot(appContainer);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  appInjected = true;
  Logger.info('React app mounted successfully');
  Logger.endPerformanceTracking('injectReactApp');
}

// Helper function to observe DOM changes
function observeGoogleCalendar() {
  Logger.info('Setting up Google Calendar observer');
  
  // Throttled version of injection to avoid too many attempts
  const throttledInject = throttle(() => {
    if (!appInjected) {
      injectReactApp();
    }
  }, 200);
  
  // Use our optimized mutation observer
  return createMutationObserver(
    document.body,
    (mutations) => {
      if (appInjected) return;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // If our app is not yet injected and both header and calendar container now exist
          const calendarContainer = findCalendarContainer();
          const headerElement = findHeaderElement();
          
          if (!document.getElementById('google-calendar-selector-app') && 
              calendarContainer && headerElement) {
            throttledInject();
            return;
          }
        }
      }
    },
    {
      childList: true,
      subtree: true,
    }
  );
}

// Configure logger
Logger.info('Google Calendar Selector initializing...');

// Start observing the page
observeGoogleCalendar();
