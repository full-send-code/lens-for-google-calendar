import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/Root/App';

// Function to inject our React app into the page
function injectReactApp() {
  console.log('Injecting React app into Google Calendar');
  
  // Look for the Calendar container (for passing to the overlay)
  const calendarContainer = document.querySelector('#calendar-container') || 
                           document.querySelector('[role="main"]') || 
                           document.querySelector('#maincell');
                           
  if (!calendarContainer) {
    console.error('Could not find Google Calendar container');
    return;
  }
  
  // Look for the header element where we'll inject our button row
  // This is similar to the approach used in the original inject.js
  const headerElement = document.querySelectorAll('header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)')[0];
  
  if (!headerElement) {
    console.error('Could not find Google Calendar header');
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
}

// Helper function to observe DOM changes
function observeGoogleCalendar() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // If our app is not yet injected and both header and calendar container now exist
        const calendarContainer = document.querySelector('#calendar-container') || 
                                document.querySelector('[role="main"]') || 
                                document.querySelector('#maincell');
                                
        const headerElement = document.querySelectorAll('header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)')[0];
        
        if (!document.getElementById('google-calendar-selector-app') && 
            calendarContainer && headerElement) {
          observer.disconnect();
          injectReactApp();
          return;
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // Also try immediately in case the calendar is already loaded
  const calendarContainer = document.querySelector('#calendar-container') || 
                          document.querySelector('[role="main"]') || 
                          document.querySelector('#maincell');
                          
  const headerElement = document.querySelectorAll('header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)')[0];
  
  if (calendarContainer && headerElement) {
    injectReactApp();
  }
}

// Start observing the page
observeGoogleCalendar();
