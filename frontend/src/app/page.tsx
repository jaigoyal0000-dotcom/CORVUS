'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400 animate-pulse">
        <span className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Opening CORVUS Auth...</span>
      </div>
    </div>
  );
}
