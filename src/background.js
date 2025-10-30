// Add message listener for content script communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages from content script
  sendResponse({status: "ready"});
  return true; // Keep message channel open for async response
});

// Handle extension icon click to open settings page
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('settings.html')
  });
});

// setTimeout( () => chrome.browserAction.disable(), 5000 )
