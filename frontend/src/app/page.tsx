'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Landmark, Users, CheckCircle2, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      {/* Header navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Lend<span className="text-blue-500 font-extrabold">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-md shadow-blue-500/10"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center gap-16 z-10">
        
        {/* Left Side: Copywriting */}
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit mx-auto lg:mx-0">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Now Live: CreditSea Partner</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-white tracking-tight">
            Seamless Lending.<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-500">
              Smarter Decisioning.
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Welcome to LendFlow, the next-generation Loan Management System. An end-to-end platform for automated borrower applications, real-time Business Rule Engine evaluation, and high-performance risk dashboards.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Instant BRE Audits</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Automatic Repayments</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>RBAC Secured Ledger</span>
            </div>
          </div>
        </div>

        {/* Right Side: Dual Portal Cards */}
        <div className="flex-1 w-full max-w-md md:max-w-xl flex flex-col gap-6">
          
          {/* Card 1: Borrower Portal */}
          <Link href="/register" className="group">
            <div className="glass-card p-6 rounded-2xl flex items-start gap-5">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
                <Landmark className="h-6 w-6" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    Borrower Portal
                  </h3>
                  <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Apply for a personal loan, upload salary slips, and configure tenure options instantly. Experience real-time eligibility feedback backed by our rule engine.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Operations Dashboard */}
          <Link href="/login" className="group">
            <div className="glass-card p-6 rounded-2xl flex items-start gap-5">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Operations Dashboard
                  </h3>
                  <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-emerald-400 transform group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Role-based panel for internal teams. Track registration leads, review and sanction loan applications, authorize fund releases, and record outstanding collection schedules.
                </p>
              </div>
            </div>
          </Link>

          {/* Seed accounts notice */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 text-xs text-gray-400 leading-relaxed shadow-sm">
            <div className="flex items-center gap-2 mb-1 text-yellow-500 font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Evaluator Sandbox Enabled</span>
            </div>
            Testing accounts for all roles (Admin, Sales, Sanction, Disbursement, Collection) have been seeded automatically. Access credentials on the Login screen.
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-900/80 mt-12 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>&copy; {new Date().getFullYear()} LendFlow &bull; Powered by CreditSea Technology.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300">Terms of Use</a>
            <a href="#" className="hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300">API Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
