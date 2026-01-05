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

// API Response from webhook
export interface APIResponse {
  compositeDQS: number; // 0-100
  qualityGrade: string; // A, B, C, D, F
  dimensions: string[]; // Array of dimension data (can be empty)
  explanations: string[]; // Array of explanation strings
  recommendations: string[]; // Array of recommendation strings
  timestamp: string; // ISO 8601 format
  complianceStatus: string; // e.g., 'REQUIRES_REMEDIATION'
  evaluationId: string; // Unique evaluation identifier
  riskLevel: string; // HIGH, MEDIUM, LOW
  dataHandling: string; // Data handling policy description
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
  // New fields from API
  qualityGrade?: string;
  complianceStatus?: string;
  evaluationId?: string;
  riskLevel?: string;
  dataHandling?: string;
}
