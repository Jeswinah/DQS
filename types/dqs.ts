export type Role = 'admin' | 'analyst' | 'auditor';

export interface DimensionScore {
  id: string;
  name: string;
  score: number; // 0-100
  explanation: string;
}

export interface Recommendation {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  expectedImprovement: number; // points
  action: string;
}

export interface ColumnStat {
  name: string;
  completeness: number;
  uniqueCount: number;
  dataType: string;
}

export interface DQSummary {
  score: number;
  confidence: number; // 0-100
  timestamp: string;
  dimensions: DimensionScore[];
  recommendations: Recommendation[];
  metadata: {
    records: number;
    columns: number;
    missingValues: number;
    anomalies: number;
    fileName?: string;
    duplicates?: number;
    columnStats?: ColumnStat[];
  };
  audit: {
    hash: string;
    evaluatedAt: string;
    policies: string[];
    modelVersion: string;
  };
}
