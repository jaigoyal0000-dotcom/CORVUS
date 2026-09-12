'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Eye,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  User,
  ChevronDown,
  Satellite,
  Settings,
  ShieldAlert,
  Image as ImageIcon,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { getUser, clearAuth, CorvusUser } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CorvusUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/auth');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/workspace/proj_0001', label: 'GIS Map Workspace', icon: Globe },
    { href: '/projects', label: 'National Projects', icon: FolderKanban },
    { href: '/image-analysis', label: 'Satellite Analysis', icon: ImageIcon },
    { href: '/chat', label: 'AI Spatial Chat', icon: MessageSquare },
    { href: '/disaster', label: 'Disaster Cell', icon: ShieldAlert },
  ];

  const initials = mounted && user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="h-15 bg-[#0B3558] border-b border-[#082842] px-6 flex items-center justify-between sticky top-0 z-50 shadow-md">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-7">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/40 group-hover:bg-amber-500/30 transition shadow-xs">
            <Eye className="w-5 h-5 text-amber-300" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold tracking-tight text-white leading-none">CORVUS</h1>
            <p className="text-[10px] text-blue-200 font-medium">National Geospatial Portal</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#12426d] text-white border-b-2 border-amber-400 font-bold shadow-xs'
                    : 'text-blue-100 hover:text-white hover:bg-[#12426d]/60'
                }`}
              >
                <link.icon className="w-4 h-4 text-blue-200" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Status + User */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-md text-[11px] text-emerald-300 font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Portal Active</span>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12426d] hover:bg-[#185387] border border-[#1b5080] transition text-white"
          >
            <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white leading-none">{mounted && user?.full_name ? user.full_name : 'Officer'}</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl shadow-2xl shadow-black/40 py-2 animate-fade-up z-50">
              <div className="px-4 py-3 border-b border-slate-800/60">
                <div className="text-sm font-semibold text-white">{mounted && user?.full_name ? user.full_name : 'User'}</div>
                <div className="text-xs text-slate-400 mt-0.5">{user?.email || ''}</div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/projects"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 transition"
              >
                <FolderKanban className="w-4 h-4" />
                Projects
              </Link>

              <div className="border-t border-slate-800/60 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
