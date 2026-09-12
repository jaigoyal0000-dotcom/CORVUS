'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderPlus, Layers, ArrowRight, Calendar, PlusCircle, Search, Satellite, BarChart3, X
} from 'lucide-react';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import Navbar from '@/components/Navbar';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  queries_count: number;
  analyses: any[];
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'proj_0001',
      name: 'Delhi Urban Expansion & Land Cover',
      description: 'Bi-temporal Sentinel-2 and Sentinel-1 SAR analysis over National Capital Region (2024 - 2026).',
      created_at: '2026-08-29T20:00:00Z',
      queries_count: 14,
      analyses: [],
    },
    {
      id: 'proj_0002',
      name: 'Yamuna River Flood Risk Assessment',
      description: 'Multi-modal optical and SAR flood inundation mapping and water body extent tracking.',
      created_at: '2026-08-28T14:30:00Z',
      queries_count: 8,
      analyses: [],
    },
    {
      id: 'proj_0003',
      name: 'Industrial Infrastructure Monitoring',
      description: 'Open-vocabulary visual grounding and building mask extraction over industrial zones.',
      created_at: '2026-08-25T11:15:00Z',
      queries_count: 6,
      analyses: [],
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth');
      return;
    }
    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/projects');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setProjects(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc || 'Satellite intelligence analysis project.',
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setProjects([created, ...projects]);
        setShowCreateModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        router.push(`/workspace/${created.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your geospatial analysis projects and workspaces
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" /> New Project
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name or description..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-xl font-black text-white">{projects.length}</div>
            <div className="text-xs text-slate-400">Total Projects</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-xl font-black text-white">{projects.reduce((sum, p) => sum + p.queries_count, 0)}</div>
            <div className="text-xs text-slate-400">Total Queries</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-xl font-black text-emerald-400">Active</div>
            <div className="text-xs text-slate-400">System Status</div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj, i) => (
            <div
              key={proj.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase">
                    {proj.id}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(proj.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 leading-tight">{proj.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> {proj.queries_count} queries
                  </span>
                </div>
                <Link
                  href={`/workspace/${proj.id}`}
                  className="px-4 py-2 bg-slate-800/60 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-up">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-400" /> Create New Project
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Mumbai Coastal Development 2026"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Description</label>
              <textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Briefly describe the AOI and monitoring objectives..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
