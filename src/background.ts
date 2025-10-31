// Add message listener for content script communication
chrome.runtime.onMessage.addListener(
  (
    _message: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean => {
    // Handle messages from content script
    sendResponse({ status: "ready" });
    return true; // Keep message channel open for async response
  }
);

// setTimeout( () => chrome.browserAction.disable(), 5000 )
