/**
 * BaseAgent - Foundation for all AI agents
 * Simplified version without complex imports
 */

// Direct type definitions to avoid import issues
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

// Additional types for agents
export interface ParsedRequirement {
  taskType: 'classification' | 'detection' | 'segmentation';
  categories: string[];
  targetAccuracy: number;
  constraints: any[];
  timeLimit?: number;
}

export abstract class BaseAgent {
  public readonly id: string;
  public readonly name: string;
  private _status: AgentStatus = 'idle';
  protected initialized = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  get status(): AgentStatus {
    return this._status;
  }

  protected setStatus(status: AgentStatus): void {
    const previousStatus = this._status;
    this._status = status;
    console.log(`[${this.name}] Status: ${previousStatus} → ${status}`);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log(`[${this.name}] Already initialized`);
      return;
    }

    try {
      this.setStatus('initializing');
      console.log(`[${this.name}] Initializing...`);
      
      await this.onInitialize();
      
      this.initialized = true;
      this.setStatus('idle');
      console.log(`[${this.name}] Initialized successfully`);
      
    } catch (error) {
      this.setStatus('error');
      console.error(`[${this.name}] Initialization failed:`, error);
      throw error;
    }
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      this.setStatus('active');
      console.log(`[${this.name}] Executing task: ${task.type}`);
      
      const result = await this.onExecute(task);
      
      this.setStatus('completed');
      console.log(`[${this.name}] Task completed successfully`);
      
      // Reset to idle after completion
      this.setStatus('idle');
      
      return result;
      
    } catch (error) {
      this.setStatus('error');
      console.error(`[${this.name}] Task execution failed:`, error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log(`[${this.name}] Cleaning up...`);
      await this.onCleanup();
      this.setStatus('idle');
      console.log(`[${this.name}] Cleanup completed`);
    } catch (error) {
      console.error(`[${this.name}] Cleanup failed:`, error);
      throw error;
    }
  }

  // Abstract methods to be implemented by specific agents
  protected abstract onInitialize(): Promise<void>;
  protected abstract onExecute(task: AgentTask): Promise<AgentResult>;
  protected abstract onCleanup(): Promise<void>;
}