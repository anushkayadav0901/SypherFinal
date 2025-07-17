class SypherExtension {
    constructor() {
        this.dangerScore = 23;
        this.evidenceList = [];
        this.phishingKeywords = ['urgent', 'click here', 'verify now', 'suspended', 'act now', 'winner', 'congratulations', 'claim', 'prize', 'lottery', 'bitcoin', 'cryptocurrency', 'investment', 'roi', 'profit', 'guaranteed', 'risk-free', 'double your money', 'easy money', 'make money fast', 'work from home', 'free money', 'get rich quick'];
        this.gamblingKeywords = ['casino', 'poker', 'rummy', 'betting', 'slots', 'jackpot', 'gamble', 'wager', 'bet', 'odds', 'blackjack', 'roulette', 'dice', 'lottery', 'scratch card', 'bingo', 'sports betting', 'horse racing'];
        this.highRiskDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'short.link', 'rebrand.ly', 'cutt.ly', 'tiny.cc', 'is.gd'];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateNetworkStatus();
        this.checkCurrentPage();
        this.loadEvidence(); // Load evidence on init
        setInterval(() => this.updateNetworkStatus(), 30000);
    }

    setupEventListeners() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.getElementById('perform-dork').addEventListener('click', () => this.performDork());
        document.getElementById('analyze-sentiment').addEventListener('click', () => this.analyzeSentiment());
        document.getElementById('collect-evidence').addEventListener('click', () => this.collectEvidence());
        document.getElementById('scan-page').addEventListener('click', () => this.scanCurrentPage());
        document.getElementById('export-evidence').addEventListener('click', () => this.exportEvidence());
        document.getElementById('sync-ipfs').addEventListener('click', () => this.syncIPFS());
        document.getElementById('privacy-mode').addEventListener('click', () => this.togglePrivacyMode());
        document.getElementById('disable-privacy').addEventListener('click', () => this.togglePrivacyMode());
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    updateNetworkStatus() {
        const indicator = document.getElementById('network-indicator');
        const text = document.getElementById('network-text');
        
        if (navigator.onLine) {
            indicator.className = 'online';
            indicator.textContent = '●';
            text.textContent = 'Online - IPFS Sync Ready';
        } else {
            indicator.className = 'offline';
            indicator.textContent = '●';
            text.textContent = 'Offline - Local Mode Active';
        }
    }

    async checkCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                this.analyzePage(tab.url, tab.title);
            }
        } catch (error) {
            console.error('Error checking current page:', error);
        }
    }

    analyzePage(url, title) {
        let score = 0;
        let alerts = [];

        if (url) {
            const domain = new URL(url).hostname.toLowerCase();
            
            if (this.highRiskDomains.some(d => domain.includes(d))) {
                score += 30;
                alerts.push({
                    type: 'high',
                    title: '🔴 High Risk Domain',
                    description: `Shortened URL detected: ${domain}`
                });
            }

            if (this.gamblingKeywords.some(keyword => domain.includes(keyword) || title.toLowerCase().includes(keyword))) {
                score += 50;
                alerts.push({
                    type: 'high',
                    title: '🎰 Gambling Content Detected',
                    description: `Gambling-related content: ${domain}`
                });
            }

            if (this.phishingKeywords.some(keyword => title.toLowerCase().includes(keyword))) {
                score += 25;
                alerts.push({
                    type: 'medium',
                    title: '⚠️ Suspicious Content',
                    description: `Phishing indicators detected in page title`
                });
            }

            if (url.includes('http://') && !url.includes('localhost')) {
                score += 20;
                alerts.push({
                    type: 'medium',
                    title: '🔓 Insecure Connection',
                    description: `Site uses HTTP instead of HTTPS`
                });
            }
        }

        this.updateDangerScore(score);
        this.updateAlerts(alerts);
    }

    updateDangerScore(score) {
        this.dangerScore = Math.min(score, 100);
        const scoreElement = document.getElementById('danger-score');
        const progressElement = document.getElementById('danger-progress');
        
        scoreElement.textContent = this.dangerScore;
        progressElement.style.width = `${this.dangerScore}%`;
        
        scoreElement.className = 'score-value';
        if (this.dangerScore <= 30) {
            scoreElement.classList.add('score-low');
        } else if (this.dangerScore <= 70) {
            scoreElement.classList.add('score-medium');
        } else {
            scoreElement.classList.add('score-high');
        }
    }

    updateAlerts(newAlerts) {
        const container = document.getElementById('alerts-container');
        container.innerHTML = '';
        
        newAlerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert alert-${alert.type}`;
            alertElement.innerHTML = `
                <div class="alert-title">${alert.title}</div>
                <div class="alert-description">${alert.description}</div>
            `;
            container.appendChild(alertElement);
        });

        if (newAlerts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-low">
                    <div class="alert-title">✅ Content Verified</div>
                    <div class="alert-description">No immediate threats detected</div>
                </div>
            `;
        }
    }

    performDork() {
        const query = document.getElementById('dork-query').value.trim();
        const type = document.getElementById('dork-type').value;
        const loading = document.getElementById('dork-loading');
        const results = document.getElementById('dork-results');

        if (!query) return;

        loading.classList.remove('hidden');
        results.innerHTML = '';

        chrome.runtime.sendMessage({ action: 'performDork', query, type }, (response) => {
            loading.classList.add('hidden');
            if (response && response.error) {
                results.innerHTML = `<div class="result-item"><div class="result-title">Error</div><div class="result-description">${response.error}</div></div>`;
            } else {
                this.displayDorkResults(response);
            }
        });
    }

    displayDorkResults(results) {
        const container = document.getElementById('dork-results');
        container.innerHTML = '';

        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'result-item';
            resultElement.innerHTML = `
                <div class="result-title">${result.title}</div>
                <div class="result-description">${result.description}</div>
                <div class="result-description" style="color: #00ff88; font-size: 10px;">${result.url}</div>
            `;
            container.appendChild(resultElement);
        });
    }

    analyzeSentiment() {
        const text = document.getElementById('sentiment-text').value.trim();
        const loading = document.getElementById('sentiment-loading');
        const results = document.getElementById('sentiment-results');

        if (!text) return;

        loading.classList.remove('hidden');
        results.innerHTML = '';

        chrome.runtime.sendMessage({ action: 'analyzeSentiment', text }, (response) => {
            loading.classList.add('hidden');
            if (response && response.error) {
                results.innerHTML = `<div class="sentiment-result sentiment-high"><div class="alert-title">Error</div><div class="alert-description">${response.error}</div></div>`;
            } else {
                this.displaySentimentResults(response);
            }
        });
    }

    generateThreatAnalysis(riskLevel, threats) {
        if (riskLevel === 'high') {
            return `HIGH RISK: Multiple threat indicators detected. Contains ${threats.length} suspicious terms.`;
        } else if (riskLevel === 'medium') {
            return `MEDIUM RISK: Some concerning patterns found. Monitor closely.`;
        } else {
            return `LOW RISK: Text appears to be safe with minimal threat indicators.`;
        }
    }

    displaySentimentResults(analysis) {
        const container = document.getElementById('sentiment-results');
        container.innerHTML = `
            <div class="sentiment-result sentiment-${analysis.riskLevel}">
                <div class="alert-title">${analysis.riskLevel.toUpperCase()} RISK (${analysis.riskScore}%)</div>
                <div class="alert-description">${analysis.analysis}</div>
                ${analysis.threats.length > 0 ? `<div class="alert-description" style="margin-top: 8px;"><strong>Detected threats:</strong> ${analysis.threats.join(', ')}</div>` : ''}
            </div>
        `;
    }

    async collectEvidence() {
        const type = document.getElementById('evidence-type').value;
        const description = document.getElementById('evidence-description').value.trim();

        if (!description) return;

        // Get the current active tab's URL, not the popup's URL
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab) {
            const evidence = {
                type,
                description,
                url: tab.url,
                title: tab.title
            };
            chrome.runtime.sendMessage({ action: 'addEvidence', evidence }, (response) => {
                if (response?.success) {
                    document.getElementById('evidence-description').value = '';
                    this.loadEvidence(); // Refresh the list from storage
                }
            });
        }
    }

    loadEvidence() {
        chrome.runtime.sendMessage({ action: 'getEvidence' }, (evidenceList) => {
            this.evidenceList = evidenceList || [];
            this.displayEvidenceList();
        });
    }

    displayEvidenceList() {
        const container = document.getElementById('evidence-list');
        container.innerHTML = '';

        if (!this.evidenceList || this.evidenceList.length === 0) {
            container.innerHTML = '<div class="result-item"><div class="result-description">No evidence collected yet.</div></div>';
            return;
        }

        this.evidenceList.forEach(evidence => {
            const evidenceElement = document.createElement('div');
            evidenceElement.className = 'result-item';
            evidenceElement.innerHTML = `
                <div class="result-title">${evidence.type}: ${evidence.description}</div>
                <div class="result-description">${new Date(evidence.timestamp).toLocaleString()}</div>
            `;
            container.appendChild(evidenceElement);
        });
    }

    // --- Quick Actions ---
    scanCurrentPage() {
        const scanButton = document.getElementById('scan-page');
        scanButton.textContent = 'Scanning...';
        chrome.runtime.sendMessage({ action: 'scanCurrentPage' }, (response) => {
            scanButton.textContent = 'Scan Current Page';
            // You can update the alerts/danger score based on the response
            console.log('Scan results:', response);
            this.updateDangerScore(response.score);
            this.updateAlerts(response.alerts);
        });
    }

    exportEvidence() {
        const exportButton = document.getElementById('export-evidence');
        exportButton.textContent = 'Exporting...';
        chrome.runtime.sendMessage({ action: 'exportEvidence' }, () => {
            exportButton.textContent = '📊 Export Report';
        });
    }

    syncIPFS() {
        // This is a placeholder as IPFS logic is not in your background script
        console.log('IPFS Sync requested. (Not Implemented)');
    }

    togglePrivacyMode() {
        // This is a placeholder as privacy mode logic is not in your background script
        const overlay = document.getElementById('privacy-overlay');
        overlay.classList.toggle('hidden');
    }
}

/**
 * This is the crucial part that was missing.
 * It waits for the HTML document to be fully loaded,
 * then creates a new instance of our SypherExtension class,
 * which in turn sets up all the event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    new SypherExtension();
});