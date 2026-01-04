import React from 'react';

interface Props {
  hash: string;
  evaluatedAt: string;
  policies: string[];
  modelVersion: string;
}

/**
 * CompliancePanel: Audit trail and governance metadata.
 * Read-only view suitable for auditors.
 */
export const CompliancePanel: React.FC<Props> = ({ hash, evaluatedAt, policies, modelVersion }) => {
  return (
    <section
      className="card rounded-xl p-5 shadow"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >
      <h3 className="section-title flex items-center gap-2">
        <span>🔐</span> Compliance & Audit
      </h3>

      <div className="mt-3 space-y-2 text-sm" style={{ color: '#334155' }}>
        <div>
          <span className="font-medium">Blockchain Hash:</span>{' '}
          <code
            className="ml-1 rounded px-2 py-0.5 text-xs"
            style={{ background: '#f1f5f9', color: '#475569' }}
          >
            {hash}
          </code>
        </div>
        <div>
          <span className="font-medium">Evaluated:</span> {new Date(evaluatedAt).toLocaleString()}
        </div>
        <div>
          <span className="font-medium">Model Version:</span> {modelVersion}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-medium" style={{ color: '#64748b' }}>
          Policy Rules Applied
        </div>
        <ul className="list-inside list-disc space-y-1 text-xs" style={{ color: '#475569' }}>
          {policies.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default CompliancePanel;
