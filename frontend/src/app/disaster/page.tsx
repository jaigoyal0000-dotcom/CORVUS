'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  ShieldAlert, Search, Zap, Globe, Waves, Flame, Wind,
  AlertTriangle, Navigation, MapPin, Compass, BarChart3,
  Droplets, Trees, CheckCircle2, RefreshCw, Sparkles,
  Download, Activity, ArrowRight, ShieldCheck, ArrowUpRight,
  Radio, Volume2, Key, Info
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AdvancedChat, { ChatMessage } from '@/components/AdvancedChat';
import { BasemapStyle, SpectralFilter, BASEMAP_PROVIDERS } from '@/components/OpenLayersMap';

const OpenLayersMap = dynamic(() => import('@/components/OpenLayersMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      <span>Loading OpenLayers Real-Time Multi-Hazard Engine...</span>
    </div>
  ),
});

export default function DisasterPortalPage() {
  const [searchQuery, setSearchQuery] = useState('Assam Brahmaputra');
  const [activeLocationName, setActiveLocationName] = useState('Brahmaputra Flood Plain, Assam, India');
  const [activeCentroid, setActiveCentroid] = useState<[number, number]>([92.7900, 26.6500]);
  const [disasterData, setDisasterData] = useState<any | null>(null);
  const [disasterScanning, setDisasterScanning] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState<BasemapStyle>('google_sat');
  const [activeSpectralFilter, setActiveSpectralFilter] = useState<SpectralFilter>('normal');

  // Preset Global & National Disaster High-Risk Hotspots
  const presetHotspots = [
    { name: 'Assam Brahmaputra', label: 'Assam Flood Plain', centroid: [92.7900, 26.6500], hazard: 'flood', icon: '🌊' },
    { name: 'Valencia Basin', label: 'Valencia Flash Flood', centroid: [-0.3760, 39.4690], hazard: 'flash_flood', icon: '🌊' },
    { name: 'Uttarakhand Chamoli', label: 'Chamoli Glacial Surge', centroid: [79.5600, 30.5500], hazard: 'flash_flood', icon: '🌊' },
    { name: 'Delhi Yamuna', label: 'Delhi Yamuna Basin', centroid: [77.2400, 28.6600], hazard: 'flood', icon: '🏙️' },
    { name: 'Similipal Biosphere', label: 'Similipal Wildfire', centroid: [86.3500, 21.8500], hazard: 'wildfire', icon: '🔥' },
    { name: 'Kerala Backwaters', label: 'Kuttanad Inundation', centroid: [76.4800, 9.4900], hazard: 'flood', icon: '🌊' },
    { name: 'Miami Delta', label: 'Miami Coastal Surge', centroid: [-80.1936, 25.7742], hazard: 'storm_surge', icon: '🏖️' },
    { name: 'Tokyo Bay', label: 'Tokyo Fluvial Basin', centroid: [139.7639, 35.6769], hazard: 'flood', icon: '🏙️' },
  ];

  const quickDisasterPrompts = [
    { text: 'What is the evacuation route & safe shelter location?', icon: '🛡️' },
    { text: 'Explain the flood inundation cause & river discharge', icon: '🌊' },
    { text: 'How many hectares of agricultural land are submerged?', icon: '🌾' },
    { text: 'What is the soil saturation & liquefaction risk?', icon: '💧' },
    { text: 'Show SAR radar backscatter profile of flood water', icon: '🛰️' },
  ];

  // Run initial disaster scan on page load
  useEffect(() => {
    handleAssessDisaster('Assam Brahmaputra', [92.7900, 26.6500]);
  }, []);

  const handleAssessDisaster = async (targetLocName?: string, targetCoords?: [number, number]) => {
    const loc = targetLocName || searchQuery.trim() || activeLocationName;
    const coords = targetCoords || activeCentroid;

    setDisasterScanning(true);
    setActiveLocationName(loc);
    if (targetCoords) {
      setActiveCentroid(targetCoords);
    }

    try {
      const res = await fetch('http://localhost:8000/api/v1/disaster/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_name: loc,
          centroid: coords,
          zoom: 13,
          hazard_type: 'auto',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDisasterData(data);
        if (data.centroid) {
          setActiveCentroid(data.centroid as [number, number]);
        }
        if (data.location_name) {
          setActiveLocationName(data.location_name);
        }

        // Post the real-time disaster intelligence briefing into the live chat feed
        const disasterChatMessage: ChatMessage = {
          id: `DISASTER-${Date.now()}`,
          role: 'corvus',
          text: data.ai_early_warning_brief,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          analysisResult: {
            request_id: `HAZARD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            intent: 'DISASTER_ASSESSMENT',
            task: 'multi_hazard_detection',
            confidence_display: `${data.risk_score}% Threat Score`,
            evidence: [
              { id: 'HAZARD-001', type: 'inundation_risk_zones', uri: '/masks/flood_hazard.png' },
              { id: 'HAZARD-002', type: 'comparative_t1_t2_matrix', data: data.comparative_metrics },
            ],
            gis_statistics: data.comparative_metrics,
            execution_trace: {
              latency_ms: 480,
              steps: [
                { stage: 'Live Geocoding (OpenStreetMap Nominatim)', details: `Resolved coordinates for ${data.location_name}` },
                { stage: 'Live Meteorological Telemetry (Open-Meteo)', details: `Temp: ${data.live_telemetry?.temperature_c}°C | 7D Rain: ${data.live_telemetry?.past_7d_rain_mm} mm | Soil: ${data.live_telemetry?.soil_moisture_saturation_pct}%` },
                { stage: 'Multi-Hazard Physical Risk Modeling', details: `Computed risk score: ${data.risk_score}% (${data.threat_level})` },
                { stage: 'Spatial Polygon Delineation', details: `Generated ${data.hazard_geometries?.length || 3} polygon zones & Safe Evacuation Hub` },
              ],
            },
            llm_method: 'CORVUS-Disaster-Engine',
          },
        };

        setChatHistory(prev => [...prev, disasterChatMessage]);
      }
    } catch (err) {
      console.error('Error running disaster assessment:', err);
    } finally {
      setDisasterScanning(false);
    }
  };

  const handleSendMessage = async (text: string, attachments?: ChatMessage['attachments'], customApiKey?: string) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return;

    setLoading(true);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userMsg: ChatMessage = {
      id: `USER-${Date.now()}`,
      role: 'user',
      text,
      timestamp: now,
      attachments,
    };

    const currentHistory = [...chatHistory, userMsg];
    setChatHistory(currentHistory);

    const mapContextPayload = {
      location_name: activeLocationName,
      centroid: activeCentroid,
      zoom: 13,
      disaster_risk: disasterData?.risk_score,
      threat_level: disasterData?.threat_level,
      live_weather: disasterData?.live_telemetry,
      comparative_metrics: disasterData?.comparative_metrics,
    };

    try {
      const historyPayload = currentHistory.map(m => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('http://localhost:8000/api/v1/analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          project_id: 'DISASTER-PORTAL',
          chat_history: historyPayload,
          map_context: mapContextPayload,
          api_key: customApiKey || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const corvusMsg: ChatMessage = {
          id: `CORVUS-${Date.now()}`,
          role: 'corvus',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          analysisResult: data,
        };
        setChatHistory(prev => [...prev, corvusMsg]);
      }
    } catch (e) {
      console.error('Chat error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] flex flex-col text-slate-100">
      <Navbar />

      {/* Global Reconnaissance & Disaster Search Header */}
      <div className="px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 sticky top-16 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              CORVUS Disaster Intelligence Center
              <span className="text-[10px] font-mono bg-red-500/15 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/30 animate-pulse">
                LIVE MULTI-HAZARD FEED
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Autonomous satellite bi-temporal analysis & meteorological risk modeling
            </p>
          </div>
        </div>

        {/* Search Bar & Hotspot Quick Buttons */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl min-w-[320px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAssessDisaster();
              }}
              placeholder="Search any place, city, or river basin on Earth (e.g. Assam, Valencia, Miami, Tokyo)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500 font-medium transition"
            />
          </div>

          <button
            onClick={() => handleAssessDisaster()}
            disabled={disasterScanning}
            className="px-4 py-2 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/25 transition disabled:opacity-50 shrink-0"
          >
            {disasterScanning ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>SCAN RISK</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hotspots Quick Pill Selector Bar */}
      <div className="px-6 py-2 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <span className="text-[10px] uppercase font-mono font-bold text-slate-500 shrink-0 flex items-center gap-1">
          <Radio className="w-3 h-3 text-red-400" /> Hotspots:
        </span>
        {presetHotspots.map((hs, i) => (
          <button
            key={i}
            onClick={() => {
              setSearchQuery(hs.name);
              handleAssessDisaster(hs.name, hs.centroid as [number, number]);
            }}
            className="px-3 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition flex items-center gap-1.5 shrink-0"
          >
            <span>{hs.icon}</span>
            <span>{hs.label}</span>
          </button>
        ))}
      </div>

      {/* Main Dual-Column Content Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Map & Telemetry Dashboard (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col border-r border-slate-800/80 overflow-y-auto custom-scrollbar">
          {/* Map View */}
          <div className="h-[460px] relative border-b border-slate-800/80 shrink-0">
            <OpenLayersMap
              centerLonLat={activeCentroid}
              locationName={activeLocationName}
              zoom={13}
              basemap={activeBasemap}
              onBasemapChange={setActiveBasemap}
              spectralFilter={activeSpectralFilter}
              onSpectralFilterChange={setActiveSpectralFilter}
              disasterData={disasterData}
            />

            {/* Floating Live Telemetry Badge */}
            {disasterData && (
              <div className="absolute top-4 left-4 z-10 max-w-sm bg-slate-950/95 border border-red-500/50 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{disasterData.threat_icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{disasterData.hazard_title}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{disasterData.location_name}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    disasterData.threat_level === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                      : disasterData.threat_level === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {disasterData.threat_level} ({disasterData.risk_score}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Telemetry & Comparative Conditions Matrix Panel */}
          {disasterData && (
            <div className="p-6 space-y-6">
              {/* 1. Threat Gauge & Population Overview */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="text-sm font-bold text-white uppercase">Real-Time Threat Assessment</h3>
                  </div>
                  <span className="text-xs font-mono bg-red-500/10 text-red-400 px-3 py-1 rounded-lg border border-red-500/20 font-bold">
                    Risk Probability: {disasterData.risk_score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    style={{ width: `${disasterData.risk_score}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${
                      disasterData.risk_score >= 80 ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-lg shadow-red-500/50' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                    }`}
                  />
                </div>

                {/* Live Weather & Surface Sensors */}
                {disasterData.live_telemetry && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Air Temp</span>
                      <span className="text-base font-bold text-amber-400 font-mono">{disasterData.live_telemetry.temperature_c}°C</span>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">7D Rainfall</span>
                      <span className="text-base font-bold text-cyan-400 font-mono">{disasterData.live_telemetry.past_7d_rain_mm} mm</span>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Soil Saturation</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{disasterData.live_telemetry.soil_moisture_saturation_pct}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Elevation</span>
                      <span className="text-base font-bold text-purple-400 font-mono">{disasterData.live_telemetry.elevation_m}m ASL</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Bi-Temporal Condition Comparison (T1 Baseline vs T2 Current) */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" /> Bi-Temporal Hazard Transition Matrix
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Hazard Indicator</th>
                        <th className="p-2.5">Baseline (T1)</th>
                        <th className="p-2.5">Real-Time (T2)</th>
                        <th className="p-2.5">Comparative Shift</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      <tr>
                        <td className="p-2.5 font-bold">Surface Water Extent</td>
                        <td className="p-2.5">{disasterData.comparative_metrics.t1_baseline_water_ha} ha</td>
                        <td className="p-2.5 font-bold text-cyan-400">{disasterData.comparative_metrics.t2_current_water_ha} ha</td>
                        <td className="p-2.5 font-bold text-red-400">
                          {disasterData.comparative_metrics.water_expansion_delta_ha > 0 ? '+' : ''}{disasterData.comparative_metrics.water_expansion_delta_ha} ha ({disasterData.comparative_metrics.water_expansion_delta_pct > 0 ? '+' : ''}{disasterData.comparative_metrics.water_expansion_delta_pct}%)
                        </td>
                        <td className="p-2.5"><span className="text-red-400">🔴 Critical Inundation</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">Water Index (NDWI)</td>
                        <td className="p-2.5">{disasterData.comparative_metrics.t1_mean_ndwi > 0 ? '+' : ''}{disasterData.comparative_metrics.t1_mean_ndwi}</td>
                        <td className="p-2.5 font-bold text-cyan-400">{disasterData.comparative_metrics.t2_mean_ndwi > 0 ? '+' : ''}{disasterData.comparative_metrics.t2_mean_ndwi}</td>
                        <td className="p-2.5 font-bold text-cyan-300">+{(disasterData.comparative_metrics.t2_mean_ndwi - disasterData.comparative_metrics.t1_mean_ndwi).toFixed(2)}</td>
                        <td className="p-2.5"><span className="text-cyan-400">🌊 Severe Waterlogging</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">Vegetation Vigor (NDVI)</td>
                        <td className="p-2.5">+{disasterData.comparative_metrics.t1_mean_ndvi}</td>
                        <td className="p-2.5 font-bold text-amber-400">+{disasterData.comparative_metrics.t2_mean_ndvi}</td>
                        <td className="p-2.5 font-bold text-amber-400">-{disasterData.comparative_metrics.canopy_loss_pct}% canopy loss</td>
                        <td className="p-2.5"><span className="text-amber-400">🌾 Submerged Crops</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dedicated Real-Time Disaster AI Chat Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-slate-950/70 overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Disaster AI Tactical Assistant
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
              REAL-TIME REASONING
            </span>
          </div>

          {/* Quick Disaster Prompts */}
          <div className="p-3 bg-slate-950/90 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {quickDisasterPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.text)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 rounded-lg text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1 shrink-0"
              >
                <span>{qp.icon}</span>
                <span>{qp.text}</span>
              </button>
            ))}
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-hidden p-3">
            <AdvancedChat
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              loading={loading}
              uploadedFiles={[]}
              onClearHistory={() => setChatHistory([])}
              mapContextSummary={{
                locationName: activeLocationName,
                centroid: activeCentroid,
                zoom: 13,
                activeLayersCount: 3,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
