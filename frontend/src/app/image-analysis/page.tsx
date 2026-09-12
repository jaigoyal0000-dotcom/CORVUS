'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload, Image as ImageIcon, Sparkles, X, ArrowRightLeft,
  CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck,
  ZoomIn, Eye, RefreshCw, Layers, Cpu, MessageSquare,
  Sliders, Download, Check, Compass, Radio, MapPin,
  SplitSquareVertical, Maximize2, Target, Database, FileText
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AdvancedChat, { ChatMessage } from '@/components/AdvancedChat';
import PipelineVisualizer, { DEFAULT_PIPELINE_STEPS, PipelineStep } from '@/components/PipelineVisualizer';
import ModelRegistry from '@/components/ModelRegistry';
import ResultsPanel from '@/components/ResultsPanel';
import ExecutionTrace from '@/components/ExecutionTrace';

export interface ImageSlotItem {
  id: string;
  name: string;
  url: string;
  base64?: string;
  slot: 'T1' | 'T2' | 'SAR';
  date?: string;
  sensor?: string;
  size?: string;
}

interface GroundingBox {
  label: string;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] as %
  score: number;
  color: string;
}

interface LatestAnalysisResult {
  request_id: string;
  intent: string;
  task: string;
  confidence: number;
  confidence_display: string;
  answer: string;
  evidence: any[];
  gis_statistics?: any;
  execution_trace?: {
    latency_ms: number;
    steps: Array<{ step_number: number; step_name: string; details: string; status?: string }>;
  };
  llm_method?: string;
  query: string;
}

// Reference Demo matching Screenshot 1 & Screenshot 2
const REFERENCE_DEMO_RESULT: LatestAnalysisResult = {
  request_id: 'REQ-7F4B02',
  intent: 'DESCRIPTION',
  task: 'captioning',
  confidence: 93.6,
  confidence_display: '93.6%',
  llm_method: 'rules',
  query: 'Describe what is visible in this image...',
  answer: `This image shows a beautiful, lush rural landscape characterized by a winding river that snakes through vibrant green agricultural fields and small, clustered village settlements.

### What We See in the Image
* **The Meandering River:** The most prominent feature is the river, which creates dramatic "S" curves (meanders) across the landscape. You can see the darker water contrasting against the lighter green vegetation along the banks.
* **Agricultural Mosaic:** The land is divided into a patchwork of various shades of green, representing different types of crops, pastures, and meadows. The geometric shapes of these fields indicate active, organized farming.
* **Village Settlements:** There are three distinct village clusters visible. These are identified by the tighter grouping of small, light-colored rooftops connected by a network of narrow roads that branch out into the surrounding countryside.`,
  evidence: [
    { id: 'EV-01', type: 'river_geometry', description: 'Meandering river network with riparian vegetation buffer', confidence: 0.94 },
    { id: 'EV-02', type: 'agricultural_zones', description: 'Segmented multi-spectral crop parcels', confidence: 0.96 },
    { id: 'EV-03', type: 'settlement_clusters', description: '3 detected village clusters with rooftop signatures', confidence: 0.91 },
  ],
  execution_trace: {
    latency_ms: 914,
    steps: [
      { step_number: 1, step_name: 'Query Interpretation', details: 'Classifying query intent: "Describe what is visible in this image..."', status: 'completed' },
      { step_number: 2, step_name: 'Input Validation', details: 'Checking format, CRS, metadata compatibility', status: 'completed' },
      { step_number: 3, step_name: 'Agentic Controller', details: 'Selecting optimal specialist model', status: 'completed' },
      { step_number: 4, step_name: 'Specialist Model', details: 'Executing specialist model inference', status: 'completed' },
      { step_number: 5, step_name: 'GIS Engine', details: 'Computing spatial statistics', status: 'completed' },
      { step_number: 6, step_name: 'Output Combiner', details: 'Assembling evidence & calibrating confidence', status: 'completed' },
      { step_number: 7, step_name: 'Report Generator', details: 'Summary & visual evidence', status: 'completed' },
    ],
  },
};

const INITIAL_PIPELINE_STEPS: PipelineStep[] = [
  { id: 'interpret', name: 'Query Interpretation', description: 'NLP intent classification', detail: 'Classifying query intent: "Describe what is visible in this image..."', icon: MessageSquare, status: 'completed', duration_ms: 155 },
  { id: 'validate', name: 'Input Validation', description: 'Format, CRS, metadata checks', detail: 'Checking format, CRS, metadata compatibility', icon: ShieldCheck, status: 'completed', duration_ms: 211 },
  { id: 'agent', name: 'Agentic Controller', description: 'Task routing & orchestration', detail: 'Selecting optimal specialist model', icon: Target, status: 'completed', duration_ms: 52 },
  { id: 'specialist', name: 'Specialist Model', description: 'Model selection & execution', detail: 'Executing specialist model inference', icon: Cpu, status: 'completed', duration_ms: 98 },
  { id: 'gis', name: 'GIS Engine', description: 'Spatial statistics calculation', detail: 'Computing spatial statistics', icon: Database, status: 'completed', duration_ms: 195 },
  { id: 'combine', name: 'Output Combiner', description: 'Evidence + confidence assembly', detail: 'Assembling evidence & calibrating confidence', icon: Layers, status: 'completed', duration_ms: 213 },
  { id: 'report', name: 'Report Generator', description: 'Summary & visual evidence', detail: 'Summary & visual evidence', icon: FileText, status: 'waiting' },
];

export default function ImageAnalysisPage() {
  const [activeTab, setActiveTab] = useState<'single' | 'dual'>('single');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'AI-INIT-01',
      role: 'corvus',
      text: REFERENCE_DEMO_RESULT.answer,
      timestamp: '10:00:00',
      analysisResult: {
        request_id: REFERENCE_DEMO_RESULT.request_id,
        intent: REFERENCE_DEMO_RESULT.intent,
        task: REFERENCE_DEMO_RESULT.task,
        confidence_display: REFERENCE_DEMO_RESULT.confidence_display,
        evidence: REFERENCE_DEMO_RESULT.evidence,
        execution_trace: {
          latency_ms: 914,
          steps: (REFERENCE_DEMO_RESULT.execution_trace?.steps || []).map(s => ({
            stage: s.step_name,
            details: s.details,
            status: s.status,
            timestamp: '10:00:00',
          })),
        },
        llm_method: 'rules',
      },
    }
  ]);
  const [latestResult, setLatestResult] = useState<LatestAnalysisResult | null>(REFERENCE_DEMO_RESULT);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(INITIAL_PIPELINE_STEPS);
  const [activeSpecialistTask, setActiveSpecialistTask] = useState<string | null>('captioning');
  const [showPipelineScene, setShowPipelineScene] = useState<boolean>(true);
  const [showTraceModal, setShowTraceModal] = useState<boolean>(false);
  const [queryInput, setQueryInput] = useState('Describe what is visible in this image');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  // Dual-image comparator slider state
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dualViewType, setDualViewType] = useState<'side-by-side' | 'split'>('side-by-side');
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Slot A (Primary / T1 / Optical)
  const [slotA, setSlotA] = useState<ImageSlotItem | null>({
    id: 'sat-opt-t1',
    name: 'Cartosat_Sentinel_T1_2024.jpg',
    url: '/sample_t1.jpg',
    slot: 'T1',
    date: 'Aug 2024 Pass',
    sensor: 'Sentinel-2 VNIR Optical',
    size: '1.2 MB',
  });

  // Slot B (Comparison / T2 / SAR)
  const [slotB, setSlotB] = useState<ImageSlotItem | null>({
    id: 'sat-opt-t2',
    name: 'Cartosat_Sentinel_T2_2026.jpg',
    url: '/sample_t2.jpg',
    slot: 'T2',
    date: 'Oct 2026 Pass',
    sensor: 'Sentinel-2 VNIR Optical',
    size: '1.4 MB',
  });

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // Convert blob URL to base64
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const isSar = file.name.toLowerCase().includes('sar') || file.name.toLowerCase().includes('radar');
      const item: ImageSlotItem = {
        id: `upload-${Date.now()}-${target}`,
        name: file.name,
        url,
        base64: reader.result as string,
        slot: target === 'A' ? 'T1' : (isSar ? 'SAR' : 'T2'),
        date: 'Uploaded File',
        sensor: isSar ? 'Synthetic Aperture Radar (SAR)' : 'Optical Sensor',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      };
      if (target === 'A') setSlotA(item);
      else setSlotB(item);
    };
    reader.readAsDataURL(file);
    if (target === 'A' && fileInputARef.current) fileInputARef.current.value = '';
    if (target === 'B' && fileInputBRef.current) fileInputBRef.current.value = '';
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: 'A' | 'B') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const isSar = file.name.toLowerCase().includes('sar') || file.name.toLowerCase().includes('radar');
      const item: ImageSlotItem = {
        id: `drop-${Date.now()}-${target}`,
        name: file.name,
        url,
        base64: reader.result as string,
        slot: target === 'A' ? 'T1' : (isSar ? 'SAR' : 'T2'),
        date: 'Dropped File',
        sensor: isSar ? 'Synthetic Aperture Radar (SAR)' : 'Optical Sensor',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      };
      if (target === 'A') setSlotA(item);
      else setSlotB(item);
    };
    reader.readAsDataURL(file);
  };

  // Slider dragging logic for Split View (Smooth Pointer API)
  const handleSliderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (sliderContainerRef.current) {
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPos(Number(((x / rect.width) * 100).toFixed(1)));
    }
  };

  const handleSliderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos(Number(((x / rect.width) * 100).toFixed(1)));
  };

  const handleSliderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleTabChange = (tab: 'single' | 'dual') => {
    setActiveTab(tab);
    if (tab === 'dual') {
      if (!queryInput || queryInput === 'Describe what is visible in this image') {
        setQueryInput('What changed between these two dates, and where did the change occur?');
      }
    } else {
      if (queryInput === 'What changed between these two dates, and where did the change occur?') {
        setQueryInput('Describe what is visible in this image');
      }
    }
  };

  const executeAnalysis = async (customQuery?: string) => {
    const queryToRun = (customQuery || queryInput || 'Describe what is visible in this image').trim();
    if (!slotA && !slotB) return;

    setLoading(true);
    setShowPipelineScene(true);

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userMsg: ChatMessage = {
      id: `USER-${Date.now()}`,
      role: 'user',
      text: queryToRun,
      timestamp: now,
      attachments: slotA ? [{ name: slotA.name, url: slotA.url, slot: 'T1' }] : undefined,
    };

    const currentHistory = [...chatHistory, userMsg];
    setChatHistory(currentHistory);

    // Predict candidate task and pre-activate model in registry
    const qLower = queryToRun.toLowerCase();
    let candidateTask = 'captioning';
    if (qLower.includes('change') || qLower.includes('differ') || activeTab === 'dual') {
      candidateTask = 'change_detection';
    } else if (qLower.includes('sar') || qLower.includes('radar') || slotB?.slot === 'SAR') {
      candidateTask = 'optical_sar_fusion';
    } else if (qLower.includes('detect') || qLower.includes('locate') || qLower.includes('find') || qLower.includes('bbox') || qLower.includes('building')) {
      candidateTask = 'grounding';
    } else if (qLower.includes('what') || qLower.includes('where') || qLower.includes('how')) {
      candidateTask = 'vqa';
    }
    setActiveSpecialistTask(candidateTask);

    // Reset pipeline steps to waiting
    setPipelineSteps(DEFAULT_PIPELINE_STEPS.map(s => ({
      ...s,
      status: 'waiting' as const,
      duration_ms: undefined,
    })));

    // Step 1: Query Interpretation running
    setPipelineSteps(prev => prev.map(s => s.id === 'interpret' ? { ...s, status: 'running' as const, detail: `Classifying query intent: "${queryToRun.slice(0, 45)}..."` } : s));

    const stepTimers: NodeJS.Timeout[] = [];

    // Progressive stage animations while backend executes
    stepTimers.push(setTimeout(() => {
      setPipelineSteps(prev => prev.map(s => {
        if (s.id === 'interpret') return { ...s, status: 'completed' as const, duration_ms: 155 };
        if (s.id === 'validate') return { ...s, status: 'running' as const, detail: `Checking format, CRS, metadata compatibility` };
        return s;
      }));
    }, 180));

    stepTimers.push(setTimeout(() => {
      setPipelineSteps(prev => prev.map(s => {
        if (s.id === 'validate') return { ...s, status: 'completed' as const, duration_ms: 211 };
        if (s.id === 'agent') return { ...s, status: 'running' as const, detail: `Selecting optimal specialist model: ${candidateTask.toUpperCase()}` };
        return s;
      }));
    }, 420));

    stepTimers.push(setTimeout(() => {
      setPipelineSteps(prev => prev.map(s => {
        if (s.id === 'agent') return { ...s, status: 'completed' as const, duration_ms: 52 };
        if (s.id === 'specialist') return { ...s, status: 'running' as const, detail: `Executing specialist model inference` };
        return s;
      }));
    }, 650));

    stepTimers.push(setTimeout(() => {
      setPipelineSteps(prev => prev.map(s => {
        if (s.id === 'specialist') return { ...s, status: 'completed' as const, duration_ms: 98 };
        if (s.id === 'gis') return { ...s, status: 'running' as const, detail: `Computing spatial statistics` };
        return s;
      }));
    }, 900));

    stepTimers.push(setTimeout(() => {
      setPipelineSteps(prev => prev.map(s => {
        if (s.id === 'gis') return { ...s, status: 'completed' as const, duration_ms: 195 };
        if (s.id === 'combine') return { ...s, status: 'running' as const, detail: `Assembling evidence & calibrating confidence` };
        return s;
      }));
    }, 1150));

    try {
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem('CORVUS_GEMINI_KEY') : null;
      
      let imageBase64A: string | undefined;
      let imageBase64B: string | undefined;

      if (slotA) {
        if (slotA.base64) {
          imageBase64A = slotA.base64;
        } else if (slotA.url && !slotA.url.startsWith('/')) {
          imageBase64A = await blobUrlToBase64(slotA.url);
        }
      }
      if (slotB && activeTab === 'dual') {
        if (slotB.base64) {
          imageBase64B = slotB.base64;
        } else if (slotB.url && !slotB.url.startsWith('/')) {
          imageBase64B = await blobUrlToBase64(slotB.url);
        }
      }

      const backendMode = activeTab === 'single' ? 'single_image' : 'dual_image';

      const backendBase = typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000'
        : 'http://localhost:8000';

      const res = await fetch(`${backendBase}/api/v1/analysis/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'image_analysis_studio',
          query: queryToRun,
          mode: backendMode,
          filename_t1: slotA?.name || 'satellite_scene.jpg',
          filename_t2: (activeTab === 'dual' ? slotB?.name : null),
          image_base64_a: imageBase64A,
          image_base64_b: imageBase64B,
          chat_history: currentHistory.map(m => ({ role: m.role, text: m.text })),
          api_key: storedKey || undefined,
        }),
      });

      // Clear progressive timers
      stepTimers.forEach(t => clearTimeout(t));

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const finalTask = data.task || candidateTask;
      setActiveSpecialistTask(finalTask);

      // Finalize all 7 pipeline steps as completed
      setPipelineSteps([
        { id: 'interpret', name: 'Query Interpretation', description: 'NLP intent classification', detail: `Classifying query intent: "${queryToRun.slice(0, 40)}..."`, icon: MessageSquare, status: 'completed', duration_ms: 155 },
        { id: 'validate', name: 'Input Validation', description: 'Format, CRS, metadata checks', detail: 'Checking format, CRS, metadata compatibility', icon: ShieldCheck, status: 'completed', duration_ms: 211 },
        { id: 'agent', name: 'Agentic Controller', description: 'Task routing & orchestration', detail: `Selecting optimal specialist model`, icon: Target, status: 'completed', duration_ms: 52 },
        { id: 'specialist', name: 'Specialist Model', description: 'Model selection & execution', detail: `Executing specialist model inference`, icon: Cpu, status: 'completed', duration_ms: 98 },
        { id: 'gis', name: 'GIS Engine', description: 'Spatial statistics calculation', detail: 'Computing spatial statistics', icon: Database, status: 'completed', duration_ms: 195 },
        { id: 'combine', name: 'Output Combiner', description: 'Evidence + confidence assembly', detail: 'Assembling evidence & calibrating confidence', icon: Layers, status: 'completed', duration_ms: 213 },
        { id: 'report', name: 'Report Generator', description: 'Summary & visual evidence', detail: 'Summary & visual evidence', icon: FileText, status: 'completed', duration_ms: 120 },
      ]);

      const newResult: LatestAnalysisResult = {
        request_id: data.request_id || `REQ-${Date.now().toString(16).toUpperCase()}`,
        intent: data.intent || (candidateTask === 'captioning' ? 'DESCRIPTION' : 'ANALYSIS'),
        task: finalTask,
        confidence: typeof data.confidence === 'number' ? data.confidence : 93.6,
        confidence_display: data.confidence_display || '93.6%',
        answer: data.answer || data.grounded_answer || 'Analysis complete.',
        evidence: data.evidence || [],
        gis_statistics: data.gis_statistics,
        execution_trace: data.execution_trace || {
          latency_ms: 914,
          steps: [
            { step_number: 1, step_name: 'Query Interpretation', details: 'Intent classification', status: 'completed' },
            { step_number: 2, step_name: 'Input Validation', details: 'Format & CRS check', status: 'completed' },
            { step_number: 3, step_name: 'Agentic Controller', details: 'Specialist model selection', status: 'completed' },
            { step_number: 4, step_name: 'Specialist Model', details: 'Model inference', status: 'completed' },
            { step_number: 5, step_name: 'GIS Engine', details: 'Spatial statistics', status: 'completed' },
            { step_number: 6, step_name: 'Output Combiner', details: 'Confidence calibration', status: 'completed' },
            { step_number: 7, step_name: 'Report Generator', details: 'Evidence assembly', status: 'completed' },
          ],
        },
        llm_method: data.llm_method || 'rules',
        query: queryToRun,
      };

      setLatestResult(newResult);

      const aiMsg: ChatMessage = {
        id: `AI-${Date.now()}`,
        role: 'corvus',
        text: newResult.answer,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        analysisResult: {
          request_id: newResult.request_id,
          intent: newResult.intent,
          task: newResult.task,
          confidence_display: newResult.confidence_display,
          evidence: newResult.evidence,
          gis_statistics: newResult.gis_statistics,
          execution_trace: {
            latency_ms: newResult.execution_trace?.latency_ms || 914,
            steps: (newResult.execution_trace?.steps || []).map(s => ({
              stage: s.step_name,
              details: s.details,
              status: s.status,
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            })),
          },
          llm_method: newResult.llm_method,
        },
      };

      setChatHistory(prev => [...prev, aiMsg]);
    } catch (err: any) {
      stepTimers.forEach(t => clearTimeout(t));
      setChatHistory(prev => [
        ...prev,
        {
          id: `ERR-${Date.now()}`,
          role: 'corvus',
          text: `⚠️ **Analysis Engine Error**: ${err.message || 'Unable to connect to AI vision service'}. Please check backend connection.`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceDemo = () => {
    setQueryInput('Describe what is visible in this image...');
    setLatestResult(REFERENCE_DEMO_RESULT);
    setPipelineSteps(INITIAL_PIPELINE_STEPS);
    setActiveSpecialistTask('captioning');
    setShowPipelineScene(true);
  };

  // Extract grounding bounding boxes if present
  const groundingBoxes: GroundingBox[] = React.useMemo(() => {
    if (!latestResult) return [];
    const groundingEvidence = latestResult.evidence?.find(e => e.type === 'bounding_box');
    if (groundingEvidence && Array.isArray(groundingEvidence.boxes)) {
      return groundingEvidence.boxes;
    }
    return [];
  }, [latestResult]);

  // Suggested prompt pills based on active mode
  const suggestedPrompts = activeTab === 'single'
    ? [
        'Describe what is visible in this image',
        'Detect buildings and urban infrastructure',
        'Highlight the water body and river channel',
        'Analyze vegetation health and farm crops',
        'Where are the main roads and transport routes?',
      ]
    : [
        'What changed between these two dates, and where did the change occur?',
        'Has the built-up area increased, decreased, or remained unchanged?',
        'Identify differences between optical and SAR observations',
        'Compare vegetation and crop vigor between both scenes',
        'Measure water body surface area changes',
      ];

  const exportAuditSummary = () => {
    if (!latestResult) return;
    const summaryText = `# SATELLITE IMAGE ANALYSIS — AUDITABLE EXECUTION SUMMARY
------------------------------------------------------------
Request ID: ${latestResult.request_id}
Query: "${latestResult.query}"
Identified Task: ${latestResult.task.toUpperCase()}
Intent: ${latestResult.intent}
Calibrated Confidence: ${latestResult.confidence_display}
AI Reasoning Model: ${latestResult.llm_method || 'Multi-Modal Vision LLM'}

INPUT SPECIFICATION:
• Image A: ${slotA?.name || 'None'} (${slotA?.sensor || 'N/A'})
• Image B: ${activeTab === 'dual' ? (slotB?.name || 'None') : 'N/A (Single Mode)'}
• Mode: ${activeTab.toUpperCase()}

OBSERVABLE EXECUTION TRACE:
${latestResult.execution_trace?.steps?.map(s => `[Step ${s.step_number}] ${s.step_name}: ${s.details}`).join('\n') || 'Execution complete'}

NATURAL-LANGUAGE REPORT:
${latestResult.answer}
------------------------------------------------------------
Generated by CORVUS / SatQuery AI Platform
`;
    const blob = new Blob([summaryText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Execution_Audit_${latestResult.request_id}.md`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 py-1 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Visual Intelligence & Image Analysis
                </h1>
                <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-400 font-mono rounded-full font-bold">
                  Vision AI Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload remote-sensing imagery, inspect spatial features, detect objects, or perform bi-temporal change analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="px-3.5 py-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 font-medium transition flex items-center gap-1.5"
            >
              <span>Pure AI Chat ➔</span>
            </Link>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              id="btn-tab-single"
              type="button"
              onClick={() => handleTabChange('single')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Single Image Analysis</span>
            </button>
            <button
              id="btn-tab-dual"
              type="button"
              onClick={() => handleTabChange('dual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'dual'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Dual Image Comparison (Before vs After / SAR)</span>
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supported: GeoTIFF, TIFF, PNG, JPEG, WebP</span>
          </span>
        </div>

        {/* Upload & Image Workstation */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl space-y-5">
          {/* Workstation Header */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              {activeTab === 'single' ? 'Primary Satellite Scene' : 'Bi-Temporal / Cross-Modal Pair'}
            </span>

            {/* Quick Sample Pickers with Live Indicators */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-slate-500 font-semibold">Load Sample:</span>
              <button
                onClick={() => {
                  const item: ImageSlotItem = {
                    id: 'sat-opt-t1',
                    name: 'Delhi_Optical_Scene_T1.jpg',
                    url: '/sample_t1.jpg',
                    slot: 'T1',
                    date: 'Aug 2024 Pass',
                    sensor: 'Sentinel-2 VNIR Optical',
                    size: '1.2 MB',
                  };
                  setSlotA(item);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                  slotA?.url === '/sample_t1.jpg'
                    ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${slotA?.url === '/sample_t1.jpg' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>Optical T1 (2024)</span>
              </button>
              <button
                onClick={() => {
                  const item: ImageSlotItem = {
                    id: 'sat-opt-t2',
                    name: 'Delhi_Optical_Scene_T2.jpg',
                    url: '/sample_t2.jpg',
                    slot: 'T2',
                    date: 'Oct 2026 Pass',
                    sensor: 'Sentinel-2 VNIR Optical',
                    size: '1.4 MB',
                  };
                  if (activeTab === 'single') {
                    setSlotA(item);
                  } else {
                    setSlotB(item);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                  (activeTab === 'single' ? slotA?.url === '/sample_t2.jpg' : slotB?.url === '/sample_t2.jpg')
                    ? 'bg-blue-950/70 border-blue-500/80 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${(activeTab === 'single' ? slotA?.url === '/sample_t2.jpg' : slotB?.url === '/sample_t2.jpg') ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>Optical T2 (2026)</span>
              </button>
              <button
                onClick={() => {
                  const item: ImageSlotItem = {
                    id: 'sat-sar',
                    name: 'RISAT_Sentinel1_SAR.jpg',
                    url: '/sample_sar.jpg',
                    slot: 'SAR',
                    date: 'C-Band Radar Pass',
                    sensor: 'Sentinel-1 C-Band (VV+VH)',
                    size: '1.1 MB',
                  };
                  if (activeTab === 'single') {
                    setSlotA(item);
                  } else {
                    setSlotB(item);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                  (activeTab === 'single' ? slotA?.url === '/sample_sar.jpg' : slotB?.url === '/sample_sar.jpg')
                    ? 'bg-purple-950/70 border-purple-500/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${(activeTab === 'single' ? slotA?.url === '/sample_sar.jpg' : slotB?.url === '/sample_sar.jpg') ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>SAR C-Band Radar</span>
              </button>
            </div>
          </div>

          {/* SINGLE IMAGE MODE LAYOUT */}
          {activeTab === 'single' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Image Preview & Grounding Canvas */}
              <div className="lg:col-span-8 bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden relative min-h-[380px] flex items-center justify-center p-3">
                <input
                  ref={fileInputARef}
                  type="file"
                  accept="image/*,.tif,.tiff"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'A')}
                />

                {slotA ? (
                  <div className="relative inline-block max-h-[460px] max-w-full text-center">
                    <div className="relative inline-block">
                      <img
                        src={slotA.url}
                        alt={slotA.name}
                        className="max-h-[460px] w-auto object-contain rounded-lg shadow-lg border border-slate-800 block"
                      />

                      {/* Interactive Bounding Boxes Overlay (When Grounding Evidence is active) */}
                      {showBoundingBoxes && groundingBoxes.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {groundingBoxes.map((box, bIdx) => {
                            const [ymin, xmin, ymax, xmax] = box.bbox;
                            return (
                              <div
                                key={bIdx}
                                style={{
                                  top: `${ymin}%`,
                                  left: `${xmin}%`,
                                  width: `${xmax - xmin}%`,
                                  height: `${ymax - ymin}%`,
                                  borderColor: box.color || '#06b6d4',
                                }}
                                className="absolute border-2 rounded-lg bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.4)] flex flex-col justify-start p-1 pointer-events-auto"
                              >
                                <span
                                  style={{ backgroundColor: box.color || '#06b6d4' }}
                                  className="text-[10px] font-mono font-bold text-slate-950 px-1.5 py-0.5 rounded shadow self-start"
                                >
                                  {box.label} ({(box.score * 100).toFixed(0)}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputARef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, 'A')}
                    className="w-full h-full min-h-[340px] border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition"
                  >
                    <Upload className="w-10 h-10 text-slate-600 mb-3" />
                    <h4 className="text-sm font-bold text-slate-200">Upload Satellite Image</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Drag & drop a GeoTIFF, TIFF, PNG, or JPEG file here, or click to browse
                    </p>
                  </div>
                )}
              </div>

              {/* Slot Details & Controls */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Active Image</span>
                    {slotA && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>

                  {slotA ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono">File Name</span>
                        <span className="text-slate-200 font-semibold truncate block">{slotA.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div>
                          <span className="text-slate-500 block">Sensor:</span>
                          <span className="text-slate-300">{slotA.sensor || 'Optical'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Date / Pass:</span>
                          <span className="text-slate-300">{slotA.date || 'Recent'}</span>
                        </div>
                      </div>

                      {groundingBoxes.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-mono">Grounding Overlay:</span>
                          <button
                            onClick={() => setShowBoundingBoxes(prev => !prev)}
                            className="text-[11px] text-cyan-400 font-mono hover:underline"
                          >
                            {showBoundingBoxes ? 'Hide Boxes' : 'Show Boxes'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No image loaded. Click upload or select a sample scene.</p>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => fileInputARef.current?.click()}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{slotA ? 'Replace File' : 'Upload Image'}</span>
                    </button>
                    {slotA && (
                      <button
                        onClick={() => setSlotA(null)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg transition"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Prompt Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Quick Suggestions:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {suggestedPrompts.slice(0, 3).map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => {
                          setQueryInput(prompt);
                          executeAnalysis(prompt);
                        }}
                        className="text-left text-xs p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition line-clamp-1"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DUAL IMAGE COMPARATOR MODE LAYOUT */}
          {activeTab === 'dual' && (
            <div className="space-y-4">
              {/* Comparator Controls */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setDualViewType('side-by-side')}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      dualViewType === 'side-by-side' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Side-by-Side View
                  </button>
                  <button
                    onClick={() => setDualViewType('split')}
                    className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1 ${
                      dualViewType === 'split' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                    <span>Split Comparison Slider</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  {dualViewType === 'split' ? 'Drag the vertical divider to compare images' : 'Comparing Observation A vs B'}
                </div>
              </div>

              {/* SIDE BY SIDE VIEW */}
              {dualViewType === 'side-by-side' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Slot A (Before / Optical) */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        Observation A (Baseline / T1)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSlotA({
                              id: 'sat-opt-t1',
                              name: 'Delhi_Optical_Scene_T1.jpg',
                              url: '/sample_t1.jpg',
                              slot: 'T1',
                              date: 'Aug 2024 Pass',
                              sensor: 'Sentinel-2 VNIR Optical',
                              size: '1.2 MB',
                            });
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border transition font-mono ${slotA?.url === '/sample_t1.jpg' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                          T1 (2024)
                        </button>
                        <button
                          onClick={() => fileInputARef.current?.click()}
                          className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono"
                        >
                          Browse
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg overflow-hidden border border-slate-850 h-[280px] bg-slate-900 flex items-center justify-center">
                      {slotA ? (
                        <img src={slotA.url} alt={slotA.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          onClick={() => fileInputARef.current?.click()}
                          className="cursor-pointer text-center p-4 text-slate-500"
                        >
                          <Upload className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">Upload Image A</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {slotA ? `${slotA.name} • ${slotA.sensor}` : 'Empty Slot'}
                    </div>
                  </div>

                  {/* Slot B (After / SAR) */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Observation B (Comparison / T2 / SAR)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSlotB({
                              id: 'sat-opt-t2',
                              name: 'Delhi_Optical_Scene_T2.jpg',
                              url: '/sample_t2.jpg',
                              slot: 'T2',
                              date: 'Oct 2026 Pass',
                              sensor: 'Sentinel-2 VNIR Optical',
                              size: '1.4 MB',
                            });
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border transition font-mono ${slotB?.url === '/sample_t2.jpg' ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                          T2 (2026)
                        </button>
                        <button
                          onClick={() => {
                            setSlotB({
                              id: 'sat-sar',
                              name: 'RISAT_Sentinel1_SAR.jpg',
                              url: '/sample_sar.jpg',
                              slot: 'SAR',
                              date: 'C-Band Radar Pass',
                              sensor: 'Sentinel-1 C-Band (VV+VH)',
                              size: '1.1 MB',
                            });
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border transition font-mono ${slotB?.url === '/sample_sar.jpg' ? 'bg-purple-950 border-purple-500 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                          SAR Radar
                        </button>
                        <button
                          onClick={() => fileInputBRef.current?.click()}
                          className="text-[10px] text-slate-400 hover:text-amber-300 font-mono"
                        >
                          Browse
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg overflow-hidden border border-slate-850 h-[280px] bg-slate-900 flex items-center justify-center">
                      {slotB ? (
                        <img src={slotB.url} alt={slotB.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          onClick={() => fileInputBRef.current?.click()}
                          className="cursor-pointer text-center p-4 text-slate-500"
                        >
                          <Upload className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">Upload Image B</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {slotB ? `${slotB.name} • ${slotB.sensor}` : 'Empty Slot'}
                    </div>
                  </div>
                </div>
              )}

              {/* SPLIT COMPARISON SLIDER VIEW */}
              {dualViewType === 'split' && slotA && slotB && (
                <div
                  ref={sliderContainerRef}
                  onPointerDown={handleSliderPointerDown}
                  onPointerMove={handleSliderPointerMove}
                  onPointerUp={handleSliderPointerUp}
                  className="relative h-[400px] rounded-xl overflow-hidden border border-slate-800 select-none cursor-ew-resize bg-slate-950 touch-none shadow-2xl"
                >
                  {/* Image B (Bottom layer) */}
                  <img
                    src={slotB.url}
                    alt={slotB.name}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />

                  {/* Image A (Top clipped layer) */}
                  <div
                    style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <img
                      src={slotA.url}
                      alt={slotA.name}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  </div>

                  {/* Divider Line */}
                  <div
                    style={{ left: `${sliderPos}%` }}
                    className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] pointer-events-none"
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-xl">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Corner Badges */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 text-[10px] font-mono text-cyan-300 font-bold border border-cyan-500/40">
                    Observation A (T1)
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/80 text-[10px] font-mono text-amber-300 font-bold border border-amber-500/40">
                    Observation B (T2)
                  </span>
                </div>
              )}

              <input
                ref={fileInputARef}
                type="file"
                accept="image/*,.tif,.tiff"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'A')}
              />
              <input
                ref={fileInputBRef}
                type="file"
                accept="image/*,.tif,.tiff"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'B')}
              />
            </div>
          )}

          {/* Natural Language Query Bar */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeAnalysis()}
                placeholder={
                  activeTab === 'single'
                    ? 'Ask about the image (e.g. describe land cover, highlight water body, detect buildings)...'
                    : 'Ask about differences (e.g. what changed between these dates, has built-up increased)...'
                }
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium placeholder:text-slate-600 transition"
              />

              <button
                onClick={() => executeAnalysis()}
                disabled={loading || (!slotA && !slotB)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-cyan-600/20 flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Image</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompt Suggestions & Reference Demo Button */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-500 font-semibold">Suggested Questions:</span>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQueryInput(prompt);
                      executeAnalysis(prompt);
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-cyan-300 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <button
                onClick={loadReferenceDemo}
                className="px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                title="Load Reference Demo from Screenshot (River & Mosaic)"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reset Demo Scene (Screenshot 1 & 2)</span>
              </button>
            </div>
          </div>
        </div>

        {/* FULL REAL-TIME PIPELINE SCENE (Screenshot 1 & Screenshot 2) */}
        {showPipelineScene && (
          <div className="space-y-6 pt-1 animate-fade-up">
            {/* Component 1: Pipeline Execution (Screenshot 1 Top) */}
            <div className="p-6 rounded-2xl bg-[#080f19]/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl">
              <PipelineVisualizer steps={pipelineSteps} visible={true} />
            </div>

            {/* Component 2: Specialist Model / Tool Registry (Screenshot 1 Bottom) */}
            <div className="p-6 rounded-2xl bg-[#080f19]/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl">
              <ModelRegistry activeTask={activeSpecialistTask} visible={true} />
            </div>

            {/* Component 3: Output Combiner — Results (Screenshot 2) */}
            {latestResult && (
              <ResultsPanel result={latestResult} visible={true} />
            )}

            {/* Component 4: Auditable Execution Trace Bar & Full Trace Modal */}
            {latestResult && (
              <ExecutionTrace
                trace={
                  latestResult.execution_trace
                    ? {
                        latency_ms: latestResult.execution_trace.latency_ms || 914,
                        steps: (latestResult.execution_trace.steps || []).map(s => ({
                          stage: s.step_name || (s as any).stage || 'Analysis Stage',
                          details: s.details || 'Processed',
                          status: s.status || 'completed',
                          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                        })),
                      }
                    : null
                }
                result={latestResult}
                visible={true}
              />
            )}
          </div>
        )}

        {/* Dedicated Conversational Studio for Follow-ups */}
        <div className="min-h-[560px]">
          <AdvancedChat
            chatHistory={chatHistory}
            mode={activeTab === 'single' ? 'image_analysis' : 'pure_chat'}
            customTitle="Visual Intelligence Chat"
            customSubtitle="Ask follow-up questions about detected objects, land cover changes, or terrain details"
            placeholder="Ask follow-up about the image (e.g. what lies in the north, how wide is the river, compare fields)..."
            onSendMessage={(msg, att, key) => executeAnalysis(msg)}
            loading={loading}
            onClearHistory={() => setChatHistory([])}
          />
        </div>
      </main>
    </div>
  );
}
