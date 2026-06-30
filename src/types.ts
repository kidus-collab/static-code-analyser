export type ProjectTarget = {
  name: string;
  root: string;
};

export type LineCounts = {
  sloc: number;
  comments: number;
  physical: number;
};

export type FileMetric = {
  file: string;
  sloc: number;
  cyclomatic: number;
  cognitive: number;
  maintainabilityIndex: number;
  functionCount: number;
};

export type CouplingMetrics = {
  internalEdges: number;
  avgCe: number;
  avgCa: number;
  instability: number;
  externalDepCount: number;
};

export type AnalysisSummary = {
  name: string;
  root: string;
  framework: string;
  files: number;
  extCounts: Record<string, number>;
  sloc: number;
  physicalLines: number;
  cyclomatic: {
    total: number;
    avgPerFunction: number;
    maxFile: { value: number; file: string };
  };
  cognitive: {
    total: number;
    avgPerCodeFile: number;
    maxFile: { value: number; file: string };
  };
  maintainabilityIndex: number;
  lcom: number | null;
  lcomClassCount: number;
  coupling: CouplingMetrics;
  rating: number;
  ratingLabel: string;
  topHotspots: FileMetric[];
};

export type CliOptions = {
  json: boolean;
  top: number;
  includeTests: boolean;
  configPath?: string;
  searchRoots: string[];
};
