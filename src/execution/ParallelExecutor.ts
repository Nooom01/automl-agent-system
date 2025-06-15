import { EventEmitter } from '../events/EventEmitter';
import { OptimizationPlan, AgentTask, AgentResult } from '../types';
import { PlanningAgent } from '../agents/PlanningAgent';
import { DataAgent } from '../agents/DataAgent';
import { ModelAgent } from '../agents/ModelAgent';
import { TrainingAgent } from '../agents/TrainingAgent';
import { EvaluationAgent } from '../agents/EvaluationAgent';

export interface ExecutionProgress {
  strategyId: string;
  phase: 'data' | 'model' | 'training' | 'evaluation';
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  metrics?: any;
}

export interface ExecutionResult {
  strategyId: string;
  success: boolean;
  finalMetrics: {
    accuracy: number;
    loss: number;
    trainingTime: number;
    modelSize: number;
  };
  model?: any;
  error?: string;
}

export class ParallelExecutor extends EventEmitter {
  private planningAgent: PlanningAgent;
  private dataAgent: DataAgent;
  private modelAgent: ModelAgent;
  private trainingAgent: TrainingAgent;
  private evaluationAgent: EvaluationAgent;
  private activeExecutions: Map<string, AbortController>;

  constructor() {
    super();
    this.planningAgent = new PlanningAgent();
    this.dataAgent = new DataAgent();
    this.modelAgent = new ModelAgent();
    this.trainingAgent = new TrainingAgent();
    this.evaluationAgent = new EvaluationAgent();
    this.activeExecutions = new Map();
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.planningAgent.initialize(),
      this.dataAgent.initialize(),
      this.modelAgent.initialize(),
      this.trainingAgent.initialize(),
      this.evaluationAgent.initialize()
    ]);
  }

  async executeStrategies(
    plans: OptimizationPlan[],
    data: { x: any, y: any },
    options: {
      maxConcurrent?: number;
      timeout?: number;
      earlyStopOnSuccess?: boolean;
    } = {}
  ): Promise<ExecutionResult[]> {
    const { 
      maxConcurrent = 3, 
      timeout = 3600000, // 1 hour default
      earlyStopOnSuccess = false 
    } = options;

    // Execute strategies in batches
    const results: ExecutionResult[] = [];
    const batches = this.createBatches(plans, maxConcurrent);

    for (const batch of batches) {
      const batchPromises = batch.map(plan => 
        this.executeSingleStrategy(plan, data, timeout)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        if (result.status === 'fulfilled') {
          results.push(result.value);
          
          // Early stop if we found a successful strategy
          if (earlyStopOnSuccess && result.value.success && 
              result.value.finalMetrics.accuracy >= 0.95) {
            this.cancelRemainingExecutions();
            return results;
          }
        } else {
          results.push({
            strategyId: batch[i].strategyId,
            success: false,
            finalMetrics: {
              accuracy: 0,
              loss: Infinity,
              trainingTime: 0,
              modelSize: 0
            },
            error: result.reason?.message || 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  private async executeSingleStrategy(
    plan: OptimizationPlan,
    data: { x: any, y: any },
    timeout: number
  ): Promise<ExecutionResult> {
    const abortController = new AbortController();
    this.activeExecutions.set(plan.strategyId, abortController);

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    try {
      // Emit start event
      this.emitProgress({
        strategyId: plan.strategyId,
        phase: 'data',
        progress: 0,
        status: 'running',
        message: `Starting ${plan.approach} strategy`
      });

      // Phase 1: Data Processing
      const dataResult = await this.executePhase(
        'data',
        plan,
        async () => {
          const task: AgentTask = {
            id: `data-${plan.strategyId}`,
            type: 'preprocess',
            data: {
              raw: data,
              strategy: plan.approach
            }
          };
          return await this.dataAgent.execute(task);
        },
        abortController.signal
      );

      if (!dataResult.success) {
        throw new Error('Data processing failed');
      }

      // Phase 2: Model Design
      const modelResult = await this.executePhase(
        'model',
        plan,
        async () => {
          const task: AgentTask = {
            id: `model-${plan.strategyId}`,
            type: 'design',
            data: {
              dataInfo: dataResult.data,
              architecture: plan.modelConfig.architecture
            }
          };
          return await this.modelAgent.execute(task);
        },
        abortController.signal
      );

      if (!modelResult.success) {
        throw new Error('Model design failed');
      }

      // Phase 3: Training
      const trainingResult = await this.executePhase(
        'training',
        plan,
        async () => {
          const task: AgentTask = {
            id: `train-${plan.strategyId}`,
            type: 'train',
            data: {
              model: modelResult.data,
              processedData: dataResult.data,
              trainingConfig: plan.trainingConfig
            }
          };
          return await this.trainingAgent.execute(task);
        },
        abortController.signal
      );

      if (!trainingResult.success) {
        throw new Error('Training failed');
      }

      // Phase 4: Evaluation
      const evalResult = await this.executePhase(
        'evaluation',
        plan,
        async () => {
          const task: AgentTask = {
            id: `eval-${plan.strategyId}`,
            type: 'evaluate',
            data: {
              model: trainingResult.data.model,
              testData: dataResult.data.test
            }
          };
          return await this.evaluationAgent.execute(task);
        },
        abortController.signal
      );

      clearTimeout(timeoutId);
      this.activeExecutions.delete(plan.strategyId);

      // Emit completion
      this.emitProgress({
        strategyId: plan.strategyId,
        phase: 'evaluation',
        progress: 100,
        status: 'completed',
        message: `Strategy completed with ${evalResult.data.accuracy}% accuracy`,
        metrics: evalResult.data
      });

      return {
        strategyId: plan.strategyId,
        success: true,
        finalMetrics: {
          accuracy: evalResult.data.accuracy,
          loss: evalResult.data.loss,
          trainingTime: trainingResult.data.trainingTime,
          modelSize: this.calculateModelSize(trainingResult.data.model)
        },
        model: trainingResult.data.model
      };

    } catch (error) {
      clearTimeout(timeoutId);
      this.activeExecutions.delete(plan.strategyId);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.emitProgress({
        strategyId: plan.strategyId,
        phase: 'evaluation',
        progress: 0,
        status: 'failed',
        message: `Strategy failed: ${errorMessage}`
      });

      return {
        strategyId: plan.strategyId,
        success: false,
        finalMetrics: {
          accuracy: 0,
          loss: Infinity,
          trainingTime: 0,
          modelSize: 0
        },
        error: errorMessage
      };
    }
  }

  private async executePhase(
    phase: ExecutionProgress['phase'],
    plan: OptimizationPlan,
    executor: () => Promise<AgentResult>,
    signal: AbortSignal
  ): Promise<AgentResult> {
    if (signal.aborted) {
      throw new Error('Execution aborted');
    }

    this.emitProgress({
      strategyId: plan.strategyId,
      phase,
      progress: 25,
      status: 'running',
      message: `Executing ${phase} phase`
    });

    const result = await executor();

    this.emitProgress({
      strategyId: plan.strategyId,
      phase,
      progress: 100,
      status: 'completed',
      message: `${phase} phase completed`
    });

    return result;
  }

  private emitProgress(progress: ExecutionProgress): void {
    this.emit('progress', progress);
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private calculateModelSize(model: any): number {
    // Simplified model size calculation
    // In reality, would calculate based on parameters
    return Math.round(Math.random() * 50 + 10); // 10-60 MB
  }

  private cancelRemainingExecutions(): void {
    this.activeExecutions.forEach(controller => {
      controller.abort();
    });
    this.activeExecutions.clear();
  }

  async compareStrategies(results: ExecutionResult[]): Promise<{
    best: ExecutionResult;
    ranking: ExecutionResult[];
    analysis: {
      accuracyWinner: string;
      speedWinner: string;
      sizeWinner: string;
      overallWinner: string;
      recommendations: string[];
    };
  }> {
    // Sort by accuracy (primary) and training time (secondary)
    const ranked = [...results]
      .filter(r => r.success)
      .sort((a, b) => {
        if (Math.abs(a.finalMetrics.accuracy - b.finalMetrics.accuracy) > 0.01) {
          return b.finalMetrics.accuracy - a.finalMetrics.accuracy;
        }
        return a.finalMetrics.trainingTime - b.finalMetrics.trainingTime;
      });

    if (ranked.length === 0) {
      throw new Error('No successful strategies to compare');
    }

    const best = ranked[0];
    
    // Find winners in each category
    const accuracyWinner = ranked.reduce((prev, curr) => 
      curr.finalMetrics.accuracy > prev.finalMetrics.accuracy ? curr : prev
    );
    
    const speedWinner = ranked.reduce((prev, curr) => 
      curr.finalMetrics.trainingTime < prev.finalMetrics.trainingTime ? curr : prev
    );
    
    const sizeWinner = ranked.reduce((prev, curr) => 
      curr.finalMetrics.modelSize < prev.finalMetrics.modelSize ? curr : prev
    );

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (best.finalMetrics.accuracy >= 0.95) {
      recommendations.push('Target accuracy achieved! Consider the fastest model.');
    } else {
      recommendations.push('Target accuracy not met. Consider ensemble methods.');
    }

    if (speedWinner.strategyId !== accuracyWinner.strategyId) {
      recommendations.push(
        `Trade-off detected: ${accuracyWinner.strategyId} has best accuracy but ` +
        `${speedWinner.strategyId} is ${Math.round(
          accuracyWinner.finalMetrics.trainingTime / speedWinner.finalMetrics.trainingTime
        )}x faster`
      );
    }

    if (sizeWinner.strategyId !== best.strategyId) {
      recommendations.push(
        `For deployment, consider ${sizeWinner.strategyId} which is ` +
        `${Math.round(best.finalMetrics.modelSize / sizeWinner.finalMetrics.modelSize)}x smaller`
      );
    }

    return {
      best,
      ranking: ranked,
      analysis: {
        accuracyWinner: accuracyWinner.strategyId,
        speedWinner: speedWinner.strategyId,
        sizeWinner: sizeWinner.strategyId,
        overallWinner: best.strategyId,
        recommendations
      }
    };
  }
}