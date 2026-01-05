"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { MdInsights, MdSecurity, MdSpeed, MdAutoAwesome } from 'react-icons/md';
import { analyzeDQI, storeDQIReport } from '../lib/dqiEngine';

/**
 * Landing Page: Secure Data Input Panel
 * Professional, minimal design focused on data governance
 * Privacy-first: All analysis happens client-side
 */
export default function Home() {
  const router = useRouter();
  const [sourceType, setSourceType] = React.useState('File');
  const [governanceAck, setGovernanceAck] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a file to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress('Extracting metadata from file...');

    try {
      // Client-side DQI analysis - no data leaves the browser
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress('Analyzing data quality dimensions...');
      
      const report = await analyzeDQI(selectedFile);
      
      setProgress('Generating recommendations...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProgress('Storing results locally...');
      storeDQIReport(report);
      
      setProgress('Redirecting to dashboard...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze file. Please ensure it is a valid CSV file.');
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  return (
    <div className="flex min-h-screen ">
      {/* Left Side - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background: '#1229D0',
        }}
      >
        {/* Logo and Title */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F7B600, #FFD700)' }}
            >
              <span className="text-3xl font-black" style={{ color: '#1229D0' }}>DQ</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Data Quality</div>
              <div className="text-xl font-light" style={{ color: '#F7B600' }}>Scoring Platform</div>
            </div>
          </div>
          
          {/* Hero Text */}
          <div className="mt-16">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Enterprise-Grade
              <br />
              <span style={{ color: '#F7B600' }}>Data Analytics</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              Unlock the power of your data with AI-driven quality scoring. 
              Get instant insights across 7 dimensions of data quality.
            </p>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(247, 182, 0, 0.2)' }}>
                <MdInsights className="text-xl" style={{ color: '#F7B600' }} />
              </div>
              <div>
                <div className="font-semibold text-white">7 Dimensions</div>
                <div className="text-sm text-white/60">Complete quality analysis</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(247, 182, 0, 0.2)' }}>
                <MdAutoAwesome className="text-xl" style={{ color: '#F7B600' }} />
              </div>
              <div>
                <div className="font-semibold text-white">AI-Powered</div>
                <div className="text-sm text-white/60">Agentic intelligence</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(247, 182, 0, 0.2)' }}>
                <MdSecurity className="text-xl" style={{ color: '#F7B600' }} />
              </div>
              <div>
                <div className="font-semibold text-white">Secure</div>
                <div className="text-sm text-white/60">Enterprise governance</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(247, 182, 0, 0.2)' }}>
                <MdSpeed className="text-xl" style={{ color: '#F7B600' }} />
              </div>
              <div>
                <div className="font-semibold text-white">Real-time</div>
                <div className="text-sm text-white/60">Instant scoring</div>
              </div>
            </div>
          </div>
        </div>

       
      </div>

      {/* Right Side - Form */}
      <div 
        className="flex w-full lg:w-1/2 flex-col items-center justify-center px-4 py-8 sm:p-8"
        style={{ background: '#f8fafc' }}
      >
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F7B600, #FFD700)' }}
            >
              <span className="text-2xl font-black" style={{ color: '#1229D0' }}>DQ</span>
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#1229D0' }}>
            Data Quality <span style={{ color: '#F7B600' }}>Scoring</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Enterprise-Grade Analytics
          </p>
        </div>

        {/* Main Card */}
        <div
          className="w-full max-w-md overflow-hidden rounded-2xl shadow-xl"
          style={{ background: '#fff' }}
        >
          {/* Card Header */}
          <div
            className="px-6  sm:px-8 sm:py-6"
            style={{ background: '#1229D0', borderBottom: '3px solid #F7B600' }}
          >
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Secure Data Input
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Upload your dataset for quality analysis
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Data Source Type */}
            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold" style={{ color: '#334155' }}>
                  Data Source
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full rounded-lg border-2 px-4 py-3 text-sm transition focus:outline-none focus:border-blue-300"
                  style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
                >
                  <option>File (CSV / Excel)</option>
                  <option>Database Table</option>
                  <option>API Endpoint</option>
                </select>
              </div>

              {/* File Upload */}
              {sourceType.startsWith('File') && (
                <div>
                  <label className="mb-2 block text-sm font-semibold" style={{ color: '#334155' }}>
                    Upload Dataset
                  </label>
                  <div
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition cursor-pointer hover:border-blue-400"
                    style={{ 
                      borderColor: selectedFile ? '#10b981' : '#cbd5e1', 
                      background: selectedFile ? '#f0fdf4' : '#fafafa'
                    }}
                  >
                    {selectedFile ? (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full mb-3" style={{ background: '#d1fae5' }}>
                          <span className="text-2xl">✓</span>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: '#166534' }}>{selectedFile.name}</p>
                        <p className="mt-1 text-xs" style={{ color: '#16a34a' }}>
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="mt-3 text-xs font-medium text-red-500 hover:underline"
                        >
                          Remove file
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full " style={{ background: '#e0e7ff' }}>
                          <span className="text-xl">📁</span>
                        </div>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="text-sm"
                        />
                        <p className=" text-xs" style={{ color: '#94a3b8' }}>
                          Supports CSV files
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg p-3" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
                  <p className="text-xs font-medium" style={{ color: '#b91c1c' }}>
                    ⚠️ {error}
                  </p>
                </div>
              )}

              {/* Governance Acknowledgement */}
              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl p-4 transition"
                style={{ background: governanceAck ? '#FFF8E1' : '#f8fafc', border: governanceAck ? '2px solid #F7B600' : '2px solid #e2e8f0' }}
              >
                <input
                  type="checkbox"
                  checked={governanceAck}
                  onChange={(e) => setGovernanceAck(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded accent-amber-500"
                />
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#1229D0' }}>
                    Governance Acknowledgement
                  </div>
                  <div className="text-xs leading-relaxed mt-1" style={{ color: '#475569' }}>
                    I confirm that data governance policies have been reviewed and this dataset complies with organizational standards.
                  </div>
                </div>
              </label>

              {/* Analyze Button */}
              <button
                disabled={!governanceAck || isAnalyzing || !selectedFile}
                onClick={handleAnalyze}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-base font-bold transition disabled:opacity-50 hover:opacity-90"
                style={{ 
                  background: governanceAck && selectedFile ? 'linear-gradient(90deg, #F7B600, #FFD700)' : '#94a3b8',
                  color: governanceAck && selectedFile ? '#1229D0' : '#fff',
                  boxShadow: governanceAck && selectedFile ? '0 4px 14px rgba(247, 182, 0, 0.4)' : 'none'
                }}
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin">⏳</span> {progress || 'Analyzing...'}
                  </>
                ) : (
                  <>
                    🔍 Analyze Data Quality
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card Footer */}
          <div 
            className="px-6 py-4 text-center text-xs sm:px-8" 
            style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#64748b' }}
          >
            🔒 Your data is processed securely · No raw data stored
          </div>
        </div>
      </div>
    </div>
  );
}
