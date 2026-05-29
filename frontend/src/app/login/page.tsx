'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogIn, Mail, Lock, AlertCircle, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  // Seed account presets for evaluation convenience
  const seededAccounts = [
    { label: 'Admin', email: 'admin@lendflow.com', desc: 'All Modules' },
    { label: 'Sales', email: 'sales@lendflow.com', desc: 'Lead Tracking' },
    { label: 'Sanction', email: 'sanction@lendflow.com', desc: 'Approve / Reject' },
    { label: 'Disbursement', email: 'disbursement@lendflow.com', desc: 'Fund Release' },
    { label: 'Collection', email: 'collection@lendflow.com', desc: 'Payments Ledger' },
    { label: 'Borrower (Applied)', email: 'borrower2@lendflow.com', desc: 'View Stepper / Calc' },
  ];

  const handleQuickLogin = (emailStr: string) => {
    setEmail(emailStr);
    setPassword('Password123');
    setError('');
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col lg:flex-row items-center justify-center p-6 relative gap-12">
      {/* Background blurs */}
      <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[15%] right-[20%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      <div className="w-full max-w-md z-10 flex flex-col">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors self-start">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Brand */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Lend<span className="text-blue-500 font-extrabold">Flow</span>
          </span>
        </div>

        {/* Login form card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
            <p className="text-gray-400 text-sm mt-1">Sign in to your LendFlow account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-sm text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-blue-400 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-55 disabled:pointer-events-none"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Registration Redirect */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:underline font-medium">
              Create one now
            </Link>
          </div>
        </div>
      </div>

      {/* Seeding Quick Login Selector Box */}
      <div className="w-full max-w-sm z-10">
        <div className="glass-panel p-6 rounded-2xl border-dashed border-2 border-slate-700/50">
          <div className="flex items-center gap-2 mb-4 text-amber-400">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Evaluator Sandbox</h3>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed mb-4">
            Click on any profile below to pre-fill credentials instantly. All sandbox accounts use the password <code className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-200">Password123</code>.
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {seededAccounts.map((acc, index) => (
              <button
                key={index}
                onClick={() => handleQuickLogin(acc.email)}
                className="w-full text-left p-3 rounded-xl bg-slate-950/45 hover:bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      acc.label.startsWith('Borrower') 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                    }`}>
                      {acc.label}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold">{acc.desc}</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1 font-mono font-medium">{acc.email}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transform group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
