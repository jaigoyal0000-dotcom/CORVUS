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
    <header className="h-13 bg-[#006BB6] border-b border-[#005591] px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center group-hover:bg-white/25 transition">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black tracking-wider text-white leading-none">CORVUS</h1>
            <p className="text-[10px] text-blue-100 font-medium">Bhuvan Geo-Platform</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs transition-all ${
                  isActive
                    ? 'bg-[#004E85] text-white font-bold border-b-2 border-amber-300'
                    : 'text-white/90 hover:text-white hover:bg-[#005A9C]'
                }`}
              >
                <link.icon className="w-3.5 h-3.5 text-white/80" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Status + User */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/20 rounded text-[11px] text-white font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span>ISRO Feed Active</span>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#004E85] hover:bg-[#004373] border border-white/20 transition text-white"
          >
            <div className="w-5 h-5 rounded-full bg-amber-400 text-blue-950 flex items-center justify-center text-[10px] font-black">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-none">{mounted && user?.full_name ? user.full_name : 'Officer'}</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
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
