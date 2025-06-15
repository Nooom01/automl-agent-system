// Core Types for AutoML-Agent System

export interface ParsedRequirement {
  taskType: 'classification' | 'detection' | 'segmentation';
  categories: string[];
  targetAccuracy: number;
  constraints: Constraint[];
  timeLimit?: number;
  resourceConstraints?: ResourceConstraints;
  priority?: 'speed' | 'accuracy' | 'balanced';
}

export interface Constraint {
  type: 'time' | 'memory' | 'accuracy' | 'size';
  value: number;
  unit: string;
}

export interface ResourceConstraints {
  maxMemoryMB: number;
  maxTrainingTimeMinutes: number;
  preferredModelSizeMB?: number;
}

// Agent System Types
export interface IBaseAgent {
  id: string;
  name: string;
  status: AgentStatus;
  initialize(): Promise<void>;
  execute(task: AgentTask): Promise<AgentResult>;
  cleanup(): Promise<void>;
}

export type AgentStatus = 'idle' | 'initializing' | 'active' | 'completed' | 'error';

export interface AgentTask {
  id: string;
  type: string;
  data: any;
  timestamp?: Date;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metrics?: Record<string, number>;
  timestamp?: Date;
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: 'status' | 'data' | 'error' | 'command';
  payload: any;
  timestamp: Date;
}

// AutoML Pipeline Types
export interface OptimizationPlan {
  strategyId: string;
  id: string;
  name: string;
  approach: 'transfer_learning' | 'data_centric' | 'ensemble';
  strategy: MLStrategy;
  expectedAccuracy: number;
  estimatedTime: number;
  priority: number;
  modelConfig: {
    architecture: string;
  };
  trainingConfig: TrainingConfig;
}

export interface MLStrategy {
  approach: 'transfer_learning' | 'data_centric' | 'ensemble';
  architecture?: string;
  dataAugmentation: string[];
  trainingConfig: TrainingConfig;
  categories: string[];
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: string;
  lossFunction: string;
  metrics: string[];
}

export interface AutoMLProgress {
  phase: 'parsing' | 'planning' | 'data_processing' | 'execution' | 'evaluation' | 'improvement' | 'completed';
  message: string;
  percentage: number;
  currentStrategy?: string;
  agentStatuses?: Record<string, AgentStatus>;
}

export interface AutoMLResult {
  success: boolean;
  finalAccuracy: number;
  model: any; // TensorFlow.js model
  trainingTime: number;
  strategies: OptimizationPlan[];
  selectedStrategy: string;
  improvementCycles: number;
  documentation: ModelDocumentation;
}

export interface ModelDocumentation {
  architecture: string;
  inputShape: number[];
  outputClasses: string[];
  trainingMetrics: Record<string, number>;
  recommendedUsage: string;
  limitations: string[];
}

// Knowledge Base Types
export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore?: number;
  source: 'internal' | 'arxiv' | 'papers_with_code' | 'semantic_scholar';
  createdAt: Date;
}

export interface SearchResult extends KnowledgeEntry {
  relevanceScore: number;
  matchedTerms: string[];
}

export interface ExternalAPIResult {
  title: string;
  abstract: string;
  authors: string[];
  url: string;
  citations?: number;
  publishedDate?: Date;
  relevanceScore: number;
}

// UI State Types
export interface AppState {
  currentPhase: 'idle' | 'requirement_input' | 'data_upload' | 'executing' | 'improvement' | 'completed';
  requirement?: ParsedRequirement;
  uploadedFiles: File[];
  progress: AutoMLProgress;
  result?: AutoMLResult;
  error?: string;
}

export interface AgentDashboardState {
  agents: Record<string, AgentStatusInfo>;
  messages: AgentMessage[];
  resourceUsage: ResourceMetrics;
}

export interface AgentStatusInfo {
  id: string;
  name: string;
  status: AgentStatus;
  progress: number;
  currentTask: string;
  lastUpdate: Date;
}

export interface ResourceMetrics {
  memoryUsageMB: number;
  cpuUsagePercent: number;
  gpuUsagePercent?: number;
  networkRequests: number;
}

// Training and Evaluation Types
export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
  learningRate: number;
  duration: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  classificationReport: Record<string, any>;
}

export interface ModelPerformance {
  trainingMetrics: TrainingMetrics[];
  evaluationMetrics: EvaluationMetrics;
  benchmarkComparison?: Record<string, number>;
}

// Error Types
export interface AutoMLError extends Error {
  code: string;
  phase: string;
  agentId?: string;
  recoverable: boolean;
  suggestedFix?: string;
}