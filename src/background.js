// Add message listener for content script communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages from content script
  sendResponse({status: "ready"});
  return true; // Keep message channel open for async response
});

// Handle extension icon click to open options page
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

// setTimeout( () => chrome.browserAction.disable(), 5000 )
