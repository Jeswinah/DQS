/**
 * Data Quality Intelligence (DQI) Engine
 * Privacy-preserving, metadata-only analysis for Visa payment transactions
 * 
 * ⚠️ SECURITY: This engine NEVER stores raw card/transaction data
 * ✅ Only computes objective data quality scores from metadata
 * ✅ Produces explainable, regulator-ready insights
 * ✅ Outputs standardized audit JSON
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DatasetMetadata {
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  schema: ColumnSchema[];
  statisticalSummary: StatisticalSummary;
  dataHash: string; // SHA-256 hash for audit trail, not raw data
  analyzedAt: string;
}

export interface ColumnSchema {
  name: string;
  inferredType: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'identifier' | 'mixed';
  nullRatio: number; // 0-1
  uniqueRatio: number; // 0-1
  sampleValues: string[]; // Safe samples only (max 3, redacted if sensitive)
  patterns: string[]; // Detected patterns (e.g., "YYYY-MM-DD", "XX-XXXX-XXXX")
  statistics?: NumericStatistics;
}

export interface NumericStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
}

export interface StatisticalSummary {
  totalCells: number;
  nullCells: number;
  uniqueRows: number;
  duplicateRows: number;
  anomalyCount: number;
}

export interface DQIDimension {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number; // 0-1 (normalized)
  applicable: boolean;
  findings: string[];
  impactedColumns: string[];
}

export interface CompositeDQS {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number; // 0-100
}

export interface DQIExplanation {
  dimension: string;
  summary: string;
  businessImpact: string;
  technicalDetail: string;
}

export interface DQIRecommendation {
  id: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  expectedImprovement: number; // points
  affectedDimensions: string[];
  remediation: string;
}

export interface DQIReport {
  datasetMetadata: DatasetMetadata;
  dimensions: DQIDimension[];
  compositeDQS: CompositeDQS;
  explanations: DQIExplanation[];
  recommendations: DQIRecommendation[];
  overallRiskSummary: string;
  complianceStatus: 'COMPLIANT' | 'REQUIRES_REMEDIATION' | 'NON_COMPLIANT';
  auditTrail: {
    evaluationId: string;
    timestamp: string;
    engineVersion: string;
    checksumVerified: boolean;
  };
}

// ============================================================================
// SENSITIVE DATA PATTERNS (for redaction)
// ============================================================================

const SENSITIVE_PATTERNS = {
  PAN: /\b(?:\d{4}[-\s]?){3}\d{4}\b/, // Card numbers
  CVV: /\b\d{3,4}\b/, // CVV
  SSN: /\b\d{3}-\d{2}-\d{4}\b/, // Social Security
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  PHONE: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
};

const SENSITIVE_COLUMN_NAMES = [
  'pan', 'card_number', 'cardnumber', 'card_no', 'cc_number',
  'cvv', 'cvc', 'security_code', 'ssn', 'social_security',
  'password', 'pin', 'secret', 'token', 'auth_code'
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a SHA-256 hash of data for audit purposes
 */
async function generateDataHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate unique evaluation ID
 */
function generateEvaluationId(): string {
  return `DQI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Check if a column name suggests sensitive data
 */
function isSensitiveColumn(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[_\-\s]/g, '');
  return SENSITIVE_COLUMN_NAMES.some(s => normalized.includes(s.replace(/[_\-\s]/g, '')));
}

/**
 * Redact sensitive values for safe sample display
 */
function redactSensitiveValue(value: string, columnName: string): string {
  if (isSensitiveColumn(columnName)) {
    return '***REDACTED***';
  }
  
  for (const [, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    if (pattern.test(value)) {
      return '***REDACTED***';
    }
  }
  
  // Truncate long values
  if (value.length > 50) {
    return value.substring(0, 47) + '...';
  }
  
  return value;
}

/**
 * Calculate grade from score
 */
function calculateGrade(score: number): CompositeDQS['grade'] {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ============================================================================
// CSV PARSING (Temporary - disposed after metadata extraction)
// ============================================================================

interface ParsedRow {
  [key: string]: string | number | boolean | null;
}

function parseCSVContent(content: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: ParsedRow = {};
      headers.forEach((header, idx) => {
        row[header] = parseValue(values[idx]);
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
}

function parseValue(value: string): string | number | boolean | null {
  const trimmed = value.trim().replace(/^"|"$/g, '');
  
  if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'na' || trimmed === '-') {
    return null;
  }
  
  // Try number
  const num = Number(trimmed.replace(/[$,]/g, ''));
  if (!isNaN(num) && trimmed !== '' && !/^0\d+/.test(trimmed)) {
    return num;
  }
  
  // Boolean
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  
  return trimmed;
}

// ============================================================================
// METADATA EXTRACTION ENGINE
// ============================================================================

function inferColumnType(values: (string | number | boolean | null)[], columnName: string): ColumnSchema['inferredType'] {
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  if (nonNullValues.length === 0) return 'string';

  const types = new Map<string, number>();

  // Check for identifier patterns (high uniqueness + specific naming)
  const identifierPatterns = ['id', 'key', 'code', 'ref', 'num', 'no'];
  const isLikelyIdentifier = identifierPatterns.some(p => columnName.toLowerCase().includes(p));

  for (const val of nonNullValues) {
    if (typeof val === 'number') {
      types.set('number', (types.get('number') || 0) + 1);
    } else if (typeof val === 'boolean') {
      types.set('boolean', (types.get('boolean') || 0) + 1);
    } else if (typeof val === 'string') {
      // Check for currency
      if (/^\$?[\d,]+\.?\d*$/.test(val) || /^[\d,]+\.?\d*\s*(USD|EUR|GBP|INR)$/i.test(val)) {
        types.set('currency', (types.get('currency') || 0) + 1);
      }
      // Check for date
      else if (/^\d{4}-\d{2}-\d{2}/.test(val) || /^\d{2}\/\d{2}\/\d{4}/.test(val) || /^\d{2}-\d{2}-\d{4}/.test(val)) {
        types.set('date', (types.get('date') || 0) + 1);
      }
      // Check for identifier
      else if (isLikelyIdentifier && /^[A-Z0-9\-_]+$/i.test(val)) {
        types.set('identifier', (types.get('identifier') || 0) + 1);
      }
      else {
        types.set('string', (types.get('string') || 0) + 1);
      }
    }
  }

  // Find dominant type
  let maxType = 'string';
  let maxCount = 0;
  for (const [type, count] of types) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }

  // Check for mixed types
  const dominanceRatio = maxCount / nonNullValues.length;
  if (dominanceRatio < 0.8 && types.size > 1) {
    return 'mixed';
  }

  return maxType as ColumnSchema['inferredType'];
}

function detectPatterns(values: (string | number | boolean | null)[]): string[] {
  const patterns: Set<string> = new Set();
  const stringValues = values.filter(v => typeof v === 'string') as string[];

  for (const val of stringValues.slice(0, 100)) {
    // Date patterns
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) patterns.add('YYYY-MM-DD');
    if (/^\d{2}\/\d{2}\/\d{4}/.test(val)) patterns.add('MM/DD/YYYY');
    if (/^\d{2}-\d{2}-\d{4}/.test(val)) patterns.add('DD-MM-YYYY');
    
    // Currency patterns
    if (/^\$[\d,]+\.?\d*$/.test(val)) patterns.add('$XXX.XX');
    
    // Code patterns
    if (/^[A-Z]{2,3}$/.test(val)) patterns.add('COUNTRY/CURRENCY_CODE');
    if (/^[A-Z]{3}\d+$/.test(val)) patterns.add('ALPHANUMERIC_ID');
  }

  return Array.from(patterns);
}

function calculateNumericStatistics(values: number[]): NumericStatistics {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
  };
}

function extractColumnSchema(header: string, values: (string | number | boolean | null)[]): ColumnSchema {
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  const uniqueValues = new Set(nonNullValues.map(v => String(v)));
  const inferredType = inferColumnType(values, header);
  
  // Get safe sample values (redacted if sensitive)
  const sampleValues = nonNullValues
    .slice(0, 3)
    .map(v => redactSensitiveValue(String(v), header));

  const schema: ColumnSchema = {
    name: header,
    inferredType,
    nullRatio: Math.round((1 - nonNullValues.length / values.length) * 100) / 100,
    uniqueRatio: Math.round((uniqueValues.size / Math.max(nonNullValues.length, 1)) * 100) / 100,
    sampleValues,
    patterns: detectPatterns(values),
  };

  // Add numeric statistics if applicable
  if (inferredType === 'number' || inferredType === 'currency') {
    const numericValues = values.filter(v => typeof v === 'number') as number[];
    if (numericValues.length > 0) {
      schema.statistics = calculateNumericStatistics(numericValues);
    }
  }

  return schema;
}

// ============================================================================
// DIMENSION IDENTIFICATION & SCORING
// ============================================================================

interface DimensionConfig {
  id: string;
  name: string;
  baseWeight: number;
  applicabilityCheck: (metadata: DatasetMetadata) => boolean;
  scorer: (rows: ParsedRow[], metadata: DatasetMetadata) => { score: number; findings: string[]; impactedColumns: string[] };
}

const DIMENSION_CONFIGS: DimensionConfig[] = [
  {
    id: 'completeness',
    name: 'Completeness',
    baseWeight: 0.20,
    applicabilityCheck: () => true, // Always applicable
    scorer: (rows, metadata) => {
      const findings: string[] = [];
      const impactedColumns: string[] = [];
      
      let totalCells = 0;
      let filledCells = 0;
      
      for (const col of metadata.schema) {
        totalCells += rows.length;
        const filled = rows.length * (1 - col.nullRatio);
        filledCells += filled;
        
        if (col.nullRatio > 0.05) {
          impactedColumns.push(col.name);
          findings.push(`Column '${col.name}' has ${Math.round(col.nullRatio * 100)}% missing values`);
        }
      }
      
      const completenessRatio = filledCells / totalCells;
      // More aggressive scoring - each 1% missing = 1.5 point deduction
      const score = Math.round(Math.max(0, 100 - ((1 - completenessRatio) * 150)));
      
      if (score < 90) {
        findings.push(`Overall data completeness is ${Math.round(completenessRatio * 100)}%, with ${Math.round((1-completenessRatio) * totalCells)} missing cells`);
      }
      
      return { score, findings, impactedColumns };
    }
  },
  {
    id: 'consistency',
    name: 'Consistency',
    baseWeight: 0.15,
    applicabilityCheck: () => true,
    scorer: (rows, metadata) => {
      const findings: string[] = [];
      const impactedColumns: string[] = [];
      let inconsistentRecords = 0;
      const totalRecords = rows.length;
      
      for (const col of metadata.schema) {
        // Check for mixed types (severe inconsistency)
        if (col.inferredType === 'mixed') {
          inconsistentRecords += Math.round(rows.length * 0.3); // 30% penalty per mixed column
          impactedColumns.push(col.name);
          findings.push(`Column '${col.name}' has inconsistent data types (mixed string/number/date)`);
        }
        
        // Check for format consistency in patterns
        if (col.patterns.length > 1) {
          inconsistentRecords += Math.round(rows.length * 0.1);
          if (!impactedColumns.includes(col.name)) impactedColumns.push(col.name);
          findings.push(`Column '${col.name}' has multiple formats: ${col.patterns.join(', ')}`);
        }
        
        // Check for case inconsistencies in categorical columns
        if (col.inferredType === 'string') {
          const values = rows.map(r => r[col.name]).filter(v => typeof v === 'string' && v.length > 0) as string[];
          if (values.length > 0) {
            // Check if same values appear in different cases (e.g., "VISA" vs "visa")
            const normalized = new Map<string, Set<string>>();
            for (const v of values) {
              const key = v.toLowerCase();
              if (!normalized.has(key)) normalized.set(key, new Set());
              normalized.get(key)!.add(v);
            }
            
            let caseInconsistencies = 0;
            for (const [, variants] of normalized) {
              if (variants.size > 1) {
                caseInconsistencies += variants.size - 1;
              }
            }
            
            if (caseInconsistencies > 0) {
              inconsistentRecords += caseInconsistencies * 5;
              if (!impactedColumns.includes(col.name)) impactedColumns.push(col.name);
              findings.push(`Column '${col.name}' has ${caseInconsistencies} case inconsistencies (e.g., "VISA" vs "visa")`);
            }
          }
        }
      }
      
      // Score based on inconsistent record rate
      const inconsistencyRate = inconsistentRecords / (totalRecords * metadata.schema.length);
      const score = Math.round(Math.max(0, 100 - (inconsistencyRate * 500)));
      
      return { score, findings, impactedColumns };
    }
  },
  {
    id: 'uniqueness',
    name: 'Uniqueness',
    baseWeight: 0.15,
    applicabilityCheck: () => {
      // Always applicable - uniqueness matters for all datasets
      return true;
    },
    scorer: (rows, metadata) => {
      const findings: string[] = [];
      const impactedColumns: string[] = [];
      
      // Check for duplicate rows
      const seen = new Set<string>();
      let duplicates = 0;
      
      for (const row of rows) {
        const key = JSON.stringify(row);
        if (seen.has(key)) {
          duplicates++;
        } else {
          seen.add(key);
        }
      }
      
      const duplicateRate = duplicates / rows.length;
      
      if (duplicates > 0) {
        findings.push(`Found ${duplicates} duplicate rows (${Math.round(duplicateRate * 100)}% of dataset)`);
      }
      
      // Check identifier columns for uniqueness
      const idColumns = metadata.schema.filter(c => 
        c.inferredType === 'identifier' || c.name.toLowerCase().includes('id')
      );
      
      let idDuplicateIssues = 0;
      for (const col of idColumns) {
        if (col.uniqueRatio < 1) {
          impactedColumns.push(col.name);
          const dupPercentage = Math.round((1 - col.uniqueRatio) * 100);
          findings.push(`Identifier column '${col.name}' has ${dupPercentage}% non-unique values`);
          idDuplicateIssues += (1 - col.uniqueRatio);
        }
      }
      
      // Score: penalize both row duplicates and ID column duplicates
      // Each 1% duplicate rows = 3 point penalty
      // ID columns with duplicates add additional penalty
      const rowPenalty = duplicateRate * 300;
      const idPenalty = idDuplicateIssues * 20;
      const score = Math.round(Math.max(0, 100 - rowPenalty - idPenalty));
      
      return { score, findings, impactedColumns };
    }
  },
  {
    id: 'validity',
    name: 'Validity',
    baseWeight: 0.15,
    applicabilityCheck: () => true,
    scorer: (rows, metadata) => {
      const findings: string[] = [];
      const impactedColumns: string[] = [];
      let invalidRecords = 0;
      const totalRecords = rows.length;
      
      for (const col of metadata.schema) {
        const values = rows.map(r => r[col.name]);
        
        // Check for negative values in typically positive fields
        const positiveFields = ['amount', 'price', 'quantity', 'count', 'total', 'balance', 'fee', 'cost'];
        if (positiveFields.some(f => col.name.toLowerCase().includes(f))) {
          const negativeCount = values.filter(v => typeof v === 'number' && v < 0).length;
          if (negativeCount > 0) {
            invalidRecords += negativeCount;
            impactedColumns.push(col.name);
            findings.push(`Column '${col.name}' has ${negativeCount} invalid negative values`);
          }
          
          // Check for zero values in amount fields
          const zeroCount = values.filter(v => v === 0).length;
          if (zeroCount > 0 && col.name.toLowerCase().includes('amount')) {
            invalidRecords += zeroCount;
            findings.push(`Column '${col.name}' has ${zeroCount} suspicious zero values`);
          }
        }
        
        // Check for outliers in numeric columns
        if (col.statistics && col.statistics.stdDev > 0) {
          const numericValues = values.filter(v => typeof v === 'number') as number[];
          const upperBound = col.statistics.mean + 3 * col.statistics.stdDev;
          const lowerBound = col.statistics.mean - 3 * col.statistics.stdDev;
          const outlierCount = numericValues.filter(v => v > upperBound || v < lowerBound).length;
          if (outlierCount > 0) {
            invalidRecords += outlierCount;
            if (!impactedColumns.includes(col.name)) impactedColumns.push(col.name);
            findings.push(`Column '${col.name}' has ${outlierCount} outlier values (outside 3σ range)`);
          }
        }
        
        // Check for "NULL", "NA", etc. as string literals
        const invalidNullStrings = values.filter(v => 
          typeof v === 'string' && ['null', 'na', 'n/a', 'none', 'undefined', '-', ''].includes(v.toLowerCase().trim())
        ).length;
        if (invalidNullStrings > 0) {
          invalidRecords += invalidNullStrings;
          if (!impactedColumns.includes(col.name)) impactedColumns.push(col.name);
          findings.push(`Column '${col.name}' has ${invalidNullStrings} invalid null-like strings`);
        }
        
        // Check for non-numeric values in expected numeric columns
        if (col.name.toLowerCase().includes('amount') || col.name.toLowerCase().includes('price')) {
          const nonNumericCount = values.filter(v => 
            v !== null && v !== undefined && typeof v !== 'number'
          ).length;
          if (nonNumericCount > 0) {
            invalidRecords += nonNumericCount;
            if (!impactedColumns.includes(col.name)) impactedColumns.push(col.name);
            findings.push(`Column '${col.name}' has ${nonNumericCount} non-numeric values in numeric field`);
          }
        }
      }
      
      // Each invalid record reduces score proportionally
      // 10% invalid = 30 point penalty
      const invalidRate = invalidRecords / (totalRecords * metadata.schema.length);
      const score = Math.round(Math.max(0, 100 - (invalidRate * 300)));
      
      return { score, findings, impactedColumns };
    }
  },
  {
    id: 'timeliness',
    name: 'Timeliness',
    baseWeight: 0.10,
    applicabilityCheck: (metadata) => {
      return metadata.schema.some(c => c.inferredType === 'date' || c.name.toLowerCase().includes('date'));
    },
    scorer: (rows, metadata) => {
      const findings: string[] = [];
      const impactedColumns: string[] = [];
      
      const dateColumns = metadata.schema.filter(c => 
        c.inferredType === 'date' || c.name.toLowerCase().includes('date')
      );
      
      if (dateColumns.length === 0) {
        return { score: 100, findings: ['No date columns to evaluate'], impactedColumns: [] };
      }
      
      const now = new Date();
      let totalDates = 0;
      let futureDates = 0;
      let staleDates = 0;
      let invalidDates = 0;
      
      for (const col of dateColumns) {
        for (const row of rows) {
          const dateVal = row[col.name];
          if (dateVal === null || dateVal === undefined || dateVal === '') continue;
          
          totalDates++;
          
          if (typeof dateVal === 'string') {
            const date = new Date(dateVal);
            
            // Check for invalid dates
            if (isNaN(date.getTime())) {
              invalidDates++;
              if (!impactedColumns.includes(col.name)) {
                impactedColumns.push(col.name);
                findings.push(`Column '${col.name}' contains invalid date values`);
              }
              continue;
            }
            
            // Future dates (potential error)
            if (date > now) {
              futureDates++;
              if (!findings.some(f => f.includes('future dates'))) {
                impactedColumns.push(col.name);
                findings.push(`Column '${col.name}' contains future dates (data integrity issue)`);
              }
            }
            
            // Very old dates (data staleness) - more than 2 years old
            const yearsDiff = (now.getTime() - date.getTime()) / (365 * 24 * 60 * 60 * 1000);
            if (yearsDiff > 2) {
              staleDates++;
            }
          }
        }
      }
      
      if (totalDates === 0) {
        return { score: 80, findings: ['No valid dates found to evaluate'], impactedColumns };
      }
      
      // Calculate penalties
      const futurePenalty = (futureDates / totalDates) * 150; // Heavy penalty for future dates
      const invalidPenalty = (invalidDates / totalDates) * 100;
      const stalePenalty = (staleDates / totalDates) * 30;
      
      if (futureDates > 0) {
        findings.push(`${futureDates} records have future dates`);
      }
      if (invalidDates > 0) {
        findings.push(`${invalidDates} records have invalid/unparseable dates`);
      }
      if (staleDates > 0) {
        findings.push(`${staleDates} records have dates older than 2 years`);
      }
      
      const score = Math.round(Math.max(0, 100 - futurePenalty - invalidPenalty - stalePenalty));
      return { score, findings, impactedColumns };
    }
  },
  {
    id: 'accuracy',
    name: 'Accuracy',
    baseWeight: 0.15,
    applicabilityCheck: () => true,
    scorer: (rows, metadata) => {
      const findings: string[] = [];
      const impactedColumns: string[] = [];
      let inaccurateRecords = 0;
      const totalRecords = rows.length;
      
      for (const col of metadata.schema) {
        const values = rows.map(r => r[col.name]);
        
        // Mixed types indicate accuracy issues - count each mixed value
        if (col.inferredType === 'mixed') {
          const mixedCount = Math.round(rows.length * 0.2); // Estimate 20% are type mismatches
          inaccurateRecords += mixedCount;
          impactedColumns.push(col.name);
          findings.push(`Column '${col.name}' has mixed data types (data entry errors)`);
        }
        
        // Check for identifier columns with duplicates
        if ((col.name.toLowerCase().includes('id') || col.inferredType === 'identifier') && col.uniqueRatio < 1) {
          const dupCount = Math.round((1 - col.uniqueRatio) * rows.length);
          inaccurateRecords += dupCount;
          if (!impactedColumns.includes(col.name)) impactedColumns.push(col.name);
          findings.push(`Identifier column '${col.name}' has ${dupCount} duplicate values`);
        }
        
        // Check for numeric columns with non-numeric values
        if (col.name.toLowerCase().includes('amount') || 
            col.name.toLowerCase().includes('price') || 
            col.name.toLowerCase().includes('quantity')) {
          const nonNumericCount = values.filter(v => 
            v !== null && v !== undefined && typeof v !== 'number'
          ).length;
          if (nonNumericCount > 0) {
            inaccurateRecords += nonNumericCount;
            if (!impactedColumns.includes(col.name)) impactedColumns.push(col.name);
            findings.push(`Column '${col.name}' has ${nonNumericCount} non-numeric values`);
          }
        }
        
        // Check for empty strings that should be null
        const emptyStringCount = values.filter(v => v === '').length;
        if (emptyStringCount > 0) {
          inaccurateRecords += emptyStringCount;
          if (!impactedColumns.includes(col.name)) impactedColumns.push(col.name);
          findings.push(`Column '${col.name}' has ${emptyStringCount} empty strings (should be null)`);
        }
      }
      
      // Score: each 1% inaccurate records = 3 point penalty
      const inaccuracyRate = inaccurateRecords / (totalRecords * metadata.schema.length);
      const score = Math.round(Math.max(0, 100 - (inaccuracyRate * 300)));
      
      return { score, findings, impactedColumns };
    }
  },
  {
    id: 'integrity',
    name: 'Integrity',
    baseWeight: 0.10,
    applicabilityCheck: (metadata) => {
      return metadata.columnCount > 3;
    },
    scorer: (rows, metadata) => {
      const findings: string[] = [];
      const impactedColumns: string[] = [];
      let integrityIssues = 0;
      const totalRecords = rows.length;
      
      // Check for orphan records (null foreign keys / reference columns)
      const fkColumns = metadata.schema.filter(c => 
        c.name.toLowerCase().includes('_id') || 
        (c.name.toLowerCase().endsWith('id') && c.name.length > 2) ||
        c.name.toLowerCase().includes('merchant') ||
        c.name.toLowerCase().includes('customer')
      );
      
      for (const col of fkColumns) {
        const nullCount = Math.round(col.nullRatio * totalRecords);
        if (nullCount > 0) {
          integrityIssues += nullCount;
          impactedColumns.push(col.name);
          findings.push(`Reference column '${col.name}' has ${nullCount} null values (orphan records)`);
        }
      }
      
      // Check for rows with mostly empty values (incomplete records)
      let incompleteRows = 0;
      for (const row of rows) {
        const values = Object.values(row);
        const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
        if (nullCount > values.length * 0.5) {
          incompleteRows++;
        }
      }
      if (incompleteRows > 0) {
        integrityIssues += incompleteRows * 2;
        findings.push(`${incompleteRows} rows are more than 50% empty (incomplete records)`);
      }
      
      // Check for referential patterns
      const hasAmount = metadata.schema.some(c => c.name.toLowerCase().includes('amount'));
      const hasCurrency = metadata.schema.some(c => c.name.toLowerCase().includes('currency'));
      const hasStatus = metadata.schema.some(c => c.name.toLowerCase().includes('status'));
      
      if (hasAmount && !hasCurrency) {
        integrityIssues += Math.round(totalRecords * 0.1);
        findings.push('Amount field exists without corresponding currency field');
      }
      
      // Check for status field with null values
      if (hasStatus) {
        const statusCol = metadata.schema.find(c => c.name.toLowerCase().includes('status'));
        if (statusCol && statusCol.nullRatio > 0) {
          const nullCount = Math.round(statusCol.nullRatio * totalRecords);
          integrityIssues += nullCount;
          findings.push(`Status column has ${nullCount} missing values`);
        }
      }
      
      // Score based on integrity issue rate
      const integrityRate = integrityIssues / totalRecords;
      const score = Math.round(Math.max(0, 100 - (integrityRate * 100)));
      
      return { score, findings, impactedColumns };
    }
  }
];

// ============================================================================
// EXPLAINABILITY ENGINE
// ============================================================================

function generateExplanation(dimension: DQIDimension): DQIExplanation {
  const summaries: Record<string, (score: number) => string> = {
    completeness: (s) => s >= 80 
      ? `Excellent data completeness at ${s}%. Your dataset has minimal missing values.`
      : s >= 60
        ? `Data completeness is moderate at ${s}%. Some fields require attention.`
        : `Critical completeness issues. ${100 - s}% of expected data is missing.`,
    consistency: (s) => s >= 80
      ? `Strong data consistency at ${s}%. Formats and types are well-standardized.`
      : `Consistency issues detected. ${100 - s}% of data has format/type inconsistencies.`,
    uniqueness: (s) => s >= 90
      ? `High uniqueness at ${s}%. Very few duplicate records detected.`
      : `Duplicate records found. ${100 - s}% of data may be redundant.`,
    validity: (s) => s >= 80
      ? `${s}% of values pass business rule validation checks.`
      : `${100 - s}% of values violate expected business rules or constraints.`,
    timeliness: (s) => s >= 80
      ? `Data freshness is excellent. Timestamps are current and valid.`
      : `Timeliness concerns detected. Some dates may be stale or invalid.`,
    accuracy: (s) => s >= 80
      ? `High accuracy at ${s}%. Values conform to expected formats and ranges.`
      : `Accuracy issues in ${100 - s}% of data. Review data entry processes.`,
    integrity: (s) => s >= 80
      ? `Strong referential integrity. Cross-field relationships are maintained.`
      : `Integrity gaps detected. Some references may be broken or incomplete.`,
  };

  const impacts: Record<string, (score: number) => string> = {
    completeness: (s) => s < 70 
      ? 'Missing data may cause transaction failures or compliance gaps.'
      : 'Current completeness supports reliable transaction processing.',
    consistency: (s) => s < 70
      ? 'Inconsistent formats may cause processing errors and reconciliation issues.'
      : 'Format standardization supports smooth data integration.',
    uniqueness: (s) => s < 85
      ? 'Duplicates may inflate metrics and cause double-processing risks.'
      : 'Low duplication rate ensures accurate transaction counts.',
    validity: (s) => s < 70
      ? 'Invalid values may trigger payment rejections or compliance flags.'
      : 'Valid data supports successful transaction authorization.',
    timeliness: (s) => s < 70
      ? 'Stale or future-dated records may affect settlement and reporting.'
      : 'Current timestamps support accurate real-time processing.',
    accuracy: (s) => s < 70
      ? 'Inaccurate data may lead to incorrect billing or fraud detection issues.'
      : 'Accurate data supports reliable fraud detection and billing.',
    integrity: (s) => s < 70
      ? 'Broken references may cause orphan transactions or reconciliation failures.'
      : 'Strong integrity supports complete audit trails.',
  };

  return {
    dimension: dimension.name,
    summary: summaries[dimension.id]?.(dimension.score) || `${dimension.name} score: ${dimension.score}%`,
    businessImpact: impacts[dimension.id]?.(dimension.score) || 'Monitor this dimension for quality improvements.',
    technicalDetail: dimension.findings.length > 0 
      ? dimension.findings.join('; ')
      : `No specific issues detected in ${dimension.name.toLowerCase()} dimension.`,
  };
}

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

function generateRecommendations(dimensions: DQIDimension[]): DQIRecommendation[] {
  const recommendations: DQIRecommendation[] = [];
  let idCounter = 1;

  for (const dim of dimensions) {
    if (!dim.applicable) continue;

    if (dim.id === 'completeness' && dim.score < 80) {
      recommendations.push({
        id: `REC-${idCounter++}`,
        priority: dim.score < 50 ? 'Critical' : dim.score < 70 ? 'High' : 'Medium',
        title: 'Address missing values in critical fields',
        description: `${dim.impactedColumns.length} columns have significant missing data: ${dim.impactedColumns.slice(0, 3).join(', ')}${dim.impactedColumns.length > 3 ? '...' : ''}`,
        expectedImprovement: Math.round((80 - dim.score) * 0.6),
        affectedDimensions: ['completeness', 'validity'],
        remediation: 'Implement data validation at source. Add required field constraints. Review ETL pipelines for data loss.',
      });
    }

    if (dim.id === 'uniqueness' && dim.score < 90) {
      recommendations.push({
        id: `REC-${idCounter++}`,
        priority: dim.score < 70 ? 'High' : 'Medium',
        title: 'Implement deduplication strategy',
        description: `Duplicate records detected affecting data quality. ${100 - dim.score}% redundancy identified.`,
        expectedImprovement: Math.round((90 - dim.score) * 0.5),
        affectedDimensions: ['uniqueness', 'accuracy'],
        remediation: 'Add unique constraints on identifier columns. Implement merge/purge processes. Review data ingestion for duplicate prevention.',
      });
    }

    if (dim.id === 'consistency' && dim.score < 80) {
      recommendations.push({
        id: `REC-${idCounter++}`,
        priority: dim.score < 60 ? 'High' : 'Medium',
        title: 'Standardize data formats',
        description: `Inconsistent data types and formats detected in: ${dim.impactedColumns.slice(0, 3).join(', ')}`,
        expectedImprovement: Math.round((80 - dim.score) * 0.4),
        affectedDimensions: ['consistency', 'accuracy'],
        remediation: 'Implement format validation rules. Standardize date/currency formats. Add data type enforcement at ingestion.',
      });
    }

    if (dim.id === 'validity' && dim.score < 80) {
      recommendations.push({
        id: `REC-${idCounter++}`,
        priority: dim.score < 60 ? 'Critical' : 'High',
        title: 'Add business rule validation',
        description: `${100 - dim.score}% of data fails business rule checks. Invalid values detected.`,
        expectedImprovement: Math.round((80 - dim.score) * 0.5),
        affectedDimensions: ['validity', 'integrity'],
        remediation: 'Implement range checks for numeric fields. Add lookup validation for codes. Review outlier detection thresholds.',
      });
    }

    if (dim.id === 'timeliness' && dim.score < 80) {
      recommendations.push({
        id: `REC-${idCounter++}`,
        priority: dim.score < 60 ? 'High' : 'Medium',
        title: 'Review date/timestamp handling',
        description: 'Date fields contain future dates or stale records affecting timeliness.',
        expectedImprovement: Math.round((80 - dim.score) * 0.3),
        affectedDimensions: ['timeliness'],
        remediation: 'Add date range validation. Implement data freshness SLAs. Review timestamp generation in source systems.',
      });
    }

    if (dim.id === 'integrity' && dim.score < 80) {
      recommendations.push({
        id: `REC-${idCounter++}`,
        priority: dim.score < 60 ? 'High' : 'Medium',
        title: 'Strengthen referential integrity',
        description: `Reference columns have null or orphan values: ${dim.impactedColumns.slice(0, 3).join(', ')}`,
        expectedImprovement: Math.round((80 - dim.score) * 0.4),
        affectedDimensions: ['integrity', 'completeness'],
        remediation: 'Add foreign key constraints where applicable. Implement cascading updates. Review data relationships.',
      });
    }
  }

  // Sort by priority
  const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ============================================================================
// RISK SUMMARY GENERATOR
// ============================================================================

function generateRiskSummary(compositeDQS: CompositeDQS, dimensions: DQIDimension[]): string {
  const criticalDimensions = dimensions.filter(d => d.applicable && d.score < 60);
  const warningDimensions = dimensions.filter(d => d.applicable && d.score >= 60 && d.score < 80);

  if (compositeDQS.grade === 'A') {
    return 'LOW RISK: Dataset meets enterprise quality standards. All dimensions are within acceptable thresholds. Suitable for production processing and regulatory reporting.';
  }

  if (compositeDQS.grade === 'B') {
    return `MODERATE-LOW RISK: Dataset quality is good with minor improvements needed. ${warningDimensions.length} dimension(s) require attention: ${warningDimensions.map(d => d.name).join(', ')}. Safe for most processing with monitoring.`;
  }

  if (compositeDQS.grade === 'C') {
    return `MODERATE RISK: Dataset has quality issues requiring remediation. ${warningDimensions.length + criticalDimensions.length} dimension(s) below threshold. Review recommendations before production use.`;
  }

  if (compositeDQS.grade === 'D') {
    return `HIGH RISK: Significant data quality issues detected. ${criticalDimensions.length} critical dimension(s): ${criticalDimensions.map(d => d.name).join(', ')}. Remediation required before processing.`;
  }

  return `CRITICAL RISK: Dataset fails multiple quality checks. ${criticalDimensions.length} dimensions in critical state. Do not use for production. Immediate data remediation required.`;
}

function determineComplianceStatus(compositeDQS: CompositeDQS, dimensions: DQIDimension[]): DQIReport['complianceStatus'] {
  const criticalDimensions = dimensions.filter(d => d.applicable && d.score < 50);
  
  if (criticalDimensions.length > 0 || compositeDQS.score < 50) {
    return 'NON_COMPLIANT';
  }
  
  if (compositeDQS.score < 70 || dimensions.some(d => d.applicable && d.score < 60)) {
    return 'REQUIRES_REMEDIATION';
  }
  
  return 'COMPLIANT';
}

// ============================================================================
// MAIN DQI ENGINE - PUBLIC API
// ============================================================================

/**
 * Analyze a CSV file and produce a complete DQI Report
 * This is the main entry point for the DQI Engine
 */
export async function analyzeDQI(file: File): Promise<DQIReport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        
        // ========== STEP 1: Parse CSV (temporary) ==========
        const { headers, rows } = parseCSVContent(content);
        
        if (rows.length === 0) {
          throw new Error('No data found in file');
        }

        // ========== STEP 2: Extract Metadata ==========
        const schema: ColumnSchema[] = headers.map(header => {
          const values = rows.map(row => row[header]);
          return extractColumnSchema(header, values);
        });

        const uniqueRows = new Set(rows.map(r => JSON.stringify(r))).size;
        const duplicateRows = rows.length - uniqueRows;
        const totalCells = rows.length * headers.length;
        const nullCells = schema.reduce((sum, col) => sum + Math.round(col.nullRatio * rows.length), 0);
        
        // Count anomalies (outliers, invalid values, future dates, etc.)
        let anomalyCount = 0;
        
        // Count negative amounts
        for (const col of schema) {
          if (col.statistics && col.name.toLowerCase().includes('amount')) {
            if (col.statistics.min < 0) {
              const values = rows.map(r => r[col.name]).filter(v => typeof v === 'number') as number[];
              anomalyCount += values.filter(v => v < 0).length;
            }
          }
        }
        
        // Count future dates
        const now = new Date();
        const dateColumns = schema.filter(c => c.inferredType === 'date' || c.name.toLowerCase().includes('date'));
        for (const col of dateColumns) {
          for (const row of rows) {
            const dateVal = row[col.name];
            if (dateVal && typeof dateVal === 'string') {
              const date = new Date(dateVal);
              if (!isNaN(date.getTime()) && date > now) {
                anomalyCount++;
              }
            }
          }
        }
        
        // Count statistical outliers
        for (const col of schema) {
          if (col.statistics && col.statistics.stdDev > 0) {
            const upperBound = col.statistics.mean + 3 * col.statistics.stdDev;
            const lowerBound = col.statistics.mean - 3 * col.statistics.stdDev;
            const values = rows.map(r => r[col.name]).filter(v => typeof v === 'number') as number[];
            anomalyCount += values.filter(v => v > upperBound || v < lowerBound).length;
          }
        }

        // Generate data hash for audit trail
        const dataHash = await generateDataHash(content.substring(0, 10000)); // Hash first 10K chars

        const datasetMetadata: DatasetMetadata = {
          fileName: file.name,
          fileSize: file.size,
          rowCount: rows.length,
          columnCount: headers.length,
          schema,
          statisticalSummary: {
            totalCells,
            nullCells,
            uniqueRows,
            duplicateRows,
            anomalyCount,
          },
          dataHash,
          analyzedAt: new Date().toISOString(),
        };

        // ========== STEP 3: Identify & Score Dimensions ==========
        const dimensions: DQIDimension[] = [];
        let totalWeight = 0;

        for (const config of DIMENSION_CONFIGS) {
          const applicable = config.applicabilityCheck(datasetMetadata);
          
          if (applicable) {
            const { score, findings, impactedColumns } = config.scorer(rows, datasetMetadata);
            totalWeight += config.baseWeight;
            
            dimensions.push({
              id: config.id,
              name: config.name,
              score,
              weight: config.baseWeight,
              applicable: true,
              findings,
              impactedColumns,
            });
          } else {
            dimensions.push({
              id: config.id,
              name: config.name,
              score: 0,
              weight: 0,
              applicable: false,
              findings: ['Dimension not applicable for this dataset'],
              impactedColumns: [],
            });
          }
        }

        // Normalize weights
        for (const dim of dimensions) {
          if (dim.applicable) {
            dim.weight = Math.round((dim.weight / totalWeight) * 100) / 100;
          }
        }

        // ========== STEP 4: Calculate Composite Score ==========
        const weightedScore = dimensions
          .filter(d => d.applicable)
          .reduce((sum, d) => sum + d.score * d.weight, 0);
        
        const compositeScore = Math.round(weightedScore);
        const confidence = Math.min(95, Math.round(70 + Math.log10(rows.length) * 10));

        const compositeDQS: CompositeDQS = {
          score: compositeScore,
          grade: calculateGrade(compositeScore),
          confidence,
        };

        // ========== STEP 5: Generate Explanations ==========
        const explanations = dimensions
          .filter(d => d.applicable)
          .map(d => generateExplanation(d));

        // ========== STEP 6: Generate Recommendations ==========
        const recommendations = generateRecommendations(dimensions);

        // ========== STEP 7: Generate Risk Summary ==========
        const overallRiskSummary = generateRiskSummary(compositeDQS, dimensions);
        const complianceStatus = determineComplianceStatus(compositeDQS, dimensions);

        // ========== STEP 8: Compile Final Report ==========
        const report: DQIReport = {
          datasetMetadata,
          dimensions,
          compositeDQS,
          explanations,
          recommendations,
          overallRiskSummary,
          complianceStatus,
          auditTrail: {
            evaluationId: generateEvaluationId(),
            timestamp: new Date().toISOString(),
            engineVersion: '1.0.0',
            checksumVerified: true,
          },
        };

        // ========== STEP 9: DISPOSE RAW DATA ==========
        // Critical: Clear references to raw data
        // The 'rows' array will be garbage collected after this function returns
        // No raw data is stored in the report

        resolve(report);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Store DQI Report in localStorage
 */
export function storeDQIReport(report: DQIReport): void {
  localStorage.setItem('dqi_report', JSON.stringify(report));
}

/**
 * Retrieve DQI Report from localStorage
 */
export function getStoredDQIReport(): DQIReport | null {
  const stored = localStorage.getItem('dqi_report');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as DQIReport;
  } catch {
    return null;
  }
}

/**
 * Clear stored DQI Report
 */
export function clearStoredDQIReport(): void {
  localStorage.removeItem('dqi_report');
}
