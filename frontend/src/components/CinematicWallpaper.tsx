'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CinematicWallpaper() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const targetMouse = useRef({ x: 0, y: 0 });
  const currentMouse = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      targetMouse.current.x = (e.clientX / window.innerWidth - 0.5);
      targetMouse.current.y = (e.clientY / window.innerHeight - 0.5);
    };

    const animate = () => {
      currentMouse.current.x += (targetMouse.current.x - currentMouse.current.x) * 0.05;
      currentMouse.current.y += (targetMouse.current.y - currentMouse.current.y) * 0.05;

      setMouse({
        x: parseFloat(currentMouse.current.x.toFixed(4)),
        y: parseFloat(currentMouse.current.y.toFixed(4)),
      });

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const mx = mouse.x;
  const my = mouse.y;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-[#070A12]"
      aria-hidden="true"
    >
      {/* 1. Deep Space Atmospheric Radial Glows (Cyber Geospatial Auras) */}
      <div
        className="absolute w-[900px] h-[900px] rounded-full opacity-35 blur-[140px] pointer-events-none transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(14, 116, 144, 0.45) 0%, rgba(3, 105, 161, 0.2) 50%, transparent 80%)',
          top: '-15%',
          left: '15%',
          transform: `translate3d(${mx * 40}px, ${my * 30}px, 0)`,
        }}
      />

      <div
        className="absolute w-[800px] h-[800px] rounded-full opacity-25 blur-[150px] pointer-events-none transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(79, 70, 229, 0.15) 50%, transparent 75%)',
          bottom: '-10%',
          right: '10%',
          transform: `translate3d(${mx * -35}px, ${my * -25}px, 0)`,
        }}
      />

      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[130px] pointer-events-none transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.1) 60%, transparent 80%)',
          top: '40%',
          right: '35%',
          transform: `translate3d(${mx * 25}px, ${my * 35}px, 0)`,
        }}
      />

      {/* 2. Micro Coordinate Star / Orbital Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.7) 1px, transparent 0),
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px, 96px 96px, 96px 96px',
          transform: `translate3d(${mx * -8}px, ${my * -6}px, 0)`,
        }}
      />

      {/* 3. Deep Atmospheric Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(7, 10, 18, 0.7) 70%, rgba(7, 10, 18, 0.95) 100%)',
        }}
      />
    </div>
  );
}
