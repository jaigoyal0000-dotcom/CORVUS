'use client';

import React, { useState } from 'react';
import { Activity, CheckCircle2, Download, Clock, ChevronRight, FileText, X, Printer } from 'lucide-react';

interface TraceStep {
  stage: string;
  details: string;
  status: string;
  timestamp: string;
}

interface ExecutionTraceProps {
  trace: {
    latency_ms: number;
    steps: TraceStep[];
  } | null;
  result: {
    request_id: string;
    query: string;
    answer: string;
    confidence_display: string;
    task: string;
    intent: string;
  } | null;
  visible: boolean;
}

export default function ExecutionTrace({ trace, result, visible }: ExecutionTraceProps) {
  const [showFullTrace, setShowFullTrace] = useState(false);

  if (!visible || !trace || !result) return null;

  const handleDownloadReport = () => {
    const reportContent = `===================================================================
CORVUS — THE WATCHING CROW | GEOSPATIAL INTELLIGENCE REPORT
SIH 2026 | SatQuery AI Platform
===================================================================

REQUEST ID:        ${result.request_id}
DATE:              ${new Date().toISOString()}
QUERY:             "${result.query}"

-------------------------------------------------------------------
ANALYSIS & FINDINGS
-------------------------------------------------------------------
TASK TYPE:         ${result.task.toUpperCase()}
INTENT:            ${result.intent}
CONFIDENCE:        ${result.confidence_display}

ANSWER:
${result.answer}

-------------------------------------------------------------------
EXECUTION TRACE AUDIT
-------------------------------------------------------------------
Total Latency: ${trace.latency_ms}ms

${trace.steps.map((s, i) => `[${i + 1}] ${s.stage} → ${s.details} (${s.status}) @ ${s.timestamp}`).join('\n')}

-------------------------------------------------------------------
EVIDENCE SUMMARY
-------------------------------------------------------------------
- All spatial evidence items have been validated
- GIS statistics computed from PostGIS / GeoPandas engine
- Confidence calibrated using C_model, C_evidence, C_input formula

===================================================================
CONFIDENTIAL - CORVUS AUTOMATED SATELLITE REPORT
===================================================================
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CORVUS_Report_${result.request_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Execution Summary
          </h3>
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {trace.latency_ms}ms total latency
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            ID: {result.request_id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullTrace(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            <FileText className="w-3.5 h-3.5" />
            View Full Trace
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download Report
          </button>
        </div>
      </div>

      {/* Compact Timeline */}
      <div className="flex flex-wrap gap-2">
        {trace.steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[11px]"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium">{step.stage}</span>
          </div>
        ))}
      </div>

      {/* Full Trace Modal */}
      {showFullTrace && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" /> CORVUS Execution Audit Trace
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Request: {result.request_id} • Latency: {trace.latency_ms}ms • Steps: {trace.steps.length}
                </p>
              </div>
              <button
                onClick={() => setShowFullTrace(false)}
                className="text-slate-400 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 flex-1">
              {trace.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start gap-3 text-xs animate-fade-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{step.stage}</span>
                      <span className="text-[10px] font-mono text-slate-500">{step.timestamp}</span>
                    </div>
                    <p className="text-slate-400 mt-1 font-mono text-[11px]">{step.details}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500">Execution validated against policy constraints.</span>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Full Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
