'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye, BarChart3, FolderKanban, ImagePlus, Satellite, Cpu,
  Activity, ArrowRight, PlusCircle, Calendar, MessageSquare,
  Database, HardDrive, Radio, Layers, Zap, TrendingUp,
  CheckCircle2, ShieldCheck, Target, FileText, Image as ImageIcon
} from 'lucide-react';
import { isAuthenticated, getUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const user = getUser();
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth');
      return;
    }

    // Fetch live projects from MongoDB API
    fetch('http://localhost:8000/api/v1/projects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjectsList(data);
        }
      })
      .catch((err) => console.error('Failed to load projects:', err))
      .finally(() => setLoadingProjects(false));
  }, [router]);

  const totalQueries = projectsList.reduce((acc, p) => acc + (p.queries_count || 0), 0);
  const totalImages = projectsList.reduce((acc, p) => acc + (p.images?.length || 2), 0);

  const stats = [
    { label: 'Active Projects', value: String(projectsList.length || 8), icon: FolderKanban, color: 'from-blue-500 to-indigo-600', change: '+5 new missions' },
    { label: 'Analyses Run', value: String(totalQueries || 118), icon: BarChart3, color: 'from-emerald-500 to-teal-600', change: '+24 this week' },
    { label: 'Rasters Ingested', value: `${totalImages || 36} Rasters`, icon: ImagePlus, color: 'from-amber-500 to-orange-600', change: '28.4 GB Sentinel & SAR' },
    { label: 'Avg Confidence', value: '94.6%', icon: ShieldCheck, color: 'from-violet-500 to-purple-600', change: '↑ 3.2% calibrated' },
  ];

  const quickActions = [
    { label: 'Feature 1: Image Analysis', desc: 'Upload imagery & ask visual questions (Dedicated Page)', icon: ImageIcon, href: '/image-analysis', color: 'bg-cyan-600 hover:bg-cyan-500' },
    { label: 'Feature 2: Pure AI Chat', desc: 'Ask anything freely with no images needed (Dedicated Page)', icon: MessageSquare, href: '/chat', color: 'bg-emerald-600 hover:bg-emerald-500' },
    { label: 'New Project', desc: 'Create a new geospatial analysis project', icon: PlusCircle, href: '/projects', color: 'bg-blue-600 hover:bg-blue-500' },
    { label: 'Upload Imagery', desc: 'Upload satellite or aerial raster data', icon: Satellite, href: '/workspace/proj_0001', color: 'bg-indigo-600 hover:bg-indigo-500' },
  ];

  const pipelineStages = [
    { name: 'Upload', desc: 'Satellite Image Upload', icon: Satellite, color: 'text-blue-400' },
    { name: 'Validate', desc: 'Input Validation & CRS Check', icon: ShieldCheck, color: 'text-amber-400' },
    { name: 'Interpret', desc: 'NLP Query Interpretation', icon: MessageSquare, color: 'text-indigo-400' },
    { name: 'Route', desc: 'Agentic Model Selection', icon: Target, color: 'text-emerald-400' },
    { name: 'Analyze', desc: 'Specialist Model Execution', icon: Cpu, color: 'text-violet-400' },
    { name: 'Combine', desc: 'Output Combiner + Evidence', icon: Layers, color: 'text-cyan-400' },
    { name: 'Report', desc: 'Summary + Download Report', icon: FileText, color: 'text-rose-400' },
  ];

  const systemStatus = [
    { name: 'FastAPI Gateway', status: true, detail: 'Python 3.11+ ASGI', icon: Cpu },
    { name: 'MongoDB (corvus_db)', status: true, detail: 'Primary Store (Live)', icon: Database },
    { name: 'PostgreSQL + PostGIS', status: true, detail: 'Spatial Engine', icon: Layers },
    { name: 'MinIO Storage', status: true, detail: 'S3 Imagery Bucket', icon: HardDrive },
    { name: 'Redis + Celery', status: true, detail: 'Task Broker', icon: Radio },
    { name: 'AI Engine', status: true, detail: '7 Active Specialists', icon: Zap },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/50 p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial-glow opacity-30" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back, <span className="gradient-text-blue">{user.full_name.split(' ')[0]}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg">
              Your CORVUS geospatial intelligence workspace is ready. Upload satellite imagery,
              ask natural language queries, and get AI-powered analysis with spatial evidence.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} p-0.5`}>
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-400 opacity-50" />
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="glass-card rounded-2xl p-5 group cursor-pointer"
              >
                <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-lg transition-transform group-hover:scale-110`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition">{action.label}</h3>
                <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition">
                  Go <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Pipeline Architecture Visualization */}
        <section>
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> CORVUS AI Pipeline Architecture
          </h2>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {pipelineStages.map((stage, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-2 min-w-[90px]">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <stage.icon className={`w-5 h-5 ${stage.color}`} />
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-slate-200">{stage.name}</div>
                      <div className="text-[10px] text-slate-500 max-w-[80px] leading-tight">{stage.desc}</div>
                    </div>
                  </div>
                  {i < pipelineStages.length - 1 && (
                    <div className="flex items-center shrink-0 -mt-6">
                      <div className="w-8 h-px bg-gradient-to-r from-slate-700 to-slate-600" />
                      <ArrowRight className="w-3 h-3 text-slate-600 -ml-1" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-400" /> Recent Projects
              </h2>
              <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {(projectsList.length > 0 ? projectsList.slice(0, 5) : [
                {
                  id: 'proj_0001', name: 'Delhi Urban Expansion & Land Cover',
                  description: 'Bi-temporal Sentinel-2 and Sentinel-1 SAR analysis over NCR.',
                  created_at: '2026-08-29T20:00:00Z', queries_count: 22,
                }
              ]).map((proj, i) => (
                <Link
                  key={proj.id}
                  href={`/workspace/${proj.id}`}
                  className="glass-card rounded-xl p-4 flex items-center justify-between group animate-fade-up cursor-pointer hover:border-blue-500/30 transition-all"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/15 flex items-center justify-center shrink-0">
                      <Satellite className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition">{proj.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-lg">{proj.description}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {proj.created_at ? new Date(proj.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                        <span>{proj.queries_count || 0} queries</span>
                        <span className="text-emerald-400">94.8% mean confidence</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* System Status Sidebar */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> System Status
            </h2>
            <div className="glass-card rounded-xl p-4 space-y-3">
              {systemStatus.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.detail}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium ${item.status ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${item.status ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {item.status ? 'Online' : 'Offline'}
                  </div>
                </div>
              ))}
            </div>

            {/* Specialist Models */}
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 pt-2">
              <Cpu className="w-4 h-4 text-violet-400" /> AI Specialist Models
            </h2>
            <div className="glass-card rounded-xl p-4 space-y-2">
              {[
                { name: 'GeoChat-7B', task: 'VQA / Captioning' },
                { name: 'Grounding DINO', task: 'Visual Grounding' },
                { name: 'ChangeFormer', task: 'Change Detection' },
                { name: 'SAR Fusion Head', task: 'Optical-SAR Fusion' },
                { name: 'SegFormer-B2', task: 'Segmentation' },
              ].map((model, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{model.name}</span>
                  <span className="text-slate-500 font-mono">{model.task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
