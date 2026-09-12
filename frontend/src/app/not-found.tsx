import React from 'react';
import Link from 'next/link';
import { Eye, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
        <div className="inline-flex p-3 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
          <Eye className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-100">404 — Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested geospatial route or project workspace could not be found.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Main Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
