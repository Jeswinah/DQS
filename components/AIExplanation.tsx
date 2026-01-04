import React from 'react';

interface Props {
  title?: string;
  explanation: string;
  impactedFields?: string[];
}

/**
 * AIExplanation: Plain-language AI explanation panel.
 * Provides human-readable rationale and highlights impacted fields.
 */
export const AIExplanation: React.FC<Props> = ({
  title = 'Why this score?',
  explanation,
  impactedFields = [],
}) => {
  return (
    <section
      className="card rounded-xl p-5 shadow"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >
      <h3 className="section-title flex items-center gap-2">
        <span style={{ fontSize: '1.1rem' }}>🤖</span> {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: '#334155' }}>
        {explanation}
      </p>

      {impactedFields.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium" style={{ color: '#64748b' }}>
            Impacted Fields
          </div>
          <div className="flex flex-wrap gap-2">
            {impactedFields.map((f) => (
              <span
                key={f}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AIExplanation;
