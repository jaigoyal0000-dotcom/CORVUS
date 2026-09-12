'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Satellite, Globe, Landmark, Shield, ShieldAlert, ShieldCheck,
  Trees, Droplets, Building2, Wheat, Search, ArrowRight,
  ExternalLink, Calendar, MapPin, FileCheck2, Activity,
  Phone, HelpCircle, CheckCircle2, AlertTriangle, Download,
  Layers, Radio, Sparkles, MessageSquare, Image as ImageIcon,
  Flag, Award, Eye, BarChart3, Database, UserCheck, RefreshCw,
  FolderKanban, PlusCircle, Compass, FileText
} from 'lucide-react';
import { isAuthenticated, getUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  location_name?: string;
  created_at?: string;
  queries_count?: number;
  status?: string;
  department?: string;
  confidence?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Government Portal Accessibility & Language State
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'larger'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [searchDistrict, setSearchDistrict] = useState('');

  // Live Current Time Clock (IST)
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.replace('/auth');
      return;
    }
    setUser(getUser());

    // Update live clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Fetch live projects from MongoDB API
    fetch('http://localhost:8000/api/v1/projects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjectsList(data);
        } else {
          // Pre-populate with official-grade national initiatives
          setProjectsList([
            {
              id: 'proj_0001',
              name: 'Delhi NCR Urban Expansion & Forest Canopy Audit',
              description: 'Bi-temporal high-resolution satellite surveillance for unauthorized construction and green buffer monitoring across 1,484 km².',
              location_name: 'Delhi NCR, Survey Division North',
              created_at: '2026-09-10T10:00:00Z',
              queries_count: 34,
              status: 'Approved & Verified',
              department: 'Ministry of Housing & Urban Affairs (MoHUA)',
              confidence: '98.7%'
            },
            {
              id: 'proj_0002',
              name: 'Brahmaputra River Basin Flood Inundation & Embankment Surveillance',
              description: 'Sentinel-1 SAR radar bi-weekly penetration through monsoon cloud cover to track breach hotspots and shelter connectivity.',
              location_name: 'Assam & Arunachal Pradesh Riverine Zones',
              created_at: '2026-09-08T06:30:00Z',
              queries_count: 52,
              status: 'Active Disaster Alert',
              department: 'National Disaster Management Authority (NDMA)',
              confidence: '99.2%'
            },
            {
              id: 'proj_0003',
              name: 'Kharif Crop Health, Soil Moisture & Drought Assessment (18 Districts)',
              description: 'Multi-spectral NDVI and moisture anomaly indexing to forecast crop yields and disburse Pradhan Mantri Fasal Bima subsidies.',
              location_name: 'Vidarbha & Marathwada Agro-Climatic Zone',
              created_at: '2026-09-05T14:15:00Z',
              queries_count: 28,
              status: 'Completed Survey',
              department: 'Department of Agriculture & Farmers Welfare',
              confidence: '97.4%'
            },
            {
              id: 'proj_0004',
              name: 'Western Ghats Ecological Sensitivity & Mangrove Buffer Audit',
              description: 'Coastal Regulation Zone (CRZ) encroachment identification and illegal reclamation tracking using multi-sensor radar fusion.',
              location_name: 'Maharashtra & Goa Coastal Belt',
              created_at: '2026-09-01T09:45:00Z',
              queries_count: 19,
              status: 'Annual Audit in Progress',
              department: 'Ministry of Environment, Forest & Climate Change',
              confidence: '98.1%'
            }
          ]);
        }
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
      })
      .finally(() => setLoadingProjects(false));

    return () => clearInterval(interval);
  }, [router]);

  if (!mounted) return null;

  // Bilingual content dictionary
  const t = {
    govIndia: language === 'hi' ? 'भारत सरकार' : 'GOVERNMENT OF INDIA',
    ministry: language === 'hi' ? 'अंतरिक्ष विभाग एवं पृथ्वी विज्ञान मंत्रालय' : 'Department of Space & Ministry of Earth Sciences',
    portalName: language === 'hi' ? 'राष्ट्रीय सुदूर संवेदन एवं भू-स्थानिक अवलोकन पोर्टल' : 'National Remote Sensing & Earth Observation Geospatial Portal',
    portalSub: language === 'hi'
      ? 'नागरिकों, किसानों, नगर निकायों एवं शोधकर्ताओं हेतु उपग्रह आधारित कृत्रिम बुद्धिमत्ता निगरानी मंच'
      : 'Open AI-Powered Satellite Surveillance for Citizens, Farmers, Municipal Authorities & Disaster Responders',
    bulletinTitle: language === 'hi' ? 'ताज़ा राष्ट्रीय बुलेटिन' : 'LIVE NATIONAL BULLETIN',
    bulletinText: language === 'hi'
      ? '📢 इसरो एवं सेंटिनल उपग्रह रडार लाइव: असम एवं गंगा बेसिन में बाढ़ निगरानी सक्रिय • खरीफ फसल स्वास्थ्य रिपोर्ट जारी • अनाधिकृत शहरी अतिक्रमण जांच उपलब्ध • नागरिक सहायता 1800-11-2026 24x7 चालू।'
      : '📢 SATELLITE RADAR LIVE: High-Resolution Monsoon Inundation Watch active for Brahmaputra & Ganga Basins • Kharif Crop Health Indexes Calibrated across 18 States • Municipal Encroachment Audits Open for Panchayats & ULBs • Citizen Helpline 1800-11-2026 Active 24x7.',
    searchPlaceholder: language === 'hi'
      ? 'राज्य, जिला, नदी घाटी या पिन कोड खोजें (उदा. दिल्ली, वाराणसी, पटना, मुंबई, जयपुर)...'
      : 'Search any State, District, Panchayat, River Basin or Coordinates (e.g., Delhi, Patna, Brahmaputra, Mumbai)...',
    searchBtn: language === 'hi' ? 'खोजें' : 'Locate Area',
    quickServices: language === 'hi' ? 'प्रमुख सार्वजनिक एवं प्रशासनिक सेवाएँ' : 'Key Citizen & Department Services',
    quickServicesSub: language === 'hi'
      ? 'प्रत्येक नागरिक और अधिकारी द्वारा आसानी से उपयोग किए जाने वाले सरल उपग्रह मॉड्यूल'
      : 'Plain-language, single-click geospatial services designed for instant public and administrative access',
    kpiArea: language === 'hi' ? 'कुल निगरानी क्षेत्र' : 'Monitored National Landmass',
    kpiSat: language === 'hi' ? 'सक्रिय उपग्रह बेड़ा' : 'Operational Satellite Feeds',
    kpiAudits: language === 'hi' ? 'प्रमाणित जिला सर्वेक्षण' : 'Verified District Audits',
    kpiDisaster: language === 'hi' ? 'सक्रिय आपदा चेतावनी' : 'Emergency Disaster Alerts',
    howItWorksTitle: language === 'hi' ? 'यह पोर्टल कैसे काम करता है? (3 सरल चरण)' : 'How Citizens and Officers Use This Portal (3 Simple Steps)',
    recentProjectsTitle: language === 'hi' ? 'हालिया राष्ट्रीय एवं राज्य स्तरीय भू-स्थानिक परियोजनाएं' : 'Official Geospatial Initiatives & Verified Audits',
    systemIntegrations: language === 'hi' ? 'राष्ट्रीय संस्थान एवं डेटा एकीकरण' : 'National Agency & Satellite Feeds Integration',
  };

  // Filter projects based on search
  const filteredProjects = projectsList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchDistrict.toLowerCase()) ||
      (p.location_name && p.location_name.toLowerCase().includes(searchDistrict.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchDistrict.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div
      className={`min-h-screen ${
        highContrast ? 'bg-black text-amber-300' : 'bg-slate-950 text-slate-100'
      } ${
        fontScale === 'large' ? 'text-base' : fontScale === 'larger' ? 'text-lg' : 'text-sm'
      }`}
    >
      {/* 🇮🇳 1. OFFICIAL GOVERNMENT TRICOLOR TOP STRIP & ACCESSIBILITY BAR */}
      <div className="bg-gradient-to-r from-amber-600 via-white to-emerald-600 h-1.5 w-full shrink-0" />
      
      {/* Official Government of India Top Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-xs py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-3">
          {/* National Ashoka Emblem / National Seal Graphic */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300 font-serif font-bold">
              🏛️
            </div>
            <span className="font-semibold tracking-wider text-slate-200">
              {t.govIndia}
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden md:inline font-medium">
            {t.ministry}
          </span>
        </div>

        {/* Accessibility & Language Controls */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          {/* Live IST Clock */}
          <div className="hidden lg:flex items-center gap-1.5 text-cyan-400 bg-slate-950/70 px-2.5 py-0.5 rounded border border-slate-800">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>{currentTime || '19:26:00 IST'}</span>
          </div>

          {/* Citizen Helpline */}
          <div className="hidden sm:flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
            <Phone className="w-3 h-3" />
            <span className="font-sans font-bold">Toll-Free: 1800-11-2026</span>
          </div>

          {/* Font Scaler (A- | A | A+) */}
          <div className="flex items-center bg-slate-800/80 rounded border border-slate-700 overflow-hidden">
            <button
              onClick={() => setFontScale('normal')}
              className={`px-2 py-0.5 font-bold hover:bg-slate-700 transition ${fontScale === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
              title="Standard Font Size"
            >
              A-
            </button>
            <button
              onClick={() => setFontScale('large')}
              className={`px-2 py-0.5 font-bold hover:bg-slate-700 transition ${fontScale === 'large' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
              title="Large Font Size"
            >
              A
            </button>
            <button
              onClick={() => setFontScale('larger')}
              className={`px-2 py-0.5 font-bold hover:bg-slate-700 transition ${fontScale === 'larger' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
              title="Extra Large Font Size"
            >
              A+
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`px-2 py-0.5 rounded border text-[10px] font-sans font-semibold transition ${
              highContrast
                ? 'bg-amber-400 text-black border-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {highContrast ? 'Standard Mode' : 'High Contrast'}
          </button>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-800/80 rounded border border-slate-700 overflow-hidden font-sans">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-0.5 font-bold transition ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-0.5 font-bold transition ${language === 'hi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>

      {/* Main Standard Nav */}
      <Navbar />

      {/* 📢 2. LIVE EMERGENCY & SATELLITE BULLETIN TICKER */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-900/40 px-4 sm:px-8 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 shadow-sm animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          <span>{t.bulletinTitle}</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap text-xs text-blue-200 font-medium">
          <p className="inline-block">{t.bulletinText}</p>
        </div>
      </div>

      {/* 🏛️ 3. OFFICIAL NATIONAL PORTAL MASTHEAD & SEARCH */}
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-0.5 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                  <Satellite className="w-6 h-6" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">
                    CORVUS — NATIONAL EARTH OBSERVATION MISSION
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
                    ✓ Survey of India Calibrated
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {t.portalName}
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed pl-1">
              {t.portalSub}
            </p>
          </div>

          {/* Official Officer Badge & Direct Quick Mission Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs w-full sm:w-auto">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Logged in Official / Citizen
              </div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user?.full_name || 'Corvus Mission Director'}</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Authorized
                </span>
              </div>
            </div>

            <Link
              href="/workspace/proj_0001"
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition shrink-0 w-full sm:w-auto"
            >
              <Globe className="w-4 h-4" />
              <span>Launch GIS Satellite Map ➔</span>
            </Link>
          </div>
        </div>

        {/* Universal District / Village / Coordinates Locator Bar */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="bg-slate-900/90 border-2 border-blue-500/30 hover:border-blue-500/50 rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-2.5 shadow-xl transition">
            <div className="flex items-center gap-2.5 px-3 w-full flex-1">
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="bg-transparent border-none text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none w-full"
              />
              {searchDistrict && (
                <button
                  onClick={() => setSearchDistrict('')}
                  className="text-xs text-slate-500 hover:text-slate-300 font-bold px-1.5"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Quick jump presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 px-2 sm:px-0">
              <span className="text-[10px] text-slate-500 font-mono hidden lg:inline">Popular:</span>
              {[
                { name: 'Delhi NCR', id: 'proj_0001' },
                { name: 'Patna (Ganga)', id: 'proj_0001' },
                { name: 'Assam (Flood)', id: 'proj_0002' },
                { name: 'Mumbai Coast', id: 'proj_0004' },
              ].map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => setSearchDistrict(loc.name)}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium whitespace-nowrap transition border border-slate-700"
                >
                  {loc.name}
                </button>
              ))}
              <Link
                href="/workspace/proj_0001"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ml-1"
              >
                <span>{t.searchBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 📊 4. NATIONAL GEOSPATIAL KEY INDICATORS (KPIs in plain, understandable words) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: t.kpiArea,
              value: '3.287M km²',
              subtitle: 'Pan-India Territory Tracked',
              icon: Globe,
              accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
            },
            {
              title: t.kpiSat,
              value: '14 Active Satellites',
              subtitle: 'Sentinel, Landsat & Radar SAR',
              icon: Satellite,
              accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            },
            {
              title: t.kpiAudits,
              value: '1,280+ Panchayats',
              subtitle: 'Urban & Agricultural Surveys',
              icon: FileCheck2,
              accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            },
            {
              title: t.kpiDisaster,
              value: '24x7 Surveillance',
              subtitle: 'Flood, Cyclone & Fire Alerts',
              icon: ShieldAlert,
              accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-xl border ${kpi.accent}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  {kpi.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 5. KEY CITIZEN & DEPARTMENT SERVICES (6 Simple, Intuitive, Colorful Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Landmark className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              {t.quickServices}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.quickServicesSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Interactive GIS Satellite Map */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between group transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 group-hover:scale-105 transition">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold">
                  Public Service 01
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                  Interactive GIS Satellite Map (नक्शा पोर्टल)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  View high-resolution satellite imagery across any Indian village or town. Toggle road networks, tree canopies, and water boundaries.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Real-Time OpenLayers</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Multi-Spectral</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">GPS Anchored</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <Link
                href="/workspace/proj_0001"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>Launch Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Disaster & Emergency AI Portal */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-red-950/40 border border-red-500/30 hover:border-red-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between group transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 group-hover:scale-105 transition">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono bg-red-950/80 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30 font-bold">
                  Public Service 02
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-red-300 transition">
                  Disaster & Emergency AI (आपदा प्रबंधन)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Track active flood inundation zones, cloud-penetrating SAR radar feeds, forest fire detections, and safe evacuation corridors.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Live Flood Maps</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Cyclone Watch</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">NDMA Standards</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <Link
                href="/disaster"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>Open Disaster AI Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Agriculture & Crop Health Audit */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between group transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 group-hover:scale-105 transition">
                  <Wheat className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  Public Service 03
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  Crop Health & Agriculture Audit (फसल निगरानी)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Analyze NDVI crop greenery, soil moisture, and drought risk. Essential for farmers, agricultural officers, and crop insurance claims.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">NDVI Vegetation</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Drought Early Warning</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">PMFBY Subsidy Aid</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <Link
                href="/image-analysis"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>Analyze Crop Imagery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Urban Planning & Encroachment Audit */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between group transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 group-hover:scale-105 transition">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  Public Service 04
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Urban Planning & Encroachment (शहरी नियोजन)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Identify unauthorized buildings, illegal forest clearing, and infrastructure growth using automated bi-temporal change detection.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">ChangeFormer AI</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Encroachment Vector</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Municipal Audits</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <Link
                href="/workspace/proj_0001"
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>Inspect Urban Expansion</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 5: Ask AI Geospatial Copilot */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between group transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 group-hover:scale-105 transition">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                  Public Service 05
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                  Citizen & Officer AI Copilot (भू-स्थानिक चैट)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ask plain-language questions like "How much greenery was lost in Pune?" or "Is my district under flood risk?" and get instant answers.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Natural Language NLP</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">No Photos Required</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">24x7 Answers</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <Link
                href="/chat"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>Start AI Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 6: Official Audit Reports & Projects */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between group transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 group-hover:scale-105 transition">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                  Public Service 06
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                  Certified Reports & Registry (प्रमाणित रिपोर्ट)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Access official government project records, download PDF summaries with GPS coordinates, and view multi-agency verification stamps.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Certified PDF Export</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Audit Trails</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Public Records</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <Link
                href="/projects"
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>View Official Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🧭 6. "HOW IT WORKS" — 3 SIMPLE STEPS FOR EVERY CITIZEN & OFFICER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <HelpCircle className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">
              {t.howItWorksTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Step 1: Select Your Location or Upload
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Search any Indian district or upload a satellite / drone photograph. The portal automatically recognizes the GPS coordinates and anchors the map.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Step 2: Automated AI Spatial Scan
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Our neural networks instantly calculate green canopy (NDVI), water spread (NDWI), and unauthorized building changes with 98%+ precision.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Step 3: Download Certified Reports
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Export legally valid geospatial audit reports, evidence cards, and map snapshots for municipal approvals, legal cases, or public welfare.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📁 7. OFFICIAL GEOSPATIAL AUDITS & ACTIVE INITIATIVES (Plain Table) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <FolderKanban className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {t.recentProjectsTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified spatial surveillance records published for public & inter-departmental transparency
            </p>
          </div>

          <Link
            href="/projects"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition"
          >
            <span>Browse Full National Registry ➔</span>
          </Link>
        </div>

        {/* Official Project Cards List */}
        <div className="space-y-3">
          {filteredProjects.slice(0, 4).map((proj) => (
            <div
              key={proj.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 sm:p-5 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                    {proj.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>{proj.location_name || 'All-India Geospatial Zone'}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{proj.status || 'Verified Survey'}</span>
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {proj.description}
                </p>

                <div className="flex items-center flex-wrap gap-4 text-[11px] text-slate-500 font-mono pt-1">
                  <span>🏛️ {proj.department || 'National Geospatial Authority'}</span>
                  <span>•</span>
                  <span>Accuracy: <strong className="text-emerald-400 font-sans">{proj.confidence || '98.5%'}</strong></span>
                  <span>•</span>
                  <span>Surveillance Queries: <strong className="text-slate-300 font-sans">{proj.queries_count || 24}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                <Link
                  href={`/workspace/${proj.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm w-full md:w-auto"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Open Map Workspace</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🛰️ 8. NATIONAL AGENCY & SATELLITE INTEGRATION MATRIX */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{t.systemIntegrations}</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              ● All Feeds Fully Synchronized
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
            {[
              { name: 'Survey of India (SOI)', type: 'Geodetic CRS (EPSG:4326)', status: 'Active' },
              { name: 'ISRO Bhuvan Feeds', type: 'High-Res Optical', status: 'Active' },
              { name: 'Sentinel-1 & 2', type: 'ESA Optical + SAR Radar', status: 'Active' },
              { name: 'NDMA Disaster Cell', type: 'Emergency Protocols', status: 'Active' },
              { name: 'Digital India GIS', type: 'National Spatial Grid', status: 'Active' },
              { name: 'IMD Weather & Rain', type: 'Monsoon Telemetry', status: 'Active' },
            ].map((agency, i) => (
              <div
                key={i}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-center flex flex-col justify-between"
              >
                <div className="text-[11px] font-bold text-slate-200">{agency.name}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">{agency.type}</div>
                <div className="mt-2 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 py-0.5 rounded">
                  ✓ {agency.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🇮🇳 9. OFFICIAL GOVERNMENT FOOTER & COMPLIANCE */}
      <footer className="bg-slate-950 border-t border-slate-800 mt-12 py-10 px-4 sm:px-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Government Portals
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li><a href="https://www.india.gov.in" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition flex items-center gap-1">National Portal of India <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://bhuvan.nrsc.gov.in" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition flex items-center gap-1">ISRO Bhuvan Geo-Portal <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://surveyofindia.gov.in" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition flex items-center gap-1">Survey of India (SOI) <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://ndma.gov.in" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition flex items-center gap-1">NDMA Disaster Cell <ExternalLink className="w-2.5 h-2.5" /></a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Citizen Services
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li><Link href="/workspace/proj_0001" className="hover:text-cyan-400 transition">View District Satellite Map</Link></li>
                <li><Link href="/disaster" className="hover:text-cyan-400 transition">Check Flood & Cyclone Alerts</Link></li>
                <li><Link href="/image-analysis" className="hover:text-cyan-400 transition">Crop Health (NDVI) Assessment</Link></li>
                <li><Link href="/chat" className="hover:text-cyan-400 transition">Ask AI Spatial Question</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Legal & RTI Policies
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li className="hover:text-slate-200 cursor-pointer">Right to Information (RTI)</li>
                <li className="hover:text-slate-200 cursor-pointer">National Geospatial Policy 2022</li>
                <li className="hover:text-slate-200 cursor-pointer">Terms of Use & Copyright</li>
                <li className="hover:text-slate-200 cursor-pointer">Privacy & Hyperlinking Policy</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Help & Grievance
              </h4>
              <div className="space-y-2 text-[11px]">
                <p className="text-slate-300 font-semibold">National Geospatial Helpdesk:</p>
                <p className="text-emerald-400 font-mono font-bold">📞 1800-11-2026 (Toll-Free)</p>
                <p className="text-slate-400">Email: helpdesk@corvus.gov.in</p>
                <p className="text-slate-500 text-[10px]">CPGRAMS Citizen Grievance Redressal Compliant</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span>🏛️</span>
              <span>
                Designed and Developed for <strong>National Earth Observation & Spatial Surveillance Mission</strong> by Team CORVUS.
              </span>
            </div>
            <div>
              <span>Last Reviewed and Updated: <strong>12 September 2026</strong> • Version 4.2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
