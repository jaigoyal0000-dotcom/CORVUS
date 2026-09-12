import type { Metadata } from 'next';
import './globals.css';
import CinematicWallpaper from '@/components/CinematicWallpaper';

export const metadata: Metadata = {
  title: 'CORVUS — THE WATCHING CROW | SatQuery AI',
  description: 'AI-Powered Satellite & Aerial Intelligence Platform (SIH 2026)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0B0F17] text-slate-100 antialiased selection:bg-blue-600 selection:text-white relative min-h-screen">
        <CinematicWallpaper />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}

