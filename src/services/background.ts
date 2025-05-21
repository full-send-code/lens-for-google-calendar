// Background script for Lens for Google Calendar
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

function log(level: 'log' | 'warn' | 'error', message: string, ...data: any[]) {
  const prefix = '[Lens for Google Calendar Background]';
  
  switch(level) {
    case 'warn':
      console.warn(`${prefix} ${message}`, ...data);
      break;
    case 'error':
      console.error(`${prefix} ${message}`, ...data);
      break;
    default:
      console.log(`${prefix} ${message}`, ...data);
  }
}

log('log', 'Background script loaded');

// Keep track of which tabs have the extension loaded
const activeTabsMap = new Map<number, boolean>();

// Chrome runtime onInstalled listener
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    log('log', 'Extension installed');
  } else if (details.reason === 'update') {
    const thisVersion = chrome.runtime.getManifest().version;
    log('log', `Extension updated to version ${thisVersion}`);
  }
});

// Listen for tab updates to reset injected state when navigating
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    // Tab is navigating, reset the injection state
    activeTabsMap.delete(tabId);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    const tabId = sender.tab?.id;
    log('log', 'Received message:', message, 'from tab:', tabId);
    
    // Handle different action types
    switch (message.action) {
      case 'contentScriptLoaded': {
        // Content script is letting us know it's loaded
        if (tabId) {
          activeTabsMap.set(tabId, true);
          log('log', `Content script loaded in tab ${tabId}`);
        }
        
        sendResponse({ 
          status: 'acknowledged', 
          timestamp: Date.now(),
          debug: DEBUG_MODE 
        });
        break;
      }
      
      case 'openOptions': {
        // Request to open options page
        chrome.runtime.openOptionsPage();
        sendResponse({ status: 'success', action: 'openedOptions' });
        break;
      }
      
      default: {
        // Default response for compatibility with existing code
        sendResponse({ status: 'received', message: 'Unknown action type' });
      }
    }
  } catch (error) {
    log('error', 'Error handling message', error);
    // Send error response
    sendResponse({ status: 'error', error: String(error) });
  }
  
  // Return true to indicate we will send a response asynchronously
  return true;
});
