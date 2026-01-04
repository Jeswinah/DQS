import React from 'react';
import { DimensionScore } from '../types/dqs';

interface Props {
  dimensions: DimensionScore[];
  onSelect?: (id: string) => void;
}

const barColor = (score: number) =>
  score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

/**
 * DimensionBreakdown: Horizontal bar chart for each quality dimension.
 * Clicking a dimension updates the AI explanation panel.
 */
export const DimensionBreakdown: React.FC<Props> = ({ dimensions, onSelect }) => {
  return (
    <section
      className="card rounded-xl p-5 shadow"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >
      <h3 className="section-title">Dimension-wise Quality Breakdown</h3>
      <p className="mb-4 text-xs" style={{ color: '#64748b' }}>
        Click a dimension to see AI explanation
      </p>
      <div className="flex flex-col gap-3">
        {dimensions.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect?.(d.id)}
            className="group flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition hover:shadow-md"
            style={{ borderColor: '#e2e8f0', background: '#fafafa' }}
          >
            <div className="w-32">
              <div className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                {d.name}
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: barColor(d.score) }}
              >
                {d.score}%
              </div>
            </div>
            <div className="flex-1">
              <div
                className="h-4 w-full overflow-hidden rounded-full"
                style={{ background: '#e2e8f0' }}
              >
                <div
                  className="h-4 rounded-full transition-all"
                  style={{ width: `${d.score}%`, background: barColor(d.score) }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default DimensionBreakdown;
