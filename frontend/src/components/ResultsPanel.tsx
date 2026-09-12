'use client';

import React from 'react';
import { ShieldCheck, FileText, MapPin, BarChart3, CheckCircle2, Layers, TrendingUp } from 'lucide-react';

interface ResultsPanelProps {
  result: {
    answer: string;
    confidence: number;
    confidence_display: string;
    intent: string;
    task: string;
    evidence: Array<{
      id: string;
      type: string;
      uri?: string;
      data?: any;
      description?: string;
      confidence?: number;
    }>;
    gis_statistics?: any;
    llm_method?: string;
  } | null;
  visible: boolean;
}

// Rich Markdown Renderer for Output Combiner Results
function renderAnswerMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-2">
          {trimmed.replace('### ', '')}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="text-base font-bold text-white mt-5 mb-2.5">
          {trimmed.replace('## ', '')}
        </h3>
      );
      return;
    }

    // Bullet points with bold titles (e.g. * **Title:** details)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const rawContent = trimmed.substring(2);
      elements.push(
        <li key={idx} className="ml-5 list-disc text-slate-300 text-xs sm:text-sm my-1.5 leading-relaxed">
          <span
            dangerouslySetInnerHTML={{
              __html: rawContent
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-xs border border-slate-800">$1</code>')
            }}
          />
        </li>
      );
      return;
    }

    if (trimmed.length > 0) {
      elements.push(
        <p
          key={idx}
          className="text-xs sm:text-sm text-slate-200 leading-relaxed my-2"
          dangerouslySetInnerHTML={{
            __html: trimmed
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-xs border border-slate-800">$1</code>')
          }}
        />
      );
    }
  });

  return elements;
}

export default function ResultsPanel({ result, visible }: ResultsPanelProps) {
  if (!visible || !result) return null;

  const confidenceColor =
    result.confidence >= 85 ? 'text-emerald-400' :
    result.confidence >= 60 ? 'text-amber-400' :
    'text-red-400';

  const confidenceRingColor =
    result.confidence >= 85 ? '#10B981' :
    result.confidence >= 60 ? '#F59E0B' :
    '#EF4444';

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (result.confidence / 100) * circumference;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="tracking-widest font-mono text-[11px]">OUTPUT COMBINER — RESULTS</span>
        </h3>
        <span className="text-[10px] font-mono text-slate-500 uppercase">
          Evidence Synthesized
        </span>
      </div>

      {/* Main Answer Card */}
      <div className="p-6 bg-[#0a121e]/85 border border-slate-800/80 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5 border-b border-slate-800/70 pb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-md uppercase font-mono tracking-wider">
                INTENT: {result.intent}
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-md uppercase font-mono tracking-wider">
                TASK: {result.task.toUpperCase()}
              </span>
              <span className="text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-md uppercase font-mono tracking-wider flex items-center gap-1">
                {result.llm_method === 'llm' ? '🧠 LLM' : '📐 RULES'}
              </span>
            </div>
            <h4 className="text-lg font-extrabold text-white tracking-tight">AI Analysis Result</h4>
          </div>

          {/* Calibrated Confidence Ring */}
          <div className="flex items-center gap-3.5 bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-2xl shrink-0">
            <div className="confidence-ring relative w-[72px] h-[72px] flex items-center justify-center">
              <svg width="72" height="72" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="4.5" />
                <circle
                  cx="40" cy="40" r="36" fill="none"
                  stroke={confidenceRingColor}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-base font-black font-mono ${confidenceColor}`}>{result.confidence_display}</span>
              </div>
            </div>
            <div className="text-right leading-tight">
              <div className="text-[11px] text-slate-400 font-medium">Calibrated</div>
              <div className="text-[11px] text-slate-400 font-medium">Confidence</div>
            </div>
          </div>
        </div>

        {/* Formatted Markdown Answer */}
        <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1 font-sans">
          {renderAnswerMarkdown(result.answer)}
        </div>

        {/* GIS Statistics */}
        {result.gis_statistics && (
          <div className="mt-5 p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl">
            <h5 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" /> GIS Spatial Statistics
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(result.gis_statistics).map(([key, value]: [string, any]) => {
                if (typeof value === 'object' && !Array.isArray(value)) {
                  return Object.entries(value).map(([subKey, subVal]: [string, any]) => (
                    <div key={`${key}_${subKey}`} className="p-2.5 bg-slate-900/70 border border-slate-800/60 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{key}.{subKey}</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">
                        {typeof subVal === 'number' ? subVal.toLocaleString() : String(subVal)}
                      </div>
                    </div>
                  ));
                }
                if (Array.isArray(value)) {
                  return (
                    <div key={key} className="p-2.5 bg-slate-900/70 border border-slate-800/60 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{key.replace(/_/g, ' ')}</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">[{value.join(', ')}]</div>
                    </div>
                  );
                }
                return (
                  <div key={key} className="p-2.5 bg-slate-900/70 border border-slate-800/60 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">{key.replace(/_/g, ' ')}</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </div>
                  </div>
                );
              }).flat()}
            </div>
          </div>
        )}
      </div>

      {/* Spatial Evidence Items */}
      {result.evidence.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" /> Spatial Evidence Items ({result.evidence.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {result.evidence.map((ev) => (
              <div key={ev.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-mono font-bold text-blue-400">{ev.id}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xs font-semibold text-slate-200 uppercase">{ev.type.replace(/_/g, ' ')}</div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono truncate">
                  {ev.uri || ev.description || (ev.data ? `Delta: +${ev.data.net_increase_m2?.toLocaleString() || ev.data.diff_m2?.toLocaleString() || ''} m²` : 'Validated')}
                </p>
                {ev.confidence && (
                  <div className="mt-2 text-[10px] text-emerald-400 font-mono">
                    Confidence: {(ev.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
