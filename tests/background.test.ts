import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('background.ts', () => {
  let messageListener: (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => boolean;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset chrome.runtime.onMessage
    (chrome.runtime.onMessage.addListener as jest.Mock) = jest.fn((listener: any) => {
      messageListener = listener as typeof messageListener;
    });

    // Import the background script (this will execute it and register the listener)
    require('../src/background');
  });

  it('should register a message listener', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should respond with ready status when message is received', () => {
    const mockSendResponse = jest.fn();
    const mockSender: chrome.runtime.MessageSender = { 
      tab: { 
        id: 1,
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: false,
        incognito: false,
        selected: false
      } as chrome.tabs.Tab
    };
    const mockMessage = { action: 'test' };

    const result = messageListener(mockMessage, mockSender, mockSendResponse);

    expect(mockSendResponse).toHaveBeenCalledWith({ status: 'ready' });
    expect(result).toBe(true);
  });

  it('should return true to keep message channel open', () => {
    const mockSendResponse = jest.fn();
    const mockSender: chrome.runtime.MessageSender = {};
    const mockMessage = {};

    const result = messageListener(mockMessage, mockSender, mockSendResponse);

    expect(result).toBe(true);
  });

  it('should handle empty messages', () => {
    const mockSendResponse = jest.fn();
    const mockSender: chrome.runtime.MessageSender = {};
    const mockMessage = null;

    const result = messageListener(mockMessage, mockSender, mockSendResponse);

    expect(mockSendResponse).toHaveBeenCalledWith({ status: 'ready' });
    expect(result).toBe(true);
  });
});
