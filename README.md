# SYPHER – Your Screen’s Smartest Watchdog

> In today’s digital world, every click could be a threat. SYPHER is an AI-powered, browser-based OSINT assistant that detects scams, phishing, fake content, and manipulated media — before you even click.

---

## Why SYPHER?

- ₹2 or ₹5 scam tricks are becoming common to gain trust before launching major attacks.
- Fake donation campaigns, UPI frauds, phishing links, deepfakes, and misinformation are spreading faster than ever.
- Internet blackouts, especially in rural or conflict zones, leave users vulnerable with no real-time protection.

That’s where *SYPHER* comes in — a silent, offline-ready digital safety companion.

---

## What Does It Do?

SYPHER passively monitors what's on your screen and instantly flags:
- Suspicious UPI links and QR codes  
- Manipulated or emotionally triggering content (sentiment analysis)  
- Phishing and scam patterns  
- Deepfakes and image tampering  
- Risky domains and fake websites  
- Keyword-based scam detection (customizable trees)

It also gives each page or element a *Danger Score* based on real-time AI checks.

---

## Key Features

- *Offline Mode:* Works during internet shutdowns. Syncs to IPFS when back online.
- *Sentiment & Scam Detection:* Hugging Face models analyze tone + intent.
- *AI Privacy Layer:* Automatically redacts names, faces, phone numbers.
- *Fake Media Detection:* Detects deepfakes and edited images.
- *Heatmaps:* Maps scam-prone areas and user movements (opt-in).
- *Google Dork Suggestions:* For deeper open-source investigations.
- *No Setup Needed:* Seamless background protection. No commands, no configs.

---

## Tech Stack

- *Frontend:* React.js, HTML, CSS, JavaScript
- *AI Models:* Hugging Face Transformers, Custom keyword detection
- *Security & Storage:* IPFS, local storage, browser APIs
- *Others:* Google Dork generator, SSL & domain analysis

---

## 📦 Installation & Usage

```bash
git clone https://github.com/your-username/sypher.git
cd sypher
npm install
npm start
