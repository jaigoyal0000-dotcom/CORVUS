'use client';

import React from 'react';
import { CheckCircle2, Loader2, Clock, ArrowRight, Cpu, MessageSquare, ShieldCheck, Target, Layers, FileText, Database } from 'lucide-react';

export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  status: 'waiting' | 'running' | 'completed' | 'failed';
  icon: any;
  detail?: string;
  duration_ms?: number;
}

interface PipelineVisualizerProps {
  steps: PipelineStep[];
  visible: boolean;
}

export const DEFAULT_PIPELINE_STEPS: PipelineStep[] = [
  { id: 'interpret', name: 'Query Interpretation', description: 'NLP intent classification', icon: MessageSquare, status: 'waiting' },
  { id: 'validate', name: 'Input Validation', description: 'Format, CRS, metadata checks', icon: ShieldCheck, status: 'waiting' },
  { id: 'agent', name: 'Agentic Controller', description: 'Task routing & orchestration', icon: Target, status: 'waiting' },
  { id: 'specialist', name: 'Specialist Model', description: 'Model selection & execution', icon: Cpu, status: 'waiting' },
  { id: 'gis', name: 'GIS Engine', description: 'Spatial statistics calculation', icon: Database, status: 'waiting' },
  { id: 'combine', name: 'Output Combiner', description: 'Evidence + confidence assembly', icon: Layers, status: 'waiting' },
  { id: 'report', name: 'Report Generator', description: 'Summary & visual evidence', icon: FileText, status: 'waiting' },
];

export default function PipelineVisualizer({ steps, visible }: PipelineVisualizerProps) {
  if (!visible) return null;

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const isRunning = steps.some(s => s.status === 'running');
  const allDone = completedCount === steps.length;

  return (
    <div className="space-y-3.5 animate-fade-up">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-400 flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          </div>
          <span className="tracking-widest font-mono text-[11px]">PIPELINE EXECUTION</span>
        </h3>
        <div className="flex items-center gap-2.5 font-mono text-xs">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[11px] text-blue-400 font-medium animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Executing Pipeline...
            </span>
          )}
          {allDone && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complete
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-semibold">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>

      {/* Glowing Gradient Progress Bar */}
      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.8)] ${
            allDone
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
              : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500'
          }`}
          style={{ width: `${Math.max(4, (completedCount / steps.length) * 100)}%` }}
        />
      </div>

      {/* Pipeline Steps List */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'running';
          const isFailed = step.status === 'failed';

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-300 ${
                isDone
                  ? 'bg-[#091518]/90 border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.04)]'
                  : isCurrent
                  ? 'bg-blue-950/40 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30'
                  : isFailed
                  ? 'bg-red-950/30 border-red-500/30'
                  : 'bg-slate-900/35 border-slate-800/50 opacity-60'
              }`}
            >
              {/* Left Status Icon */}
              <div className="shrink-0">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  </div>
                ) : isFailed ? (
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold">
                    ✕
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                )}
              </div>

              {/* Step Title, Duration & Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      isDone
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-blue-300'
                        : isFailed
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </span>
                  {step.duration_ms !== undefined && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {step.duration_ms}ms
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 truncate ${
                    isDone
                      ? 'text-slate-300'
                      : isCurrent
                      ? 'text-blue-200/80'
                      : 'text-slate-500'
                  }`}
                >
                  {step.detail || step.description}
                </p>
              </div>

              {/* Right Stage Category Icon */}
              <div className="shrink-0 pl-2">
                <StepIcon
                  className={`w-4 h-4 ${
                    isDone
                      ? 'text-emerald-400/70'
                      : isCurrent
                      ? 'text-blue-400'
                      : 'text-slate-600'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
