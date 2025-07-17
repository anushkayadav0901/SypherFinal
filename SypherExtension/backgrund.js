// Semantic Shadows Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('Semantic Shadows Extension installed');
  
  // Set up initial storage
  chrome.storage.local.set({
    analysisHistory: [],
    settings: {
      shadowThreshold: 0.3,
      autoAnalyze: false,
      highlightSentences: true
    }
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup - no additional logic needed
  console.log('Extension icon clicked on tab:', tab.id);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveAnalysis') {
    // Save analysis results to storage
    chrome.storage.local.get(['analysisHistory'], (result) => {
      const history = result.analysisHistory || [];
      history.push({
        url: sender.tab.url,
        timestamp: Date.now(),
        shadowScore: request.shadowScore,
        omissionsCount: request.omissionsCount,
        insights: request.insights
      });
      
      // Keep only last 50 analyses
      if (history.length > 50) {
        history.shift();
      }
      
      chrome.storage.local.set({analysisHistory: history});
    });
    
    sendResponse({success: true});
  }
  
  if (request.action === 'getHistory') {
    chrome.storage.local.get(['analysisHistory'], (result) => {
      sendResponse({history: result.analysisHistory || []});
    });
    return true; // Keep message channel open
  }
});

// Context menu for quick analysis
chrome.contextMenus.create({
  id: 'analyzeSelection',
  title: 'Analyze Selection for Semantic Shadows',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeSelection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'analyzeSelection',
      text: info.selectionText
    });
  }
});

// Badge update based on analysis results
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    const shadowScore = request.shadowScore;
    let badgeText = '';
    let badgeColor = '';
    
    if (shadowScore > 0.7) {
      badgeText = 'HIGH';
      badgeColor = '#FF4444';
    } else if (shadowScore > 0.4) {
      badgeText = 'MED';
      badgeColor = '#FFA500';
    } else if (shadowScore > 0.1) {
      badgeText = 'LOW';
      badgeColor = '#4CAF50';
    }
    
    chrome.action.setBadgeText({
      text: badgeText,
      tabId: sender.tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: badgeColor,
      tabId: sender.tab.id
    });
  }
});

// Clear badge when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
  }
});