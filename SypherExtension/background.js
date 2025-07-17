// Background service worker for SYPHER extension
const SYPHER_BG = {
  phishingKeywords: ['urgent', 'click here', 'verify now', 'suspended', 'act now', 'winner', 'congratulations', 'claim', 'prize', 'lottery', 'bitcoin', 'cryptocurrency', 'investment', 'roi', 'profit', 'guaranteed', 'risk-free', 'double your money', 'easy money', 'make money fast', 'work from home', 'free money', 'get rich quick'],
  gamblingKeywords: ['casino', 'poker', 'rummy', 'betting', 'slots', 'jackpot', 'gamble', 'wager', 'bet', 'odds', 'blackjack', 'roulette', 'dice', 'lottery', 'scratch card', 'bingo', 'sports betting', 'horse racing'],
  highRiskDomains: ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'short.link', 'rebrand.ly', 'cutt.ly', 'tiny.cc', 'is.gd'],
  
  threatDatabase: new Map(),
  evidenceStorage: [],
  activeAlerts: new Map()
};

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('SYPHER Extension installed/updated');
  
  // Initialize storage
  chrome.storage.local.set({
    dangerScore: 0,
    evidenceList: [],
    threatHistory: [],
    settings: {
      privacyMode: false,
      realTimeScanning: true,
      notificationsEnabled: true
    }
  });
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'sypher-analyze',
    title: 'Analyze with SYPHER',
    contexts: ['selection', 'page']
  });
  
  // Set up alarms
  chrome.alarms.create('threatScan', { periodInMinutes: 5 });
  chrome.alarms.create('updateCheck', { periodInMinutes: 60 });
  
  if (details.reason === 'install') {
    // Show welcome notification
    chrome.notifications.create('welcome', {
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'SYPHER Extension Active',
      message: 'AI-powered threat detection is now monitoring your browsing'
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sypher-analyze') {
    if (info.selectionText) {
      analyzeSentiment(info.selectionText, tab.id);
    } else {
      scanPage(tab.id); // This function was called but not defined. This change adds it.
    }
  }
});

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'threatScan':
      performBackgroundScan();
      break;
    case 'updateCheck':
      checkForUpdates();
      break;
  }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);
  
  switch (request.action) {
    case 'analyzePage':
      analyzePage(request.url, request.title, sender.tab?.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'pageScanned':
      handlePageScan(request.data, sender.tab?.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'threatDetected':
      handleThreatDetection(request, sender.tab?.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'sensitiveDataDetected':
      handleSensitiveData(request, sender.tab?.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'getEvidence':
      getEvidence()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'addEvidence':
      addEvidence(request.evidence)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'exportEvidence':
      exportEvidence()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'performDork':
      performDork(request.query, request.type)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'analyzeSentiment':
      analyzeSentiment(request.text, sender.tab?.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'scanCurrentPage':
      scanCurrentPage(sender.tab?.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'getThreatHistory':
      getThreatHistory()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'clearThreatHistory':
      clearThreatHistory()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'updateSettings':
      updateSettings(request.settings)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
  
  return true;
});

// Analyze page content
async function analyzePage(url, title, tabId) {
  if (!url || !title) return { score: 0, alerts: [] };
  
  let score = 0;
  let alerts = [];
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Check high-risk domains
    if (SYPHER_BG.highRiskDomains.some(d => domain.includes(d))) {
      score += 30;
      alerts.push({
        type: 'high',
        title: '🔴 High Risk Domain',
        description: `Shortened URL detected: ${domain}`,
        timestamp: Date.now()
      });
    }
    
    // Check for gambling content
    if (SYPHER_BG.gamblingKeywords.some(keyword => 
      domain.includes(keyword) || title.toLowerCase().includes(keyword))) {
      score += 50;
      alerts.push({
        type: 'high',
        title: '🎰 Gambling Content Detected',
        description: `Gambling-related content: ${domain}`,
        timestamp: Date.now()
      });
    }
    
    // Check for phishing keywords
    if (SYPHER_BG.phishingKeywords.some(keyword => 
      title.toLowerCase().includes(keyword))) {
      score += 25;
      alerts.push({
        type: 'medium',
        title: '⚠️ Suspicious Content',
        description: 'Phishing indicators detected in page title',
        timestamp: Date.now()
      });
    }
    
    // Check for insecure connection
    if (url.includes('http://') && !url.includes('localhost')) {
      score += 20;
      alerts.push({
        type: 'medium',
        title: '🔓 Insecure Connection',
        description: 'Site uses HTTP instead of HTTPS',
        timestamp: Date.now()
      });
    }
    
    // Check threat database
    if (SYPHER_BG.threatDatabase.has(domain)) {
      const threatInfo = SYPHER_BG.threatDatabase.get(domain);
      score += threatInfo.score;
      alerts.push({
        type: 'high',
        title: '🚨 Known Threat',
        description: `Domain flagged: ${threatInfo.reason}`,
        timestamp: Date.now()
      });
    }
    
    // Store analysis result
    await storeThreatAnalysis(url, domain, score, alerts);
    
    // Update badge
    if (tabId) {
      updateBadge(tabId, score);
    }
    
    // Send notifications for high-risk content
    if (score > 70) {
      showThreatNotification(domain, score);
    }
    
  } catch (error) {
    console.error('Error analyzing page:', error);
    alerts.push({
      type: 'low',
      title: '⚠️ Analysis Error',
      description: 'Unable to fully analyze page',
      timestamp: Date.now()
    });
  }
  
  return { score: Math.min(score, 100), alerts };
}

// Handle page scan from content script
async function handlePageScan(pageData, tabId) {
  console.log('Page scan received:', pageData);
  
  const analysis = await analyzePage(pageData.url, pageData.title, tabId);
  
  // Additional analysis based on page content
  if (pageData.text) {
    const sentimentAnalysis = await analyzeSentiment(pageData.text, tabId);
    if (sentimentAnalysis.riskScore > 30) {
      analysis.score += sentimentAnalysis.riskScore / 2;
      analysis.alerts.push({
        type: sentimentAnalysis.riskLevel,
        title: '📝 Content Analysis',
        description: `Suspicious content patterns detected`,
        timestamp: Date.now()
      });
    }
  }
  
  return analysis;
}

// Handle threat detection from content script
async function handleThreatDetection(request, tabId) {
  console.log('Threat detected:', request.type, request.data);
  
  const threat = {
    id: Date.now(),
    type: request.type,
    data: request.data,
    timestamp: request.timestamp,
    tabId: tabId
  };
  
  // Store threat
  const result = await chrome.storage.local.get(['threatHistory']);
  const threatHistory = result.threatHistory || [];
  threatHistory.push(threat);
  
  // Keep only last 100 threats
  if (threatHistory.length > 100) {
    threatHistory.splice(0, threatHistory.length - 100);
  }
  
  await chrome.storage.local.set({ threatHistory });
  
  // Update active alerts
  SYPHER_BG.activeAlerts.set(threat.id, threat);
  
  // Show notification for high-priority threats
  if (['insecure_form', 'sensitive_request'].includes(request.type)) {
    chrome.notifications.create(`threat_${threat.id}`, {
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'SYPHER Security Alert',
      message: `${request.type.replace('_', ' ')} detected on ${request.data.url || 'current page'}`
    });
  }
  
  return { success: true, threatId: threat.id };
}

// Handle sensitive data detection
async function handleSensitiveData(request, tabId) {
  console.log('Sensitive data detected:', request.type);
  
  const evidence = {
    id: Date.now(),
    type: 'sensitive_data',
    description: `${request.type} detected on page`,
    url: request.url,
    timestamp: request.timestamp,
    data: request.text.substring(0, 100) // Limit stored data
  };
  
  await addEvidence(evidence);
  
  // High-priority notification
  chrome.notifications.create(`sensitive_${evidence.id}`, {
    type: 'basic',
    iconUrl: '/icons/icon128.png',
    title: 'SYPHER Data Leak Alert',
    message: `Potential ${request.type} exposure detected`
  });
  
  return { success: true };
}

// Get evidence from storage
async function getEvidence() {
  const result = await chrome.storage.local.get(['evidenceList']);
  return result.evidenceList || [];
}

// Add evidence to storage
async function addEvidence(evidence) {
  const result = await chrome.storage.local.get(['evidenceList']);
  const evidenceList = result.evidenceList || [];
  
  evidenceList.push({
    ...evidence,
    id: evidence.id || Date.now(),
    timestamp: evidence.timestamp || new Date().toISOString()
  });
  
  await chrome.storage.local.set({ evidenceList });
  return { success: true };
}

// Export evidence as JSON
async function exportEvidence() {
  const evidenceList = await getEvidence();
  const threatHistory = await getThreatHistory();
  
  const report = {
    generated: new Date().toISOString(),
    evidence: evidenceList,
    threats: threatHistory,
    summary: {
      totalEvidence: evidenceList.length,
      totalThreats: threatHistory.length,
      riskScore: await calculateOverallRiskScore()
    }
  };
  
  // Create download
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  await chrome.downloads.download({
    url: url,
    filename: `sypher_report_${Date.now()}.json`,
    saveAs: true
  });
  
  return { success: true };
}

// Perform Google dork simulation
async function performDork(query, type) {
  // Simulate dork search results
  const typeQueries = {
    credential: `${query} "password" OR "username" OR "login"`,
    directory: `${query} intitle:"index of"`,
    file: `${query} filetype:pdf OR filetype:doc OR filetype:xls`,
    vulnerability: `${query} "sql injection" OR "xss" OR "vulnerability"`,
    social: `${query} site:facebook.com OR site:twitter.com OR site:instagram.com`,
    phishing: `${query} "phishing" OR "scam" OR "fake"`
  };
  
  const fullQuery = typeQueries[type] || query;
  
  // Simulate results
  const results = [
    {
      title: `OSINT Result for: ${fullQuery}`,
      description: `Simulated search result for ${type} analysis`,
      url: `https://example.com/search?q=${encodeURIComponent(fullQuery)}`,
      risk: Math.random() > 0.5 ? 'high' : 'medium',
      timestamp: Date.now()
    },
    {
      title: `Data Leak Detection`,
      description: `Potential data exposure found in public repositories`,
      url: `https://github.com/search?q=${encodeURIComponent(query)}`,
      risk: 'high',
      timestamp: Date.now()
    },
    {
      title: `Security Advisory`,
      description: `Related security information and advisories`,
      url: `https://nvd.nist.gov/search?q=${encodeURIComponent(query)}`,
      risk: 'medium',
      timestamp: Date.now()
    }
  ];
  
  return results;
}

// Analyze sentiment/threat level of text
async function analyzeSentiment(text, tabId) {
  const lowerText = text.toLowerCase();
  let riskScore = 0;
  let threats = [];
  
  // Check phishing keywords
  SYPHER_BG.phishingKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      riskScore += 15;
      threats.push(keyword);
    }
  });
  
  // Check gambling keywords
  SYPHER_BG.gamblingKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      riskScore += 20;
      threats.push(keyword);
    }
  });
  
  // Check urgency words
  const urgencyWords = ['urgent', 'immediate', 'now', 'quickly', 'asap', 'deadline'];
  urgencyWords.forEach(word => {
    if (lowerText.includes(word)) {
      riskScore += 10;
      threats.push(word);
    }
  });
  
  // Check financial words
  const financialWords = ['money', 'payment', 'card', 'bank', 'account', 'credit'];
  financialWords.forEach(word => {
    if (lowerText.includes(word)) {
      riskScore += 8;
      threats.push(word);
    }
  });
  
  let riskLevel = 'low';
  if (riskScore > 50) riskLevel = 'high';
  else if (riskScore > 25) riskLevel = 'medium';
  
  const analysis = {
    riskLevel,
    riskScore: Math.min(riskScore, 100),
    threats: [...new Set(threats)],
    analysis: generateThreatAnalysis(riskLevel, threats)
  };
  
  // Store high-risk analysis
  if (riskScore > 50) {
    await addEvidence({
      type: 'text_analysis',
      description: `High-risk text analysis: ${analysis.analysis}`,
      url: 'current_page',
      data: text.substring(0, 200)
    });
  }
  
  return analysis;
}

// Generate threat analysis description
function generateThreatAnalysis(riskLevel, threats) {
  if (riskLevel === 'high') {
    return `HIGH RISK: Multiple threat indicators detected. Contains ${threats.length} suspicious terms.`;
  } else if (riskLevel === 'medium') {
    return `MEDIUM RISK: Some concerning patterns found. Monitor closely.`;
  } else {
    return `LOW RISK: No significant threats detected. Content appears safe.`;
  }
}

// Calculate overall risk score based on stored evidence and threat history
async function calculateOverallRiskScore() {
  const evidenceList = await getEvidence();
  const threatHistory = await getThreatHistory();
  
  let totalScore = 0;
  totalScore += evidenceList.reduce((acc, evidence) => acc + (evidence.riskScore || 0), 0);
  totalScore += threatHistory.reduce((acc, threat) => acc + (threat.score || 0), 0);
  
  return Math.min(totalScore, 100); // Ensure the score does not exceed 100
}

// Store threat analysis result in local storage
async function storeThreatAnalysis(url, domain, score, alerts) {
  const result = await chrome.storage.local.get(['threatHistory']);
  const threatHistory = result.threatHistory || [];
  
  threatHistory.push({
    url,
    domain,
    score,
    alerts,
    timestamp: Date.now()
  });
  
  await chrome.storage.local.set({ threatHistory });
}

// Update the badge with the current threat score
function updateBadge(tabId, score) {
  const badgeText = score > 70 ? 'HIGH' : score > 30 ? 'MED' : '';
  const badgeColor = score > 70 ? '#ff4444' : score > 30 ? '#ffaa00' : '#00ff88';
  
  // Use chrome.action for Manifest V3, not chrome.browserAction
  chrome.action.setBadgeText({ text: badgeText, tabId: tabId });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tabId });
}

// Show threat notification
function showThreatNotification(domain, score) {
  chrome.notifications.create(`threat_notification_${Date.now()}`, {
    type: 'basic',
    iconUrl: '/icons/icon128.png',
    title: 'Threat Detected!',
    message: `High risk detected on ${domain}. Risk Score: ${score}`,
    priority: 2
  });
}

// Clear threat history
async function clearThreatHistory() {
  await chrome.storage.local.set({ threatHistory: [] });
  return { success: true };
}

// Update settings in local storage
async function updateSettings(newSettings) {
  const result = await chrome.storage.local.get(['settings']);
  const settings = { ...result.settings, ...newSettings };
  await chrome.storage.local.set({ settings });
  return { success: true };
}

// Get threat history from storage
async function getThreatHistory() {
  const result = await chrome.storage.local.get(['threatHistory']);
  return result.threatHistory || [];
}

// Initialize the SYPHER background service worker
console.log('SYPHER Background Service Worker initialized');

/**
 * Triggers a scan of the content on a specific tab.
 * This is called from the context menu when no text is selected.
 * @param {number} tabId The ID of the tab to scan.
 */
async function scanPage(tabId) {
  if (!tabId) {
    console.error("scanPage was called without a tabId.");
    return;
  }
  console.log(`Requesting content script to scan tab: ${tabId}`);
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'scanPage' });
  } catch (error) {
    console.error(`Could not send 'scanPage' message to tab ${tabId}. The content script might not be injected. Error: ${error.message}`);
  }
}
