'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { 
  Users, Award, DollarSign, Wallet, ShieldAlert, LogOut, Check, X, 
  Search, RefreshCw, Plus, Calendar, Hash, FileDown, CheckCircle2, ChevronRight, Ban
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  
  // Tab toggler for ADMIN role
  const [activeTab, setActiveTab] = useState<'sales' | 'sanction' | 'disbursement' | 'collection'>('sales');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Module Data States
  const [leads, setLeads] = useState<any[]>([]); // Sales
  const [appliedLoans, setAppliedLoans] = useState<any[]>([]); // Sanction
  const [sanctionedLoans, setSanctionedLoans] = useState<any[]>([]); // Disbursement
  const [collectionLedger, setCollectionLedger] = useState<any[]>([]); // Collection

  // Modal / Input Drawer States
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [paymentDrawerId, setPaymentDrawerId] = useState<string | null>(null);
  const [paymentTargetLoan, setPaymentTargetLoan] = useState<any | null>(null);
  const [utr, setUtr] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Set default tab based on role on load
  useEffect(() => {
    if (user) {
      if (user.role === 'Sales') setActiveTab('sales');
      else if (user.role === 'Sanction') setActiveTab('sanction');
      else if (user.role === 'Disbursement') setActiveTab('disbursement');
      else if (user.role === 'Collection') setActiveTab('collection');
      else if (user.role === 'Admin') setActiveTab('sales');
      
      refreshModuleData();
    }
  }, [user, activeTab]);

  const refreshModuleData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (user.role === 'Admin' || user.role === 'Sales') {
        if (activeTab === 'sales') {
          const res = await api.get('/executive/sales/leads');
          setLeads(res.leads);
        }
      }
      if (user.role === 'Admin' || user.role === 'Sanction') {
        if (activeTab === 'sanction') {
          const res = await api.get('/executive/sanction/loans');
          setAppliedLoans(res.loans);
        }
      }
      if (user.role === 'Admin' || user.role === 'Disbursement') {
        if (activeTab === 'disbursement') {
          const res = await api.get('/executive/disbursement/loans');
          setSanctionedLoans(res.loans);
        }
      }
      if (user.role === 'Admin' || user.role === 'Collection') {
        if (activeTab === 'collection') {
          const res = await api.get('/executive/collection/loans');
          setCollectionLedger(res.ledger);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error loading dashboard records');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // SANCTION EXECUTIVE ACTIONS
  // ------------------------------------------
  const handleApproveLoan = async (loanId: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/executive/sanction/loans/${loanId}/action`, {
        action: 'APPROVE'
      });
      setSuccessMsg(res.message);
      refreshModuleData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error approving application');
    }
  };

  const handleOpenRejectModal = (loanId: string) => {
    setRejectionModalId(loanId);
    setRejectionReason('');
  };

  const handleRejectLoan = async () => {
    if (!rejectionModalId || !rejectionReason.trim()) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/executive/sanction/loans/${rejectionModalId}/action`, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim(),
      });
      setSuccessMsg(res.message);
      setRejectionModalId(null);
      refreshModuleData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rejecting application');
    }
  };

  // ------------------------------------------
  // DISBURSEMENT EXECUTIVE ACTIONS
  // ------------------------------------------
  const handleDisburseLoan = async (loanId: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/executive/disbursement/loans/${loanId}/disburse`);
      setSuccessMsg(res.message);
      refreshModuleData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error releasing funds');
    }
  };

  // ------------------------------------------
  // COLLECTION EXECUTIVE ACTIONS
  // ------------------------------------------
  const handleOpenPaymentDrawer = (ledgerItem: any) => {
    setPaymentTargetLoan(ledgerItem.loan);
    setPaymentDrawerId(ledgerItem.loan._id);
    setUtr('');
    setPayAmount(String(ledgerItem.outstandingBalance));
    setErrorMsg('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDrawerId || !utr.trim() || !payAmount) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/executive/collection/loans/${paymentDrawerId}/payment`, {
        utr: utr.trim().toUpperCase(),
        amount: Number(payAmount),
        date: payDate,
      });
      setSuccessMsg(res.message);
      setPaymentDrawerId(null);
      refreshModuleData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording payment');
    }
  };

  // Check RBAC Permissions
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen text-gray-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider">Syncing Secure Ledger Dashboard...</span>
        </div>
      </div>
    );
  }

  // Double Check client-side permission
  if (user && user.role === 'Borrower') {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center py-12 px-6">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto animate-pulse" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Access Denied</h2>
          <p className="text-gray-400 text-xs leading-relaxed">
            Borrower credentials are not authorized to view the Operations Dashboard. Please log in with an executive profile.
          </p>
          <button
            onClick={logout}
            className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-gray-300 hover:text-white"
          >
            Switch Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between py-6 px-6 relative w-full">
      {/* Background radial glows */}
      <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      {/* Header bar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-4 mb-6 z-10 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/10">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Lend<span className="text-emerald-500 font-extrabold">Flow</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ml-2">
            Executive Panel: {user?.role}
          </span>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="text-xs text-left">
              <div className="text-gray-300 font-bold leading-tight">{user?.name}</div>
              <div className="text-[10px] text-gray-500 font-medium">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/25 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Admin Module Toggle Bar */}
      {user?.role === 'Admin' && (
        <div className="flex bg-slate-950 border border-slate-800/80 p-1 rounded-xl mb-6 max-w-2xl z-10 text-xs font-semibold gap-1">
          {[
            { id: 'sales', label: 'Sales Leads', count: leads.length },
            { id: 'sanction', label: 'Sanctions Review', count: appliedLoans.length },
            { id: 'disbursement', label: 'Disbursement Queue', count: sanctionedLoans.length },
            { id: 'collection', label: 'Collections Ledger', count: collectionLedger.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Feedback Alerts */}
      <div className="w-full z-10 mb-4 space-y-3">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Primary Dashboard Area */}
      <div className="flex-1 w-full z-10 mb-8">
        
        {/* ==========================================
            SALES LEADS MODULE PANEL
            ========================================== */}
        {activeTab === 'sales' && (user?.role === 'Admin' || user?.role === 'Sales') && (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-400" />
                  Sales Lead Tracking Module
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Registered borrower profiles who have not yet submitted a finalized loan application.
                </p>
              </div>
              <button
                onClick={refreshModuleData}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Refresh leads list"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-gray-500">Querying live leads list...</div>
            ) : leads.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-500">No pre-applied registered leads in system.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-gray-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Lead Name</th>
                      <th className="py-4 px-6">Email Address</th>
                      <th className="py-4 px-6">Registration Date</th>
                      <th className="py-4 px-6">KYC Form Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {leads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6 text-white font-bold">{lead.user.name}</td>
                        <td className="py-4 px-6 font-mono text-gray-300">{lead.user.email}</td>
                        <td className="py-4 px-6 text-gray-400">
                          {new Date(lead.registeredAt).toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            lead.status === 'PRE_APPLIED'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {lead.status === 'PRE_APPLIED' ? 'KYC In Progress (Step 3/4)' : 'Registered (Step 1)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            SANCTIONS EXECUTIVE MODULE PANEL
            ========================================== */}
        {activeTab === 'sanction' && (user?.role === 'Admin' || user?.role === 'Sanction') && (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  Sanction Underwriting Module
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Applications currently awaiting secondary review, credit assessment, and authorization decision.
                </p>
              </div>
              <button
                onClick={refreshModuleData}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Refresh sanction queue"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-gray-500">Querying live applications list...</div>
            ) : appliedLoans.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-500">No applications pending review in this queue.</div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {appliedLoans.map((loan) => (
                  <div key={loan._id} className="p-6 rounded-2xl bg-slate-950/65 border border-slate-800 hover:border-slate-700/60 shadow-lg transition-all flex flex-col justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border-bl border-slate-800 rounded-bl-xl">
                      Applied
                    </div>
                    {/* Top Segment: Borrower Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-white font-extrabold text-sm leading-snug">{loan.personalDetails.fullName}</h3>
                        <p className="text-gray-500 text-[10px] font-medium font-mono">{loan.borrower.email} &bull; ID: {loan._id}</p>
                      </div>

                      {/* Detail Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">PAN Card</span>
                          <div className="font-mono text-gray-300 mt-0.5">{loan.personalDetails.pan}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Monthly Salary</span>
                          <div className="text-gray-300 font-bold mt-0.5">₹{loan.personalDetails.monthlySalary?.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="border-t border-slate-800/80 pt-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Employment</span>
                          <div className="text-gray-300 font-medium mt-0.5">{loan.personalDetails.employmentMode}</div>
                        </div>
                        <div className="border-t border-slate-800/80 pt-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Date of Birth</span>
                          <div className="text-gray-300 font-medium mt-0.5">
                            {new Date(loan.personalDetails.dob).toLocaleDateString('en-IN', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Loan request metrics */}
                      <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Principal</span>
                          <span className="text-xs font-black text-white font-mono mt-0.5">₹{loan.loanAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col border-x border-slate-800">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Interest (12%)</span>
                          <span className="text-xs font-black text-indigo-400 font-mono mt-0.5">₹{loan.simpleInterest?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Total Repayment</span>
                          <span className="text-xs font-black text-white font-mono mt-0.5">₹{loan.totalRepayment?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Salary Slip Link */}
                      {loan.salarySlipUrl && (
                        <div className="pt-2">
                          <a
                            href={`${api.apiBaseUrl}${loan.salarySlipUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-gray-300 hover:text-white transition-all w-full justify-center"
                          >
                            <FileDown className="h-4 w-4 text-blue-400" />
                            View / Download Salary Slip Document
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Bottom Segment: Decision Buttons */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-900 pt-4">
                      <button
                        onClick={() => handleOpenRejectModal(loan._id)}
                        className="py-2.5 rounded-xl border border-slate-800 hover:border-rose-500/20 text-rose-400 hover:bg-rose-500/[0.02] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Ban className="h-4 w-4" />
                        Reject Application
                      </button>
                      <button
                        onClick={() => handleApproveLoan(loan._id)}
                        className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                      >
                        <Check className="h-4 w-4" />
                        Approve & Sanction
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            DISBURSEMENT EXECUTIVE MODULE PANEL
            ========================================== */}
        {activeTab === 'disbursement' && (user?.role === 'Admin' || user?.role === 'Disbursement') && (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  Disbursement Operations Module
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Sanctioned and authorized loans awaiting principal release and final payment triggers.
                </p>
              </div>
              <button
                onClick={refreshModuleData}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Refresh disbursement queue"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-gray-500">Querying live sanctions list...</div>
            ) : sanctionedLoans.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-500">No applications awaiting disbursement.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-gray-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Borrower</th>
                      <th className="py-4 px-6">Sanctioned Principal</th>
                      <th className="py-4 px-6">Tenure</th>
                      <th className="py-4 px-6">Total Repayment Amount</th>
                      <th className="py-4 px-6 text-center">Action Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sanctionedLoans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{loan.personalDetails?.fullName}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{loan.borrower.email}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-white font-bold">₹{loan.loanAmount?.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6 text-gray-300 font-medium">{loan.tenureDays} Days</td>
                        <td className="py-4 px-6 font-mono text-indigo-400 font-extrabold">₹{loan.totalRepayment?.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleDisburseLoan(loan._id)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto active:scale-95"
                          >
                            <Wallet className="h-4 w-4" />
                            Release Funds
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            COLLECTION EXECUTIVE MODULE PANEL
            ========================================== */}
        {activeTab === 'collection' && (user?.role === 'Admin' || user?.role === 'Collection') && (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-400" />
                  Active Collections & Repayment Ledger
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Active disbursed loans ledger tracking repayments, unique UTR codes, and outstanding balances.
                </p>
              </div>
              <button
                onClick={refreshModuleData}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Refresh collections ledger"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-gray-500">Querying live active ledger...</div>
            ) : collectionLedger.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-500">No active disbursed loans in repayment phase.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-gray-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Borrower</th>
                      <th className="py-4 px-6">Repayment Target</th>
                      <th className="py-4 px-6">Total Paid</th>
                      <th className="py-4 px-6">Outstanding Dues</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-center">Collection Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {collectionLedger.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{item.loan.personalDetails?.fullName}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.loan.borrower.email}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-gray-300 font-bold">₹{item.loan.totalRepayment?.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6 font-mono text-emerald-400 font-extrabold">₹{item.totalPaid?.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6 font-mono text-rose-400 font-black">₹{item.outstandingBalance?.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            item.loan.status === 'CLOSED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                          }`}>
                            {item.loan.status === 'CLOSED' ? 'CLOSED / SETTLED' : 'DISBURSED (ACTIVE)'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {item.loan.status === 'CLOSED' ? (
                            <span className="text-[10px] text-gray-500 font-bold uppercase">No Actions Needed</span>
                          ) : (
                            <button
                              onClick={() => handleOpenPaymentDrawer(item)}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/25 text-gray-300 hover:text-emerald-400 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto active:scale-95"
                            >
                              <Plus className="h-4 w-4" />
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ==========================================
          SANCTIONS: REJECTION REASON MODAL
          ========================================== */}
      {rejectionModalId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide text-rose-400">Rejection Audit Remark</h3>
              <button
                onClick={() => setRejectionModalId(null)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Please enter the underwriting rejection reasons. This description will be visible to the borrower instantly on their application portal.
            </p>
            <div className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="glass-input w-full p-3.5 rounded-xl text-xs outline-none"
                placeholder="Applicant monthly earnings fall below criteria or documents submitted are blurry..."
              ></textarea>
              <div className="flex justify-end gap-3 text-xs font-bold pt-2">
                <button
                  onClick={() => setRejectionModalId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectLoan}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          COLLECTIONS: RECORD PAYMENT MODAL DRAWER
          ========================================== */}
      {paymentDrawerId && paymentTargetLoan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide text-emerald-400">Record Borrower Repayment</h3>
              <button
                onClick={() => setPaymentDrawerId(null)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-gray-400 font-semibold">Target Account:</div>
              <div className="text-white font-bold text-sm">{paymentTargetLoan.personalDetails?.fullName}</div>
              <div className="text-gray-500 font-mono text-[10px]">{paymentTargetLoan.borrower.email}</div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
              {/* UTR Number */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">UTR / Txn Ref Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-mono uppercase"
                    placeholder="E.g. UTR123456789"
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-1">*Must be globally unique. No duplicates allowed.</p>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Repayment Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-xs text-gray-500 font-extrabold">₹</span>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-mono"
                    placeholder="Amount paid"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Transaction Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 text-xs font-bold pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setPaymentDrawerId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer className="w-full text-center text-xs text-gray-500 mt-8 py-4 border-t border-slate-900/60 z-10">
        &copy; {new Date().getFullYear()} LendFlow secure Operations Dashboard &bull; Partner: CreditSea
      </footer>
    </div>
  );
}
