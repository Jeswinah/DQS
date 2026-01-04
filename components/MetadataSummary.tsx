import React from 'react';

interface ColumnStat {
  name: string;
  completeness: number;
  uniqueCount: number;
  dataType: string;
}

interface Props {
  records: number;
  columns: number;
  missingValues: number;
  anomalies: number;
  fileName?: string;
  duplicates?: number;
  columnStats?: ColumnStat[];
}

/**
 * MetadataSummary: High-level dataset statistics.
 * No raw data exposed—only aggregate counts.
 */
export const MetadataSummary: React.FC<Props> = ({ 
  records, 
  columns, 
  missingValues, 
  anomalies,
  fileName,
  duplicates = 0,
  columnStats = []
}) => {
  const stats = [
    { label: 'Records', value: records.toLocaleString(), icon: '📄' },
    { label: 'Columns', value: columns, icon: '📊' },
    { label: 'Missing Values', value: missingValues.toLocaleString(), icon: '⚠️' },
    { label: 'Anomalies', value: anomalies, icon: '🔍' },
    { label: 'Duplicates', value: duplicates, icon: '📋' },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'number': return { bg: '#dbeafe', text: '#1e40af' };
      case 'date': return { bg: '#fef3c7', text: '#92400e' };
      case 'boolean': return { bg: '#d1fae5', text: '#047857' };
      case 'mixed': return { bg: '#fee2e2', text: '#b91c1c' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <section
      className="space-y-4"
    >
      {/* File Name */}
      {fileName && (
        <div
          className="rounded-xl p-4 shadow"
          style={{ background: '#fff', border: '1px solid #e2e8f0' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📁</span>
            <div>
              <div className="text-sm font-bold" style={{ color: '#1e293b' }}>{fileName}</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Analyzed File</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div
        className="rounded-xl p-5 shadow"
        style={{ background: '#fff', border: '1px solid #e2e8f0' }}
      >
        <h3 className="mb-3 text-sm font-bold" style={{ color: '#1e293b' }}>Dataset Statistics</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-3 text-center"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <div className="text-lg">{s.icon}</div>
              <div className="mt-1 text-xl font-bold" style={{ color: '#1e293b' }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: '#64748b' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column Statistics */}
      {columnStats.length > 0 && (
        <div
          className="rounded-xl p-5 shadow"
          style={{ background: '#fff', border: '1px solid #e2e8f0' }}
        >
          <h3 className="mb-3 text-sm font-bold" style={{ color: '#1e293b' }}>Column Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th className="py-2 text-left font-semibold" style={{ color: '#475569' }}>Column</th>
                  <th className="py-2 text-center font-semibold" style={{ color: '#475569' }}>Type</th>
                  <th className="py-2 text-center font-semibold" style={{ color: '#475569' }}>Completeness</th>
                  <th className="py-2 text-right font-semibold" style={{ color: '#475569' }}>Unique</th>
                </tr>
              </thead>
              <tbody>
                {columnStats.slice(0, 10).map((col, idx) => {
                  const typeColor = getTypeColor(col.dataType);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td className="py-2 font-medium" style={{ color: '#1e293b' }}>{col.name}</td>
                      <td className="py-2 text-center">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: typeColor.bg, color: typeColor.text }}
                        >
                          {col.dataType}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <div className="mx-auto flex items-center gap-2" style={{ maxWidth: 100 }}>
                          <div className="h-2 flex-1 rounded-full" style={{ background: '#e2e8f0' }}>
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${col.completeness}%`,
                                background: col.completeness >= 80 ? '#10b981' : col.completeness >= 50 ? '#f59e0b' : '#ef4444'
                              }}
                            />
                          </div>
                          <span className="text-xs" style={{ color: '#64748b' }}>{col.completeness}%</span>
                        </div>
                      </td>
                      <td className="py-2 text-right" style={{ color: '#64748b' }}>{col.uniqueCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {columnStats.length > 10 && (
              <p className="mt-2 text-xs" style={{ color: '#94a3b8' }}>
                Showing 10 of {columnStats.length} columns
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs" style={{ color: '#94a3b8' }}>
        No raw data exposed · Statistics only
      </p>
    </section>
  );
};

export default MetadataSummary;
