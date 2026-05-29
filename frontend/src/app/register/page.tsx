'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserPlus, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Borrower'); // Default role
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, role);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center py-12 px-6 relative">
      {/* Background blur circles */}
      <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      <div className="w-full max-w-md z-10">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Brand Logo */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Lend<span className="text-blue-500 font-extrabold">Flow</span>
          </span>
        </div>

        {/* Form panel */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
            <p className="text-gray-400 text-sm mt-1">Get started with your loan application</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-sm text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Password</label>
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

            {/* Sandbox Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Register as (Sandbox Option)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="glass-input w-full px-3.5 py-3 rounded-xl text-sm outline-none cursor-pointer"
              >
                <option value="Borrower" className="bg-slate-950 text-white">Borrower (Self-Apply)</option>
                <option value="Sales" className="bg-slate-950 text-white">Sales Executive (Leads)</option>
                <option value="Sanction" className="bg-slate-950 text-white">Sanction Executive (Approve)</option>
                <option value="Disbursement" className="bg-slate-950 text-white">Disbursement Executive (Release)</option>
                <option value="Collection" className="bg-slate-950 text-white">Collection Executive (Collect)</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-1">
                *Borrower is default. Other roles can also be chosen instantly for evaluation sandbox testing.
              </p>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-55 disabled:pointer-events-none"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Redirection */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
