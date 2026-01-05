"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar,
  AreaChart, Area,
  LineChart, Line, CartesianGrid,
  Legend
} from 'recharts';
import { 
  MdDashboard, 
  MdInsights, 
  MdTrendingUp, 
  MdLightbulb, 
  MdSecurity, 
  MdTableChart 
} from 'react-icons/md';
import { RecommendationsList } from '../../components/RecommendationsList';
import { CompliancePanel } from '../../components/CompliancePanel';
import { MetadataSummary } from '../../components/MetadataSummary';
import { getStoredDQIReport, type DQIReport } from '../../lib/dqiEngine';
import type { DQSummary, Role, DimensionScore } from '../../types/dqs';

// Generate explanations based on scores
function generateExplanation(dimension: string, score: number): string {
  const explanations: Record<string, (s: number) => string> = {
    completeness: (s) => s >= 80 
      ? `Excellent data completeness at ${s}%. Only ${100-s}% of values are missing across the dataset.`
      : s >= 50 
        ? `Data completeness is at ${s}%. Consider addressing the ${100-s}% missing values to improve data quality.`
        : `Critical: ${100-s}% of data is missing. Immediate action required to fill in mandatory fields.`,
    accuracy: (s) => s >= 80
      ? `High accuracy: ${s}% of values conform to expected formats and business rules.`
      : s >= 50
        ? `${100-s}% of values have accuracy issues. Review data type consistency and format validation.`
        : `Low accuracy detected. Many values do not conform to expected formats.`,
    consistency: (s) => s >= 80
      ? `Strong consistency at ${s}%. Cross-field validation shows good data coherence.`
      : `Consistency issues detected. ${100-s}% of records have conflicting or mismatched values.`,
    timeliness: (s) => s >= 80
      ? `Excellent timeliness. Data freshness meets SLA requirements.`
      : s >= 50
        ? `Timeliness score of ${s}% indicates some data latency. Consider reviewing ingestion pipelines.`
        : `Critical timeliness issues. Data is significantly outdated.`,
    uniqueness: (s) => s >= 90
      ? `High uniqueness at ${s}%. Very few duplicate records detected.`
      : s >= 70
        ? `${100-s}% potential duplicates found. Review deduplication strategy.`
        : `Significant duplication detected. ${100-s}% of records may be duplicates.`,
    validity: (s) => s >= 80
      ? `${s}% of values pass validity checks against business rules and constraints.`
      : `${100-s}% of values fail validity checks. Review data against business rules.`,
    integrity: (s) => s >= 80
      ? `Strong referential integrity at ${s}%. Foreign key relationships are well maintained.`
      : `Integrity issues detected. ${100-s}% of records have referential integrity problems.`,
  };
  return explanations[dimension]?.(score) || `Score: ${score}%`;
}

// Convert DQI Report to DQSummary format for dashboard display
function convertDQIReportToSummary(report: DQIReport): DQSummary {
  // Convert dimensions from DQI format to dashboard format
  const dimensions: DimensionScore[] = report.dimensions
    .filter(d => d.applicable)
    .map(d => {
      const explanation = report.explanations.find(e => e.dimension === d.name);
      return {
        id: d.id,
        name: d.name,
        score: d.score,
        explanation: explanation?.summary || `${d.name} score: ${d.score}%`,
      };
    });

  // Convert recommendations
  const recommendations = report.recommendations.map(r => ({
    id: r.id,
    title: r.title,
    severity: r.priority === 'Critical' ? 'High' as const : r.priority as 'High' | 'Medium' | 'Low',
    expectedImprovement: r.expectedImprovement,
    action: r.remediation.split('.')[0] || 'Review',
  }));

  // Extract column stats from schema
  const columnStats = report.datasetMetadata.schema.map(col => ({
    name: col.name,
    completeness: Math.round((1 - col.nullRatio) * 100),
    uniqueCount: Math.round(col.uniqueRatio * report.datasetMetadata.rowCount),
    dataType: col.inferredType,
  }));

  return {
    score: report.compositeDQS.score,
    confidence: report.compositeDQS.confidence,
    timestamp: new Date(report.datasetMetadata.analyzedAt).toLocaleString(),
    dimensions,
    recommendations,
    metadata: {
      records: report.datasetMetadata.rowCount,
      columns: report.datasetMetadata.columnCount,
      missingValues: report.datasetMetadata.statisticalSummary.nullCells,
      anomalies: report.datasetMetadata.statisticalSummary.anomalyCount,
      fileName: report.datasetMetadata.fileName,
      duplicates: report.datasetMetadata.statisticalSummary.duplicateRows,
      columnStats,
    },
    audit: {
      hash: '0x' + report.datasetMetadata.dataHash.substring(0, 40),
      evaluatedAt: report.auditTrail.timestamp,
      policies: ['Data Completeness Policy', 'Format Validation Rules', 'Duplicate Detection Policy', 'Privacy Protection Policy'],
      modelVersion: report.auditTrail.engineVersion,
    },
    qualityGrade: report.compositeDQS.grade,
    complianceStatus: report.complianceStatus,
    evaluationId: report.auditTrail.evaluationId,
    riskLevel: report.overallRiskSummary.split(':')[0].trim(),
    dataHandling: 'Privacy-preserving: No raw data stored. Metadata-only analysis.',
  };
}

const COLORS = {
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  pink: '#ec4899',
};

const getScoreColor = (score: number) => {
  if (score >= 80) return COLORS.green;
  if (score >= 50) return COLORS.amber;
  return COLORS.red;
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 50) return 'Needs Improvement';
  return 'Critical';
};

// Individual dimension chart components
const CompletnessPieChart: React.FC<{ score: number }> = ({ score }) => {
  const data = [
    { name: 'Complete', value: score },
    { name: 'Missing', value: 100 - score },
  ];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={65}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          <Cell fill={getScoreColor(score)} />
          <Cell fill="#e2e8f0" />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const AccuracyBarChart: React.FC<{ score: number }> = ({ score }) => {
  const data = [
    { name: 'Valid', value: score },
    { name: 'Invalid', value: 100 - score },
  ];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          <Cell fill={COLORS.blue} />
          <Cell fill="#fca5a5" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const ConsistencyRadialChart: React.FC<{ score: number }> = ({ score }) => {
  const data = [{ name: 'Consistency', value: score, fill: COLORS.purple }];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data} startAngle={180} endAngle={0}>
        <RadialBar background dataKey="value" cornerRadius={10} />
        <Tooltip />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

const TimelinessAreaChart: React.FC<{ score: number }> = ({ score }) => {
  const data = [
    { time: 'Week 1', latency: 100 - score + 5 },
    { time: 'Week 2', latency: 100 - score + 10 },
    { time: 'Week 3', latency: 100 - score },
    { time: 'Week 4', latency: 100 - score - 5 },
  ];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Area type="monotone" dataKey="latency" stroke={COLORS.amber} fill="#fef3c7" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const UniquenessDonutChart: React.FC<{ score: number }> = ({ score }) => {
  const data = [
    { name: 'Unique', value: score },
    { name: 'Duplicate', value: 100 - score },
  ];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={60}
          dataKey="value"
          paddingAngle={3}
        >
          <Cell fill={COLORS.green} />
          <Cell fill="#fecaca" />
        </Pie>
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const ValidityGaugeChart: React.FC<{ score: number }> = ({ score }) => {
  const data = [{ name: 'Validity', value: score, fill: COLORS.indigo }];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadialBarChart cx="50%" cy="80%" innerRadius="80%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
        <RadialBar background dataKey="value" cornerRadius={5} />
        <Tooltip />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

const IntegrityLineChart: React.FC<{ score: number }> = ({ score }) => {
  const data = [
    { check: 'FK Check', pass: score },
    { check: 'Ref Check', pass: score + 5 },
    { check: 'Schema', pass: score + 10 },
    { check: 'Constraint', pass: score - 5 },
  ];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="check" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Line type="monotone" dataKey="pass" stroke={COLORS.pink} strokeWidth={3} dot={{ fill: COLORS.pink, r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Chart renderer for each dimension
const renderDimensionChart = (dim: DimensionScore) => {
  switch (dim.id) {
    case 'completeness': return <CompletnessPieChart score={dim.score} />;
    case 'accuracy': return <AccuracyBarChart score={dim.score} />;
    case 'consistency': return <ConsistencyRadialChart score={dim.score} />;
    case 'timeliness': return <TimelinessAreaChart score={dim.score} />;
    case 'uniqueness': return <UniquenessDonutChart score={dim.score} />;
    case 'validity': return <ValidityGaugeChart score={dim.score} />;
    case 'integrity': return <IntegrityLineChart score={dim.score} />;
    default: return null;
  }
};

const getChartType = (id: string) => {
  const types: Record<string, string> = {
    completeness: 'Donut Chart',
    accuracy: 'Bar Chart',
    consistency: 'Radial Chart',
    timeliness: 'Area Chart',
    uniqueness: 'Pie Chart',
    validity: 'Gauge Chart',
    integrity: 'Line Chart',
  };
  return types[id] || 'Chart';
};

// Trend data (will be based on current score)
const generateTrendData = (currentScore: number) => [
  { month: 'Sep 25', score: Math.max(40, currentScore - 13) },
  { month: 'Oct 25', score: Math.max(45, currentScore - 8) },
  { month: 'Nov 25', score: Math.max(50, currentScore - 5) },
  { month: 'Dec 25', score: Math.max(55, currentScore - 2) },
  { month: 'Jan 26', score: currentScore },
];

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = React.useState<Role>('analyst');
  const [selectedDim, setSelectedDim] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<string>('overview');
  const [summary, setSummary] = React.useState<DQSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Load DQI Report from localStorage
    const dqiReport = getStoredDQIReport();
    if (dqiReport) {
      setSummary(convertDQIReportToSummary(dqiReport));
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  // Redirect if no data
  if (!loading && !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f1f5f9' }}>
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
          <span className="mb-4 block text-4xl">📊</span>
          <h2 className="mb-2 text-xl font-bold" style={{ color: '#1e293b' }}>No Data Found</h2>
          <p className="mb-4 text-sm" style={{ color: '#64748b' }}>Please upload a file to analyze.</p>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg px-6 py-3 text-sm font-bold text-white"
            style={{ background: '#1229D0' }}
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f1f5f9' }}>
        <div className="text-center">
          <span className="mb-4 block animate-spin text-4xl">⏳</span>
          <p className="text-sm" style={{ color: '#64748b' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const trendData = generateTrendData(summary.score);
  const selectedDimData = summary.dimensions.find((d) => d.id === selectedDim);

  // Menu items for navigation
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: MdDashboard, description: 'Overall DQS Score' },
    { id: 'dimensions', label: 'Dimensions', icon: MdInsights, description: '7 Quality Metrics' },
    { id: 'trends', label: 'Trends', icon: MdTrendingUp, description: 'Historical Data' },
    { id: 'recommendations', label: 'Actions', icon: MdLightbulb, description: 'Recommendations' },
    { id: 'compliance', label: 'Compliance', icon: MdSecurity, description: 'Audit Trail' },
    { id: 'metadata', label: 'Metadata', icon: MdTableChart, description: 'Dataset Info' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-4 py-3 shadow-md sm:px-6 sm:py-4"
        style={{ background: 'linear-gradient(90deg, #1229D0, #1E40AF)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                <span style={{ color: '#f5a623' }}>DQS</span> Dashboard
              </h1>
              <p className="hidden text-xs text-slate-300 sm:block">
                Data Quality Analysis Results · {summary.timestamp}
              </p>
            </div>
            {/* Mobile score badge */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white sm:hidden"
              style={{ background: getScoreColor(summary.score) }}
            >
              {summary.score}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Outside flex container for proper full-width */}
      <div className="lg:hidden" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-2 overflow-x-auto px-4 py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
            {menuItems.map((item) => {
              if (item.id === 'compliance' && role === 'analyst') return null;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition sm:gap-2 sm:px-4 sm:text-sm ${
                    isActive ? 'text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  style={{ 
                    background: isActive ? '#1229D0' : '#f8fafc',
                    border: isActive ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <item.icon className="text-base sm:text-lg" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Sidebar Menu - Desktop only */}
        <aside
          className="sticky top-20 hidden h-fit w-64 shrink-0 p-4 lg:block"
          style={{ background: '#fff', borderRadius: '0 0 16px 0' }}
        >
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              // Hide compliance for analyst
              if (item.id === 'compliance' && role === 'analyst') return null;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                    isActive
                      ? 'shadow-md'
                      : 'hover:bg-slate-50'
                  }`}
                  style={{
                    background: isActive ? 'linear-gradient(90deg, #1229D0, #1E40AF)' : 'transparent',
                    color: isActive ? '#fff' : '#334155',
                  }}
                >
                  <item.icon className="text-xl" />
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className={`text-xs ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Score Display */}
          <div
            className="mt-6 rounded-xl p-4 text-center"
            style={{ background: getScoreColor(summary.score) }}
          >
            <div className="text-3xl font-extrabold text-white">{summary.score}</div>
            <div className="text-xs font-medium text-white/80">Overall DQS</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <section className="space-y-4 sm:space-y-6">
              <div
                className="rounded-2xl p-4 shadow-lg sm:p-8"
                style={{ background: '#fff' }}
              >
                <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:justify-between">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold sm:text-2xl" style={{ color: '#1e293b' }}>
                      Overall Data Quality Score
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: '#64748b' }}>
                      Composite score across all 7 dimensions
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                    <div
                      className="flex h-28 w-28 flex-col items-center justify-center rounded-full shadow-xl sm:h-36 sm:w-36"
                      style={{ background: getScoreColor(summary.score) }}
                    >
                      <div className="text-4xl font-extrabold text-white sm:text-5xl">{summary.score}</div>
                      <div className="text-xs font-medium text-white/80 sm:text-sm">{getScoreLabel(summary.score)}</div>
                    </div>

                    <div className="text-center sm:text-right">
                      <div className="text-xs font-medium sm:text-sm" style={{ color: '#64748b' }}>Confidence</div>
                      <div className="text-3xl font-bold sm:text-4xl" style={{ color: '#1e293b' }}>{summary.confidence}%</div>
                      <div className="mt-1 text-xs sm:mt-2" style={{ color: '#94a3b8' }}>AI-Powered Analysis</div>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-4">
                  <div className="rounded-xl p-3 text-center sm:p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="text-lg font-bold sm:text-2xl" style={{ color: '#1e293b' }}>{summary.metadata.records.toLocaleString()}</div>
                    <div className="text-xs font-medium" style={{ color: '#64748b' }}>Records</div>
                  </div>
                  <div className="rounded-xl p-3 text-center sm:p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="text-lg font-bold sm:text-2xl" style={{ color: '#1e293b' }}>{summary.metadata.columns}</div>
                    <div className="text-xs font-medium" style={{ color: '#64748b' }}>Columns</div>
                  </div>
                  <div className="rounded-xl p-3 text-center sm:p-4" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
                    <div className="text-lg font-bold sm:text-2xl" style={{ color: '#92400e' }}>{summary.metadata.missingValues.toLocaleString()}</div>
                    <div className="text-xs font-medium" style={{ color: '#a16207' }}>Missing</div>
                  </div>
                  <div className="rounded-xl p-3 text-center sm:p-4" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
                    <div className="text-lg font-bold sm:text-2xl" style={{ color: '#b91c1c' }}>{summary.metadata.anomalies}</div>
                    <div className="text-xs font-medium" style={{ color: '#dc2626' }}>Anomalies</div>
                  </div>
                </div>

                {/* API Assessment Details */}
                {summary.qualityGrade && (
                  <div className="mt-6 rounded-xl p-4 sm:p-6" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '2px solid #fbbf24' }}>
                    <h3 className="mb-4 text-lg font-bold" style={{ color: '#78350f' }}>Assessment Details</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <div className="text-xs font-medium" style={{ color: '#92400e' }}>Quality Grade</div>
                        <div className="text-2xl font-extrabold" style={{ color: getScoreColor(summary.score) }}>{summary.qualityGrade}</div>
                      </div>
                      {summary.riskLevel && (
                        <div>
                          <div className="text-xs font-medium" style={{ color: '#92400e' }}>Risk Level</div>
                          <div className="text-lg font-bold" style={{ 
                            color: summary.riskLevel === 'HIGH' ? '#dc2626' : 
                                   summary.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981' 
                          }}>{summary.riskLevel}</div>
                        </div>
                      )}
                      {summary.complianceStatus && (
                        <div>
                          <div className="text-xs font-medium" style={{ color: '#92400e' }}>Compliance</div>
                          <div className="text-sm font-bold" style={{ color: '#78350f' }}>
                            {summary.complianceStatus.replace('_', ' ')}
                          </div>
                        </div>
                      )}
                      {summary.evaluationId && (
                        <div>
                          <div className="text-xs font-medium" style={{ color: '#92400e' }}>Evaluation ID</div>
                          <div className="text-sm font-mono font-bold" style={{ color: '#78350f' }}>#{summary.evaluationId}</div>
                        </div>
                      )}
                    </div>
                    {summary.dataHandling && (
                      <div className="mt-4 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                        <div className="text-xs font-medium" style={{ color: '#92400e' }}>Data Handling</div>
                        <div className="mt-1 text-xs" style={{ color: '#78350f' }}>{summary.dataHandling}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Dimensions Section */}
          {activeSection === 'dimensions' && (
            <section className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl" style={{ color: '#1e293b' }}>Dimension Analysis</h2>
                <p className="text-xs sm:text-sm" style={{ color: '#64748b' }}>Click any dimension to see AI explanation</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {summary.dimensions.map((dim) => (
                  <button
                    key={dim.id}
                    onClick={() => setSelectedDim(dim.id === selectedDim ? null : dim.id)}
                    className={`rounded-xl p-4 text-left shadow-lg transition hover:shadow-xl sm:rounded-2xl sm:p-6 ${
                      selectedDim === dim.id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    style={{ background: '#fff' }}
                  >
                    <div className="mb-2 flex items-center justify-between sm:mb-3">
                      <h4 className="text-base font-bold sm:text-lg" style={{ color: '#1e293b' }}>{dim.name}</h4>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold sm:px-3 sm:py-1 sm:text-sm"
                        style={{ background: getScoreColor(dim.score), color: '#fff' }}
                      >
                        {dim.score}%
                      </span>
                    </div>
                    <div className="mb-2 text-xs" style={{ color: '#94a3b8' }}>{getChartType(dim.id)}</div>
                    {renderDimensionChart(dim)}
                  </button>
                ))}
              </div>

              {/* AI Explanation */}
              {selectedDimData && (
                <div
                  className="rounded-xl p-4 shadow-lg sm:rounded-2xl sm:p-6"
                  style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}
                >
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-bold sm:mb-3 sm:text-xl" style={{ color: '#3730a3' }}>
                    <span>🤖</span> Why is {selectedDimData.name} at {selectedDimData.score}%?
                  </h3>
                  <p className="text-xs leading-relaxed sm:text-sm" style={{ color: '#4338ca' }}>
                    {selectedDimData.explanation}
                  </p>
                  <div className="mt-3 sm:mt-4">
                    <span className="text-xs font-medium" style={{ color: '#6366f1' }}>Impacted Fields:</span>
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                      {['kyc_address', 'transaction_date', 'merchant_id', 'amount'].map((f) => (
                        <span
                          key={f}
                          className="rounded-full px-2 py-0.5 text-xs font-medium sm:px-3 sm:py-1"
                          style={{ background: '#c7d2fe', color: '#3730a3' }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Trends Section */}
          {activeSection === 'trends' && (
            <section className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl" style={{ color: '#1e293b' }}>DQS Trends</h2>
                <p className="text-xs sm:text-sm" style={{ color: '#64748b' }}>Historical data quality scores over time</p>
              </div>

              <div className="rounded-xl p-4 shadow-lg sm:rounded-2xl sm:p-6" style={{ background: '#fff' }}>
                <h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg" style={{ color: '#1e293b' }}>Score Trend (Last 5 Months)</h3>
                <div style={{ height: 220 }} className="sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorScore2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1229D0" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#1229D0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} width={30} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#1229D0"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorScore2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend Insights */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-3">
                <div className="rounded-lg p-3 sm:rounded-xl sm:p-5" style={{ background: '#d1fae5' }}>
                  <div className="text-lg font-bold sm:text-2xl" style={{ color: '#047857' }}>+13 pts</div>
                  <div className="text-xs sm:text-sm" style={{ color: '#065f46' }}>Since Sep</div>
                </div>
                <div className="rounded-lg p-3 sm:rounded-xl sm:p-5" style={{ background: '#e0e7ff' }}>
                  <div className="text-lg font-bold sm:text-2xl" style={{ color: '#3730a3' }}>+2.6</div>
                  <div className="text-xs sm:text-sm" style={{ color: '#4338ca' }}>Monthly</div>
                </div>
                <div className="rounded-lg p-3 sm:rounded-xl sm:p-5" style={{ background: '#fef3c7' }}>
                  <div className="text-lg font-bold sm:text-2xl" style={{ color: '#92400e' }}>80</div>
                  <div className="text-xs sm:text-sm" style={{ color: '#a16207' }}>Q2 Target</div>
                </div>
              </div>
            </section>
          )}

          {/* Recommendations Section */}
          {activeSection === 'recommendations' && (
            <section className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl" style={{ color: '#1e293b' }}>Actionable Recommendations</h2>
                <p className="text-xs sm:text-sm" style={{ color: '#64748b' }}>AI-generated fixes ranked by impact</p>
              </div>
              <RecommendationsList items={summary.recommendations} />
            </section>
          )}

          {/* Compliance Section */}
          {activeSection === 'compliance' && (role === 'admin' || role === 'auditor') && (
            <section className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl" style={{ color: '#1e293b' }}>Compliance & Audit Trail</h2>
                <p className="text-xs sm:text-sm" style={{ color: '#64748b' }}>Blockchain-backed governance records</p>
              </div>
              <CompliancePanel
                hash={summary.audit.hash}
                evaluatedAt={summary.audit.evaluatedAt}
                policies={summary.audit.policies}
                modelVersion={summary.audit.modelVersion}
              />
            </section>
          )}

          {/* Metadata Section */}
          {activeSection === 'metadata' && (
            <section className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl" style={{ color: '#1e293b' }}>Dataset Metadata</h2>
                <p className="text-xs sm:text-sm" style={{ color: '#64748b' }}>High-level statistics from your uploaded file</p>
              </div>
              <MetadataSummary 
                records={summary.metadata.records}
                columns={summary.metadata.columns}
                missingValues={summary.metadata.missingValues}
                anomalies={summary.metadata.anomalies}
                fileName={summary.metadata.fileName}
                duplicates={summary.metadata.duplicates}
                columnStats={summary.metadata.columnStats}
              />
            </section>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-6 border-t px-4 py-4 text-center text-xs sm:mt-8 sm:py-6" style={{ color: '#94a3b8' }}>
        <span className="hidden sm:inline">Data Quality Scoring Platform · Powered by Agentic AI · Visa-Level Governance · No Raw Data Exposed</span>
        <span className="sm:hidden">DQS Platform · Agentic AI · Visa-Level Governance</span>
      </footer>
    </div>
  );
}
