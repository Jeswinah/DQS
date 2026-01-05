import React from 'react';
import { Role } from '../types/dqs';
import { analyzeDQI, storeDQIReport, type DQIReport } from '../lib/dqiEngine';

interface Props {
  role: Role;
  onAnalyze: (file: File | null, report?: DQIReport) => void;
}

/**
 * UploadPanel: Secure dataset input control.
 * Accepts CSV/Excel. No raw data stored - only metadata analyzed.
 * Privacy-preserving: All analysis happens client-side.
 */
export const UploadPanel: React.FC<Props> = ({ role, onAnalyze }) => {
  const [sourceType, setSourceType] = React.useState('File');
  const [governanceAck, setGovernanceAck] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisStatus, setAnalysisStatus] = React.useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setAnalysisStatus('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisStatus('Extracting metadata...');
    
    try {
      // Client-side DQI analysis - no data leaves the browser
      setAnalysisStatus('Analyzing data quality dimensions...');
      const report = await analyzeDQI(selectedFile);
      
      setAnalysisStatus('Generating recommendations...');
      
      // Store report in localStorage for dashboard
      storeDQIReport(report);
      
      console.log('DQI Report generated:', report);
      setAnalysisStatus('Analysis complete!');
      
      // Pass both file and report to parent
      onAnalyze(selectedFile, report);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisStatus('Analysis failed. Please check the file format.');
      alert('Failed to analyze file. Please ensure it is a valid CSV file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="card rounded-xl p-5 shadow" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <h3 className="section-title flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#1229D0' }} />
        Secure Data Input
      </h3>

      <div className="flex flex-col gap-4 text-sm" style={{ color: '#334155' }}>
        {/* Source type */}
        <div>
          <label className="mb-1 block font-medium">Data Source</label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            <option>File (CSV / Excel)</option>
            <option>Database Table</option>
            <option>API Endpoint</option>
          </select>
        </div>

        {/* File upload */}
        {sourceType.startsWith('File') && (
          <div>
            <label className="mb-1 block font-medium">Upload Dataset</label>
            <input
              aria-label="Upload dataset"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="w-full text-sm"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-slate-500">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
        )}

        {/* Sensitivity
        <div>
          <label className="mb-1 block font-medium">Sensitivity Level</label>
          <div className="flex gap-2">
            {['Low', 'Medium', 'High'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSensitivity(lvl)}
                className={`flex-1 rounded border px-3 py-1 text-xs font-medium transition ${
                  sensitivity === lvl ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div> */}

        {/* Governance acknowledgement */}
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={governanceAck}
            onChange={(e) => setGovernanceAck(e.target.checked)}
            className="mt-1"
          />
          <span>I confirm that governance policies have been reviewed and acknowledged.</span>
        </label>

        {/* Analysis status */}
        {analysisStatus && (
          <div className="text-xs text-center py-2" style={{ color: analysisStatus.includes('complete') ? '#10b981' : '#64748b' }}>
            {analysisStatus}
          </div>
        )}

        {/* Analyze button */}
        <button
          disabled={!governanceAck || !selectedFile || isAnalyzing}
          onClick={handleAnalyze}
          className="mt-1 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
          style={{ background: '#1229D0' }}
        >
          {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Data Quality'}
        </button>

        {/* Privacy notice */}
        <div className="text-xs text-center" style={{ color: '#94a3b8' }}>
          🔒 Privacy-first: All analysis happens locally in your browser.<br />
          No raw data is transmitted or stored.
        </div>

        <div className="text-xs" style={{ color: '#94a3b8' }}>
          Current role: <span className="font-medium">{role}</span>
        </div>
      </div>
    </section>
  );
};

export default UploadPanel;
