// Content script for injection
import { createRoot } from 'react-dom/client';
import React from 'react';
import App from '../components/App';
import CalendarManager from '../calendar_manager';
import '../styles/index.css';

// Listen for messages from the extension
if (chrome && chrome.runtime) {
  chrome.runtime.sendMessage({}, function(response) {
    const readyStateCheckInterval = setInterval(function() {
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);
        
        // Insert our React UI
        insertUI();
      }
    }, 10);
  });
}

// Function to insert our UI into the page
function insertUI() {
  // Check if our UI is already inserted
  if (document.getElementById('calendar_selector_ui')) {
    console.warn('Lens for Google Calendar UI already loaded');
    return;
  }
  
  // Create a container for our React app
  const container = document.createElement('div');
  container.id = 'calendar_selector_ui';
  container.className = 'calendar-selector-ui';
  document.body.appendChild(container);
  
  // Render our React app
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('Calendar Selector UI initialized');
}

// If we're not in an extension environment, insert the UI directly
// (for development/testing)
if (!window.chrome || !chrome.runtime) {
  window.addEventListener('load', () => {
    // Small delay to ensure the DOM is ready
    setTimeout(insertUI, 1000);
  });
}

// Expose CalendarManager globally for debugging
(window as any).CalendarManager = CalendarManager;
