// Content script that runs in the context of web pages
(function() {
  'use strict';
  
  const SYPHER_CONFIG = {
    phishingKeywords: ['urgent', 'click here', 'verify now', 'suspended', 'act now', 'winner', 'congratulations', 'claim', 'prize', 'lottery', 'bitcoin', 'cryptocurrency', 'investment', 'roi', 'profit', 'guaranteed', 'risk-free', 'double your money', 'easy money', 'make money fast', 'work from home', 'free money', 'get rich quick'],
    gamblingKeywords: ['casino', 'poker', 'rummy', 'betting', 'slots', 'jackpot', 'gamble', 'wager', 'bet', 'odds', 'blackjack', 'roulette', 'dice', 'lottery', 'scratch card', 'bingo', 'sports betting', 'horse racing'],
    highRiskDomains: ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'short.link', 'rebrand.ly', 'cutt.ly', 'tiny.cc', 'is.gd'],
    suspiciousPatterns: [
      /password\s*[:=]\s*[^\s]+/i,
      /username\s*[:=]\s*[^\s]+/i,
      /api[_-]?key\s*[:=]\s*[^\s]+/i,
      /secret\s*[:=]\s*[^\s]+/i,
      /token\s*[:=]\s*[^\s]+/i
    ]
  };

  let isInitialized = false;
  let observerActive = false;
  let suspiciousElements = new Set();

  // Initialize content script
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    // Start monitoring
    startDOMMonitoring();
    interceptNetworkRequests();
    
    // Initial page scan
    setTimeout(() => {
      scanCurrentPage();
    }, 1000);

    console.log('SYPHER Content Script initialized');
  }

  // Start monitoring DOM changes
  function startDOMMonitoring() {
    if (observerActive) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          checkForSuspiciousElements(mutation.addedNodes);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    observerActive = true;
  }

  // Check for suspicious elements in added nodes
  function checkForSuspiciousElements(nodes) {
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        analyzeElement(node);
        
        // Check child elements
        const childElements = node.querySelectorAll('*');
        childElements.forEach(child => analyzeElement(child));
      } else if (node.nodeType === Node.TEXT_NODE) {
        analyzeTextNode(node);
      }
    });
  }

  // Analyze individual element
  function analyzeElement(element) {
    if (!element || suspiciousElements.has(element)) return;

    const text = element.textContent?.toLowerCase() || '';
    const tagName = element.tagName?.toLowerCase() || '';

    // Check for phishing keywords
    if (SYPHER_CONFIG.phishingKeywords.some(keyword => text.includes(keyword))) {
      markAsSuspicious(element, 'phishing', 'Phishing keywords detected');
    }

    // Check for gambling content
    if (SYPHER_CONFIG.gamblingKeywords.some(keyword => text.includes(keyword))) {
      markAsSuspicious(element, 'gambling', 'Gambling content detected');
    }

    // Check forms
    if (tagName === 'form') {
      analyzeForm(element);
    }

    // Check input fields
    if (tagName === 'input') {
      analyzeInput(element);
    }

    // Check links
    if (tagName === 'a') {
      analyzeLink(element);
    }
  }

  // Analyze text nodes for sensitive patterns
  function analyzeTextNode(node) {
    if (!node.textContent) return;

    const text = node.textContent;
    SYPHER_CONFIG.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        reportSensitiveData(text, 'credential_leak');
      }
    });
  }

  // Analyze form elements
  function analyzeForm(form) {
    const action = form.action || '';
    const method = form.method || 'GET';
    
    // Check for insecure forms
    if (action.startsWith('http://') && !action.includes('localhost')) {
      markAsSuspicious(form, 'insecure', 'Form submits over HTTP');
      reportThreat('insecure_form', {
        url: window.location.href,
        formAction: action,
        method: method
      });
    }

    // Check for password fields
    const passwordFields = form.querySelectorAll('input[type="password"]');
    if (passwordFields.length > 0 && window.location.protocol === 'http:') {
      markAsSuspicious(form, 'insecure', 'Password field on HTTP page');
    }
  }

  // Analyze input fields
  function analyzeInput(input) {
    const type = input.type?.toLowerCase() || '';
    const name = input.name?.toLowerCase() || '';
    const placeholder = input.placeholder?.toLowerCase() || '';

    // Check for sensitive input fields
    if (type === 'password' || name.includes('password') || placeholder.includes('password')) {
      if (window.location.protocol === 'http:') {
        markAsSuspicious(input, 'insecure', 'Password field on insecure connection');
      }
    }
  }

  // Analyze links
  function analyzeLink(link) {
    const href = link.href || '';
    const domain = extractDomain(href);

    if (domain && SYPHER_CONFIG.highRiskDomains.some(d => domain.includes(d))) {
      markAsSuspicious(link, 'suspicious_link', 'Link to high-risk domain');
    }
  }

  // Mark element as suspicious
  function markAsSuspicious(element, type, reason) {
    if (suspiciousElements.has(element)) return;

    suspiciousElements.add(element);
    
    // Add visual indicator
    if (element.style) {
      element.style.outline = '2px solid #ff4444';
      element.style.position = 'relative';
    }

    // Create warning badge
    const warning = document.createElement('div');
    warning.innerHTML = '⚠️ SYPHER';
    warning.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      background: #ff4444;
      color: white;
      padding: 2px 5px;
      font-size: 10px;
      font-weight: bold;
      z-index: 9999;
      border-radius: 2px;
      pointer-events: none;
    `;
    
    element.appendChild(warning);

    // Report to background script
    reportThreat(type, {
      url: window.location.href,
      reason: reason,
      elementTag: element.tagName,
      elementText: element.textContent?.substring(0, 100) || ''
    });
  }

  // Scan current page
  function scanCurrentPage() {
    const pageData = {
      url: window.location.href,
      title: document.title,
      text: document.body.innerText || '',
      domain: window.location.hostname,
      protocol: window.location.protocol,
      forms: document.forms.length,
      inputs: document.querySelectorAll('input').length,
      links: document.querySelectorAll('a').length
    };

    // Send to background script
    chrome.runtime.sendMessage({
      action: 'pageScanned',
      data: pageData
    });

    // Analyze all existing elements
    checkForSuspiciousElements([document.body]);
  }

  // Intercept network requests
  function interceptNetworkRequests() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = args[0];
      const options = args[1] || {};
      
      if (typeof url === 'string') {
        analyzeFetchRequest(url, options);
      }
      
      return originalFetch.apply(this, args);
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      if (url) {
        analyzeFetchRequest(url, { method });
      }
      return originalXHROpen.apply(this, arguments);
    };
  }

  // Analyze fetch/XHR requests
  function analyzeFetchRequest(url, options) {
    // Check for sensitive endpoints
    const sensitivePatterns = [
      /password/i,
      /login/i,
      /auth/i,
      /token/i,
      /api[_-]?key/i,
      /secret/i
    ];

    if (sensitivePatterns.some(pattern => pattern.test(url))) {
      reportThreat('sensitive_request', {
        url: url,
        method: options.method || 'GET',
        pageUrl: window.location.href
      });
    }
  }

  // Report threat to background script
  function reportThreat(type, data) {
    chrome.runtime.sendMessage({
      action: 'threatDetected',
      type: type,
      data: data,
      timestamp: Date.now()
    });
  }

  // Report sensitive data exposure
  function reportSensitiveData(text, type) {
    chrome.runtime.sendMessage({
      action: 'sensitiveDataDetected',
      type: type,
      text: text.substring(0, 200), // Limit text length
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  // Extract domain from URL
  function extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return null;
    }
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'scanPage':
        scanCurrentPage();
        sendResponse({ success: true });
        break;
        
      case 'getPageInfo':
        const pageInfo = {
          url: window.location.href,
          title: document.title,
          text: document.body.innerText || '',
          domain: window.location.hostname,
          suspiciousCount: suspiciousElements.size
        };
        sendResponse(pageInfo);
        break;
        
      case 'highlightThreats':
        // Re-highlight all suspicious elements
        suspiciousElements.forEach(element => {
          if (element.style) {
            element.style.outline = '2px solid #ff4444';
          }
        });
        sendResponse({ highlighted: suspiciousElements.size });
        break;
        
      case 'clearHighlights':
        // Remove all highlights
        suspiciousElements.forEach(element => {
          if (element.style) {
            element.style.outline = '';
          }
          const warning = element.querySelector('[data-sypher-warning]');
          if (warning) {
            warning.remove();
          }
        });
        sendResponse({ cleared: suspiciousElements.size });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true; // Required for async response
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialize on page changes (for SPAs)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(scanCurrentPage, 500);
    }
  }, 1000);

})();