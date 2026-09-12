'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Image as ImageIcon, GitCompare, Sparkles, X, ZoomIn, ZoomOut,
  Maximize2, RefreshCw, Sliders, ArrowRightLeft, Layers, ShieldCheck,
  CheckCircle2, ArrowRight, Eye, SplitSquareVertical
} from 'lucide-react';

export interface DualImageItem {
  id: string;
  name: string;
  url: string;
  base64?: string;
  slot: 'T1' | 'T2' | 'SAR' | 'Custom';
  date?: string;
  sensor?: string;
}

interface DualImageComparatorProps {
  imageA: DualImageItem | null;
  imageB: DualImageItem | null;
  onImageAChange: (item: DualImageItem | null) => void;
  onImageBChange: (item: DualImageItem | null) => void;
  onRunComparisonQuery: (prompt: string) => void;
}

// Built-in Demo Benchmark Pairs
const DEMO_PAIRS = [
  {
    title: 'Delhi Urban Expansion (2024 vs 2026)',
    desc: 'Bi-temporal Sentinel-2 optical imagery tracking +26.5% built-up expansion.',
    imageA: {
      id: 'demo-delhi-t1',
      name: 'Delhi_Optical_T1_2024.jpg',
      url: '/sample_t1.jpg',
      slot: 'T1' as const,
      date: 'Aug 2024',
      sensor: 'Sentinel-2 VNIR',
    },
    imageB: {
      id: 'demo-delhi-t2',
      name: 'Delhi_Optical_T2_2026.jpg',
      url: '/sample_t2.jpg',
      slot: 'T2' as const,
      date: 'Aug 2026',
      sensor: 'Sentinel-2 VNIR',
    },
  },
  {
    title: 'Optical vs. Sentinel-1 SAR Radar',
    desc: 'Cross-modal paired analysis merging multi-spectral with cloud-penetrating radar.',
    imageA: {
      id: 'demo-opt',
      name: 'Sentinel2_Optical_RGB.jpg',
      url: '/sample_t1.jpg',
      slot: 'T1' as const,
      date: 'Current',
      sensor: 'Sentinel-2 Multispectral',
    },
    imageB: {
      id: 'demo-sar',
      name: 'Sentinel1_SAR_C_Band.jpg',
      url: '/sample_sar.jpg',
      slot: 'SAR' as const,
      date: 'Co-registered',
      sensor: 'Sentinel-1 C-Band (VV+VH)',
    },
  },
];

export const DualImageComparator: React.FC<DualImageComparatorProps> = ({
  imageA,
  imageB,
  onImageAChange,
  onImageBChange,
  onRunComparisonQuery,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'difference'>('side-by-side');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoomA, setZoomA] = useState<number>(1);
  const [zoomB, setZoomB] = useState<number>(1);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // File loading helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      const item: DualImageItem = {
        id: `img-${Date.now()}-${side}`,
        name: file.name,
        url: URL.createObjectURL(file),
        base64: b64,
        slot: side === 'A' ? 'T1' : 'T2',
        date: 'Uploaded',
        sensor: file.name.toLowerCase().includes('sar') ? 'SAR Radar' : 'Optical Sensor',
      };
      if (side === 'A') onImageAChange(item);
      else onImageBChange(item);
    };
    reader.readAsDataURL(file);
  };

  // Slider dragging logic
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const loadDemoPair = (pairIndex: number) => {
    const pair = DEMO_PAIRS[pairIndex];
    onImageAChange(pair.imageA);
    onImageBChange(pair.imageB);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 gap-4 overflow-y-auto custom-scrollbar">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Dual-Image Comparative Vision Studio
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                BI-TEMPORAL & CROSS-MODAL
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Upload two images (Side A vs. Side B) for visual split-swiping and multi-modal LLM reasoning.
            </p>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" /> Split Swipe
          </button>
        </div>
      </div>

      {/* 2. Demo Presets Quick Load */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Benchmark Presets:
        </span>
        {DEMO_PAIRS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => loadDemoPair(idx)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-slate-300 transition text-[11px] flex items-center gap-1.5"
          >
            <span>{p.title}</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </button>
        ))}
      </div>

      {/* 3. Main Display Area */}
      <div className="flex-1 min-h-[460px] flex flex-col gap-4">
        {/* VIEW MODE 1: SIDE BY SIDE */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {/* Left: Side A */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    Side A • Baseline (T1 / Optical)
                  </h3>
                </div>
                {imageA && (
                  <button
                    onClick={() => onImageAChange(null)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition"
                    title="Remove Image A"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {imageA ? (
                <div className="flex-1 flex flex-col items-center justify-center relative bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden group min-h-[300px]">
                  <img
                    src={imageA.url}
                    alt={imageA.name}
                    style={{ transform: `scale(${zoomA})` }}
                    className="max-h-[360px] w-auto object-contain transition-transform duration-200"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] font-mono">
                    <span className="truncate text-slate-200">{imageA.name}</span>
                    <span className="text-cyan-400">{imageA.sensor || 'Optical'}</span>
                  </div>
                  {/* Zoom controls */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => setZoomA((z) => Math.min(z + 0.25, 3))}
                      className="p-1 hover:text-cyan-400"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomA((z) => Math.max(z - 0.25, 0.5))}
                      className="p-1 hover:text-cyan-400"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setZoomA(1)} className="p-1 hover:text-cyan-400">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputARef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer bg-slate-950/40 transition group min-h-[300px]"
                >
                  <div className="p-4 rounded-full bg-slate-900 group-hover:bg-cyan-500/10 border border-slate-800 group-hover:border-cyan-500/30 text-slate-400 group-hover:text-cyan-400 transition mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold text-slate-300 mb-1">Click to Upload Side A</p>
                  <p className="text-[10px] text-slate-500 text-center max-w-[200px]">
                    Pre-event GeoTIFF, Optical Satellite image (T1), or Baseline.
                  </p>
                </div>
              )}
              <input
                ref={fileInputARef}
                type="file"
                accept="image/*,.tif,.tiff"
                onChange={(e) => handleFileUpload(e, 'A')}
                className="hidden"
              />
            </div>

            {/* Right: Side B */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Side B • Comparison (T2 / SAR Radar)
                  </h3>
                </div>
                {imageB && (
                  <button
                    onClick={() => onImageBChange(null)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition"
                    title="Remove Image B"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {imageB ? (
                <div className="flex-1 flex flex-col items-center justify-center relative bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden group min-h-[300px]">
                  <img
                    src={imageB.url}
                    alt={imageB.name}
                    style={{ transform: `scale(${zoomB})` }}
                    className="max-h-[360px] w-auto object-contain transition-transform duration-200"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] font-mono">
                    <span className="truncate text-slate-200">{imageB.name}</span>
                    <span className="text-purple-400">{imageB.sensor || 'Comparison'}</span>
                  </div>
                  {/* Zoom controls */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => setZoomB((z) => Math.min(z + 0.25, 3))}
                      className="p-1 hover:text-purple-400"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomB((z) => Math.max(z - 0.25, 0.5))}
                      className="p-1 hover:text-purple-400"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setZoomB(1)} className="p-1 hover:text-purple-400">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputBRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer bg-slate-950/40 transition group min-h-[300px]"
                >
                  <div className="p-4 rounded-full bg-slate-900 group-hover:bg-purple-500/10 border border-slate-800 group-hover:border-purple-500/30 text-slate-400 group-hover:text-purple-400 transition mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold text-slate-300 mb-1">Click to Upload Side B</p>
                  <p className="text-[10px] text-slate-500 text-center max-w-[200px]">
                    Post-event GeoTIFF (T2), Synthetic Aperture Radar (SAR), or Target.
                  </p>
                </div>
              )}
              <input
                ref={fileInputBRef}
                type="file"
                accept="image/*,.tif,.tiff"
                onChange={(e) => handleFileUpload(e, 'B')}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* VIEW MODE 2: SPLIT SWIPE SLIDER */}
        {viewMode === 'split' && (
          <div
            ref={sliderContainerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex-1 min-h-[420px] relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none cursor-ew-resize shadow-2xl flex items-center justify-center"
          >
            {imageA && imageB ? (
              <>
                {/* Background: Image B */}
                <img
                  src={imageB.url}
                  alt={imageB.name}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Foreground Clip: Image A */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={imageA.url}
                    alt={imageA.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: sliderContainerRef.current?.offsetWidth || '100%' }}
                  />
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-20 pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg font-bold text-xs">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                </div>

                {/* Corner labels */}
                <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700 text-cyan-300 z-10">
                  Side A: {imageA.name} ({imageA.date || 'T1'})
                </div>
                <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700 text-purple-300 z-10">
                  Side B: {imageB.name} ({imageB.date || 'T2'})
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <p className="text-sm font-bold text-slate-300">
                  Please load both Side A and Side B to activate Split Swipe.
                </p>
                <p className="text-xs text-slate-500">
                  Select a preset benchmark pair above or upload images in Side-by-Side mode.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. Dual-Image NLP Quick Action Chips */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Multi-Modal Dual-Image Comparative Queries
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Sends both images to Vision-Language LLM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              {
                title: 'What changed between these two images?',
                icon: '🔄',
                task: 'Bi-temporal Diff',
              },
              {
                title: 'Has the built-up area increased, decreased, or remained unchanged?',
                icon: '🏙️',
                task: 'Quantitative CDVQA',
              },
              {
                title: 'Use optical and SAR images together to identify built-up and water-covered regions',
                icon: '🛰️',
                task: 'Optical-SAR Fusion',
              },
              {
                title: 'Compare flood inundation and water extent between both dates',
                icon: '🌊',
                task: 'Hydrological Delta',
              },
            ].map((chip, i) => (
              <button
                key={i}
                onClick={() => onRunComparisonQuery(chip.title)}
                className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition group flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{chip.icon}</span>
                  <span className="text-[10px] font-mono text-cyan-400/90">{chip.task}</span>
                </div>
                <span className="text-xs text-slate-200 group-hover:text-cyan-300 font-medium line-clamp-2">
                  {chip.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
