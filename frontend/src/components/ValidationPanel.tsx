'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, FileCode, MapPin, Layers, Scan } from 'lucide-react';

interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  detail: string;
  icon: any;
}

interface ValidationPanelProps {
  files: Array<{ slot: string; file: File; metadata?: any; validated?: boolean; error?: string }>;
  visible: boolean;
}

export default function ValidationPanel({ files, visible }: ValidationPanelProps) {
  if (!visible || files.length === 0) return null;

  const generateChecks = (file: any): ValidationCheck[] => {
    const meta = file.metadata;
    if (!meta) {
      return [
        { name: 'Format Check', status: 'pending', detail: 'Validating...', icon: FileCode },
        { name: 'CRS Verification', status: 'pending', detail: 'Checking...', icon: MapPin },
        { name: 'Band Compatibility', status: 'pending', detail: 'Analyzing...', icon: Layers },
        { name: 'Metadata Completeness', status: 'pending', detail: 'Scanning...', icon: Scan },
      ];
    }

    const isGeoTiff = meta.format === 'GeoTIFF' || meta.format === 'COG';
    const hasValidCRS = meta.crs && meta.crs.startsWith('EPSG:');
    const hasValidBands = meta.bands && meta.bands >= 1;
    const hasResolution = meta.resolution_m && meta.resolution_m > 0;

    return [
      {
        name: 'Format Validation',
        status: isGeoTiff ? 'pass' : 'warning',
        detail: isGeoTiff ? `${meta.format} — Geospatial raster format verified` : `${meta.format} — Non-geospatial format detected`,
        icon: FileCode,
      },
      {
        name: 'CRS / Projection',
        status: hasValidCRS ? 'pass' : 'fail',
        detail: hasValidCRS ? `${meta.crs} — Valid coordinate reference system` : 'Missing CRS — Cannot perform spatial analysis',
        icon: MapPin,
      },
      {
        name: 'Band Compatibility',
        status: hasValidBands ? 'pass' : 'fail',
        detail: hasValidBands
          ? `${meta.bands} bands detected — ${file.slot === 'SAR' ? 'VV/VH polarization expected' : 'Multi-spectral bands compatible'}`
          : 'No bands detected',
        icon: Layers,
      },
      {
        name: 'Spatial Resolution',
        status: hasResolution ? 'pass' : 'warning',
        detail: hasResolution ? `${meta.resolution_m}m GSD — ${meta.sensor || 'Unknown sensor'}` : 'Resolution unknown',
        icon: Scan,
      },
      {
        name: 'Metadata Integrity',
        status: meta.width && meta.height ? 'pass' : 'warning',
        detail: meta.width ? `${meta.width} × ${meta.height} pixels — ${((meta.width * meta.height * meta.bands * 2) / (1024 * 1024)).toFixed(0)} MB estimated` : 'Dimensions unknown',
        icon: ShieldCheck,
      },
    ];
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default: return <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const allPassed = files.every(f => {
    if (!f.metadata) return false;
    const checks = generateChecks(f);
    return checks.every(c => c.status === 'pass' || c.status === 'warning');
  });

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" /> Input Validation & Compatibility Checker
        </h3>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
          allPassed
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {allPassed ? '✓ All Checks Passed' : '⏳ Validating...'}
        </span>
      </div>

      {files.map((file) => {
        const checks = generateChecks(file);
        const passed = checks.filter(c => c.status === 'pass').length;
        return (
          <div key={file.slot} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md">
                  {file.slot}
                </span>
                <span className="text-xs font-semibold text-slate-200">{file.file.name}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {passed}/{checks.length} passed
              </span>
            </div>

            <div className="space-y-2">
              {checks.map((check, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <StatusIcon status={check.status} />
                  <div className="flex-1">
                    <span className="font-semibold text-slate-300">{check.name}</span>
                    <span className="text-slate-500 ml-2">— {check.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  passed === checks.length ? 'bg-emerald-500' : passed > 0 ? 'bg-amber-500' : 'bg-slate-700'
                }`}
                style={{ width: `${(passed / checks.length) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
