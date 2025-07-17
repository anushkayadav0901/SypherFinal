// SYPHER OSINT Extension - Background Script
class SypherBackground {
    constructor() {
        this.settings = {
            realTimeScanning: true,
            threatNotifications: true,
            offlineMode: false,
            autoSyncIPFS: true,
            aiPrivacyLayer: true,
            deepfakeDetection: true
        };
        
        this.threatDatabases = {
            maliciousDomains: new Set(),
            phishingPatterns: [],
            malwareSignatures: [],
            deepfakeIndicators: []
        };
        
        this.scanningActive = true;
        this.lastScanTime = Date.now();
        this.scanResults = new Map();
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.loadThreatDatabases();
        this.setupEventListeners();
        this.startPeriodicTasks();
        this.updateBadge();
    }
    
    loadSettings() {
        chrome.storage.local.get(['sypherSettings'], (result) => {
            if (result.sypherSettings) {
                this.settings = { ...this.settings, ...result.sypherSettings };
            }
        });
    }
    
    loadThreatDatabases() {
        // Load threat databases from storage or initialize with defaults
        chrome.storage.local.get(['threatDatabases'], (result) => {
            if (result.threatDatabases) {
                this.threatDatabases = {
                    ...this.threatDatabases,
                    ...result.threatDatabases
                };
            } else {
                this.initializeDefaultThreatData();
            }
        });
    }
    
    initializeDefaultThreatData() {
        // Initialize with common threat patterns
        this.threatDatabases.maliciousDomains = new Set([
            'example-phishing.com',
            'fake-bank.net',
            'suspicious-site.org'
        ]);
        
        this.threatDatabases.phishingPatterns = [
            /urgent.*action.*required/i,
            /verify.*account.*immediately/i,
            /suspended.*account/i,
            /click.*here.*now/i,
            /limited.*time.*offer/i
        ];
        
        this.threatDatabases.malwareSignatures = [
            'eval(unescape(',
            'document.write(unescape(',
            'javascript:void(0)',
            'onclick="javascript:'
        ];
        
        this.saveThreatDatabases();
    }
    
    saveThreatDatabases() {
        chrome.storage.local.set({
            threatDatabases: {
                maliciousDomains: Array.from(this.threatDatabases.maliciousDomains),
                phishingPatterns: this.threatDatabases.phishingPatterns.map(p => p.source),
                malwareSignatures: this.threatDatabases.malwareSignatures,
                deepfakeIndicators: this.threatDatabases.deepfakeIndicators
            }
        });
    }
    
    setupEventListeners() {
        // Handle messages from content script and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });
        
        // Handle tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.scanTab(tabId, tab.url);
            }
        });
        
        // Handle web requests
        chrome.webRequest.onBeforeRequest.addListener(
            (details) => this.analyzeWebRequest(details),
            { urls: ['<all_urls>'] },
            ['requestBody']
        );
        
        // Handle navigation
        chrome.webNavigation.onCommitted.addListener((details) => {
            if (details.frameId === 0) {
                this.analyzeNavigation(details);
            }
        });
    }
    
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'updateSettings':
                this.updateSettings(request.settings);
                sendResponse({ success: true });
                break;
                
            case 'scanPage':
                this.scanPage(request.url, request.content)
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({ error: error.message }));
                break;
                
            case 'reportThreat':
                this.reportThreat(request.threat, sender.tab);
                sendResponse({ success: true });
                break;
                
            case 'getThreatStatus':
                sendResponse(this.getThreatStatus(request.url));
                break;
                
            case 'emergencyStop':
                this.emergencyStop();
                sendResponse({ success: true });
                break;
                
            case 'analyzeMedia':
                this.analyzeMedia(request.mediaData)
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({ error: error.message }));
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        chrome.storage.local.set({ sypherSettings: this.settings });
        
        // Update scanning state
        this.scanningActive = this.settings.realTimeScanning;
        this.updateBadge();
    }
    
    async scanPage(url, content) {
        if (!this.scanningActive) {
            return { threats: [], score: 0 };
        }
        
        const threats = [];
        let dangerScore = 0;
        
        try {
            // Domain analysis
            const domainThreats = await this.analyzeDomain(url);
            threats.push(...domainThreats);
            
            // Content analysis
            const contentThreats = await this.analyzeContent(content);
            threats.push(...contentThreats);
            
            // Calculate danger score
            dangerScore = this.calculateDangerScore(threats);
            
            // Store results
            this.scanResults.set(url, {
                threats,
                score: dangerScore,
                timestamp: Date.now()
            });
            
            // Update badge
            this.updateBadge(dangerScore);
            
            // Send notifications if enabled
            if (this.settings.threatNotifications && threats.length > 0) {
                this.sendThreatNotification(threats);
            }
            
        } catch (error) {
            console.error('Error scanning page:', error);
        }
        
        return { threats, score: dangerScore };
    }
    
    async analyzeDomain(url) {
        const threats = [];
        
        try {
            const domain = new URL(url).hostname;
            
            // Check against malicious domains database
            if (this.threatDatabases.maliciousDomains.has(domain)) {
                threats.push({
                    type: 'malicious_domain',
                    level: 'high',
                    title: 'Malicious Domain',
                    description: `Domain ${domain} is in threat database`,
                    icon: '🚨'
                });
            }
            
            // Check for suspicious domain patterns
            if (this.isSuspiciousDomain(domain)) {
                threats.push({
                    type: 'suspicious_domain',
                    level: 'medium',
                    title: 'Suspicious Domain',
                    description: 'Domain shows suspicious characteristics',
                    icon: '⚠️'
                });
            }
            
            // Check for typosquatting
            const typosquatting = await this.checkTyposquatting(domain);
            if (typosquatting.detected) {
                threats.push({
                    type: 'typosquatting',
                    level: 'high',
                    title: 'Potential Typosquatting',
                    description: `Similar to ${typosquatting.target}`,
                    icon: '🎭'
                });
            }
            
        } catch (error) {
            console.error('Error analyzing domain:', error);
        }
        
        return threats;
    }
    
    async analyzeContent(content) {
        const threats = [];
        
        try {
            // Check for phishing patterns
            for (const pattern of this.threatDatabases.phishingPatterns) {
                const regex = new RegExp(pattern, 'i');
                if (regex.test(content)) {
                    threats.push({
                        type: 'phishing_pattern',
                        level: 'high',
                        title: 'Phishing Pattern Detected',
                        description: 'Content matches known phishing patterns',
                        icon: '🎣'
                    });
                    break;
                }
            }
            
            // Check for malware signatures
            for (const signature of this.threatDatabases.malwareSignatures) {
                if (content.includes(signature)) {
                    threats.push({
                        type: 'malware_signature',
                        level: 'critical',
                        title: 'Malware Signature',
                        description: 'Suspicious code patterns detected',
                        icon: '🦠'
                    });
                    break;
                }
            }
            
            // Check for suspicious links
            const suspiciousLinks = this.findSuspiciousLinks(content);
            if (suspiciousLinks.length > 0) {
                threats.push({
                    type: 'suspicious_links',
                    level: 'medium',
                    title: 'Suspicious Links',
                    description: `${suspiciousLinks.length} suspicious links found`,
                    icon: '🔗'
                });
            }
            
            // Check for data collection forms
            const dataCollection = this.checkDataCollection(content);
            if (dataCollection.detected) {
                threats.push({
                    type: 'data_collection',
                    level: 'medium',
                    title: 'Data Collection Form',
                    description: 'Form requesting sensitive information',
                    icon: '📋'
                });
            }
            
        } catch (error) {
            console.error('Error analyzing content:', error);
        }
        
        return threats;
    }
    
    isSuspiciousDomain(domain) {
        // Check for various suspicious patterns
        const suspiciousPatterns = [
            /\d+\.\d+\.\d+\.\d+/, // IP addresses
            /[a-z]{20,}/, // Very long subdomains
            /[0-9]{5,}/, // Long numbers
            /-.+-.+-.+/, // Multiple hyphens
            /\.(tk|ml|ga|cf)$/, // Suspicious TLDs
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(domain));
    }
    
    async checkTyposquatting(domain) {
        // Simple typosquatting detection
        const popularDomains = [
            'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
            'apple.com', 'twitter.com', 'linkedin.com', 'youtube.com'
        ];
        
        for (const popular of popularDomains) {
            if (this.calculateLevenshteinDistance(domain, popular) <= 2 && domain !== popular) {
                return { detected: true, target: popular };
            }
        }
        
        return { detected: false };
    }
    
    calculateLevenshteinDistance(a, b) {
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }
    
    findSuspiciousLinks(content) {
        const suspiciousLinks = [];
        const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            const url = match[1];
            const text = match[2];
            
            try {
                const urlObj = new URL(url);
                
                // Check for URL shorteners
                const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly'];
                if (shorteners.some(shortener => urlObj.hostname.includes(shortener))) {
                    suspiciousLinks.push({
                        url: url,
                        reason: 'URL shortener',
                        text: text
                    });
                }
                
                // Check for suspicious patterns
                if (this.isSuspiciousDomain(urlObj.hostname)) {
                    suspiciousLinks.push({
                        url: url,
                        reason: 'Suspicious domain',
                        text: text
                    });
                }
                
                // Check for misleading text
                if (text && !text.includes(urlObj.hostname) && text.length > 10) {
                    suspiciousLinks.push({
                        url: url,
                        reason: 'Misleading link text',
                        text: text
                    });
                }
                
            } catch (error) {
                // Invalid URL
                suspiciousLinks.push({
                    url: url,
                    reason: 'Invalid URL format',
                    text: text
                });
            }
        }
        
        return suspiciousLinks;
    }
    
    checkDataCollection(content) {
        const sensitiveFields = [
            'password', 'ssn', 'social', 'credit', 'card', 'cvv',
            'bank', 'account', 'routing', 'pin', 'security'
        ];
        
        const inputRegex = /<input[^>]*name=["']([^"']+)["'][^>]*>/gi;
        let match;
        let sensitiveInputs = 0;
        
        while ((match = inputRegex.exec(content)) !== null) {
            const inputName = match[1].toLowerCase();
            if (sensitiveFields.some(field => inputName.includes(field))) {
                sensitiveInputs++;
            }
        }
        
        return {
            detected: sensitiveInputs > 0,
            count: sensitiveInputs
        };
    }
    
    calculateDangerScore(threats) {
        let score = 0;
        
        threats.forEach(threat => {
            switch (threat.level) {
                case 'critical':
                    score += 100;
                    break;
                case 'high':
                    score += 75;
                    break;
                case 'medium':
                    score += 50;
                    break;
                case 'low':
                    score += 25;
                    break;
            }
        });
        
        return Math.min(score, 100);
    }
    
    getThreatStatus(url) {
        const result = this.scanResults.get(url);
        if (!result) {
            return { threats: [], score: 0, lastScan: null };
        }
        
        return {
            threats: result.threats,
            score: result.score,
            lastScan: result.timestamp
        };
    }
    
    async scanTab(tabId, url) {
        try {
            const result = await chrome.tabs.sendMessage(tabId, { action: 'getPageContent' });
            if (result && result.content) {
                await this.scanPage(url, result.content);
            }
        } catch (error) {
            console.error('Error scanning tab:', error);
        }
    }
    
    analyzeWebRequest(details) {
        // Analyze web requests for suspicious patterns
        if (details.requestBody && details.requestBody.formData) {
            const formData = details.requestBody.formData;
            
            // Check for suspicious form submissions
            const suspiciousPatterns = ['password', 'ssn', 'credit', 'account'];
            const hassensitive = Object.keys(formData).some(key => 
                suspiciousPatterns.some(pattern => key.toLowerCase().includes(pattern))
            );
            
            if (hasensive) {
                this.reportSuspiciousRequest(details);
            }
        }
        
        return {}; // Don't block requests
    }
    
    analyzeNavigation(details) {
        // Analyze navigation events
        if (details.url && this.scanningActive) {
            setTimeout(() => {
                this.scanTab(details.tabId, details.url);
            }, 1000);
        }
    }
    
    reportSuspiciousRequest(details) {
        console.warn('Suspicious request detected:', details.url);
        // Additional reporting logic here
    }
    
    async analyzeMedia(mediaData) {
        if (!this.settings.deepfakeDetection) {
            return { deepfakeDetected: false };
        }
        
        try {
            // Simple deepfake detection (placeholder)
            const indicators = this.threatDatabases.deepfakeIndicators;
            const detected = indicators.some(indicator => 
                mediaData.includes(indicator)
            );
            
            return {
                deepfakeDetected: detected,
                confidence: detected ? 0.8 : 0.1
            };
        } catch (error) {
            console.error('Error analyzing media:', error);
            return { deepfakeDetected: false, error: error.message };
        }
    }
    
    reportThreat(threat, tab) {
        // Report threat to external service or log
        console.log('Threat reported:', threat, 'on tab:', tab.url);
        
        // Add to threat database if appropriate
        if (threat.type === 'malicious_domain') {
            this.threatDatabases.maliciousDomains.add(new URL(tab.url).hostname);
            this.saveThreatDatabases();
        }
    }
    
    sendThreatNotification(threats) {
        const highestThreat = threats.reduce((highest, current) => {
            const levels = { low: 1, medium: 2, high: 3, critical: 4 };
            return levels[current.level] > levels[highest.level] ? current : highest;
        });
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'SYPHER Security Alert',
            message: `${highestThreat.title}: ${highestThreat.description}`
        });
    }
    
    updateBadge(score = 0) {
        let badgeText = '';
        let badgeColor = '#4CAF50';
        
        if (score > 75) {
            badgeText = '⚠️';
            badgeColor = '#F44336';
        } else if (score > 50) {
            badgeText = '⚠️';
            badgeColor = '#FF9800';
        } else if (score > 25) {
            badgeText = '⚠️';
            badgeColor = '#FFC107';
        }
        
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    }
    
    startPeriodicTasks() {
        // Update threat databases periodically
        setInterval(() => {
            this.updateThreatDatabases();
        }, 60000 * 60); // Every hour
        
        // Clean old scan results
        setInterval(() => {
            this.cleanOldResults();
        }, 60000 * 10); // Every 10 minutes
    }
    
    updateThreatDatabases() {
        // Update threat databases from remote sources
        // This is a placeholder - in a real implementation, you'd fetch from threat intelligence APIs
        console.log('Updating threat databases...');
    }
    
    cleanOldResults() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        
        for (const [url, result] of this.scanResults.entries()) {
            if (result.timestamp < cutoff) {
                this.scanResults.delete(url);
            }
        }
    }
    
    emergencyStop() {
        this.scanningActive = false;
        chrome.action.setBadgeText({ text: '🛑' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        console.log('Emergency stop activated');
    }
}

// Initialize the background script
const sypherBackground = new SypherBackground();