import React, { useState, useEffect } from 'react';
import { Star, Github, Target, Search, MessageCircle, Eye, Shield, Brain, Network, Clock, Download, Zap, Activity, TrendingUp, AlertTriangle, Users, Globe, Lock, Cpu, Database, BarChart3, FileText, Camera, Fingerprint, Radar, Sparkles, ChevronRight, Play, ExternalLink, MapPin, User, Building, Phone, Mail, Calendar, Link } from 'lucide-react';

const SypherLanding = () => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [activeDemo, setActiveDemo] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({
    accuracy: 0,
    platforms: 0,
    speed: 0,
    entities: 0
  });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateStats();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsElement = document.getElementById('stats-section');
    if (statsElement) {
      observer.observe(statsElement);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateStats = () => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      accuracy: 95,
      platforms: 15,
      speed: 100,
      entities: 50000
    };

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setAnimatedStats({
        accuracy: Math.round(targets.accuracy * easeOutQuart),
        platforms: Math.round(targets.platforms * easeOutQuart),
        speed: Math.round(targets.speed * easeOutQuart),
        entities: Math.round(targets.entities * easeOutQuart)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);
  };

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const handleDownload = () => {
    const manifest = {
      manifest_version: 3,
      name: "Sypher OSINT",
      version: "1.0.0",
      description: "Advanced OSINT Intelligence with AI-powered threat detection",
      permissions: ["activeTab", "storage", "tabs"],
      action: {
        default_popup: "popup.html",
        default_title: "Sypher OSINT"
      },
      content_scripts: [{
        matches: ["<all_urls>"],
        js: ["content.js"]
      }]
    };
    
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Predictive Risk Scoring",
      description: "AI continuously evaluates entities against known patterns of fraud, disinformation, and concerning activity with real-time risk assessment.",
      highlight: "95% accuracy",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Narrative Analysis",
      description: "Detect coordinated messaging, disinformation campaigns, and identical content spread across disparate sources in real-time.",
      highlight: "Cross-platform",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Interactive Intelligence",
      description: "Chat-like interface for real-time questioning: 'Who is this person associated with?' 'What controversies exist?'",
      highlight: "Real-time Q&A",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Visual OSINT",
      description: "Logo recognition, branding consistency checks, and stylistic analysis across linked sites to identify fake presences.",
      highlight: "Multi-modal",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Fingerprint className="w-8 h-8" />,
      title: "Digital Fingerprinting",
      description: "Analyze hidden technical attributes: font libraries, CDNs, frameworks, and IP patterns to correlate entities.",
      highlight: "Deep analysis",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Explainable AI",
      description: "Every insight includes clear explanations of AI reasoning with source citations and logical steps taken.",
      highlight: "Transparent",
      color: "from-teal-500 to-green-500"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Geospatial Intelligence",
      description: "Map-based analysis of entity locations, movement patterns, and geographic correlations across multiple identities.",
      highlight: "Location tracking",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Radar className="w-8 h-8" />,
      title: "Anomaly Detection",
      description: "Identify unusual patterns: sudden mention surges, contradictory information, or coordinated account behavior.",
      highlight: "Pattern recognition",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Cross-Reference Engine",
      description: "Automatically correlate entities across multiple tabs and sources with persistent intelligence gathering.",
      highlight: "Multi-source",
      color: "from-rose-500 to-pink-500"
    }
  ];

  const demoSteps = [
    {
      title: "Entity Recognition",
      description: "AI identifies persons, organizations, and entities across web pages",
      risks: [
        { level: "HIGH", text: "Coordinated Disinformation Campaign", detail: "Identical content detected across 15 platforms" },
        { level: "MEDIUM", text: "Anomalous Activity Pattern", detail: "500% increase in mentions over 24h" }
      ]
    },
    {
      title: "Risk Assessment",
      description: "Dynamic scoring based on accumulated intelligence",
      risks: [
        { level: "CRITICAL", text: "Potential Threat Actor", detail: "Multiple fake identities detected" },
        { level: "HIGH", text: "Narrative Manipulation", detail: "Coordinated messaging across 8 platforms" }
      ]
    },
    {
      title: "Geospatial Analysis",
      description: "Location-based intelligence and identity mapping",
      risks: [
        { level: "MEDIUM", text: "Geographic Inconsistency", detail: "Claims presence in 3 different cities" },
        { level: "HIGH", text: "Identity Cluster", detail: "5 related profiles within 50km radius" }
      ]
    }
  ];

  const mapLocations = [
    { city: "New York", country: "USA", lat: 40.7128, lng: -74.0060, confidence: 92, type: "Primary" },
    { city: "London", country: "UK", lat: 51.5074, lng: -0.1278, confidence: 78, type: "Secondary" },
    { city: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050, confidence: 65, type: "Potential" },
    { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, confidence: 43, type: "Weak Signal" }
  ];

  const identityProfiles = [
    {
      name: "Dr. Amit Mishra",
      type: "Primary Identity",
      confidence: 95,
      avatar: "🩺",
      details: {
        profession: "Medical Professional",
        location: "Kaushambi, Yashoda Hospital, UP",
        platforms: ["LinkedIn", "Twitter", "ResearchGate"],
        lastSeen: "2 hours ago"
      }
    },
    {
      name: "Amit M.",
      type: "Academic Profile",
      confidence: 89,
      avatar: "🎓",
      details: {
        profession: "Research Scientist",
        location: "Aligarh Muslim University,UP",
        platforms: ["Google Scholar", "ORCID"],
        lastSeen: "1 day ago"
      }
    },
    {
      name: "Amit Mishra",
      type: "Social Media",
      confidence: 72,
      avatar: "📱",
      details: {
        profession: "Healthcare Advocate",
        location: "Noida Metro Hospital",
        platforms: ["Instagram", "Facebook"],
        lastSeen: "3 hours ago"
      }
    },
    {
      name: "Dr. Mishra",
      type: "Professional Network",
      confidence: 68,
      avatar: "💼",
      details: {
        profession: "Medical Consultant",
        location: "Candy Hopsital, Mumbai, Maharashtra",
        platforms: ["Professional Forums"],
        lastSeen: "1 week ago"
      }
    }
  ];

  const stats = [
    { value: animatedStats.accuracy, suffix: "%", label: "Threat Detection Accuracy" },
    { value: animatedStats.platforms, suffix: "+", label: "Platforms Monitored" },
    { value: animatedStats.speed, suffix: "ms", label: "Analysis Speed", prefix: "<" },
    { value: animatedStats.entities, suffix: "K+", label: "Entities Tracked", transform: (val) => Math.round(val / 1000) }
  ];

  const faqItems = [
    {
      question: "How does Sypher's AI differ from other OSINT tools?",
      answer: "Sypher uses advanced machine learning for predictive risk scoring and narrative analysis. Unlike traditional tools that just collect data, we provide real-time threat assessment with 95% accuracy and explainable AI reasoning."
    },
    {
      question: "What makes the browser extension unique?",
      answer: "Our extension performs deep analysis directly in your browser - from digital fingerprinting to visual consistency checks. It's the only tool that combines technical OSINT with behavioral analysis in real-time."
    },
    {
      question: "How does the interactive intelligence work?",
      answer: "You can ask natural language questions about entities on screen: 'Who is this person connected to?' or 'What controversies exist?' The AI analyzes your open tabs and cached data to provide contextual answers."
    },
    {
      question: "How accurate is the geospatial intelligence?",
      answer: "Our location analysis combines IP geolocation, timestamp analysis, linguistic patterns, and metadata correlation to achieve 85-95% accuracy in primary location identification."
    },
    {
      question: "Is my data secure and private?",
      answer: "Yes. All processing happens locally in your browser. No personal information or browsing data is transmitted to external servers. We use client-side AI models for maximum privacy."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Custom Cursor */}
      <div 
        className="fixed w-10 h-10 bg-white rounded-full pointer-events-none z-50 mix-blend-difference transition-all duration-100"
        style={{ 
          left: cursorPos.x - 8, 
          top: cursorPos.y - 8,
          transform: 'translate(0, 0)'
        }}
      />
      
      {/* Floating Navbar */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 z-40 flex items-center space-x-8">
        <div className="flex items-center">
          <span className="text-xl font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Sypher</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
          <a href="#demo" className="text-white/80 hover:text-white transition-colors">Demo</a>
          <a href="#faq" className="text-white/80 hover:text-white transition-colors">FAQ</a>
        </div>
        
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-all duration-300 hover:scale-105"
        >
          <Github className="w-4 h-4" />
          <span className="font-medium">GitHub</span>
        </a>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Advanced OSINT Intelligence</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-[-0.1em]" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Beyond Recognition
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 font-medium max-w-4xl mx-auto tracking-[-0.1]">
              AI-powered predictive analysis, threat detection, and interactive intelligence - all directly in your browser
            </p>
          </div>
          
          <div id="stats-section" className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {stat.prefix || ''}{stat.transform ? stat.transform(stat.value) : stat.value}{stat.suffix || ''}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={handleDownload}
              className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-2xl flex items-center gap-3"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Install Extension
            </button>
            <button className="border border-white/30 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 flex items-center gap-3">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Advanced Intelligence Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive OSINT capabilities powered by cutting-edge AI and machine learning
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Lexend, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium text-white">
                    {feature.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Real-time Intelligence Analysis
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Watch Sypher analyze web content in real-time, detecting threats and providing actionable insights
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Panel - Browser Mockup */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-2 text-sm flex-1">
                    https://target-analysis.com
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm">
                      🩺
                    </div>
                    <div>
                      <div className="font-semibold">Dr. Amit Mishra</div>
                      <div className="text-sm text-gray-400">Medical Professional</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 leading-relaxed">
                    "Recent reports & images show that Karachi Port has been fully destroyed by INS VIKRANT!!"
                  </div>
                </div>
                
                <div className="flex gap-2 mb-4">
                  {demoSteps.map((step, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveDemo(index)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeDemo === index 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {step.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right Panel - Analysis Results */}
            <div className="space-y-6">
              {/* Risk Analysis */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Sypher Analysis
                  </h3>
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {demoSteps[activeDemo].risks.map((risk, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          risk.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          risk.level === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                          risk.level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {risk.level}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-white mb-1">{risk.text}</div>
                          <div className="text-sm text-gray-400">{risk.detail}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-300">Ask Sypher</span>
                  </div>
                  <div className="text-sm text-gray-300 italic">
                    "What other entities is Dr. Amit Mishra connected to?"
                  </div>
                </div>
              </div>

              {/* Geospatial Intelligence */}
              {activeDemo === 2 && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Location Intelligence
                    </h3>
                  </div>
                  
                  {/* World Map Visualization */}
                  <div className="bg-white/5 rounded-lg p-6 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"></div>
                    
                    {/* Simplified World Map */}
                    <div className="relative h-48 bg-gradient-to-b from-blue-900/20 to-blue-800/20 rounded-lg flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-pulse"></div>
                      
                      {/* Location Markers */}
                      <div className="absolute top-12 left-16">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                        <div className="text-xs text-white mt-1">NYC</div>
                      </div>
                      <div className="absolute top-8 right-24">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                        <div className="text-xs text-white mt-1">LON</div>
                      </div>
                      <div className="absolute top-6 right-20">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                        <div className="text-xs text-white mt-1">BER</div>
                      </div>
                      <div className="absolute bottom-12 right-8">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                        <div className="text-xs text-white mt-1">TOK</div>
                      </div>
                      
                      {/* Connection Lines */}
                      <svg className="absolute inset-0 w-full h-full">
                        <defs>
                          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.8)" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 70 60 Q 150 20 280 40"
                          stroke="url(#connectionGradient)"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="5,5"
                          className="animate-pulse"
                        />
                      </svg>
                      
                      <div className="text-center text-gray-400 text-sm">
                        Global Activity Map
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {mapLocations.map((location, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Globe className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="font-semibold text-sm">{location.city}</div>
                            <div className="text-xs text-gray-400">{location.country}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{location.type}</span>
                          <span className="text-xs font-medium text-green-400">{location.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Identity Clustering */}
              {activeDemo === 2 && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-6 h-6 text-green-400" />
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
                      Identity Profiles
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {identityProfiles.map((profile, index) => (
                      <div key={index} className="bg-white/5                      border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-lg">
                            {profile.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold text-white">{profile.name}</div>
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                {profile.confidence}%
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 mb-2">{profile.type}</div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="text-gray-500">Profession</div>
                                <div className="text-gray-300">{profile.details.profession}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Location</div>
                                <div className="text-gray-300">{profile.details.location}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Platforms</div>
                                <div className="text-gray-300">{profile.details.platforms.join(', ')}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Last Seen</div>
                                <div className="text-gray-300">{profile.details.lastSeen}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Lexend, sans-serif' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Find answers to common questions about Sypher and its capabilities.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleFAQ(index)}>
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                  <span className="text-gray-400">{activeFAQ === index ? '-' : '+'}</span>
                </div>
                {activeFAQ === index && (
                  <div className="mt-2 text-gray-300">{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-10 bg-black/50">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2025 Sypher. All rights reserved.</p>
          <p>Follow us on <a href="https://github.com" className="text-white hover:underline">GitHub</a></p>
        </div>
      </footer>
    </div>
  );
};

export default SypherLanding;
