import React from 'react';
import { Recommendation } from '../types/dqs';

interface Props {
  items: Recommendation[];
}

const severityStyle = (s: Recommendation['severity']) => {
  if (s === 'High') return { bg: '#fee2e2', color: '#b91c1c' };
  if (s === 'Medium') return { bg: '#fef3c7', color: '#b45309' };
  return { bg: '#d1fae5', color: '#047857' };
};

/**
 * RecommendationsList: Ranked list of AI-generated recommendations.
 * Each shows severity, expected improvement, and action buttons.
 */
export const RecommendationsList: React.FC<Props> = ({ items }) => {
  return (
    <section
      className="card rounded-xl p-5 shadow"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >
      <h3 className="section-title">Actionable Recommendations</h3>
      <p className="mb-4 text-xs" style={{ color: '#64748b' }}>
        Ranked by expected impact
      </p>

      <div className="flex flex-col gap-3">
        {items.map((r, idx) => {
          const sev = severityStyle(r.severity);
          return (
            <div
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
              style={{ borderColor: '#e2e8f0', background: '#fafafa' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: '#1229D0', color: '#fff' }}
                >
                  {idx + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                    {r.title}
                  </div>
                  <div className="text-xs" style={{ color: '#64748b' }}>
                    Expected: <span className="font-medium text-emerald-600">+{r.expectedImprovement} pts</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: sev.bg, color: sev.color }}
                >
                  {r.severity}
                </span>
                <button
                  className="rounded px-2 py-1 text-xs font-medium transition hover:opacity-80"
                  style={{ background: '#1229D0', color: '#fff' }}
                >
                  Fix
                </button>
                <button
                  className="rounded border px-2 py-1 text-xs font-medium"
                  style={{ borderColor: '#cbd5e1', color: '#475569' }}
                >
                  Track
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecommendationsList;
