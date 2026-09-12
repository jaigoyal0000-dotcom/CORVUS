'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Compass, ShieldCheck, RefreshCw, Cpu, Layers,
  ChevronRight, ArrowRight, Sun, CloudRain, Satellite, Eye
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AdvancedChat, { ChatMessage } from '@/components/AdvancedChat';

export default function PureChatPage() {
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSendMessage = async (queryText: string, attachments?: ChatMessage['attachments'], customApiKey?: string) => {
    if (!queryText.trim()) return;

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userMsg: ChatMessage = {
      id: `USER-${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: now,
    };

    const currentHistory = [...chatHistory, userMsg];
    setChatHistory(currentHistory);
    setLoading(true);

    try {
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem('CORVUS_GEMINI_KEY') : null;
      const effectiveKey = customApiKey || storedKey || undefined;

      const res = await fetch('http://localhost:8000/api/v1/analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'pure_chat_dedicated',
          query: queryText,
          mode: 'text_only',
          chat_history: currentHistory.map(m => ({ role: m.role, text: m.text })),
          api_key: effectiveKey,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `AI-${Date.now()}`,
        role: 'corvus',
        text: data.answer || data.grounded_answer || data.response || 'Here is what I found.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        analysisResult: data,
      };

      setChatHistory(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        {
          id: `ERR-${Date.now()}`,
          role: 'corvus',
          text: `⚠️ **Conversational AI Error**: ${err.message || 'Unable to connect to AI engine'}. Please verify backend status and try again.`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const curatedTopics = [
    {
      title: 'Odisha Weather & Soil Saturation',
      desc: 'Live meteorological status, rainfall impact & ground stability',
      icon: '🌤️',
      query: 'What is the weather and ground condition in Odisha right now?',
      glow: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
    },
    {
      title: 'How SAR Radar Pierces Clouds',
      desc: 'Active microwave backscatter through storm cover and darkness',
      icon: '🛰️',
      query: 'How does Synthetic Aperture Radar (SAR) penetrate clouds?',
      glow: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10',
    },
    {
      title: 'NDVI Vegetation Health in Plain Words',
      desc: 'Light absorption scale (-1 to +1) and crop drought detection',
      icon: '🌿',
      query: 'Explain NDVI vegetation index in simple words',
      glow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    },
    {
      title: 'Emergency Flood Evacuation Protocols',
      desc: 'High-ground staging, safe routing & relief logistics',
      icon: '🚨',
      query: 'What are standard emergency evacuation steps during floods?',
      glow: 'hover:border-rose-500/40 hover:shadow-rose-500/10',
    },
    {
      title: 'Digital Elevation & Terrain Profiling',
      desc: 'How stereoscopic satellites and LiDAR map ground height',
      icon: '⛰️',
      query: 'How do satellites calculate elevation and building heights?',
      glow: 'hover:border-purple-500/40 hover:shadow-purple-500/10',
    },
    {
      title: 'Multispectral vs. Hyperspectral Data',
      desc: 'Comparing 13 Sentinel bands with continuous spectral curves',
      icon: '🌈',
      query: 'What is the difference between multispectral and hyperspectral imagery?',
      glow: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1 flex flex-col">
        {/* Subtle, Aesthetic Top Header Bar (No Clunky Banners) */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-emerald-500/20 border border-slate-700/60 flex items-center justify-center backdrop-blur-md shadow-inner">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">CORVUS Chat</h1>
                <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/50 text-[10px] text-slate-300 font-mono rounded-md">
                  Gemini Flash Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Ask any question • Real-time geospatial & general intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/image-analysis"
              className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 font-medium transition flex items-center gap-1.5"
            >
              <span>Upload Imagery ➔</span>
            </Link>
          </div>
        </div>

        {/* Clean, Full-Height Aesthetic Chat Studio */}
        <div className="flex-1 min-h-[620px]">
          <AdvancedChat
            chatHistory={chatHistory}
            mode="pure_chat"
            customTitle="CORVUS Conversational Intelligence"
            customSubtitle="Ask anything freely with grounded, natural answers"
            placeholder="Type your question (e.g. Odisha weather, how SAR works, NDVI formula, flood safety)..."
            customSuggestedPrompts={curatedTopics.map(t => t.query)}
            hideAttachmentBar={true}
            onSendMessage={handleSendMessage}
            loading={loading}
            onClearHistory={() => setChatHistory([])}
          />
        </div>
      </main>
    </div>
  );
}
