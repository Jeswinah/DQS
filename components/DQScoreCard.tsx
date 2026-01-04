import React from 'react';

interface Props {
  score: number;
  confidence: number;
  timestamp: string;
}

const getScoreStyle = (score: number) => {
  if (score >= 80) return { bg: '#10b981', text: '#fff', label: 'Excellent' };
  if (score >= 50) return { bg: '#f59e0b', text: '#1e293b', label: 'Needs Improvement' };
  return { bg: '#ef4444', text: '#fff', label: 'Critical' };
};

export const DQScoreCard: React.FC<Props> = ({ score, confidence, timestamp }) => {
  const style = getScoreStyle(score);

  return (
    <section
      className="card rounded-xl p-6 shadow"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#1e293b' }}>
            Overall Data Quality Score
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            Composite DQS (0–100) · AI-generated
          </p>
        </div>

        <div
          className="flex items-center gap-5 rounded-xl px-6 py-4"
          style={{ background: style.bg, color: style.text }}
        >
          <div className="text-center">
            <div className="text-5xl font-extrabold tabular-nums">{Math.round(score)}</div>
            <div className="mt-1 text-xs font-medium opacity-90">{style.label}</div>
          </div>
          <div className="border-l pl-4 text-right text-xs" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
            <div className="font-medium">Confidence</div>
            <div className="text-lg font-bold">{Math.round(confidence)}%</div>
            <div className="mt-1 opacity-80">{timestamp}</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm" style={{ color: '#475569' }}>
        ℹ️ AI rationale and impacted fields are detailed below.
      </p>
    </section>
  );
};

export default DQScoreCard;
