'use client';

import React from 'react';
import { Cpu, Eye, Layers, Activity, Radio, Zap } from 'lucide-react';

interface ModelRegistryProps {
  activeTask: string | null;
  visible: boolean;
}

const SPECIALIST_MODELS = [
  {
    id: 'vqa',
    tasks: ['vqa', 'captioning'],
    name: 'GeoChat-7B',
    fullName: 'VQA / Captioning Model',
    description: 'Visual question answering and scene description for satellite imagery',
    icon: Eye,
    color: 'from-blue-500 to-indigo-600',
    params: '7B parameters',
    arch: 'LLaVA-based MLLM',
  },
  {
    id: 'grounding',
    tasks: ['grounding'],
    name: 'Grounding DINO',
    fullName: 'Grounding Model',
    description: 'Open-vocabulary object detection with text-guided bounding box prediction',
    icon: Layers,
    color: 'from-emerald-500 to-teal-600',
    params: '172M parameters',
    arch: 'DINO + BERT Fusion',
  },
  {
    id: 'change',
    tasks: ['change_detection', 'change_vqa'],
    name: 'ChangeFormer 1.0',
    fullName: 'Change Understanding / Change-VQA Model',
    description: 'Bi-temporal change detection and quantitative change analysis',
    icon: Activity,
    color: 'from-amber-500 to-orange-600',
    params: '41M parameters',
    arch: 'Siamese Transformer',
  },
  {
    id: 'fusion',
    tasks: ['optical_sar_fusion'],
    name: 'SAR Fusion Head',
    fullName: 'Optical-SAR Fusion / Extraction Model',
    description: 'All-weather multi-modal sensor fusion for Sentinel-1 SAR + Sentinel-2 optical',
    icon: Radio,
    color: 'from-cyan-500 to-blue-600',
    params: '28M parameters',
    arch: 'Cross-Attention Encoder',
  },
];

export default function ModelRegistry({ activeTask, visible }: ModelRegistryProps) {
  if (!visible) return null;

  const isModelActive = (model: typeof SPECIALIST_MODELS[0]) => {
    if (!activeTask) return false;
    const t = activeTask.toLowerCase().trim();
    if (model.id === 'vqa') {
      return (
        t === 'vqa' ||
        t.includes('caption') ||
        t.includes('desc') ||
        t.includes('scene') ||
        t.includes('overview') ||
        t.includes('visual_question')
      );
    }
    if (model.id === 'grounding') {
      return (
        t === 'grounding' ||
        t.includes('ground') ||
        t.includes('detect') ||
        t.includes('bbox') ||
        t.includes('locate') ||
        t.includes('box')
      );
    }
    if (model.id === 'change') {
      return (
        t === 'change_detection' ||
        t === 'change_vqa' ||
        t.includes('change') ||
        t.includes('diff') ||
        t.includes('temporal') ||
        t.includes('dual')
      );
    }
    if (model.id === 'fusion') {
      return (
        t === 'optical_sar_fusion' ||
        t.includes('sar') ||
        t.includes('fusion') ||
        t.includes('radar') ||
        t.includes('polarim')
      );
    }
    return model.tasks.some(mt => t.includes(mt));
  };

  return (
    <div className="space-y-3.5 animate-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-violet-400" />
          <span className="tracking-widest font-mono text-[11px]">SPECIALIST MODEL / TOOL REGISTRY</span>
        </h3>
        <span className="text-[10px] font-mono text-slate-500 uppercase">
          Dynamic Agentic Routing
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SPECIALIST_MODELS.map((model) => {
          const isActive = isModelActive(model);
          const ModelIcon = model.icon;

          return (
            <div
              key={model.id}
              className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'border-blue-500/50 bg-[#0c192c]/70 shadow-[0_0_20px_rgba(59,130,246,0.18)] ring-1 ring-blue-500/30'
                  : 'border-slate-800/60 bg-slate-900/35 opacity-70 hover:opacity-90'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              )}

              <div className="flex items-start gap-3.5 relative z-10">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${model.color} p-0.5 shrink-0 ${
                    isActive ? 'shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''
                  }`}
                >
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <ModelIcon className={`w-5 h-5 ${isActive ? 'text-blue-300' : 'text-slate-300'}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-100 tracking-tight">{model.name}</span>
                    {isActive ? (
                      <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded shadow-sm animate-pulse">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-600">
                        STANDBY
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{model.fullName}</div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{model.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                    <span>{model.params}</span>
                    <span>•</span>
                    <span>{model.arch}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
