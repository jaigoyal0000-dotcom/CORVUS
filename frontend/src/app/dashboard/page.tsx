'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Satellite, Globe, Search, ArrowRight, ExternalLink,
  Phone, AlertTriangle, Download, Database, CloudSun,
  Layers, MapPin, Eye, Compass, Trees, Droplets,
  Building2, Wheat, ShieldAlert, FileText, CheckCircle2,
  ChevronRight, Sparkles, Navigation
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
  const [searchDistrict, setSearchDistrict] = useState('');

  // Accessibility State
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'larger'>('normal');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.replace('/auth');
      return;
    }
    setUser(getUser());

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
              status: 'Approved & Verified',
              department: 'Ministry of Housing & Urban Affairs (MoHUA)',
              confidence: '98.7%'
            },
            {
              id: 'proj_0002',
              name: 'Brahmaputra River Basin Flood Inundation & Embankment Surveillance',
              description: 'Sentinel-1 SAR radar bi-weekly penetration through monsoon cloud cover to track breach hotspots and shelter connectivity.',
              location_name: 'Assam & Riverine Basins',
              status: 'Active Disaster Alert',
              department: 'National Disaster Management Authority (NDMA)',
              confidence: '99.2%'
            },
            {
              id: 'proj_0003',
              name: 'Kharif Crop Health, Soil Moisture & Drought Assessment (18 Districts)',
              description: 'Multi-spectral NDVI and moisture anomaly indexing to forecast crop yields and disburse Pradhan Mantri Fasal Bima subsidies.',
              location_name: 'Vidarbha & Marathwada Agro-Climatic Zone',
              status: 'Completed Survey',
              department: 'Department of Agriculture & Farmers Welfare',
              confidence: '97.4%'
            },
            {
              id: 'proj_0004',
              name: 'Western Ghats Ecological Sensitivity & Mangrove Buffer Audit',
              description: 'Coastal Regulation Zone (CRZ) encroachment identification and illegal reclamation tracking using multi-sensor radar fusion.',
              location_name: 'Maharashtra & Goa Coastal Belt',
              status: 'Annual Audit in Progress',
              department: 'Ministry of Environment, Forest & Climate Change',
              confidence: '98.1%'
            }
          ]);
        }
      })
      .catch((err) => console.error('Failed to load projects:', err));
  }, [router]);

  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen bg-white text-slate-800 ${
        fontScale === 'large' ? 'text-base' : fontScale === 'larger' ? 'text-lg' : 'text-sm'
      }`}
    >
      {/* 🇮🇳 TOP OFFICIAL BHUVAN HEADER BAR */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2 flex items-center justify-between">
        {/* Left: Bhuvan / Corvus nextgen Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* Circular India Outline Emblem with Orange & Blue Arc Ring */}
          <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Outer circle track */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              {/* Orange top-right arc */}
              <path
                d="M 50 5 A 45 45 0 0 1 95 50"
                fill="none"
                stroke="#E65100"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Blue bottom-left arc */}
              <path
                d="M 50 95 A 45 45 0 0 1 5 50"
                fill="none"
                stroke="#006BB6"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Green dot */}
              <circle cx="50" cy="50" r="28" fill="#F0F8FF" />
            </svg>
            <span className="absolute text-sm font-black text-[#006BB6]">🇮🇳</span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight text-[#006BB6] font-serif">
                bhuvan
              </span>
              <span className="text-xs font-semibold text-slate-500 italic">nextgen</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-none">
              Indian Geo-Platform of ISRO &amp; CORVUS
            </p>
          </div>
        </Link>

        {/* Right: G20, NRSC, ISRO, Emblem + Accessibility Controls */}
        <div className="flex items-center gap-4">
          {/* G20 & ISRO NRSC Emblem Cluster */}
          <div className="hidden md:flex items-center gap-3 pr-3 border-r border-slate-200">
            {/* G20 Badge */}
            <div className="flex items-center gap-1">
              <span className="text-sm font-extrabold text-[#E65100]">G2</span>
              <div className="w-3.5 h-3.5 rounded-full border border-blue-600 flex items-center justify-center text-[8px] text-blue-600 font-bold">
                0
              </div>
              <div className="flex flex-col text-[8px] font-bold text-slate-600 leading-tight">
                <span>भारत 2023</span>
                <span>INDIA</span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-300 mx-1" />

            {/* NRSC & ISRO Text */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[11px] font-bold text-[#006BB6] leading-tight">
                  National Remote Sensing Centre
                </div>
                <div className="text-[9px] text-slate-500 font-semibold">
                  भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO)
                </div>
              </div>
              {/* Lion Emblem Placeholder */}
              <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center text-xs">
                🏛️
              </div>
            </div>
          </div>

          {/* Font Resizer A- A A+ */}
          <div className="flex items-center text-xs border border-slate-300 rounded overflow-hidden">
            <button
              onClick={() => setFontScale('normal')}
              className={`px-2 py-0.5 font-bold transition ${
                fontScale === 'normal' ? 'bg-[#006BB6] text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              A-
            </button>
            <button
              onClick={() => setFontScale('large')}
              className={`px-2 py-0.5 font-bold transition ${
                fontScale === 'large' ? 'bg-[#006BB6] text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontScale('larger')}
              className={`px-2 py-0.5 font-bold transition ${
                fontScale === 'larger' ? 'bg-[#006BB6] text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              A+
            </button>
          </div>

          {/* Language Switch */}
          <div className="flex items-center text-xs border border-slate-300 rounded overflow-hidden">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 font-semibold transition ${
                language === 'en' ? 'bg-[#006BB6] text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 font-semibold transition ${
                language === 'hi' ? 'bg-[#006BB6] text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 ROYAL BLUE NAVIGATION BAR */}
      <Navbar />

      {/* 🌤️ AUTHENTIC BHUVAN HERO BANNER SECTION */}
      <section className="bg-gradient-to-b from-[#FFFFFF] via-[#F1F7FD] to-[#D8EAF8] border-b border-[#BEDCF4] py-8 px-4 sm:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Bhuvan Large India Circular Emblem & Crimson Title */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Big Circular India Emblem with Orange & Blue Swooshes */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
                {/* Background circle */}
                <circle cx="60" cy="60" r="54" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                {/* Orange upper-right arc */}
                <path
                  d="M 60 8 A 52 52 0 0 1 112 60"
                  fill="none"
                  stroke="#E65100"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                {/* Blue lower-left arc */}
                <path
                  d="M 60 112 A 52 52 0 0 1 8 60"
                  fill="none"
                  stroke="#006BB6"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                {/* Green India Map shape representation */}
                <path
                  d="M60 28 L66 36 L64 44 L72 48 L76 56 L68 66 L64 78 L56 78 L50 68 L44 56 L48 44 L54 34 Z"
                  fill="#43A047"
                  stroke="#2E7D32"
                  strokeWidth="1.5"
                />
                <circle cx="60" cy="54" r="3.5" fill="#000080" />
              </svg>
            </div>

            {/* Bhuvan Text & Descriptions */}
            <div className="space-y-1.5 max-w-2xl">
              {/* Crimson Brand Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#C0282D] tracking-tight font-serif">
                Bhuvan
              </h1>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Indian Geo Platform of ISRO
              </h2>

              <p className="text-xs text-slate-700 leading-relaxed pt-1">
                Visualisation | OGC Compliant Thematic, Disaster, Weather, Ocean Services | Asset Mapping and Inventory Creations
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Planning and Development | Decision Making | Resources Management | Location Based Services
              </p>

              {/* Direct Quick Launch Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-3 justify-center sm:justify-start">
                <Link
                  href="/workspace/proj_0001"
                  className="px-4 py-2 bg-[#006BB6] hover:bg-[#005591] text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Globe className="w-4 h-4" />
                  <span>Launch 2D GIS Map</span>
                </Link>
                <Link
                  href="/disaster"
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Disaster Cell</span>
                </Link>
                <Link
                  href="/image-analysis"
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Wheat className="w-4 h-4 text-emerald-700" />
                  <span>Agriculture &amp; NDVI</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Framed Satellite Imagery of India */}
          <div className="shrink-0 w-full sm:w-80 lg:w-72">
            <Link
              href="/workspace/proj_0001"
              className="block bg-white p-1 rounded-lg border border-slate-300 shadow-md hover:border-[#006BB6] transition group"
            >
              <div className="relative h-44 rounded overflow-hidden bg-slate-900">
                {/* Satellite Imagery Canvas Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                {/* Subtitle tag */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs rounded text-[10px] text-white font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sentinel / RISAT Feed</span>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                  <span className="font-bold">Indian Subcontinent</span>
                  <span className="text-[11px] text-blue-200 group-hover:underline flex items-center gap-0.5">
                    Explore ➔
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 📢 LATEST UPDATES / TICKER STRIP */}
      <div className="bg-[#EAF3FA] border-b border-[#D0E2F0] px-4 sm:px-8 py-1.5 flex items-center gap-3">
        {/* Blue Solid Button */}
        <div className="px-3 py-1 bg-[#005599] text-white font-bold text-xs rounded-xs shrink-0 shadow-xs">
          Latest Updates
        </div>

        {/* Ticker Text */}
        <div className="overflow-hidden whitespace-nowrap text-xs text-slate-800 font-medium flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800">
              Webinar on Bhuvan &amp; Corvus Geospatial AI Overview ( 05-07 August, 2026 )
            </span>
            <span className="bg-red-600 text-white text-[9px] font-bold px-1 py-0.2 rounded uppercase">
              New
            </span>
          </div>
          <span className="text-slate-400">•</span>
          <span className="text-[#006BB6] hover:underline cursor-pointer">
            Know Your DIGIPIN - Search by location, search by postal pin &amp; coordinate grid
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-700">
            Monsoon Inundation Mapping Active for Brahmaputra &amp; Ganga River Basins
          </span>
        </div>
      </div>

      {/* 🔍 SEARCH LOCATOR BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="bg-white border border-slate-300 rounded-lg p-2 flex flex-col sm:flex-row items-center gap-2 shadow-xs">
          <div className="flex items-center gap-2.5 px-3 w-full flex-1">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              placeholder="Search by District, State, River Basin, or Coordinates (e.g., Delhi, Patna, Brahmaputra)..."
              className="bg-transparent border-none text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none w-full"
            />
            {searchDistrict && (
              <button
                onClick={() => setSearchDistrict('')}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold px-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['Delhi NCR', 'Patna (Ganga)', 'Assam (Flood)', 'Mumbai Coast'].map((loc) => (
              <button
                key={loc}
                onClick={() => setSearchDistrict(loc)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition border border-slate-200 whitespace-nowrap"
              >
                {loc}
              </button>
            ))}
            <Link
              href="/workspace/proj_0001"
              className="px-4 py-2 bg-[#006BB6] hover:bg-[#005591] text-white rounded text-xs font-bold transition flex items-center gap-1 shrink-0 ml-1"
            >
              <span>Search Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 🌐 SECTION 1: VISUALISATION & FREE DOWNLOAD (Exact Bhuvan 6-Card Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold text-slate-800">
            Visualisation &amp; Free Download
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Collaborative applications - Platform to share your data and create governance applications
          </p>
        </div>

        {/* 6 Clean White Bhuvan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Bhuvan 2D */}
          <Link
            href="/workspace/proj_0001"
            className="bg-white border border-slate-200 hover:border-[#006BB6] hover:shadow-md transition-all rounded-lg p-4 flex items-center gap-4 group"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <div className="relative">
                <Globe className="w-7 h-7 text-[#006BB6]" />
                <Search className="w-4 h-4 text-[#E65100] absolute -bottom-1 -right-1" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#006BB6] transition">
                Bhuvan 2D
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-resolution Satellite Map Viewer &amp; Basemaps
              </p>
            </div>
          </Link>

          {/* Card 2: Bhuvan 3D */}
          <Link
            href="/workspace/proj_0001"
            className="bg-white border border-slate-200 hover:border-[#2E7D32] hover:shadow-md transition-all rounded-lg p-4 flex items-center gap-4 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 48 48" className="w-8 h-8 text-[#2E7D32]">
                <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M 24 6 A 18 18 0 0 1 42 24" fill="none" stroke="#43A047" strokeWidth="4" />
                <polygon points="42,20 46,26 38,26" fill="#43A047" />
                <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#2E7D32] transition">
                Bhuvan 3D
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Digital Elevation Model (DEM) &amp; Terrain Globe
              </p>
            </div>
          </Link>

          {/* Card 3: Bhuvan Lite */}
          <Link
            href="/workspace/proj_0001"
            className="bg-white border border-slate-200 hover:border-[#E65100] hover:shadow-md transition-all rounded-lg p-4 flex items-center gap-4 group"
          >
            <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M 50 5 A 45 45 0 0 1 95 50" fill="none" stroke="#E65100" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 50 95 A 45 45 0 0 1 5 50" fill="none" stroke="#006BB6" strokeWidth="8" strokeLinecap="round" />
                </svg>
                <span className="absolute text-xs">🇮🇳</span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#E65100] transition">
                Bhuvan Lite
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Optimized lightweight GIS for mobile &amp; low bandwidth
              </p>
            </div>
          </Link>

          {/* Card 4: Open Data Archive */}
          <Link
            href="/projects"
            className="bg-white border border-slate-200 hover:border-[#1565C0] hover:shadow-md transition-all rounded-lg p-4 flex items-center gap-4 group"
          >
            <div className="w-14 h-14 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <div className="relative">
                <Database className="w-7 h-7 text-[#1565C0]" />
                <Download className="w-3.5 h-3.5 text-[#1565C0] absolute -bottom-1 -right-1" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1565C0] transition">
                Open Data Archive
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download Free Satellite Rasters &amp; Vector Datasets
              </p>
            </div>
          </Link>

          {/* Card 5: Climate & Environment */}
          <Link
            href="/image-analysis"
            className="bg-white border border-slate-200 hover:border-amber-600 hover:shadow-md transition-all rounded-lg p-4 flex items-center gap-4 group"
          >
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CloudSun className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">
                Climate &amp; Environment
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vegetation Index (NDVI), Drought &amp; Weather Anomalies
              </p>
            </div>
          </Link>

          {/* Card 6: Bhoonidhi VISTA */}
          <Link
            href="/chat"
            className="bg-white border border-slate-200 hover:border-purple-600 hover:shadow-md transition-all rounded-lg p-4 flex items-center gap-4 group"
          >
            <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <div className="text-center">
                <span className="text-xs font-black text-purple-700 tracking-wider">VISTA</span>
                <div className="text-[8px] text-purple-600 font-bold">AI CoPilot</div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition">
                Bhoonidhi VISTA
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI Geospatial Chat &amp; Automated Feature Extraction
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 🌿 SECTION 2: APPLICATION SECTORS */}
      <section className="bg-slate-50 border-y border-slate-200 py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-semibold text-slate-800">
              Application Sectors
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Collaborative applications - Platform to share your data and create governance applications
            </p>
          </div>

          {/* Sectors Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                title: 'Agriculture',
                desc: 'Crop health, soil moisture & PMFBY subsidy',
                icon: Wheat,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                link: '/image-analysis',
              },
              {
                title: 'Disaster Cell',
                desc: 'Flood inundation, cyclones & emergency radar',
                icon: ShieldAlert,
                color: 'text-red-600',
                bg: 'bg-red-50',
                link: '/disaster',
              },
              {
                title: 'Water Resources',
                desc: 'River basin watch, reservoirs & NDWI analysis',
                icon: Droplets,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                link: '/workspace/proj_0001',
              },
              {
                title: 'Urban Governance',
                desc: 'Encroachment audits & Smart City planning',
                icon: Building2,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                link: '/workspace/proj_0001',
              },
              {
                title: 'Forestry & Ecology',
                desc: 'Canopy change, forest fires & CRZ buffers',
                icon: Trees,
                color: 'text-green-700',
                bg: 'bg-green-50',
                link: '/workspace/proj_0001',
              },
              {
                title: 'Rural SVAMITVA',
                desc: 'Panchayat boundary & land parcel mapping',
                icon: MapPin,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                link: '/projects',
              },
            ].map((sector) => (
              <Link
                key={sector.title}
                href={sector.link}
                className="bg-white border border-slate-200 hover:border-[#006BB6] hover:shadow-xs transition rounded-lg p-3.5 text-center flex flex-col items-center justify-between group"
              >
                <div className={`w-11 h-11 rounded-full ${sector.bg} flex items-center justify-center ${sector.color} mb-2`}>
                  <sector.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#006BB6] transition">
                    {sector.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">
                    {sector.desc}
                  </p>
                </div>
                <span className="text-[10px] text-[#006BB6] font-bold mt-2 flex items-center gap-0.5">
                  Open Sector ➔
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 📊 SECTION 3: RECENT AUDITS & VERIFIED SURVEYS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Active Geospatial Surveys &amp; Verified Records
            </h3>
            <p className="text-xs text-slate-500">
              National audit register synchronized with ISRO Bhuvan satellite archives
            </p>
          </div>
          <Link
            href="/projects"
            className="text-xs text-[#006BB6] hover:underline font-bold flex items-center gap-1"
          >
            <span>All Projects ➔</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projectsList.slice(0, 4).map((proj) => (
            <div
              key={proj.id}
              className="bg-white border border-slate-200 hover:border-[#006BB6] rounded-lg p-4 transition shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#006BB6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {proj.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    ✓ {proj.status || 'Verified'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {proj.name}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {proj.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">🏛️ {proj.department || 'ISRO / MoHUA'}</span>
                <Link
                  href={`/workspace/${proj.id}`}
                  className="px-2.5 py-1 bg-[#006BB6] hover:bg-[#005591] text-white rounded text-xs font-bold transition flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  <span>Open GIS Map</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🇮🇳 OFFICIAL BHUVAN FOOTER */}
      <footer className="bg-slate-100 text-slate-600 text-xs border-t border-slate-300 mt-8">
        {/* Tricolor Stripe */}
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#E65100]" />
          <div className="flex-1 bg-white border-y border-slate-200" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h5 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
                ISRO Bhuvan Portals
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="https://bhuvan.nrsc.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#006BB6] hover:underline flex items-center gap-1">Bhuvan Official Portal <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://www.isro.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#006BB6] hover:underline flex items-center gap-1">ISRO Headquarters <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://www.nrsc.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#006BB6] hover:underline flex items-center gap-1">National Remote Sensing Centre <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li><a href="https://surveyofindia.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#006BB6] hover:underline flex items-center gap-1">Survey of India <ExternalLink className="w-2.5 h-2.5" /></a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
                Geospatial Tools
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link href="/workspace/proj_0001" className="hover:text-[#006BB6] hover:underline">Bhuvan 2D Map Explorer</Link></li>
                <li><Link href="/workspace/proj_0001" className="hover:text-[#006BB6] hover:underline">Bhuvan 3D Elevation Globe</Link></li>
                <li><Link href="/disaster" className="hover:text-[#006BB6] hover:underline">Disaster &amp; Emergency Cell</Link></li>
                <li><Link href="/image-analysis" className="hover:text-[#006BB6] hover:underline">Crop Health (NDVI) Analysis</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
                Policy &amp; Guidelines
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li className="hover:text-[#006BB6] cursor-pointer">National Geospatial Policy 2022</li>
                <li className="hover:text-[#006BB6] cursor-pointer">Right to Information (RTI)</li>
                <li className="hover:text-[#006BB6] cursor-pointer">Terms of Use &amp; Disclaimer</li>
                <li className="hover:text-[#006BB6] cursor-pointer">Hyperlinking &amp; Privacy Policy</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
                Contact &amp; Support
              </h5>
              <div className="space-y-1 text-[11px]">
                <p className="font-semibold text-slate-800">ISRO NRSC Technical Support:</p>
                <p className="text-[#006BB6] font-bold text-xs">1800-11-2026 (Toll-Free)</p>
                <p className="text-slate-500">Email: bhuvan@nrsc.gov.in</p>
                <p className="text-slate-500 text-[10px]">Hyderabad - 500 037, India</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              <span>Indian Geo-Platform of ISRO • Maintained by <strong>National Remote Sensing Centre (NRSC)</strong></span>
            </div>
            <div>
              <span>Last Updated: <strong>September 2026</strong> • CORVUS Release 4.3</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 📌 FLOATING RIGHT TAB: "Downloads" (As seen in Bhuvan screenshot) */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden sm:block">
        <Link
          href="/projects"
          className="bg-[#006BB6] hover:bg-[#005591] text-white text-xs font-bold py-3 px-1.5 rounded-l-md shadow-lg flex flex-col items-center gap-1 transition"
          style={{ writingMode: 'vertical-rl' }}
        >
          <Download className="w-3.5 h-3.5 rotate-90 mb-1" />
          <span>Downloads</span>
        </Link>
      </div>
    </div>
  );
}
