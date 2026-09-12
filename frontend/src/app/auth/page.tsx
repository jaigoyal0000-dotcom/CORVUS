'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Satellite, Shield, Zap, Layers, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginUser, registerUser, getUser, CorvusUser } from '@/lib/auth';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('analyst');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingUser, setExistingUser] = useState<CorvusUser | null>(null);

  useEffect(() => {
    setExistingUser(getUser());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
        await registerUser(email, password, fullName, role);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex relative overflow-hidden">
      {/* Animated Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-radial-glow opacity-40" />
      
      {/* Floating Satellite Elements */}
      <div className="absolute top-20 left-20 animate-float opacity-10">
        <Satellite className="w-16 h-16 text-blue-400" />
      </div>
      <div className="absolute bottom-32 right-32 animate-float opacity-10" style={{ animationDelay: '1s' }}>
        <Layers className="w-12 h-12 text-indigo-400" />
      </div>
      <div className="absolute top-40 right-40 animate-float opacity-10" style={{ animationDelay: '2s' }}>
        <Shield className="w-10 h-10 text-emerald-400" />
      </div>

      {/* Orbiting Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-blue-500/5 rounded-full animate-spin-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-indigo-500/5 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-12 relative z-10">
        <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30 animate-pulse-glow">
              <Eye className="w-12 h-12 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight gradient-text">CORVUS</h1>
              <p className="text-slate-400 text-sm font-medium">THE WATCHING CROW</p>
            </div>
          </div>

          <p className="text-base text-slate-200 leading-relaxed">
            AI-Powered Satellite & Aerial Intelligence Platform for geospatial analysis, 
            change detection, and visual question answering.
          </p>

          <div className="space-y-4">
            {[
              { icon: Satellite, text: 'Multi-modal satellite imagery analysis', color: 'text-blue-400' },
              { icon: Zap, text: 'Agentic AI with specialist model routing', color: 'text-amber-400' },
              { icon: Shield, text: 'Grounded answers — no hallucinated data', color: 'text-emerald-400' },
              { icon: Layers, text: 'GIS statistics with spatial evidence', color: 'text-indigo-400' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <feature.icon className={`w-5 h-5 ${feature.color} shrink-0`} />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-slate-400 font-mono">
            SIH 2026 | SIH26167 | SatQuery AI Platform
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Eye className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black gradient-text">CORVUS</h1>
              <p className="text-xs text-slate-400">THE WATCHING CROW</p>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-8 shadow-2xl shadow-black/30">
            {/* Active Session Card (if previously logged in) */}
            {existingUser && (
              <div className="mb-6 p-3.5 bg-blue-950/60 border border-blue-500/30 rounded-2xl flex items-center justify-between gap-3 animate-fade-up">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                    {existingUser.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] text-blue-300 font-medium">Active Session</p>
                    <p className="text-xs font-semibold text-white truncate">{existingUser.full_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shrink-0 shadow-md shadow-blue-600/30"
                >
                  Enter Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Tab Toggle */}
            <div className="flex bg-slate-900/80 rounded-xl p-1 mb-8">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  isLogin
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  !isLogin
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {isLogin
                ? 'Sign in to access your geospatial workspace'
                : 'Register to start analyzing satellite imagery'}
            </p>

            {/* Quick Demo Login Preset */}
            {isLogin && (
              <div className="mb-6 p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Quick Demo Preset</span>
                  <span className="text-[10px] text-blue-400 font-normal">Click to autofill</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setEmail('analyst@corvus.ai'); setPassword('AnalystPassword123!'); }}
                    className="px-2 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-medium text-blue-300 transition text-center"
                  >
                    Analyst
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('admin@corvus.ai'); setPassword('AdminPassword123!'); }}
                    className="px-2 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-xs font-medium text-purple-300 transition text-center"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('demo@corvus.ai'); setPassword('DemoPassword123!'); }}
                    className="px-2 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-300 transition text-center"
                  >
                    Operator
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setEmail('priya.sharma@isro.res.in'); setPassword('PriyaPassword123!'); }}
                    className="px-2 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-300 transition text-center truncate"
                    title="Dr. Priya Sharma (ISRO Scientist)"
                  >
                    ISRO Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('aarav.mehta@ndrf.gov.in'); setPassword('AaravPassword123!'); }}
                    className="px-2 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-xs font-medium text-rose-300 transition text-center truncate"
                    title="Cmdr. Aarav Mehta (NDRF Commander)"
                  >
                    NDRF Cmdr
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('sarah.chen@esa.int'); setPassword('SarahPassword123!'); }}
                    className="px-2 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg text-xs font-medium text-cyan-300 transition text-center truncate"
                    title="Sarah Chen (ESA Copernicus)"
                  >
                    Copernicus
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-medium animate-fade-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="animate-fade-up">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jay Goyal"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition placeholder:text-slate-600"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@corvus.ai"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition placeholder:text-slate-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition pr-12 placeholder:text-slate-600"
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="animate-fade-up">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="analyst">Geospatial Analyst</option>
                    <option value="researcher">Research Scientist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In to CORVUS' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-6">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                {isLogin ? 'Register here' : 'Sign in'}
              </button>
            </p>
          </div>

          <p className="text-center text-[11px] text-slate-600 mt-6 font-mono">
            CORVUS v1.0 • SIH 2026 • Secured with HMAC-SHA256 JWT
          </p>
        </div>
      </div>
    </div>
  );
}
