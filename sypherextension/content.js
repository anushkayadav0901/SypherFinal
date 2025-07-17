class SypherContentScript {
    constructor() {
        this.pageData = null;
        this.observer = null;
        this.init();
    }
    
    init() {
        this.setupMessageListener();
        this.observePageChanges();
        this.scanCurrentPage();
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open
        });
    }
    
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'getPageContent':
                this.getPageContent()
                    .then(content => sendResponse({ content }))
                    .catch(error => sendResponse({ error: error.message }));
                break;
                
            case 'scanElement':
                this.scanElement(request.selector)
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({ error: error.message }));
                break;
                
            case 'highlightThreats':
                this.highlightThreats(request.threats);
                sendResponse({ success: true });
                break;
                
            case 'getPageMetadata':
                sendResponse(this.getPageMetadata());
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    }
    
    async getPageContent() {
        try {
            const content = {
                url: window.location.href,
                title: document.title,
                html: document.documentElement.outerHTML,
                text: document.body ? document.body.innerText : '',
                forms: this.extractForms(),
                links: this.extractLinks(),
                scripts: this.extractScripts(),
                metadata: this.getPageMetadata(),
                images: this.extractImages()
            };
            
            this.pageData = content;
            return content;
        } catch (error) {
            console.error('Error getting page content:', error);
            throw error;
        }
    }
    
    extractForms() {
        const forms = [];
        const formElements = document.querySelectorAll('form');
        
        formElements.forEach((form, index) => {
            const inputs = [];
            const inputElements = form.querySelectorAll('input, textarea, select');
            
            inputElements.forEach(input => {
                inputs.push({
                    type: input.type || 'text',
                    name: input.name || '',
                    id: input.id || '',
                    placeholder: input.placeholder || '',
                    required: input.required || false
                });
            });
            
            forms.push({
                index: index,
                action: form.action || '',
                method: form.method || 'get',
                inputs: inputs,
                html: form.outerHTML
            });
        });
        
        return forms;
    }
    
    extractLinks() {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');
        
        linkElements.forEach(link => {
            links.push({
                href: link.href,
                text: link.textContent.trim(),
                title: link.title || '',
                target: link.target || '',
                rel: link.rel || ''
            });
        });
        
        return links;
    }
    
    extractScripts() {
        const scripts = [];
        const scriptElements = document.querySelectorAll('script');
        
        scriptElements.forEach(script => {
            scripts.push({
                src: script.src || '',
                type: script.type || 'text/javascript',
                content: script.src ? '' : script.textContent.substring(0, 1000), // Limit content
                async: script.async || false,
                defer: script.defer || false
            });
        });
        
        return scripts;
    }
    
    extractImages() {
        const images = [];
        const imgElements = document.querySelectorAll('img');
        
        imgElements.forEach(img => {
            images.push({
                src: img.src || '',
                alt: img.alt || '',
                title: img.title || '',
                width: img.width || 0,
                height: img.height || 0
            });
        });
        
        return images;
    }
    
    getPageMetadata() {
        const metadata = {
            viewport: this.getMetaContent('viewport'),
            description: this.getMetaContent('description'),
            keywords: this.getMetaContent('keywords'),
            author: this.getMetaContent('author'),
            robots: this.getMetaContent('robots'),
            charset: document.characterSet || '',
            language: document.documentElement.lang || '',
            canonical: this.getCanonicalUrl(),
            ogTitle: this.getMetaProperty('og:title'),
            ogDescription: this.getMetaProperty('og:description'),
            ogImage: this.getMetaProperty('og:image'),
            ogUrl: this.getMetaProperty('og:url'),
            twitterCard: this.getMetaProperty('twitter:card'),
            lastModified: document.lastModified || ''
        };
        
        return metadata;
    }
    
    getMetaContent(name) {
        const meta = document.querySelector(`meta[name="${name}"]`);
        return meta ? meta.getAttribute('content') : '';
    }
    
    getMetaProperty(property) {
        const meta = document.querySelector(`meta[property="${property}"]`);
        return meta ? meta.getAttribute('content') : '';
    }
    
    getCanonicalUrl() {
        const canonical = document.querySelector('link[rel="canonical"]');
        return canonical ? canonical.getAttribute('href') : '';
    }
    
    observePageChanges() {
        // Watch for dynamic content changes
        this.observer = new MutationObserver((mutations) => {
            let significantChange = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if added nodes contain significant content
                    const hasSignificantContent = Array.from(mutation.addedNodes).some(node => {
                        return node.nodeType === Node.ELEMENT_NODE && 
                               (node.tagName === 'FORM' || 
                                node.tagName === 'SCRIPT' || 
                                node.querySelector('form, script'));
                    });
                    
                    if (hasSignificantContent) {
                        significantChange = true;
                    }
                }
            });
            
            if (significantChange) {
                this.notifyContentChange();
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    notifyContentChange() {
        // Debounce notifications
        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }
        
        this.changeTimeout = setTimeout(() => {
            chrome.runtime.sendMessage({
                action: 'contentChanged',
                url: window.location.href
            });
        }, 1000);
    }
    
    async scanElement(selector) {
        try {
            const element = document.querySelector(selector);
            if (!element) {
                return { error: 'Element not found' };
            }
            
            return {
                html: element.outerHTML,
                text: element.textContent,
                attributes: this.getElementAttributes(element),
                children: element.children.length
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    getElementAttributes(element) {
        const attributes = {};
        for (const attr of element.attributes) {
            attributes[attr.name] = attr.value;
        }
        return attributes;
    }
    
    highlightThreats(threats) {
        // Remove existing highlights
        this.removeHighlights();
        
        threats.forEach(threat => {
            switch (threat.type) {
                case 'suspicious_links':
                    this.highlightSuspiciousLinks();
                    break;
                case 'data_collection':
                    this.highlightDataCollectionForms();
                    break;
                case 'malware_signature':
                    this.highlightMalwareSignatures();
                    break;
            }
        });
    }
    
    highlightSuspiciousLinks() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            if (this.isLinkSuspicious(link)) {
                this.addThreatHighlight(link, 'suspicious-link');
            }
        });
    }
    
    highlightDataCollectionForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (this.isFormSuspicious(form)) {
                this.addThreatHighlight(form, 'data-collection-form');
            }
        });
    }
    
    highlightMalwareSignatures() {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (this.isScriptSuspicious(script)) {
                this.addThreatHighlight(script, 'malware-signature');
            }
        });
    }
    
    isLinkSuspicious(link) {
        const href = link.href;
        const text = link.textContent;
        
        // Check for URL shorteners
        const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
        if (shorteners.some(shortener => href.includes(shortener))) {
            return true;
        }
        
        // Check for misleading text
        try {
            const url = new URL(href);
            if (text && !text.includes(url.hostname) && text.length > 10) {
                return true;
            }
        } catch (e) {
            return true; // Invalid URL
        }
        
        return false;
    }
    
    isFormSuspicious(form) {
        const inputs = form.querySelectorAll('input');
        const sensitiveFields = ['password', 'ssn', 'social', 'credit', 'card'];
        
        return Array.from(inputs).some(input => {
            const name = (input.name || '').toLowerCase();
            const id = (input.id || '').toLowerCase();
            return sensitiveFields.some(field => name.includes(field) || id.includes(field));
        });
    }
    
    isScriptSuspicious(script) {
        const content = script.textContent || '';
        const suspiciousPatterns = [
            'eval(unescape(',
            'document.write(unescape(',
            'javascript:void(0)'
        ];
        
        return suspiciousPatterns.some(pattern => content.includes(pattern));
    }
    
    addThreatHighlight(element, className) {
        element.classList.add('sypher-threat-highlight', className);
        
        // Add CSS if not already added
        if (!document.getElementById('sypher-threat-styles')) {
            this.addThreatStyles();
        }
    }
    
    addThreatStyles() {
        const style = document.createElement('style');
        style.id = 'sypher-threat-styles';
        style.textContent = `
            .sypher-threat-highlight {
                position: relative;
                box-shadow: 0 0 10px rgba(255, 0, 0, 0.5) !important;
            }
            
            .sypher-threat-highlight::before {
                content: '⚠️';
                position: absolute;
                top: -5px;
                right: -5px;
                background: red;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                z-index: 10000;
            }
            
            .suspicious-link {
                border: 2px solid orange !important;
            }
            
            .data-collection-form {
                border: 2px solid red !important;
            }
            
            .malware-signature {
                border: 2px solid purple !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    removeHighlights() {
        const highlights = document.querySelectorAll('.sypher-threat-highlight');
        highlights.forEach(element => {
            element.classList.remove('sypher-threat-highlight', 'suspicious-link', 'data-collection-form', 'malware-signature');
        });
    }
    
    scanCurrentPage() {
        // Automatically scan the current page when content script loads
        setTimeout(() => {
            this.getPageContent().then(content => {
                chrome.runtime.sendMessage({
                    action: 'scanPage',
                    url: window.location.href,
                    content: content.html
                });
            }).catch(error => {
                console.error('Error scanning current page:', error);
            });
        }, 1000);
    }
}

// Initialize the content script
const sypherContentScript = new SypherContentScript();

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (sypherContentScript.observer) {
        sypherContentScript.observer.disconnect();
    }
});