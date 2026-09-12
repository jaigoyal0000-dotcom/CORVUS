'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-slate-100 min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Global System Error</h2>
          <p className="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
            {error.message || 'Critical system boundary error caught.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
          >
            Reset System Boundary
          </button>
        </div>
      </body>
    </html>
  );
}
