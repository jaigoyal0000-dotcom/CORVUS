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
    { href: '/workspace/proj_0001', label: 'GIS Workspace', icon: Globe },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/image-analysis', label: 'Image Analysis', icon: ImageIcon },
    { href: '/chat', label: 'Pure AI Chat', icon: MessageSquare },
    { href: '/disaster', label: 'Disaster AI', icon: ShieldAlert },
  ];

  const initials = mounted && user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-blue-600/15 rounded-xl border border-blue-500/20 group-hover:bg-blue-600/25 transition">
            <Eye className="w-5 h-5 text-blue-400" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold tracking-tight text-white leading-none">CORVUS</h1>
            <p className="text-[10px] text-slate-500 font-medium">SatQuery AI</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Status + User */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/8 border border-emerald-500/15 rounded-full text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AI Engine Active</span>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-900/60 transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-600/20">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-none">{mounted && user?.full_name ? user.full_name : 'User'}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{mounted && user?.role ? user.role : 'analyst'}</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
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
