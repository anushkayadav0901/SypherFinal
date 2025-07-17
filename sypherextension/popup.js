class SypherPopup {
    constructor() {
        this.currentTab = 'threats';
        this.dangerScore = 15;
        this.threats = [];
        this.evidence = [];
        this.settings = {
            realTimeScanning: true,
            threatNotifications: true,
            offlineMode: false,
            autoSyncIPFS: true,
            aiPrivacyLayer: true,
            deepfakeDetection: true
        };
        this.stats = {
            threatsBlocked: 247,
            sitesScanned: 1205,
            evidenceCollected: 89,
            offlineStorage: '2.3GB'
        };
        
        this.init();
    }
    
    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.updateUI();
        this.startRealTimeUpdates();
    }
    
    loadStoredData() {
        // Load data from chrome.storage
        chrome.storage.local.get(['sypherData', 'sypherSettings'], (result) => {
            if (result.sypherData) {
                this.threats = result.sypherData.threats || [];
                this.evidence = result.sypherData.evidence || [];
                this.stats = result.sypherData.stats || this.stats;
                this.dangerScore = result.sypherData.dangerScore || this.dangerScore;
            }
            
            if (result.sypherSettings) {
                this.settings = { ...this.settings, ...result.sypherSettings };
            }
            
            this.updateUI();
        });
    }
    
    saveData() {
        const data = {
            threats: this.threats,
            evidence: this.evidence,
            stats: this.stats,
            dangerScore: this.dangerScore
        };
        
        chrome.storage.local.set({
            sypherData: data,
            sypherSettings: this.settings
        });
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.textContent.toLowerCase();
                this.switchTab(tabName);
            });
        });
        
        // Settings toggles
        document.querySelectorAll('.toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                this.toggleSetting(e.target);
            });
        });
        
        // Action buttons
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.textContent.toLowerCase().replace(/\s+/g, '');
                this.handleAction(action);
            });
        });
        
        // Emergency stop button
        const emergencyBtn = document.getElementById('emergencyStop');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => this.emergencyStop());
        }
    }
    
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(tabName);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        this.currentTab = tabName;
    }
    
    toggleSetting(toggleElement) {
        toggleElement.classList.toggle('active');
        
        // Update settings based on toggle position
        const settingLabel = toggleElement.parentElement.querySelector('.settings-label').textContent;
        const settingKey = this.getSettingKey(settingLabel);
        
        if (settingKey) {
            this.settings[settingKey] = toggleElement.classList.contains('active');
            this.saveData();
            
            // Send message to background script
            chrome.runtime.sendMessage({
                action: 'updateSettings',
                settings: this.settings
            });
            
            // Handle special settings
            if (settingKey === 'offlineMode') {
                this.updateOfflineMode();
            }
        }
    }
    
    getSettingKey(label) {
        const keyMap = {
            'Real-time Scanning': 'realTimeScanning',
            'Threat Notifications': 'threatNotifications',
            'Offline Mode': 'offlineMode',
            'Auto-sync IPFS': 'autoSyncIPFS',
            'AI Privacy Layer': 'aiPrivacyLayer',
            'Deepfake Detection': 'deepfakeDetection'
        };
        return keyMap[label];
    }
    
    handleAction(action) {
        switch (action) {
            case 'exportevidence':
                this.exportEvidence();
                break;
            case 'synctoipfs':
                this.syncToIPFS();
                break;
            case 'resetall':
                this.resetSettings();
                break;
            case 'exportconfig':
                this.exportSettings();
                break;
            case 'clearall':
                this.clearAllData();
                break;
        }
    }
    
    updateUI() {
        // Update danger score
        const dangerElement = document.getElementById('dangerScore');
        if (dangerElement) {
            dangerElement.textContent = this.dangerScore;
            dangerElement.className = `danger-value ${this.getDangerLevel()}`;
        }
        
        // Update stats
        Object.keys(this.stats).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = this.stats[key];
            }
        });
        
        // Update threats list
        this.updateThreatsList();
        
        // Update evidence list
        this.updateEvidenceList();
        
        // Update settings toggles
        this.updateSettingsToggles();
    }
    
    getDangerLevel() {
        if (this.dangerScore < 25) return 'danger-low';
        if (this.dangerScore < 50) return 'danger-medium';
        if (this.dangerScore < 75) return 'danger-high';
        return 'danger-critical';
    }
    
    updateThreatsList() {
        const threatsList = document.getElementById('threatList');
        if (!threatsList) return;
        
        if (this.threats.length === 0) {
            // Default threats for demo
            this.threats = [
                {
                    level: 'medium',
                    title: 'Suspicious Link Pattern',
                    description: '3 shortened URLs detected',
                    icon: '⚠️',
                    timestamp: Date.now()
                },
                {
                    level: 'low',
                    title: 'External Redirects',
                    description: '2 external domains linked',
                    icon: 'ℹ️',
                    timestamp: Date.now() - 300000
                }
            ];
        }
        
        threatsList.innerHTML = this.threats.map(threat => `
            <div class="threat-item">
                <div class="threat-icon threat-${threat.level}">${threat.icon}</div>
                <div class="threat-content">
                    <div class="threat-title">${threat.title}</div>
                    <div class="threat-desc">${threat.description}</div>
                    <div class="threat-time">${this.formatTime(threat.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }
    
    updateEvidenceList() {
        const evidenceList = document.getElementById('evidenceList');
        if (!evidenceList) return;
        
        if (this.evidence.length === 0) {
            // Default evidence for demo
            this.evidence = [
                {
                    type: 'Suspicious Message',
                    time: '2 min ago',
                    content: '"Click here to claim your prize!" - Detected phishing attempt',
                    timestamp: Date.now() - 120000
                },
                {
                    type: 'Media Analysis',
                    time: '5 min ago',
                    content: 'Image manipulation detected - 73% confidence deepfake',
                    timestamp: Date.now() - 300000
                },
                {
                    type: 'Domain Alert',
                    time: '12 min ago',
                    content: 'Suspicious domain registered 2 days ago - potential typosquatting',
                    timestamp: Date.now() - 720000
                }
            ];
        }
        
        evidenceList.innerHTML = this.evidence.map(item => `
            <div class="evidence-item">
                <div class="evidence-header">
                    <div class="evidence-type">${item.type}</div>
                    <div class="evidence-time">${item.time}</div>
                </div>
                <div class="evidence-content">${item.content}</div>
            </div>
        `).join('');
    }
    
    updateSettingsToggles() {
        const settingItems = document.querySelectorAll('.settings-item');
        settingItems.forEach(item => {
            const label = item.querySelector('.settings-label').textContent;
            const toggle = item.querySelector('.toggle');
            const key = this.getSettingKey(label);
            
            if (key && this.settings[key]) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        });
    }
    
    updateOfflineMode() {
        const offlineIndicator = document.getElementById('offlineIndicator');
        if (this.settings.offlineMode) {
            offlineIndicator.style.display = 'flex';
        } else {
            offlineIndicator.style.display = 'none';
        }
    }
    
    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            if (this.settings.realTimeScanning) {
                this.simulateRealTimeData();
            }
        }, 5000);
    }
    
    simulateRealTimeData() {
        // Simulate changing danger score
        const change = Math.random() * 10 - 5;
        this.dangerScore = Math.max(0, Math.min(100, this.dangerScore + change));
        
        // Simulate new threats occasionally
        if (Math.random() < 0.3) {
            this.addSimulatedThreat();
        }
        
        // Simulate new evidence
        if (Math.random() < 0.2) {
            this.addSimulatedEvidence();
        }
        
        this.updateUI();
        this.saveData();
    }
    
    addSimulatedThreat() {
        const threats = [
            {
                level: 'high',
                title: 'Phishing Attempt',
                description: 'Fake login page detected',
                icon: '🎣'
            },
            {
                level: 'medium',
                title: 'Suspicious Script',
                description: 'Obfuscated JavaScript found',
                icon: '⚠️'
            },
            {
                level: 'critical',
                title: 'Malware Download',
                description: 'Dangerous file detected',
                icon: '🦠'
            }
        ];
        
        const newThreat = threats[Math.floor(Math.random() * threats.length)];
        newThreat.timestamp = Date.now();
        this.threats.unshift(newThreat);
        
        // Keep only last 10 threats
        this.threats = this.threats.slice(0, 10);
        
        // Update stats
        this.stats.threatsBlocked++;
    }
    
    addSimulatedEvidence() {
        const evidenceTypes = [
            {
                type: 'Network Analysis',
                content: 'Suspicious network traffic pattern detected'
            },
            {
                type: 'Social Engineering',
                content: 'Potential social engineering attempt identified'
            },
            {
                type: 'Credential Harvesting',
                content: 'Form submission to suspicious endpoint detected'
            }
        ];
        
        const newEvidence = evidenceTypes[Math.floor(Math.random() * evidenceTypes.length)];
        newEvidence.timestamp = Date.now();
        newEvidence.time = 'Just now';
        this.evidence.unshift(newEvidence);
        
        // Keep only last 15 evidence items
        this.evidence = this.evidence.slice(0, 15);
        
        // Update stats
        this.stats.evidenceCollected++;
    }
    
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
        return `${Math.floor(diff / 86400000)} days ago`;
    }
    
    exportEvidence() {
        const evidenceData = {
            timestamp: new Date().toISOString(),
            threats: this.threats,
            evidence: this.evidence,
            stats: this.stats,
            dangerScore: this.dangerScore
        };
        
        const blob = new Blob([JSON.stringify(evidenceData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sypher-evidence-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Evidence exported successfully');
    }
    
    async syncToIPFS() {
        this.showNotification('Syncing to IPFS...');
        
        // Simulate IPFS sync
        setTimeout(() => {
            this.showNotification('Evidence synced to IPFS successfully');
            this.stats.offlineStorage = (parseFloat(this.stats.offlineStorage) + 0.1).toFixed(1) + 'GB';
            this.updateUI();
        }, 2000);
    }
    
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings?')) {
            this.settings = {
                realTimeScanning: true,
                threatNotifications: true,
                offlineMode: false,
                autoSyncIPFS: true,
                aiPrivacyLayer: true,
                deepfakeDetection: true
            };
            this.saveData();
            this.updateUI();
            this.showNotification('Settings reset to default');
        }
    }
    
    exportSettings() {
        const settingsData = {
            timestamp: new Date().toISOString(),
            settings: this.settings,
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sypher-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Configuration exported successfully');
    }
    
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.threats = [];
            this.evidence = [];
            this.stats = {
                threatsBlocked: 0,
                sitesScanned: 0,
                evidenceCollected: 0,
                offlineStorage: '0.0GB'
            };
            this.dangerScore = 0;
            this.saveData();
            this.updateUI();
            this.showNotification('All data cleared');
        }
    }
    
    emergencyStop() {
        // Disable all scanning and notifications
        this.settings.realTimeScanning = false;
        this.settings.threatNotifications = false;
        this.settings.deepfakeDetection = false;
        
        // Send emergency stop to background script
        chrome.runtime.sendMessage({
            action: 'emergencyStop'
        });
        
        this.saveData();
        this.updateUI();
        this.showNotification('Emergency stop activated - All scanning disabled');
    }
    
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #2d3748;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SypherPopup();
});

// Global functions for HTML onclick handlers
function switchTab(tabName) {
    window.sypherPopup.switchTab(tabName);
}

// Store instance globally for HTML access
window.sypherPopup = null;
document.addEventListener('DOMContentLoaded', () => {
    window.sypherPopup = new SypherPopup();
});