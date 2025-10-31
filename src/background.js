// Add message listener for content script communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle storage operations from content script
  if (message.action === 'storage-set') {
    chrome.storage.sync.set(message.data, () => {
      if (chrome.runtime.lastError) {
        sendResponse({success: false, error: chrome.runtime.lastError.message});
      } else {
        sendResponse({success: true});
      }
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'storage-get') {
    chrome.storage.sync.get(message.keys, (result) => {
      if (chrome.runtime.lastError) {
        sendResponse({success: false, error: chrome.runtime.lastError.message});
      } else {
        sendResponse({success: true, data: result});
      }
    });
    return true; // Keep message channel open for async response
  }
  
  // Default response for other messages
  sendResponse({status: "ready"});
  return true;
});

// Handle extension icon click to open options page
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

// setTimeout( () => chrome.browserAction.disable(), 5000 )
