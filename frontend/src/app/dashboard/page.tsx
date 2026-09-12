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
          setProjectsList([
            {
              id: 'proj_0001',
              name: 'Delhi NCR Urban Expansion & Forest Canopy Audit',
              description: 'Bi-temporal high-resolution satellite surveillance for unauthorized construction and green buffer monitoring across 1,484 km².',
              location_name: 'Delhi NCR (North Survey Division)',
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
              location_name: 'Assam & Riverine Basins',
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

  // Sensible Bilingual Government Dictionary
  const t = {
    govIndia: language === 'hi' ? 'भारत सरकार' : 'GOVERNMENT OF INDIA',
    ministry: language === 'hi' ? 'अंतरिक्ष विभाग एवं पृथ्वी विज्ञान मंत्रालय' : 'Department of Space & Ministry of Earth Sciences',
    portalName: language === 'hi' ? 'राष्ट्रीय सुदूर संवेदन एवं भू-स्थानिक अवलोकन पोर्टल' : 'National Remote Sensing & Earth Observation Geospatial Portal',
    portalSub: language === 'hi'
      ? 'नागरिकों, किसानों, नगर निकायों एवं आपदा प्रबंधन हेतु उपग्रह आधारित आधिकारिक भू-स्थानिक मंच'
      : 'Approved under National Geospatial Policy 2022 • Open Public & Inter-Departmental Satellite Intelligence',
    bulletinTitle: language === 'hi' ? 'ताज़ा बुलेटिन' : 'LIVE BULLETIN',
    bulletinText: language === 'hi'
      ? 'इसरो एवं सेंटिनल उपग्रह रडार लाइव: असम एवं गंगा बेसिन में बाढ़ निगरानी सक्रिय • खरीफ फसल स्वास्थ्य रिपोर्ट जारी • अनाधिकृत शहरी अतिक्रमण जांच उपलब्ध • नागरिक सहायता 1800-11-2026 (निःशुल्क) चालू।'
      : 'SATELLITE RADAR LIVE: High-Resolution Monsoon Inundation Watch active for Brahmaputra & Ganga Basins • Kharif Crop Health Indexes Calibrated across 18 States • Municipal Encroachment Audits Open for Panchayats & ULBs • Citizen Helpline 1800-11-2026 Active 24x7.',
    searchPlaceholder: language === 'hi'
      ? 'राज्य, जिला, पंचायत या निर्देशांक खोजें (उदा. दिल्ली, वाराणसी, पटना, मुंबई, जयपुर)...'
      : 'Search any State, District, Panchayat, River Basin or Coordinates (e.g., Delhi, Patna, Brahmaputra, Mumbai)...',
    searchBtn: language === 'hi' ? 'खोजें' : 'Search Area',
    quickServices: language === 'hi' ? 'प्रमुख सार्वजनिक एवं प्रशासनिक सेवाएँ' : 'Key Citizen & Department Services',
    quickServicesSub: language === 'hi'
      ? 'प्रत्येक नागरिक और अधिकारी द्वारा आसानी से उपयोग किए जाने वाले आधिकारिक उपग्रह मॉड्यूल'
      : 'Direct, single-click geospatial services for public transparency and departmental operations',
    kpiSection: language === 'hi' ? 'राष्ट्रीय भू-स्थानिक आंकड़े' : 'National Geospatial Statistics Overview',
    kpiArea: language === 'hi' ? 'कुल निगरानी क्षेत्र' : 'Total Territory Monitored',
    kpiSat: language === 'hi' ? 'सक्रिय उपग्रह बेड़ा' : 'Operational Satellite Feeds',
    kpiAudits: language === 'hi' ? 'सत्यापित सर्वेक्षण' : 'Verified District Audits',
    kpiDisaster: language === 'hi' ? 'सतत निगरानी' : '24x7 Disaster Surveillance',
    howItWorksTitle: language === 'hi' ? 'नागरिक एवं अधिकारी इस पोर्टल का उपयोग कैसे करें?' : 'How Citizens and Officials Use This Portal (3 Simple Steps)',
    recentProjectsTitle: language === 'hi' ? 'सत्यापित राष्ट्रीय एवं राज्य स्तरीय भू-स्थानिक सर्वेक्षण' : 'Official Geospatial Initiatives & Verified Audits',
    systemIntegrations: language === 'hi' ? 'राष्ट्रीय संस्थान एवं उपग्रह डेटा एकीकरण' : 'National Agency & Satellite Feeds Integration',
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
        highContrast ? 'bg-black text-amber-300' : 'bg-[#FAFCFF] text-slate-800'
      } ${
        fontScale === 'large' ? 'text-base' : fontScale === 'larger' ? 'text-lg' : 'text-sm'
      }`}
    >
      {/* 🇮🇳 1. ELEGANT NATIONAL TRICOLOR TOP STRIP */}
      <div className="h-1.5 w-full flex shrink-0">
        <div className="flex-1 bg-[#E65100]" />
        <div className="flex-1 bg-white border-y border-slate-200 relative flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#000080]" />
        </div>
        <div className="flex-1 bg-[#138808]" />
      </div>
      
      {/* Top Official Government Masthead Bar */}
      <div className="bg-white border-b border-slate-200 text-xs py-2 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-3 text-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-400 flex items-center justify-center text-sm shadow-xs">
              🏛️
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-extrabold tracking-wider text-[#9A3412] uppercase text-xs">
                {t.govIndia}
              </span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-600 text-[11px] font-medium">
                {t.ministry}
              </span>
            </div>
          </div>
        </div>

        {/* Accessibility & Language Controls */}
        <div className="flex items-center gap-3 text-[11px]">
          {/* Live IST Clock */}
          <div className="hidden lg:flex items-center gap-1.5 text-[#0A2540] bg-slate-50 px-2.5 py-1 rounded border border-slate-200 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-bold">{currentTime || '19:50:00 IST'}</span>
          </div>

          {/* Citizen Helpline */}
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold">Toll-Free: 1800-11-2026</span>
          </div>

          {/* Font Scaler */}
          <div className="flex items-center bg-slate-100 rounded border border-slate-300 overflow-hidden font-mono">
            <button
              onClick={() => setFontScale('normal')}
              className={`px-2 py-0.5 font-bold transition ${fontScale === 'normal' ? 'bg-[#0B3558] text-white' : 'text-slate-700 hover:bg-slate-200'}`}
              title="Standard Font Size"
            >
              A-
            </button>
            <button
              onClick={() => setFontScale('large')}
              className={`px-2 py-0.5 font-bold transition ${fontScale === 'large' ? 'bg-[#0B3558] text-white' : 'text-slate-700 hover:bg-slate-200'}`}
              title="Large Font Size"
            >
              A
            </button>
            <button
              onClick={() => setFontScale('larger')}
              className={`px-2 py-0.5 font-bold transition ${fontScale === 'larger' ? 'bg-[#0B3558] text-white' : 'text-slate-700 hover:bg-slate-200'}`}
              title="Extra Large Font Size"
            >
              A+
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 rounded border border-slate-300 overflow-hidden">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 font-bold transition ${language === 'en' ? 'bg-[#E65100] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 font-bold transition ${language === 'hi' ? 'bg-[#E65100] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'}`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>

      {/* Official Sensible Government Navigation Bar */}
      <Navbar />

      {/* 📢 2. OFFICIAL BULLETIN TICKER */}
      <div className="bg-[#FFF8E7] border-b border-amber-200/80 px-4 sm:px-8 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#E65100] text-white font-extrabold text-[10px] uppercase tracking-wider shrink-0 shadow-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>{t.bulletinTitle}</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap text-xs text-amber-950 font-medium">
          <p className="inline-block">{t.bulletinText}</p>
        </div>
      </div>

      {/* 🏛️ 3. SENSIBLE OFFICIAL PORTAL HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-7 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-center text-[#0B3558] shrink-0 shadow-xs">
                <Satellite className="w-6 h-6 text-[#0B3558]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#E65100] tracking-wider uppercase">
                    CORVUS — राष्ट्रीय सुदूर संवेदन मिशन
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                    ✓ Survey of India Verified
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0B2545] tracking-tight">
                  {t.portalName}
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-normal pl-0.5 leading-relaxed">
              {t.portalSub}
            </p>
          </div>

          {/* Right: Clean Action Button & User Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs w-full sm:w-auto">
              <div className="text-[10px] text-slate-500 font-medium">
                Authorized Official / Citizen
              </div>
              <div className="font-bold text-[#0B2545] flex items-center gap-1 mt-0.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{user?.full_name || 'Corvus Mission Director'}</span>
              </div>
            </div>

            <Link
              href="/workspace/proj_0001"
              className="px-5 py-3 bg-[#E65100] hover:bg-[#D84315] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition shrink-0 w-full sm:w-auto"
            >
              <Globe className="w-4 h-4 text-white" />
              <span>उपग्रह नक्शा खोलें (Launch GIS Map) ➔</span>
            </Link>
          </div>
        </div>

        {/* Universal Search Bar */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="bg-white border-2 border-slate-300 hover:border-[#0B3558] focus-within:border-[#0B3558] rounded-xl p-2 flex flex-col sm:flex-row items-center gap-2 shadow-xs transition">
            <div className="flex items-center gap-2.5 px-3 w-full flex-1">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="bg-transparent border-none text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none w-full"
              />
              {searchDistrict && (
                <button
                  onClick={() => setSearchDistrict('')}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold px-1.5"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 px-2 sm:px-0">
              <span className="text-[10px] text-slate-500 font-medium hidden lg:inline">Quick Search:</span>
              {[
                { name: 'Delhi NCR' },
                { name: 'Patna (Ganga)' },
                { name: 'Assam (Flood)' },
                { name: 'Mumbai Coast' },
              ].map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => setSearchDistrict(loc.name)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition border border-slate-200 whitespace-nowrap"
                >
                  {loc.name}
                </button>
              ))}
              <Link
                href="/workspace/proj_0001"
                className="px-4 py-2 bg-[#0B3558] hover:bg-[#07243D] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ml-1 shadow-xs"
              >
                <span>{t.searchBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 📊 4. NATIONAL GEOSPATIAL STATISTICS (Sensible Numbers Panel) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#E65100]" />
            <span>{t.kpiSection}</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            National Remote Sensing Centre &amp; Survey of India Standard
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border-t-3 border-t-[#E65100] border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase">
              {t.kpiArea}
            </div>
            <div className="text-2xl font-black text-[#0B2545] tracking-tight mt-1">
              3,287,263 km²
            </div>
            <div className="text-[11px] text-[#E65100] font-medium mt-1">
              अखिल भारतीय कवरेज (All-India)
            </div>
          </div>

          <div className="bg-white border-t-3 border-t-[#0B3558] border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase">
              {t.kpiSat}
            </div>
            <div className="text-2xl font-black text-[#0B2545] tracking-tight mt-1">
              14 Satellites
            </div>
            <div className="text-[11px] text-[#0B3558] font-medium mt-1">
              सक्रिय उपग्रह बेड़ा (Sentinel/RISAT)
            </div>
          </div>

          <div className="bg-white border-t-3 border-t-[#138808] border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase">
              {t.kpiAudits}
            </div>
            <div className="text-2xl font-black text-[#0B2545] tracking-tight mt-1">
              1,280+ Surveys
            </div>
            <div className="text-[11px] text-[#138808] font-medium mt-1">
              सत्यापित सर्वेक्षण (Panchayat/ULBs)
            </div>
          </div>

          <div className="bg-white border-t-3 border-t-red-600 border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase">
              {t.kpiDisaster}
            </div>
            <div className="text-2xl font-black text-[#0B2545] tracking-tight mt-1">
              24×7 Active
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">
              सतत निगरानी (Disaster Watch)
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 5. KEY CITIZEN & DEPARTMENT SERVICES (Clean, Sensible Writing) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-100 text-[#E65100]">
              <Landmark className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-[#0B2545]">
              {t.quickServices}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.quickServicesSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Service 1 */}
          <div className="bg-white border border-slate-200 hover:border-[#0B3558] rounded-xl p-5 shadow-xs hover:shadow-sm flex flex-col justify-between transition">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-blue-50 text-[#0B3558] border border-blue-200">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-[#0B3558] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  नक्शा सेवा
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B2545]">
                  भू-स्थानिक नक्शा पोर्टल (GIS Satellite Map Explorer)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  देश भर के गांवों, शहरों और औद्योगिक क्षेत्रों के उच्च-रिज़ॉल्यूशन उपग्रह चित्र, सड़क नेटवर्क एवं भूमि आवरण देखें।
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/workspace/proj_0001"
                className="w-full py-2 bg-[#0B3558] hover:bg-[#07243D] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>नक्शा पोर्टल खोलें (Launch Map)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Service 2 */}
          <div className="bg-white border border-slate-200 hover:border-[#E65100] rounded-xl p-5 shadow-xs hover:shadow-sm flex flex-col justify-between transition">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-orange-50 text-[#E65100] border border-orange-200">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-[#E65100] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  आपदा सेवा
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B2545]">
                  आपदा प्रबंधन एवं चेतावनी (Disaster &amp; Emergency Cell)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  बाढ़ जलभराव क्षेत्र, चक्रवात निगरानी, बादल भेदी रडार स्कैन एवं सुरक्षित राहत शिविरों की वास्तविक समय जानकारी।
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/disaster"
                className="w-full py-2 bg-[#E65100] hover:bg-[#D84315] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>आपदा पोर्टल खोलें (Open Disaster AI)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Service 3 */}
          <div className="bg-white border border-slate-200 hover:border-[#138808] rounded-xl p-5 shadow-xs hover:shadow-sm flex flex-col justify-between transition">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-[#138808] border border-emerald-200">
                  <Wheat className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-[#138808] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  कृषि सेवा
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B2545]">
                  कृषि एवं फसल निगरानी (Crop Health &amp; Agriculture Audit)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  फसल हरियाली (NDVI), मिट्टी में नमी एवं सूखा जोखिम का उपग्रह आधारित विश्लेषण — फसल बीमा एवं किसान कल्याण हेतु।
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/image-analysis"
                className="w-full py-2 bg-[#138808] hover:bg-[#0F6B06] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>फसल विश्लेषण (Analyze Crops)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Service 4 */}
          <div className="bg-white border border-slate-200 hover:border-[#0B3558] rounded-xl p-5 shadow-xs hover:shadow-sm flex flex-col justify-between transition">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-amber-50 text-[#B45309] border border-amber-200">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-[#B45309] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  शहरी विकास
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B2545]">
                  शहरी नियोजन एवं अतिक्रमण (Urban Infrastructure &amp; Change)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  अवैध निर्माण, वन आवरण में क्षति एवं शहर विस्तार की स्वचालित उपग्रह निगरानी — नगर निगम एवं विकास प्राधिकरणों हेतु।
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/workspace/proj_0001"
                className="w-full py-2 bg-[#0B3558] hover:bg-[#07243D] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>शहरी ऑडिट देखें (Inspect Urban)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Service 5 */}
          <div className="bg-white border border-slate-200 hover:border-[#0B3558] rounded-xl p-5 shadow-xs hover:shadow-sm flex flex-col justify-between transition">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  एआई परामर्श
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B2545]">
                  भू-स्थानिक नागरिक एआई सहायक (Geospatial AI Copilot)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  सरल हिंदी या अंग्रेजी में प्रश्न पूछें और उपग्रह डेटा से तत्काल प्रामाणिक उत्तर एवं नक्शा संदर्भ प्राप्त करें।
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/chat"
                className="w-full py-2 bg-[#0B3558] hover:bg-[#07243D] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>एआई से पूछें (Ask AI Copilot)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Service 6 */}
          <div className="bg-white border border-slate-200 hover:border-[#138808] rounded-xl p-5 shadow-xs hover:shadow-sm flex flex-col justify-between transition">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  सरकारी रिपोर्ट
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B2545]">
                  प्रमाणित रिपोर्ट एवं डेटा रजिस्ट्री (Official Registry &amp; PDF)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  जीपीएस निर्देशांक, उपग्रह टाइमस्टैम्प एवं आधिकारिक सत्यापन के साथ प्रमाणित पीडीएफ सर्वेक्षण सारांश डाउनलोड करें।
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/projects"
                className="w-full py-2 bg-[#138808] hover:bg-[#0F6B06] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>आधिकारिक रिकॉर्ड देखें (View Registry)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🧭 6. "HOW IT WORKS" — 3 SIMPLE STEPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded bg-emerald-100 text-emerald-800">
              <HelpCircle className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-extrabold text-[#0B2545]">
              {t.howItWorksTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-md bg-[#E65100] text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  स्थान चुनें या उपग्रह चित्र अपलोड करें
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Search any district, village or enter GPS coordinates to instantly anchor the satellite scene.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-md bg-[#0B3558] text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  स्वचालित एआई स्थानिक विश्लेषण
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  AI models calculate vegetation (NDVI), water bodies (NDWI), and unauthorized constructions with 98%+ precision.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-md bg-[#138808] text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  प्रमाणित सरकारी रिपोर्ट डाउनलोड करें
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Download certified survey summary with coordinates and digital timestamps for official records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📁 7. OFFICIAL INITIATIVES REGISTRY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-100 text-[#E65100]">
                <FolderKanban className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-[#0B2545]">
                {t.recentProjectsTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified public spatial surveillance records
            </p>
          </div>

          <Link
            href="/projects"
            className="text-xs text-[#0B3558] hover:underline font-bold flex items-center gap-1"
          >
            <span>सभी परियोजनाएं देखें (Browse Full Registry) ➔</span>
          </Link>
        </div>

        <div className="space-y-2.5">
          {filteredProjects.slice(0, 4).map((proj) => (
            <div
              key={proj.id}
              className="bg-white border border-slate-200 hover:border-[#0B3558] rounded-lg p-4 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {proj.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-600" />
                    <span>{proj.location_name || 'All-India Geospatial Zone'}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{proj.status || 'Verified Survey'}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#0B2545]">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {proj.description}
                </p>

                <div className="text-[11px] text-slate-500 font-medium">
                  <span>🏛️ {proj.department || 'National Geospatial Authority'}</span>
                  <span className="mx-2">•</span>
                  <span>Accuracy: <strong className="text-emerald-800">{proj.confidence || '98.5%'}</strong></span>
                </div>
              </div>

              <div className="shrink-0 w-full md:w-auto pt-2 md:pt-0">
                <Link
                  href={`/workspace/${proj.id}`}
                  className="px-3.5 py-1.5 bg-[#0B3558] hover:bg-[#07243D] text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs w-full md:w-auto"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Open Map</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🛰️ 8. NATIONAL AGENCY INTEGRATION MATRIX */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#E65100]" />
              <span>{t.systemIntegrations}</span>
            </h3>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
              ✓ All Feeds Synchronized
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
            {[
              { name: 'Survey of India (SOI)', type: 'Geodetic CRS', status: 'Active' },
              { name: 'ISRO Bhuvan Feeds', type: 'High-Res Optical', status: 'Active' },
              { name: 'Sentinel-1 & 2', type: 'Optical + SAR', status: 'Active' },
              { name: 'NDMA Disaster Cell', type: 'Emergency Grid', status: 'Active' },
              { name: 'Digital India GIS', type: 'National Grid', status: 'Active' },
              { name: 'IMD Weather & Rain', type: 'Monsoon Radar', status: 'Active' },
            ].map((agency, i) => (
              <div
                key={i}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center flex flex-col justify-between"
              >
                <div className="text-[11px] font-bold text-slate-800">{agency.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{agency.type}</div>
                <div className="mt-1.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 py-0.5 rounded">
                  ✓ {agency.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🇮🇳 9. OFFICIAL GOVERNMENT FOOTER */}
      <footer className="bg-slate-100 text-slate-600 text-xs border-t border-slate-200 mt-10">
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#E65100]" />
          <div className="flex-1 bg-white border-y border-slate-200" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h4 className="text-[#0B2545] font-bold text-xs uppercase tracking-wider mb-2.5">
                Government Portals
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="https://www.india.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">National Portal of India <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://bhuvan.nrsc.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">ISRO Bhuvan Geo-Portal <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://surveyofindia.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">Survey of India (SOI) <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://ndma.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">NDMA Disaster Cell <ExternalLink className="w-2.5 h-2.5" /></a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#0B2545] font-bold text-xs uppercase tracking-wider mb-2.5">
                Citizen Services
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link href="/workspace/proj_0001" className="hover:underline">View District Satellite Map</Link></li>
                <li><Link href="/disaster" className="hover:underline">Check Flood &amp; Cyclone Alerts</Link></li>
                <li><Link href="/image-analysis" className="hover:underline">Crop Health (NDVI) Assessment</Link></li>
                <li><Link href="/chat" className="hover:underline">Ask AI Spatial Question</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#0B2545] font-bold text-xs uppercase tracking-wider mb-2.5">
                Legal &amp; RTI Policies
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li className="hover:underline cursor-pointer">Right to Information (RTI)</li>
                <li className="hover:underline cursor-pointer">National Geospatial Policy 2022</li>
                <li className="hover:underline cursor-pointer">Terms of Use &amp; Copyright</li>
                <li className="hover:underline cursor-pointer">Privacy &amp; Hyperlinking Policy</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#0B2545] font-bold text-xs uppercase tracking-wider mb-2.5">
                Help &amp; Grievance
              </h4>
              <div className="space-y-1 text-[11px]">
                <p className="font-semibold text-slate-800">National Geospatial Helpdesk:</p>
                <p className="text-emerald-800 font-bold text-sm">1800-11-2026 (Toll-Free)</p>
                <p className="text-slate-500">Email: helpdesk@corvus.gov.in</p>
                <p className="text-slate-500 text-[10px]">CPGRAMS Citizen Redressal Compliant</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              <span>Designed and Developed for <strong>National Earth Observation Mission</strong> by Team CORVUS.</span>
            </div>
            <div>
              <span>Last Reviewed: <strong>12 September 2026</strong> • Version 4.2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
