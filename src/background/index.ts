// Background script for shopAI side panel extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('shopAI extension installed');
});

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Basic message handling (can be extended later)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.type === 'PING') {
    sendResponse({ success: true, message: 'pong' });
  }
  
  return true;
});