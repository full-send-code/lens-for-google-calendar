// Background script for Lens for Google Calendar
console.log('Background script loaded');

// Chrome runtime onInstalled listener
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First install
    console.log('Extension installed');
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  // For compatibility with our content script initialization
  if (message.action === 'openOptions') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
  }
  
  // Always respond to content script initialization
  sendResponse({});
  
  return true;
});
