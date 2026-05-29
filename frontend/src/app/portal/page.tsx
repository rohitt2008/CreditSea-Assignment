'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { 
  FileText, Upload, Sliders, CheckCircle, Clock, XCircle, AlertCircle, 
  HelpCircle, LogOut, ChevronRight, Check, Award, FileSpreadsheet, User, Info, DollarSign, Calendar
} from 'lucide-react';

export default function BorrowerPortal() {
  const { user, logout, loading: authLoading } = useAuth();
  
  // Step tracking:
  // 1: Login (Completed)
  // 2: Personal Details
  // 3: Upload Salary Slip
  // 4: Loan Config & Apply
  // 5: Application Status / Tracker
  const [currentStep, setCurrentStep] = useState(2);
  const [appState, setAppState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Step 2 Form States
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [employmentMode, setEmploymentMode] = useState('Salaried');
  
  // Step 3 Upload States
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4 Slider States
  const [loanAmount, setLoanAmount] = useState(100000); // 100K default
  const [tenureDays, setTenureDays] = useState(90); // 90 days default
  
  // Action Feedback States
  const [errorMsg, setErrorMsg] = useState('');
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [breChecking, setBreChecking] = useState(false);
  const [brePassed, setBrePassed] = useState(false);
  
  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const data = await api.get('/borrower/application');
      if (data.application) {
        setAppState(data.application);
        const status = data.application.status;
        
        if (status === 'PRE_APPLIED') {
          // Determine which sub-step they are on based on existing fields
          if (data.application.salarySlipUrl) {
            setCurrentStep(4);
          } else if (data.application.personalDetails) {
            setCurrentStep(3);
          } else {
            setCurrentStep(2);
          }
          
          // Populate details
          if (data.application.personalDetails) {
            const p = data.application.personalDetails;
            setFullName(p.fullName || '');
            setPan(p.pan || '');
            if (p.dob) {
              setDob(new Date(p.dob).toISOString().split('T')[0]);
            }
            setMonthlySalary(String(p.monthlySalary || ''));
            setEmploymentMode(p.employmentMode || 'Salaried');
          }
        } else {
          // Already submitted, show status tracker (Step 5)
          setCurrentStep(5);
        }
      } else {
        // No application started yet
        setCurrentStep(2);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error fetching application status');
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 2 (Personal Details + BRE check)
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setBreErrors([]);
    setBreChecking(true);

    // Dynamic BRE Simulation Delay for premium micro-experience
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const res = await api.post('/borrower/application/personal', {
        fullName,
        pan: pan.toUpperCase(),
        dob,
        monthlySalary: Number(monthlySalary),
        employmentMode,
      });

      setAppState(res.application);
      setBrePassed(true);
      
      // Advance to upload after a brief success animation pause
      setTimeout(() => {
        setBrePassed(false);
        setCurrentStep(3);
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || 'Validation failed');
      if (err.message.includes('Business Rule Engine')) {
        // Extract errors if passed from server
        // Our server returns messages like "Validation failed" and errors array
        setBreErrors(err.message.split('\n'));
      }
    } finally {
      setBreChecking(false);
    }
  };

  // Trigger File Input Click
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Handle Drag-and-Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setUploadError('');
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    
    if (!allowed.includes(ext)) {
      setUploadError('Only PDF, JPG, JPEG, and PNG files are allowed');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds maximum size limit of 5 MB');
      return;
    }

    setFile(selectedFile);
  };

  // Submit Step 3 (Salary Slip upload)
  const handleUploadSubmit = async () => {
    if (!file) {
      setUploadError('Please select a file first');
      return;
    }

    setUploadError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('salarySlip', file);

    // Premium upload progress visual emulation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 90) clearInterval(interval);
    }, 150);

    try {
      const res = await api.postMultipart('/borrower/application/upload', formData);
      clearInterval(interval);
      setUploadProgress(100);
      setAppState(res.application);
      
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        setCurrentStep(4);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      setUploadError(err.message || 'File upload failed');
      setLoading(false);
    }
  };

  // Submit Step 4 (Loan Configuration & Apply)
  const handleApplySubmit = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.post('/borrower/application/apply', {
        loanAmount,
        tenureDays,
      });

      setAppState(res.application);
      setCurrentStep(5); // Go to Status tracker screen
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  // Calculations for Step 4
  const interestRate = 12; // 12% p.a.
  const simpleInterest = Math.round((loanAmount * interestRate * tenureDays) / (365 * 100));
  const totalRepayment = loanAmount + simpleInterest;

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen text-gray-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider">Syncing LendFlow Secure Portal...</span>
        </div>
      </div>
    );
  }

  // Stepper steps structure
  const steps = [
    { num: 1, label: 'Sign Up', state: 'complete' },
    { num: 2, label: 'Eligibility', state: currentStep > 2 ? 'complete' : currentStep === 2 ? 'active' : 'pending' },
    { num: 3, label: 'Salary Slip', state: currentStep > 3 ? 'complete' : currentStep === 3 ? 'active' : 'pending' },
    { num: 4, label: 'Configure', state: currentStep > 4 ? 'complete' : currentStep === 4 ? 'active' : 'pending' },
    { num: 5, label: 'Approval Status', state: currentStep === 5 ? 'active' : 'pending' },
  ];

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between py-6 px-6 relative max-w-6xl mx-auto w-full">
      {/* Background blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-pink-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-8 z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Lend<span className="text-blue-500 font-extrabold">Flow</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-2">
            Borrower Portal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <User className="h-4 w-4 text-blue-400" />
            <div className="text-xs text-left">
              <div className="text-gray-300 font-bold leading-tight">{user?.name}</div>
              <div className="text-[10px] text-gray-500 font-medium">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/25 text-gray-400 hover:text-rose-400 transition-all cursor-pointer active:scale-95"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Stepper display */}
      <div className="w-full max-w-4xl mx-auto mb-10 z-10">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-2 text-center flex-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                  s.state === 'complete' 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : s.state === 'active' 
                    ? 'bg-slate-900 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10 scale-105' 
                    : 'bg-slate-950 border-slate-800 text-gray-500'
                }`}>
                  {s.state === 'complete' ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className={`text-[10px] md:text-xs font-semibold tracking-wide ${
                  s.state === 'active' ? 'text-blue-400 font-bold' : s.state === 'complete' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-[1px] flex-1 mx-2 ${
                  s.state === 'complete' ? 'bg-blue-600' : 'bg-slate-800'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Primary Forms display panels */}
      <div className="flex-1 w-full max-w-3xl mx-auto z-10 mb-8">
        
        {/* Step 2: Personal Details Form */}
        {currentStep === 2 && (
          <div className="glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            
            {/* BRE Checking Overlay Animation */}
            {breChecking && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-25 text-gray-300 transition-all p-6">
                <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="font-bold text-lg text-white mb-2 tracking-tight">Business Rule Engine Audits</h3>
                <p className="text-gray-400 text-sm max-w-xs text-center leading-relaxed">
                  Verifying applicant age metrics, salary tiers, PAN configurations, and employment records...
                </p>
                <div className="flex flex-col gap-2 mt-6 w-full max-w-xs text-xs text-gray-500 font-semibold uppercase">
                  <div className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span>PAN Pattern Check</span>
                    <span className="text-indigo-400 animate-pulse">Scanning...</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span>Age Range Audit</span>
                    <span className="text-indigo-400 animate-pulse">Evaluating...</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span>Salary Benchmark</span>
                    <span className="text-indigo-400 animate-pulse">Calculating...</span>
                  </div>
                </div>
              </div>
            )}

            {/* BRE Success Transition Banner */}
            {brePassed && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-25 text-gray-300 transition-all p-6 text-center">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="font-extrabold text-xl text-emerald-400 mb-2">BRE Verification Approved!</h3>
                <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                  All credit scoring heuristics and age guidelines validated. Advancing to upload salary document.
                </p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Step 2: Personal Details & Eligibility Heuristics
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Enter your KYC credentials to initiate the live Business Rule Engine (BRE) eligibility audit.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-sm text-rose-400 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                  <AlertCircle className="h-4.5 w-4.5" />
                  <span>BRE Validation Rejected</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-xs">
                  {breErrors.length > 0 ? (
                    breErrors.map((err, idx) => <li key={idx}>{err}</li>)
                  ) : (
                    <li>{errorMsg}</li>
                  )}
                </ul>
              </div>
            )}

            <form onSubmit={handlePersonalSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Full Name (KYC)</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="As on PAN Card"
                    />
                  </div>
                </div>

                {/* PAN Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">PAN Card Number</label>
                  <div className="relative">
                    <FileSpreadsheet className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm font-mono uppercase"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Monthly Salary */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Monthly Net Salary (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm text-gray-500 font-extrabold">₹</span>
                    <input
                      type="number"
                      required
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value)}
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="Min 25000"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Employment Classification</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Salaried', 'Self-Employed', 'Unemployed'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEmploymentMode(mode)}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                        employmentMode === mode
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-slate-950 border-slate-800 text-gray-400 hover:border-slate-700/60 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice Box */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 text-xs text-gray-400 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-300">Live Server-side Eligibility Guidelines:</span>
                  <p>
                    Age must reside strictly between 23 and 50. Net salary must be greater than or equal to ₹25,000 / month. Unemployed applicants and malformed PAN layouts will be filtered out instantly.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Validate and Check Rules
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Upload Salary Slip Form */}
        {currentStep === 3 && (
          <div className="glass-panel p-8 rounded-2xl shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-400" />
                Step 3: Document Verification (Salary Slip)
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Provide proof of employment net earnings. Accepted formats: PDF, JPG, PNG (Max 5MB).
              </p>
            </div>

            {uploadError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-sm text-rose-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleUploadAreaClick}
                className="border-2 border-dashed border-slate-800 hover:border-blue-500/40 rounded-2xl p-10 text-center cursor-pointer transition-all bg-slate-950/20 hover:bg-slate-950/50 flex flex-col items-center gap-4"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className="h-14 w-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-md">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm text-white font-bold">Drag and drop salary slip here</p>
                  <p className="text-xs text-gray-500 mt-1">or click to browse local files</p>
                </div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider bg-slate-900 border border-slate-800/80 px-3 py-1 rounded-full">
                  PDF, PNG, JPG &bull; UP TO 5MB
                </div>
              </div>

              {/* File Selected Row */}
              {file && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-white font-bold truncate">{file.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 cursor-pointer transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Progress Bar */}
              {uploadProgress > 0 && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-400">
                    <span>Uploading salary document...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 rounded-xl border border-slate-800 text-gray-400 hover:text-white hover:border-slate-700 text-sm font-bold transition-all cursor-pointer"
                >
                  Back to Details
                </button>
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={!file}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
                >
                  Upload & Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Loan Config & Apply Form */}
        {currentStep === 4 && (
          <div className="glass-panel p-8 rounded-2xl shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-400" />
                Step 4: Configure Loan Requirements
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Customize your required principal amount and repayment timeline using interactive sliders.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-sm text-rose-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-8">
              
              {/* Slider 1: Loan Amount */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Principal Amount
                  </label>
                  <span className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 font-mono">
                    ₹{loanAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={5000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-950 border border-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                  <span>₹50,000</span>
                  <span>₹5,00,000 (Max Limit)</span>
                </div>
              </div>

              {/* Slider 2: Tenure Days */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Repayment Tenure
                  </label>
                  <span className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 font-mono">
                    {tenureDays} Days
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={365}
                  step={1}
                  value={tenureDays}
                  onChange={(e) => setTenureDays(Number(e.target.value))}
                  className="w-full h-2 bg-slate-950 border border-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                  <span>30 Days</span>
                  <span>365 Days (1 Year)</span>
                </div>
              </div>

              {/* Interest Rate Note Box */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex justify-between items-center text-xs">
                <span className="text-gray-400 font-semibold flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-400" />
                  Fixed Annual Interest Rate:
                </span>
                <span className="font-extrabold text-blue-400 text-sm font-mono">12% p.a.</span>
              </div>

              {/* Real-time Calculation Panel */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/20 to-blue-950/20 border border-blue-500/10 grid grid-cols-3 gap-4 text-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/[0.01] pointer-events-none"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Principal (P)</span>
                  <span className="text-sm font-bold text-white font-mono">₹{loanAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col gap-1 border-x border-slate-800/80">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Simple Interest (SI)</span>
                  <span className="text-sm font-extrabold text-indigo-400 font-mono">₹{simpleInterest.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total Repayment</span>
                  <span className="text-sm font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400">
                    ₹{totalRepayment.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-3 rounded-xl border border-slate-800 text-gray-400 hover:text-white hover:border-slate-700 text-sm font-bold transition-all cursor-pointer"
                >
                  Back to Upload
                </button>
                <button
                  type="button"
                  onClick={handleApplySubmit}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                >
                  Submit Application
                  <Check className="h-4.5 w-4.5" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Step 5: Application Status / Live Tracker Screen */}
        {currentStep === 5 && appState && (
          <div className="glass-panel p-8 rounded-2xl shadow-2xl text-center space-y-8">
            
            {/* Status Header Indicator */}
            <div>
              {appState.status === 'APPLIED' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-float">
                    <Clock className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Application Submitted Successfully</h2>
                  <p className="text-gray-400 text-xs max-w-sm leading-relaxed mx-auto">
                    Your loan application ID is <code className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-blue-300 text-[10px]">{appState._id}</code>. Our internal executives are currently auditing details.
                  </p>
                </div>
              )}

              {appState.status === 'SANCTIONED' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-float">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-emerald-400 tracking-tight">Loan Approved & Sanctioned!</h2>
                  <p className="text-gray-400 text-xs max-w-sm leading-relaxed mx-auto">
                    Excellent! The sanction executive has approved your request. Pending disbursement and fund release.
                  </p>
                </div>
              )}

              {appState.status === 'REJECTED' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse">
                    <XCircle className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-rose-400 tracking-tight">Application Declined</h2>
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-rose-300 max-w-md text-left space-y-1 mx-auto">
                    <span className="font-bold flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Rejection Audit Remarks:</span>
                    <p>{appState.rejectionReason || 'Heuristic rules mismatch in secondary evaluation.'}</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="mt-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-blue-500/30 text-xs text-blue-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    Re-Apply (Edit KYC Details)
                  </button>
                </div>
              )}

              {appState.status === 'DISBURSED' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-float">
                    <DollarSign className="h-8 w-8 animate-bounce" />
                  </div>
                  <h2 className="text-xl font-bold text-emerald-400 tracking-tight">Funds Released & Active</h2>
                  <p className="text-gray-400 text-xs max-w-sm leading-relaxed mx-auto">
                    Funds have been successfully disbursed to your bank. Pay off outstanding balances before deadline.
                  </p>
                </div>
              )}

              {appState.status === 'CLOSED' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-float">
                    <Check className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Loan Closed & Settled</h2>
                  <p className="text-gray-400 text-xs max-w-sm leading-relaxed mx-auto">
                    Thank you! Your total repayment of ₹{appState.totalRepayment?.toLocaleString('en-IN')} has been settled in full. No outstanding dues!
                  </p>
                </div>
              )}
            </div>

            {/* Pipeline Stage Tracker */}
            <div className="py-6 border-y border-slate-900 max-w-md mx-auto">
              <div className="flex justify-between items-center relative">
                {/* Connector line */}
                <div className="absolute left-0 right-0 top-3.5 h-[2px] bg-slate-800 z-0"></div>
                
                {['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'].map((st, idx) => {
                  const statusPriority = ['PRE_APPLIED', 'REJECTED', 'APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'];
                  const currentIdx = statusPriority.indexOf(appState.status);
                  const stepIdx = statusPriority.indexOf(st);
                  const isCompleted = currentIdx >= stepIdx && appState.status !== 'REJECTED';
                  const isActive = appState.status === st;

                  return (
                    <div key={st} className="flex flex-col items-center gap-2 z-10">
                      <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isCompleted 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : isActive 
                          ? 'bg-slate-900 border-blue-500 text-blue-400 shadow shadow-blue-500/20' 
                          : 'bg-slate-950 border-slate-800 text-gray-500'
                      }`}>
                        {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        isActive ? 'text-blue-400' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loan Metric Details Card */}
            <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-900 max-w-md mx-auto grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Loan Amount</span>
                <div className="text-sm font-extrabold text-white mt-0.5">₹{appState.loanAmount?.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Tenure Days</span>
                <div className="text-sm font-extrabold text-white mt-0.5">{appState.tenureDays} Days</div>
              </div>
              <div className="border-t border-slate-900/80 pt-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Interest Rate</span>
                <div className="text-sm font-extrabold text-blue-400 mt-0.5">{appState.interestRate}% p.a.</div>
              </div>
              <div className="border-t border-slate-900/80 pt-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Total Repayment</span>
                <div className="text-sm font-black text-white mt-0.5">₹{appState.totalRepayment?.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Refresh Sync Button */}
            <div className="pt-2">
              <button
                onClick={fetchApplication}
                className="px-6 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-gray-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
              >
                Refresh Sync Status
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Footer bar */}
      <footer className="w-full text-center text-xs text-gray-500 mt-8 py-4 border-t border-slate-900 z-10">
        &copy; {new Date().getFullYear()} LendFlow secure Borrower Panel &bull; Partner: CreditSea
      </footer>
    </div>
  );
}
