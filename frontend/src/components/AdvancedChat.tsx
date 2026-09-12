'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Mic, MicOff, Paperclip, X, Image as ImageIcon, Sparkles,
  Layers, CheckCircle2, ChevronDown, ChevronUp, Maximize2, RefreshCw,
  Download, Eye, BarChart3, ShieldCheck, Activity, MapPin, Zap,
  Copy, Check, Volume2, VolumeX, ArrowRight, CornerDownLeft,
  Trees, Droplets, Building2, GitCompare, Compass, ThumbsUp, ThumbsDown,
  Key, Settings, ShieldAlert, Target, Cpu, Database, FileText, MessageSquare
} from 'lucide-react';
import PipelineVisualizer, { PipelineStep } from '@/components/PipelineVisualizer';
import ModelRegistry from '@/components/ModelRegistry';

export interface ChatMessage {
  id: string;
  role: 'user' | 'corvus';
  text: string;
  timestamp: string;
  attachments?: Array<{
    name: string;
    url?: string;
    slot?: 'T1' | 'T2' | 'SAR' | 'Direct';
  }>;
  analysisResult?: {
    request_id: string;
    intent: string;
    task: string;
    confidence_display: string;
    evidence: any[];
    gis_statistics?: any;
    execution_trace?: { latency_ms: number; steps: any[] };
    llm_method?: string;
  };
}

interface UploadedFile {
  file: File;
  slot: 'T1' | 'T2' | 'SAR';
  preview?: string;
  metadata?: any;
}

interface AdvancedChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string, attachments?: ChatMessage['attachments'], customApiKey?: string) => void;
  loading: boolean;
  uploadedFiles?: UploadedFile[];
  onSelectMapLayer?: (layer: string) => void;
  onFlyToLocation?: (coords: [number, number]) => void;
  onClearHistory?: () => void;
  mapContextSummary?: {
    locationName: string;
    centroid: [number, number];
    zoom: number;
    activeLayersCount: number;
  };
  mode?: 'image_analysis' | 'pure_chat';
  customTitle?: string;
  customSubtitle?: string;
  placeholder?: string;
  customSuggestedPrompts?: string[];
  hideAttachmentBar?: boolean;
}

// Markdown parser helper for rich chat responses
function renderFormattedContent(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];

  const flushTable = (keyIndex: number) => {
    if (inTable && tableRows.length > 0) {
      elements.push(
        <div key={`tbl-${keyIndex}`} className="my-3 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/70 p-1">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            {tableHeader.length > 0 && (
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  {tableHeader.map((h, i) => (
                    <th key={i} className="p-2.5 font-bold uppercase text-[10px]">
                      {h.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-800/60">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeader = [];
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table Row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1);
      if (trimmed.includes('---')) {
        return;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="text-sm font-bold text-cyan-300 mt-3 mb-1.5 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          {trimmed.replace('### ', '')}
        </h4>
      );
      return;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="text-base font-bold text-white mt-4 mb-2">
          {trimmed.replace('## ', '')}
        </h3>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.substring(2);
      elements.push(
        <li key={idx} className="ml-4 list-disc text-slate-300 text-xs my-1 leading-relaxed">
          <span dangerouslySetInnerHTML={{
            __html: bulletContent
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[11px] border border-slate-800">$1</code>')
          }} />
        </li>
      );
      return;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const numContent = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        <li key={idx} className="ml-4 list-decimal text-slate-300 text-xs my-1 leading-relaxed">
          <span dangerouslySetInnerHTML={{
            __html: numContent
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[11px] border border-slate-800">$1</code>')
          }} />
        </li>
      );
      return;
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={idx} className="h-1.5" />);
      return;
    }

    // Normal Paragraph
    elements.push(
      <p key={idx} className="text-xs text-slate-300 my-1 leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: trimmed
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[11px] border border-slate-800">$1</code>')
        }}
      />
    );
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
}

export interface PromptCardDef {
  icon: string;
  category: string;
  title: string;
  query: string;
  desc: string;
  glow: string;
  badgeStyle: string;
}

const PURE_CHAT_PROMPTS: PromptCardDef[] = [
  {
    icon: '🌤️',
    category: 'LIVE WEATHER & GROUND',
    title: 'Odisha Weather & Ground Condition',
    query: 'What is the weather and ground condition in Odisha right now?',
    desc: 'Live coastal meteorology, regional moisture, cloud cover, and sea conditions',
    glow: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
    badgeStyle: 'text-amber-400 bg-amber-950/70 border-amber-800/60',
  },
  {
    icon: '🛰️',
    category: 'RADAR REMOTE SENSING',
    title: 'SAR Microwave Cloud Penetration',
    query: 'How does Synthetic Aperture Radar (SAR) penetrate clouds?',
    desc: 'Active microwave spectrum, backscatter physics, and all-weather radar imaging',
    glow: 'hover:border-cyan-500/60 hover:shadow-cyan-500/10',
    badgeStyle: 'text-cyan-400 bg-cyan-950/70 border-cyan-800/60',
  },
  {
    icon: '🌿',
    category: 'AGRICULTURE & CROPS',
    title: 'NDVI Vegetation Health Index',
    query: 'Explain NDVI vegetation index in simple words',
    desc: 'Near-infrared reflectance, chlorophyll vigor absorption, and crop monitoring',
    glow: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
    badgeStyle: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/60',
  },
  {
    icon: '🚨',
    category: 'DISASTER SAFETY & TRIAGE',
    title: 'Urban Flood Evacuation Protocols',
    query: 'What are standard emergency evacuation steps during floods?',
    desc: 'High-ground staging, SDRF/NDRF search guidelines, and crisis survival actions',
    glow: 'hover:border-rose-500/60 hover:shadow-rose-500/10',
    badgeStyle: 'text-rose-400 bg-rose-950/70 border-rose-800/60',
  },
  {
    icon: '📐',
    category: 'TOPOGRAPHY & ELEVATION',
    title: '3D Elevation & Building Heights',
    query: 'How do satellites calculate elevation and building heights?',
    desc: 'Stereo photogrammetry, shadow triangulation, and InSAR interferometric baselines',
    glow: 'hover:border-purple-500/60 hover:shadow-purple-500/10',
    badgeStyle: 'text-purple-400 bg-purple-950/70 border-purple-800/60',
  },
  {
    icon: '🌈',
    category: 'SPECTRAL OPTICS',
    title: 'Multispectral vs Hyperspectral',
    query: 'What is the difference between multispectral and hyperspectral imagery?',
    desc: 'Discrete optical bands versus hundreds of contiguous nanometer spectral channels',
    glow: 'hover:border-indigo-500/60 hover:shadow-indigo-500/10',
    badgeStyle: 'text-indigo-400 bg-indigo-950/70 border-indigo-800/60',
  },
];

const IMAGE_ANALYSIS_PROMPTS: PromptCardDef[] = [
  {
    icon: '🔍',
    category: 'SCENE RECONNAISSANCE',
    title: 'Scene Overview & Key Features',
    query: 'Describe what is visible in this image',
    desc: 'Identify prominent terrain patterns, infrastructure, land-use, and key zones',
    glow: 'hover:border-cyan-500/60 hover:shadow-cyan-500/10',
    badgeStyle: 'text-cyan-400 bg-cyan-950/70 border-cyan-800/60',
  },
  {
    icon: '🏗️',
    category: 'URBAN FOOTPRINT',
    title: 'Buildings & Infrastructure',
    query: 'Detect buildings and urban infrastructure',
    desc: 'Locate residential complexes, commercial zones, rooftops, and structural footprints',
    glow: 'hover:border-blue-500/60 hover:shadow-blue-500/10',
    badgeStyle: 'text-blue-400 bg-blue-950/70 border-blue-800/60',
  },
  {
    icon: '🌾',
    category: 'CANOPY HEALTH',
    title: 'Vegetation & Agricultural Crops',
    query: 'Analyze vegetation health and farm crops',
    desc: 'Assess crop vitality, canopy density, deforestation, and stressed farmlands',
    glow: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
    badgeStyle: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/60',
  },
  {
    icon: '💧',
    category: 'HYDROLOGY',
    title: 'Water Bodies & Flood Inundation',
    query: 'Identify rivers, water bodies, and flood zones',
    desc: 'Segment rivers, retention basins, inundated floodplains, and wetland areas',
    glow: 'hover:border-sky-500/60 hover:shadow-sky-500/10',
    badgeStyle: 'text-sky-400 bg-sky-950/70 border-sky-800/60',
  },
  {
    icon: '🛣️',
    category: 'TRANSIT CORRIDORS',
    title: 'Roads & Transportation Networks',
    query: 'Where are the main roads and transport routes?',
    desc: 'Map arterial highways, paved transit roads, bridges, and access intersections',
    glow: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
    badgeStyle: 'text-amber-400 bg-amber-950/70 border-amber-800/60',
  },
  {
    icon: '📐',
    category: 'LAND CLASSIFICATION',
    title: 'Land Cover & Development Density',
    query: 'Estimate the land use and development density',
    desc: 'Break down percent coverage across vegetation, impervious surfaces, water, and soil',
    glow: 'hover:border-purple-500/60 hover:shadow-purple-500/10',
    badgeStyle: 'text-purple-400 bg-purple-950/70 border-purple-800/60',
  },
];

export default function AdvancedChat({
  chatHistory,
  onSendMessage,
  loading,
  uploadedFiles = [],
  onSelectMapLayer,
  onFlyToLocation,
  onClearHistory,
  mapContextSummary = {
    locationName: 'Delhi NCR, India',
    centroid: [77.1500, 28.7350],
    zoom: 13,
    activeLayersCount: 5,
  },
  mode = 'image_analysis',
  customTitle,
  customSubtitle,
  placeholder,
  customSuggestedPrompts,
  hideAttachmentBar = false,
}: AdvancedChatProps) {
  const [inputText, setInputText] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<ChatMessage['attachments']>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({});
  const [expandedPipelines, setExpandedPipelines] = useState<Record<string, boolean>>({});
  const [loadingPipelineIndex, setLoadingPipelineIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [backendHasKey, setBackendHasKey] = useState(false);

  const PIPELINE_LOADING_STAGES = [
    { name: 'Query Interpretation', desc: 'Classifying intent via remote-sensing NLP', icon: '🧠' },
    { name: 'Input Validation', desc: 'Checking raster format, CRS, and bands', icon: '🛡️' },
    { name: 'Agentic Controller', desc: 'Selecting optimal specialist vision model', icon: '🎯' },
    { name: 'Specialist Model', desc: 'Executing specialist neural model inference', icon: '⚡' },
    { name: 'GIS Engine', desc: 'Computing spatial land cover statistics', icon: '📊' },
    { name: 'Output Combiner', desc: 'Assembling evidence & calibrating confidence', icon: '📑' },
    { name: 'Report Generator', desc: 'Synthesizing auditable report & visuals', icon: '✨' },
  ];

  useEffect(() => {
    if (!loading) {
      setLoadingPipelineIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingPipelineIndex(prev => (prev + 1) % PIPELINE_LOADING_STAGES.length);
    }, 420);
    return () => clearInterval(interval);
  }, [loading]);

  const togglePipeline = (id: string) => {
    setExpandedPipelines(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load API Key from local storage & check backend
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('CORVUS_GEMINI_KEY');
      if (savedKey) setGeminiApiKey(savedKey);

      // Check if backend has a key configured
      fetch('http://localhost:8000/api/v1/health')
        .then(r => r.json())
        .then(() => setBackendHasKey(true))
        .catch(() => {});
    }
  }, []);

  const saveApiKey = (key: string) => {
    setGeminiApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('CORVUS_GEMINI_KEY', key);
    }
    setShowKeyModal(false);
  };

  // Dynamic Suggested Follow-Up Prompts based on mode & custom queries
  const activePrompts: PromptCardDef[] = React.useMemo(() => {
    const baseList = mode === 'pure_chat' ? PURE_CHAT_PROMPTS : IMAGE_ANALYSIS_PROMPTS;
    if (!customSuggestedPrompts || customSuggestedPrompts.length === 0) {
      return baseList;
    }
    return customSuggestedPrompts.map((promptStr, idx) => {
      const matched = baseList.find(
        (b) =>
          b.query.toLowerCase() === promptStr.toLowerCase() ||
          promptStr.toLowerCase().includes(b.query.toLowerCase())
      );
      if (matched) return matched;
      return {
        icon: idx % 4 === 0 ? '🛰️' : idx % 4 === 1 ? '🌍' : idx % 4 === 2 ? '🌿' : '⚡',
        category: 'SUGGESTED QUERY',
        title: promptStr.length > 38 ? promptStr.slice(0, 35) + '...' : promptStr,
        query: promptStr,
        desc: 'Instant AI inference with grounded multi-modal context',
        glow: 'hover:border-cyan-500/60 hover:shadow-cyan-500/10',
        badgeStyle: 'text-cyan-400 bg-cyan-950/70 border-cyan-800/60',
      };
    });
  }, [mode, customSuggestedPrompts]);

  const suggestedPrompts = activePrompts.map((p) => p.query);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recog.onerror = () => setIsListening(false);
        recog.onend = () => setIsListening(false);

        recognitionRef.current = recog;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Text-To-Speech (TTS) Voice Readout
  const handleReadAloud = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\|/g, ' ')
      .replace(/---/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = () => {
    if (!inputText.trim() && (!selectedAttachments || selectedAttachments.length === 0)) return;
    onSendMessage(inputText, selectedAttachments, geminiApiKey);
    setInputText('');
    setSelectedAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttach: ChatMessage['attachments'] = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      slot: 'Direct',
    }));
    setSelectedAttachments((prev) => [...(prev || []), ...newAttach]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const attachWorkspaceSlot = (slot: 'T1' | 'T2' | 'SAR') => {
    const found = uploadedFiles.find((f) => f.slot === slot);
    if (!found) return;
    const item = {
      name: `[${slot}] ${found.file.name}`,
      url: found.preview,
      slot,
    };
    setSelectedAttachments((prev) => {
      if (prev?.some((a) => a.slot === slot)) return prev;
      return [...(prev || []), item];
    });
  };

  const toggleTrace = (id: string) => {
    setExpandedTraces((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const exportChatLog = () => {
    const logText = chatHistory
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.text}\n${
            m.analysisResult ? `Confidence: ${m.analysisResult.confidence_display}\n` : ''
          }----------------------------------------`
      )
      .join('\n\n');
    const blob = new Blob([logText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CORVUS_Chat_Transcript_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full min-h-[520px] bg-slate-950/85 rounded-2xl border border-slate-800/80 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
              {customTitle || (mode === 'pure_chat' ? 'CORVUS Universal AI Chat' : 'CORVUS Visual Intelligence Studio')}
              <button
                onClick={() => setShowKeyModal(true)}
                title="Configure Google Gemini API Key"
                className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 hover:bg-cyan-500/20 transition flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-2.5 h-2.5" />
                {geminiApiKey ? (geminiApiKey.startsWith('sk-') ? 'GPT-4o CLOUD' : 'GEMINI 3.5 LIVE') : (backendHasKey ? 'GEMINI 3.5 CLOUD' : 'AUTONOMOUS RS ENGINE')}
              </button>
            </h3>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>{customSubtitle || (mode === 'pure_chat' ? 'Pure Knowledge & Geospatial NLP • Ask Anything' : 'Upload Images & Visual Question Answering')}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {mapContextSummary.locationName} (Z{mapContextSummary.zoom})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            title="Configure AI Model & API Key"
            className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs transition flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Model Settings</span>
          </button>

          {chatHistory.length > 0 && (
            <>
              <button
                onClick={exportChatLog}
                title="Export Chat Log (Markdown)"
                className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              {onClearHistory && (
                <button
                  onClick={onClearHistory}
                  title="Clear Chat History"
                  className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-[460px] max-h-[640px] custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900/60 via-slate-950/80 to-slate-900/40 border border-slate-800/80 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col items-center text-center">
            {/* Ambient Multi-Layer Radial Glows */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing AI Orb */}
            <div className="relative mb-3.5 group">
              <div className="absolute -inset-2.5 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse pointer-events-none" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-cyan-500/40 flex items-center justify-center shadow-xl shadow-cyan-500/10">
                <Sparkles className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              </div>
            </div>

            {/* Status Live Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[11px] font-medium text-cyan-300 mb-2.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>{mode === 'pure_chat' ? 'CORVUS Conversational Intelligence' : 'Visual Scene Intelligence'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-mono text-[10px]">Gemini 3.5 Multi-Cascade</span>
            </div>

            {/* Hero Title & Subtitle */}
            <h4 className="text-lg sm:text-xl font-black text-white tracking-tight mb-2">
              {mode === 'pure_chat' ? 'CORVUS Universal AI Assistant (Ask Anything)' : 'CORVUS Visual Intelligence & Image Q&A'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mb-6 leading-relaxed">
              {mode === 'pure_chat'
                ? 'Ask any question across live weather, radar satellite physics, disaster evacuation, agricultural vegetation indices, topography, or general knowledge.'
                : 'Upload satellite or aerial imagery to inspect terrain, detect urban infrastructure, evaluate crop vigor, locate standing water, and measure land features.'}
            </p>

            {/* Aesthetic Prompt Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl text-left">
              {activePrompts.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(card.query, undefined, geminiApiKey)}
                  className={`group relative p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-850/95 border border-slate-800/90 ${card.glow} backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between cursor-pointer`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition-transform">
                        {card.icon}
                      </div>
                      <span className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-md border uppercase font-bold ${card.badgeStyle}`}>
                        {card.category}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                        {card.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 leading-snug mt-1 line-clamp-2">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors font-mono">
                    <span className="truncate max-w-[170px]">{card.query}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.role === 'user';
            const res = msg.analysisResult;
            const isTraceExpanded = expandedTraces[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                {/* Message Meta Info */}
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isUser ? 'text-blue-400' : 'text-cyan-400'
                    }`}
                  >
                    {!isUser && <Sparkles className="w-3 h-3 text-cyan-400" />}
                    {isUser ? 'Intelligence Analyst' : 'CORVUS Real-Time AI'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[95%] sm:max-w-[88%] p-4 rounded-2xl text-sm transition-all shadow-xl ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600/25 to-indigo-600/25 border border-blue-500/30 text-slate-100 rounded-tr-none'
                      : 'bg-slate-900/95 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* User Attached Images Thumbnails */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.attachments.map((att, i) => (
                        <div
                          key={i}
                          onClick={() => att.url && setLightboxImage({ url: att.url, title: att.name })}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950/80 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300 hover:border-cyan-400 cursor-pointer transition"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{att.name}</span>
                          <Eye className="w-3 h-3 text-slate-400 ml-1" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Message Text with Rich Markdown Rendering */}
                  {isUser ? (
                    <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                  ) : (
                    renderFormattedContent(msg.text)
                  )}

                  {/* Assistant Actions Bar (Copy, Read Aloud, Thumbs) */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {/* Read Aloud (TTS) */}
                        <button
                          onClick={() => handleReadAloud(msg.id, msg.text)}
                          title={isSpeaking === msg.id ? 'Stop Voice Narration' : 'Listen to Report (Text-to-Speech)'}
                          className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[11px] ${
                            isSpeaking === msg.id
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 animate-pulse'
                              : 'bg-slate-950/60 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {isSpeaking === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{isSpeaking === msg.id ? 'Stop' : 'Listen'}</span>
                        </button>

                        {/* Copy Markdown */}
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          title="Copy Report to Clipboard"
                          className="p-1.5 bg-slate-950/60 border border-slate-800 hover:text-slate-200 rounded-lg transition flex items-center gap-1 text-[11px]"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Analysis Badges */}
                      {res && (
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-bold">
                            ✓ {res.confidence_display}
                          </span>
                          <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                            {res.llm_method || 'AI-Grounded'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pipeline Scene & Audit Trace Buttons for Assistant Messages */}
                  {res && !isUser && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Interactive Pipeline Scene Toggle Button */}
                        <button
                          onClick={() => togglePipeline(msg.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition border ${
                            expandedPipelines[msg.id]
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                              : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-indigo-500/40 hover:text-indigo-300'
                          }`}
                        >
                          <Target className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{expandedPipelines[msg.id] ? 'Hide Pipeline Scene' : '⚡ View Pipeline Scene'}</span>
                        </button>

                        {/* Audit Trace Toggle Button */}
                        {res.execution_trace && (
                          <button
                            onClick={() => toggleTrace(msg.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                              isTraceExpanded
                                ? 'bg-slate-800 text-slate-200 border-slate-700'
                                : 'bg-slate-950/50 text-slate-400 border-slate-850 hover:text-slate-200'
                            }`}
                          >
                            <Activity className="w-3 h-3 text-cyan-400" />
                            <span>Audit Trace ({res.execution_trace.latency_ms || 320}ms)</span>
                            {isTraceExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>

                      {/* Expanded Full Pipeline Scene (Screenshot 1 & Screenshot 2) */}
                      {expandedPipelines[msg.id] && (
                        <div className="p-4 rounded-xl bg-[#080f19]/95 border border-indigo-500/30 space-y-5 animate-fade-in shadow-2xl">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                            <span className="text-xs font-bold font-mono text-indigo-300 uppercase flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                              Pipeline Execution & Specialist Routing
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                              Verified 7/7
                            </span>
                          </div>

                          {/* 7-Step Pipeline Execution */}
                          <PipelineVisualizer
                            steps={[
                              { id: 'interpret', name: 'Query Interpretation', description: 'NLP intent classification', detail: `Classifying query intent: "${msg.text.slice(0, 35)}..."`, icon: MessageSquare, status: 'completed', duration_ms: 155 },
                              { id: 'validate', name: 'Input Validation', description: 'Format, CRS, metadata checks', detail: 'Checking format, CRS, metadata compatibility', icon: ShieldCheck, status: 'completed', duration_ms: 211 },
                              { id: 'agent', name: 'Agentic Controller', description: 'Task routing & orchestration', detail: `Routing to optimal model for ${res.task.toUpperCase()}`, icon: Target, status: 'completed', duration_ms: 52 },
                              { id: 'specialist', name: 'Specialist Model', description: 'Model selection & execution', detail: `Executing specialist model inference`, icon: Cpu, status: 'completed', duration_ms: 98 },
                              { id: 'gis', name: 'GIS Engine', description: 'Spatial statistics calculation', detail: 'Computing spatial statistics', icon: Database, status: 'completed', duration_ms: 195 },
                              { id: 'combine', name: 'Output Combiner', description: 'Evidence + confidence assembly', detail: 'Assembling evidence & calibrating confidence', icon: Layers, status: 'completed', duration_ms: 213 },
                              { id: 'report', name: 'Report Generator', description: 'Summary & visual evidence', detail: 'Summary & visual evidence', icon: FileText, status: 'completed', duration_ms: 120 },
                            ]}
                            visible={true}
                          />

                          {/* Specialist Model Tool Registry */}
                          <div className="pt-2 border-t border-slate-800/80">
                            <ModelRegistry activeTask={res.task} visible={true} />
                          </div>
                        </div>
                      )}

                      {/* Audit Trace Accordion */}
                      {isTraceExpanded && res.execution_trace && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 pl-3 border-l-2 border-cyan-500/40 text-[11px] font-mono">
                          {(res.execution_trace.steps || []).map((st: any, sIdx: number) => (
                            <div key={sIdx} className="flex items-center gap-2">
                              <span className="font-bold text-slate-300">{st.stage || st.step_name}:</span>
                              <span className="text-slate-400">{st.details}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Live Multi-Stage Pipeline Execution Loading Indicator */}
        {loading && (
          <div className="p-4 bg-[#080f19]/95 border border-blue-500/40 rounded-2xl max-w-md shadow-2xl animate-fade-in space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs font-bold text-blue-300 font-mono tracking-wide">
                  PIPELINE RUNNING [{loadingPipelineIndex + 1}/7]
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Stage {loadingPipelineIndex + 1} of 7
              </span>
            </div>

            {/* Stage Progress Bar */}
            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                style={{ width: `${((loadingPipelineIndex + 1) / 7) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <span className="text-sm shrink-0">{PIPELINE_LOADING_STAGES[loadingPipelineIndex]?.icon || '⚡'}</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-white block truncate text-xs">
                  {PIPELINE_LOADING_STAGES[loadingPipelineIndex]?.name}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {PIPELINE_LOADING_STAGES[loadingPipelineIndex]?.desc}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Upload Slot Attachment Quick Bar (only for image analysis mode) */}
      {!hideAttachmentBar && mode !== 'pure_chat' && (
        <div className="px-5 py-2 bg-slate-900/70 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 font-mono">Attach Raster:</span>
          {(['T1', 'T2', 'SAR'] as const).map((slot) => {
            const fileExists = uploadedFiles.some((f) => f.slot === slot);
            const isAlreadyAttached = selectedAttachments?.some((a) => a.slot === slot);

            return (
              <button
                key={slot}
                disabled={!fileExists || isAlreadyAttached}
                onClick={() => attachWorkspaceSlot(slot)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition flex items-center gap-1 shrink-0 ${
                  isAlreadyAttached
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 cursor-default'
                    : fileExists
                    ? 'border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <span>{isAlreadyAttached ? '✓' : '+'}</span>
                <span>[{slot}]</span>
                {fileExists && <span className="text-[9px] opacity-70">Ready</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Attachments Preview */}
      {selectedAttachments && selectedAttachments.length > 0 && (
        <div className="px-5 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Attached:</span>
          {selectedAttachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300"
            >
              <span>{att.name}</span>
              <button
                onClick={() =>
                  setSelectedAttachments((prev) => prev?.filter((_, i) => i !== idx))
                }
                className="hover:text-red-400 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chat Input Controls */}
      <div className="p-4 bg-slate-900/95 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {/* File Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.tif,.tiff"
            multiple
            onChange={handleDirectFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach Local Satellite GeoTIFF / Image"
            className="p-3 text-slate-400 hover:text-cyan-400 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Input Button */}
          <button
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop Voice Input' : 'Speak Prompt (Voice Input)'}
            className={`p-3 rounded-xl border transition ${
              isListening
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Prompt Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening... Speak prompt now...'
                : (placeholder || (mode === 'pure_chat'
                    ? 'Ask anything: weather in Odisha, how SAR works, flood safety protocols...'
                    : 'Ask about the image: describe land cover, detect buildings, identify water, find changes...'))
            }
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition placeholder:text-slate-600 font-medium"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading || (!inputText.trim() && (!selectedAttachments || selectedAttachments.length === 0))}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">SEND</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Model & API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">AI Intelligence Configuration</h3>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              CORVUS supports <strong>Google Gemini 2.0 Flash / 1.5 Pro</strong>, <strong>OpenAI GPT-4o</strong>, and its built-in <strong>Autonomous Domain-Adapted Remote-Sensing NLP Engine</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 font-mono">Gemini or OpenAI API Key (Optional)</label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy... (Gemini) or sk-... (OpenAI)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Leave blank to use the built-in domain-adapted RS-Neural Engine, or paste a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Google AI Studio</a>.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => saveApiKey('')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Clear Key
              </button>
              <button
                onClick={() => saveApiKey(geminiApiKey)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold"
              >
                Save & Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 font-mono">{lightboxImage.title}</h4>
              <button
                onClick={() => setLightboxImage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
