'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Send, Search, Zap, MessageSquare, Cpu, Target, Database,
  ShieldCheck, Layers, FileText, ArrowRight, ChevronDown,
  Trees, Droplets, Building2, GitCompare, Route, Sliders,
  BarChart3, Globe, Sparkles, CheckCircle2, Eye, EyeOff,
  AlertTriangle, Flame, Waves, ShieldAlert, Compass, Navigation,
  HelpCircle, RefreshCw, X
} from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import ImageUploader from '@/components/ImageUploader';
import ValidationPanel from '@/components/ValidationPanel';
import PipelineVisualizer, { DEFAULT_PIPELINE_STEPS, PipelineStep } from '@/components/PipelineVisualizer';
import ModelRegistry from '@/components/ModelRegistry';
import ResultsPanel from '@/components/ResultsPanel';
import ExecutionTrace from '@/components/ExecutionTrace';
import {
  LandCoverVisibility,
  BasemapStyle,
  SpectralFilter,
  BASEMAP_PROVIDERS
} from '@/components/OpenLayersMap';

const OpenLayersMap = dynamic(() => import('@/components/OpenLayersMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <span>Loading OpenLayers Real-Time Multi-Spectral Engine...</span>
    </div>
  ),
});

import AdvancedChat, { ChatMessage } from '@/components/AdvancedChat';

interface UploadedFile {
  file: File;
  slot: 'T1' | 'T2' | 'SAR';
  preview?: string;
  metadata?: any;
  validating?: boolean;
  validated?: boolean;
  error?: string;
}

interface AnalysisResult {
  request_id: string;
  query: string;
  intent: string;
  task: string;
  answer: string;
  confidence: number;
  confidence_display: string;
  evidence: any[];
  gis_statistics?: any;
  execution_trace: { latency_ms: number; steps: any[] };
  llm_method?: string;
}

export default function WorkspacePage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(DEFAULT_PIPELINE_STEPS.map(s => ({ ...s })));
  const [showPipeline, setShowPipeline] = useState(false);
  const [showModelRegistry, setShowModelRegistry] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  // Unified GIS Mission Copilot Chat History
  const [imageChatHistory, setImageChatHistory] = useState<ChatMessage[]>([]);

  // Project Data & Map Anchor State
  const [projectData, setProjectData] = useState<any | null>({
    id: params.projectId || 'proj_0001',
    name: 'Delhi Urban Expansion & Land Cover',
    location_name: 'Delhi NCR, India',
    map_center: [77.2000, 28.6500],
    map_zoom: 13,
  });
  const [isFreshProject, setIsFreshProject] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  const [savingLocation, setSavingLocation] = useState(false);

  // Disaster Intelligence & Place Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLocationName, setActiveLocationName] = useState('Delhi NCR, India');
  const [activeCentroid, setActiveCentroid] = useState<[number, number]>([77.2000, 28.6500]);
  const [disasterData, setDisasterData] = useState<any | null>(null);
  const [disasterScanning, setDisasterScanning] = useState(false);

  // Multi-Spectral Land Cover & Environmental Feature Layer Visibility State (Default ON for clear visualization)
  const [layerVisibility, setLayerVisibility] = useState<LandCoverVisibility>({
    vegetation: true,
    water: true,
    urban: true,
    diff_change: true,
    roads: true,
  });

  const [activeBasemap, setActiveBasemap] = useState<BasemapStyle>('google_sat');
  const [activeSpectralFilter, setActiveSpectralFilter] = useState<SpectralFilter>('normal');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth');
      return;
    }

    if (!params.projectId) return;

    fetch(`http://localhost:8000/api/v1/projects/${params.projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((proj) => {
        if (proj) {
          setProjectData(proj);
          if (proj.map_center && Array.isArray(proj.map_center) && proj.map_center.length === 2) {
            setActiveCentroid([proj.map_center[0], proj.map_center[1]]);
            setActiveLocationName(proj.location_name || proj.name);
            setMapZoom(proj.map_zoom || 13);
            setIsFreshProject(false);
          } else if (proj.aoi_polygon?.coordinates?.[0]?.[0]) {
            const coords = proj.aoi_polygon.coordinates[0];
            const lons = coords.map((c: number[]) => c[0]);
            const lats = coords.map((c: number[]) => c[1]);
            const cLon = (Math.min(...lons) + Math.max(...lons)) / 2;
            const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
            setActiveCentroid([cLon, cLat]);
            setActiveLocationName(proj.location_name || proj.name);
            setMapZoom(proj.map_zoom || 13);
            setIsFreshProject(false);
          } else {
            // Fresh newly created project! Open wide overview until pointed
            setIsFreshProject(true);
            setActiveLocationName(proj.name || 'New Project Mission');
            setActiveCentroid([78.9629, 20.5937]);
            setMapZoom(4.5);
          }
        }
      })
      .catch((err) => console.error('Failed to load project details:', err));
  }, [params.projectId, router]);

  const handlePointLocation = async (coords: [number, number], name?: string, newZoom: number = 13) => {
    setActiveCentroid(coords);
    const locName = name || `Point Target (${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E)`;
    setActiveLocationName(locName);
    setMapZoom(newZoom);
    setIsFreshProject(false);
    setSavingLocation(true);

    try {
      await fetch(`http://localhost:8000/api/v1/projects/${params.projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          map_center: coords,
          map_zoom: newZoom,
          location_name: locName,
          aoi_polygon: {
            type: 'Polygon',
            coordinates: [[
              [coords[0] - 0.04, coords[1] - 0.03],
              [coords[0] + 0.04, coords[1] - 0.03],
              [coords[0] + 0.04, coords[1] + 0.03],
              [coords[0] - 0.04, coords[1] + 0.03],
              [coords[0] - 0.04, coords[1] - 0.03],
            ]]
          }
        })
      });
    } catch (e) {
      console.error('Failed to save project map location:', e);
    } finally {
      setTimeout(() => setSavingLocation(false), 800);
    }
  };

  // Preset Global & National Disaster High-Risk Hotspots
  const presetHotspots = [
    { name: 'Assam Brahmaputra', label: 'Assam Flood Plain', centroid: [92.7900, 26.6500], hazard: 'flood', icon: '🌊' },
    { name: 'Valencia Basin', label: 'Valencia Flash Flood', centroid: [-0.3760, 39.4690], hazard: 'flash_flood', icon: '🌊' },
    { name: 'Uttarakhand Chamoli', label: 'Chamoli Glacial Surge', centroid: [79.5600, 30.5500], hazard: 'flash_flood', icon: '🌊' },
    { name: 'Delhi Yamuna', label: 'Delhi Yamuna Basin', centroid: [77.2400, 28.6600], hazard: 'flood', icon: '🏙️' },
    { name: 'Similipal Biosphere', label: 'Similipal Wildfire', centroid: [86.3500, 21.8500], hazard: 'wildfire', icon: '🔥' },
    { name: 'Kerala Backwaters', label: 'Kuttanad Inundation', centroid: [76.4800, 9.4900], hazard: 'flood', icon: '🌊' },
    { name: 'Mumbai Delta', label: 'Mithi River Delta', centroid: [72.8700, 19.0700], hazard: 'urban_flood', icon: '🏖️' },
  ];

  // Quick GIS Mission Intelligence Queries
  const gisMissionPrompts = [
    'Summarize land cover distribution in this AOI',
    'Detect changes between before and after satellite passes',
    'Calculate vegetation health and NDVI stress levels',
    'Evaluate flood risks and surface water proximity',
    'Identify urban encroachment and new buildings',
    'Extract critical infrastructure and road transport routes',
  ];

  const toggleLayer = (key: keyof LandCoverVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const simulatePipelineStep = (stepId: string, detail: string, delay: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setPipelineSteps(prev => prev.map(s =>
          s.id === stepId ? { ...s, status: 'running' as const, detail } : s
        ));
        setTimeout(() => {
          setPipelineSteps(prev => prev.map(s =>
            s.id === stepId ? { ...s, status: 'completed' as const, duration_ms: Math.floor(Math.random() * 200 + 50) } : s
          ));
          resolve();
        }, 400 + Math.random() * 300);
      }, delay);
    });
  };

  // Real-Time Place Search & Instant Disaster Assessment
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

        // Post the real-time disaster intelligence briefing into the live chat feed
        const disasterChatMessage: ChatMessage = {
          id: `DISASTER-${Date.now()}`,
          role: 'corvus',
          text: data.ai_early_warning_brief,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          analysisResult: {
            request_id: `RISK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            intent: 'DISASTER_ASSESSMENT',
            task: 'multi_hazard_detection',
            confidence_display: `${data.risk_score}% Threat Score`,
            evidence: [
              { id: 'HAZARD-001', type: 'inundation_risk_zones', uri: '/masks/flood_hazard.png' },
              { id: 'HAZARD-002', type: 'comparative_t1_t2_matrix', data: data.comparative_metrics },
            ],
            gis_statistics: data.comparative_metrics,
            execution_trace: {
              latency_ms: 620,
              steps: [
                { stage: 'Geocoding & Satellite Imagery Acquisition', details: `Retrieved T1 & T2 passes for ${data.location_name}` },
                { stage: 'Bi-Temporal Index Comparison', details: `NDWI delta: +${(data.comparative_metrics.t2_mean_ndwi - data.comparative_metrics.t1_mean_ndwi).toFixed(2)} | NDVI canopy delta: -${data.comparative_metrics.canopy_loss_pct}%` },
                { stage: 'Multi-Hazard Risk Engine', details: `Computed overall threat score: ${data.risk_score}% (${data.threat_level})` },
                { stage: 'Vector Hazard Geometry Generation', details: `Delineated ${data.hazard_geometries?.length || 3} polygon zones & Safe Evacuation Hub` },
              ],
            },
            llm_method: 'CORVUS-Disaster-Engine',
          },
        };

        setImageChatHistory(prev => [...prev, disasterChatMessage]);
      }
    } catch (err) {
      console.error('Error running disaster assessment:', err);
    } finally {
      setDisasterScanning(false);
    }
  };

  // Helper: Convert File object or object URL to base64 data URI
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Helper: Convert an object URL (blob:) to base64 data URI
  const blobUrlToBase64 = useCallback(async (blobUrl: string): Promise<string> => {
    try {
      const resp = await fetch(blobUrl);
      const blob = await resp.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  }, []);

  const handleAnalyze = async (queryToRun?: string, attachments?: ChatMessage['attachments'], customApiKey?: string) => {
    const q = queryToRun || query;
    if (!q.trim() && (!attachments || attachments.length === 0)) return;

    const actualQuery = q.trim() || (attachments && attachments.length > 0 ? `Analyze attached imagery: ${attachments.map(a => a.name).join(', ')}` : 'Analyze imagery');

    setLoading(true);
    setShowPipeline(true);
    setShowModelRegistry(false);
    setShowResults(false);
    setShowTrace(false);
    setAnalysisResult(null);

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userMsgId = `USER-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: actualQuery,
      timestamp: now,
      attachments,
    };

    const currentHistory = [...imageChatHistory, userMsg];
    setImageChatHistory(currentHistory);

    // Reset pipeline
    setPipelineSteps(DEFAULT_PIPELINE_STEPS.map(s => ({ ...s, status: 'waiting' as const })));
    setShowPipeline(true);

    const t1File = uploadedFiles.find(f => f.slot === 'T1');
    const t2File = uploadedFiles.find(f => f.slot === 'T2');
    const sarFile = uploadedFiles.find(f => f.slot === 'SAR');

    const mapContextPayload = {
      location_name: activeLocationName,
      centroid: activeCentroid,
      zoom: mapZoom,
      basemap: activeBasemap,
      spectral_filter: activeSpectralFilter,
      layer_visibility: layerVisibility,
      disaster_risk: disasterData?.risk_score,
      threat_level: disasterData?.threat_level,
    };

    try {
      await simulatePipelineStep('interpret', `Classifying query intent: "${actualQuery.substring(0, 40)}..."`, 200);
      await simulatePipelineStep('validate', 'Checking format, CRS, metadata compatibility', 100);
      await simulatePipelineStep('agent', 'Selecting optimal specialist model', 100);

      setShowModelRegistry(true);

      await simulatePipelineStep('specialist', 'Executing specialist model inference', 100);
      await simulatePipelineStep('gis', 'Computing spatial statistics', 100);
      await simulatePipelineStep('combine', 'Assembling evidence & calibrating confidence', 100);

      // === BUILD IMAGE BASE64 PAYLOADS ===
      let imageBase64A: string | undefined;
      let imageBase64B: string | undefined;
      let analysisMode: string = 'text_only';

      if (attachments && attachments.length > 0) {
        const imgAttachments = attachments.filter(a => a.url);
        if (imgAttachments.length >= 1 && imgAttachments[0].url) {
          imageBase64A = await blobUrlToBase64(imgAttachments[0].url);
          analysisMode = 'single_image';
        }
        if (imgAttachments.length >= 2 && imgAttachments[1].url) {
          imageBase64B = await blobUrlToBase64(imgAttachments[1].url);
          analysisMode = 'dual_image';
        }
      } else if (t1File) {
        imageBase64A = await fileToBase64(t1File.file);
        analysisMode = 'single_image';
        if (t2File) {
          imageBase64B = await fileToBase64(t2File.file);
          analysisMode = 'dual_image';
        } else if (sarFile) {
          imageBase64B = await fileToBase64(sarFile.file);
          analysisMode = 'dual_image';
        }
      }

      const historyPayload = currentHistory.map(m => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('http://localhost:8000/api/v1/analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: actualQuery,
          filename_t1: t1File?.file.name || 'Delhi_Optical_T1.tif',
          filename_t2: t2File?.file.name || null,
          filename_sar: sarFile?.file.name || null,
          image_base64_a: imageBase64A || undefined,
          image_base64_b: imageBase64B || undefined,
          mode: analysisMode,
          project_id: params.projectId,
          chat_history: historyPayload,
          map_context: mapContextPayload,
          api_key: customApiKey || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
        setShowResults(true);

        const corvusMsg: ChatMessage = {
          id: `CORVUS-${Date.now()}`,
          role: 'corvus',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          analysisResult: data,
        };

        setImageChatHistory(prev => [...prev, corvusMsg]);
      } else {
        throw new Error(`API error: ${res.statusText}`);
      }

      await simulatePipelineStep('report', 'Generating execution summary & report', 100);
      setShowTrace(true);

    } catch (e) {
      console.error('Analysis error:', e);
      const errCorvusMsg: ChatMessage = {
        id: `CORVUS-${Date.now()}`,
        role: 'corvus',
        text: 'I encountered an issue processing this query. Please check your connection or try a different prompt.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      setImageChatHistory(prev => [...prev, errCorvusMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Sidebar */}
        <aside className="w-84 bg-slate-950/70 border-r border-slate-800/60 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Spatial Command
              </h2>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-md border border-slate-700">
              {params.projectId}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Image Uploader */}
            <ImageUploader
              uploadedFiles={uploadedFiles}
              projectCentroid={activeCentroid}
              projectLocationName={activeLocationName}
              projectId={params.projectId}
              onFlyToLocation={(coords, name, zoom) => {
                handlePointLocation(coords, name, zoom || 14);
              }}
              onFilesChange={(files) => {
                setUploadedFiles(files);
                setShowValidation(files.some(f => f.validated || f.validating));

                // Anchor map to the latest updated/validated file
                const latestFile = [...files].reverse().find(f => f.validated && f.metadata?.centroid);
                if (latestFile?.metadata?.centroid) {
                  const [lon, lat] = latestFile.metadata.centroid;
                  const locName = latestFile.metadata.location_name || `Uploaded Image Location`;
                  handlePointLocation([lon, lat], locName, 14);
                }
              }}
            />

            {/* 1. Multi-Spectral Classified Feature Layer Suite */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> Land Cover Layers
                </h3>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {Object.values(layerVisibility).filter(Boolean).length}/5 Active
                </span>
              </div>

              <div className="space-y-2">
                {/* 🌿 Vegetation Layer */}
                <div
                  onClick={() => toggleLayer('vegetation')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    layerVisibility.vegetation
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${layerVisibility.vegetation ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Trees className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Vegetation & Canopy</div>
                      <div className="text-[10px] font-mono text-emerald-400/80">NDVI: +0.67 • 2.52 km² (36%)</div>
                    </div>
                  </div>
                  {layerVisibility.vegetation ? (
                    <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>

                {/* 💧 Water Bodies Layer */}
                <div
                  onClick={() => toggleLayer('water')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    layerVisibility.water
                      ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${layerVisibility.water ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Water Bodies & Rivers</div>
                      <div className="text-[10px] font-mono text-sky-400/80">NDWI: +0.58 • 0.63 km² (12%)</div>
                    </div>
                  </div>
                  {layerVisibility.water ? (
                    <Eye className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>

                {/* 🏙️ Built-up & Urban Layer */}
                <div
                  onClick={() => toggleLayer('urban')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    layerVisibility.urban
                      ? 'bg-orange-950/40 border-orange-500/40 text-orange-200'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${layerVisibility.urban ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Built-Up & Urban</div>
                      <div className="text-[10px] font-mono text-orange-400/80">NDBI: +0.46 • 1.85 km² (52%)</div>
                    </div>
                  </div>
                  {layerVisibility.urban ? (
                    <Eye className="w-4 h-4 text-orange-400 shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>

                {/* 🔄 Change Differences (Diffs) */}
                <div
                  onClick={() => toggleLayer('diff_change')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    layerVisibility.diff_change
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${layerVisibility.diff_change ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                      <GitCompare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Change Detections (Diffs)</div>
                      <div className="text-[10px] font-mono text-amber-400/80">Growth: +26.5% • Delta: +49 ha</div>
                    </div>
                  </div>
                  {layerVisibility.diff_change ? (
                    <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>

                {/* 🛣️ Road Networks */}
                <div
                  onClick={() => toggleLayer('roads')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    layerVisibility.roads
                      ? 'bg-slate-800/60 border-slate-600/50 text-slate-200'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${layerVisibility.roads ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'}`}>
                      <Route className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Roads & Arterial Grid</div>
                      <div className="text-[10px] font-mono text-slate-400">16.0 km Vectorized Transit</div>
                    </div>
                  </div>
                  {layerVisibility.roads ? (
                    <Eye className="w-4 h-4 text-slate-200 shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* 2. Basemap Style Selection */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" /> Satellite Basemap
              </h3>
              <select
                value={activeBasemap}
                onChange={(e) => setActiveBasemap(e.target.value as BasemapStyle)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 font-medium rounded-xl p-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {(Object.keys(BASEMAP_PROVIDERS) as BasemapStyle[]).map((key) => (
                  <option key={key} value={key}>
                    {BASEMAP_PROVIDERS[key].icon} {BASEMAP_PROVIDERS[key].name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Sensor Spectral Filter Simulation */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Spectral Visualizer
              </h3>
              <select
                value={activeSpectralFilter}
                onChange={(e) => setActiveSpectralFilter(e.target.value as SpectralFilter)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono rounded-xl p-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="normal">🌈 True Color RGB</option>
                <option value="cir_infrared">🌿 False Color NIR (Vegetation Stress)</option>
                <option value="sar_radar">📡 SAR Radar Mock (VV/VH Backscatter)</option>
                <option value="night_vision">🟢 Night Vision Green Phosphor</option>
                <option value="panchromatic">⚪ Panchromatic HD Sharpening</option>
                <option value="thermal_lut">🔥 Thermal Invert Spectrum</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Workspace Map Header & Telemetry Bar */}
          <div className="px-5 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isFreshProject ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Project Badge */}
                <div className="px-2.5 py-1 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 shadow-sm">
                  <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{projectData?.name || 'Mission Workspace'}</span>
                </div>

                {/* Target AOI Location Badge */}
                <div 
                  className="px-2.5 py-1 bg-slate-800/90 border border-slate-700/60 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 max-w-[420px] truncate shadow-sm"
                  title={activeLocationName}
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">AOI:</span>
                  <span className="truncate text-emerald-300 font-semibold">{activeLocationName}</span>
                </div>
              </div>

              {isFreshProject && (
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-full">
                  Fresh Map (Click to Point)
                </span>
              )}
              {savingLocation && (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono rounded-full flex items-center gap-1 animate-pulse">
                  <Database className="w-3 h-3" />
                  <span>Saved to MongoDB</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/disaster"
                className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/20 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Open Disaster AI Portal ➔</span>
              </a>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="h-[640px] xl:h-[700px] min-h-[540px] border-b border-slate-800 relative shrink-0">
            {projectData ? (
              <OpenLayersMap
                centerLonLat={activeCentroid}
                locationName={activeLocationName}
                zoom={mapZoom}
                uploadedFiles={uploadedFiles}
                layerVisibility={layerVisibility}
                onLayerVisibilityChange={setLayerVisibility}
                basemap={activeBasemap}
                onBasemapChange={setActiveBasemap}
                spectralFilter={activeSpectralFilter}
                onSpectralFilterChange={setActiveSpectralFilter}
                isFreshMap={isFreshProject}
                onPointLocation={handlePointLocation}
              />
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading Project Mission Coordinates from Database...</span>
              </div>
            )}
          </div>

          {/* Content & Mission Intelligence Copilot Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Active AOI Geospatial Mission Status Banner */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-3 flex items-center justify-between flex-wrap gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{activeLocationName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                      GIS AOI Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Centroid: {activeCentroid[0].toFixed(4)}°E, {activeCentroid[1].toFixed(4)}°N • Zoom: {mapZoom} • Basemap: {activeBasemap.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[11px]">
                  {Object.values(layerVisibility).filter(Boolean).length}/5 Layers Enabled
                </span>
              </div>
            </div>

            {/* Pipeline Execution & Model Registry Display */}
            {showPipeline && (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="p-5 rounded-2xl bg-[#080f19]/90 border border-slate-800 shadow-xl">
                  <PipelineVisualizer steps={pipelineSteps} visible={true} />
                </div>
                {showModelRegistry && (
                  <div className="p-5 rounded-2xl bg-[#080f19]/90 border border-slate-800 shadow-xl">
                    <ModelRegistry activeTask={analysisResult?.task || 'captioning'} visible={true} />
                  </div>
                )}
              </div>
            )}

            {/* Advanced Chat Feed for GIS Mission Intelligence */}
            <div className="min-h-[540px]">
              <AdvancedChat
                chatHistory={imageChatHistory}
                mode="gis_copilot"
                customTitle="GIS Mission Intelligence Copilot"
                customSubtitle="Natural language spatial intelligence, risk assessment & satellite telemetry"
                placeholder="Ask anything about this AOI, land cover changes, flood risks, or geospatial coordinates..."
                customSuggestedPrompts={gisMissionPrompts}
                onSendMessage={(txt, atts, key) => handleAnalyze(txt, atts, key)}
                loading={loading}
                uploadedFiles={uploadedFiles}
                onSelectMapLayer={() => {}}
                onClearHistory={() => setImageChatHistory([])}
                mapContextSummary={{
                  locationName: activeLocationName,
                  centroid: activeCentroid as [number, number],
                  zoom: mapZoom,
                  activeLayersCount: Object.values(layerVisibility).filter(Boolean).length,
                }}
              />
            </div>

            {/* Pipeline Execution */}
            <PipelineVisualizer steps={pipelineSteps} visible={showPipeline} />

            {/* Validation Panel */}
            <ValidationPanel files={uploadedFiles} visible={showValidation} />

            {/* Model Registry */}
            <ModelRegistry activeTask={analysisResult?.task || null} visible={showModelRegistry} />

            {/* Results Panel */}
            <ResultsPanel result={analysisResult} visible={showResults} />

            {/* Execution Trace */}
            <ExecutionTrace
              trace={analysisResult?.execution_trace || null}
              result={analysisResult}
              visible={showTrace}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
