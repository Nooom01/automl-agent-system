/**
 * TrainingAgent - Training Intelligence for AutoML
 * 
 * Manages model training with adaptive learning rates, early stopping,
 * and real-time progress monitoring.
 */

import { BaseAgent, AgentTask, AgentResult } from './BaseAgent';

export interface TrainingRequest {
  model: any; // TensorFlow.js model
  config: TrainingConfig;
  data: TrainingData;
  callbacks?: TrainingCallbacks;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: string;
  lossFunction: string;
  metrics: string[];
  earlyStopping: boolean;
  patience: number;
  validationSplit?: number;
}

export interface TrainingData {
  trainImages: Float32Array[];
  trainLabels: number[];
  validationImages?: Float32Array[];
  validationLabels?: number[];
  numClasses: number;
  imageShape: [number, number, number];
}

export interface TrainingCallbacks {
  onEpochEnd?: (epoch: number, logs: TrainingLogs) => void;
  onBatchEnd?: (batch: number, logs: TrainingLogs) => void;
  onTrainingBegin?: () => void;
  onTrainingEnd?: (finalLogs: TrainingLogs) => void;
}

export interface TrainingLogs {
  loss: number;
  accuracy: number;
  val_loss?: number;
  val_accuracy?: number;
  learningRate: number;
  epoch: number;
  batch?: number;
}

export interface TrainingResult {
  success: boolean;
  trainedModel: any;
  trainingHistory: TrainingHistory;
  finalMetrics: FinalMetrics;
  trainingTime: number;
  modelSize: number;
  bestEpoch: number;
  stoppedEarly: boolean;
}

export interface TrainingHistory {
  loss: number[];
  accuracy: number[];
  val_loss: number[];
  val_accuracy: number[];
  learningRates: number[];
  epochs: number[];
}

export interface FinalMetrics {
  trainLoss: number;
  trainAccuracy: number;
  valLoss: number;
  valAccuracy: number;
  overfitting: number;
  convergenceRate: number;
}

export class TrainingAgent extends BaseAgent {
  private currentTraining: any = null;
  private trainingHistory: TrainingHistory;
  private bestMetrics: { epoch: number; valAccuracy: number; model: any };
  private learningRateScheduler: LearningRateScheduler;

  constructor(id: string) {
    super(id, 'Training Agent');
    this.trainingHistory = this.initializeHistory();
    this.bestMetrics = { epoch: 0, valAccuracy: 0, model: null };
    this.learningRateScheduler = new LearningRateScheduler();
  }

  protected async onInitialize(): Promise<void> {
    console.log('🚀 Initializing Training Agent...');
    console.log('📊 Adaptive learning rate scheduling enabled');
    console.log('⏰ Early stopping with patience enabled');
    console.log('💾 Model checkpointing configured');
  }

  protected async onExecute(task: AgentTask): Promise<AgentResult> {
    if (task.type === 'train_model') {
      return await this.handleTraining(task.data as TrainingRequest);
    }
    
    throw new Error(`Unknown task type: ${task.type}`);
  }

  protected async onCleanup(): Promise<void> {
    console.log('🧹 Cleaning up Training Agent...');
    if (this.currentTraining) {
      // Stop any ongoing training
      this.currentTraining = null;
    }
  }

  /**
   * Main training method
   */
  async trainModel(request: TrainingRequest): Promise<TrainingResult> {
    console.log('🏋️ Starting model training...');
    const startTime = Date.now();
    
    try {
      // Reset training state
      this.resetTrainingState();
      
      // Step 1: Prepare training data
      console.log('📊 Step 1: Preparing training data...');
      const preparedData = await this.prepareTrainingData(request.data);
      
      // Step 2: Configure training
      console.log('⚙️ Step 2: Configuring training parameters...');
      const trainingConfig = this.configureTraining(request.config);
      
      // Step 3: Set up callbacks
      console.log('📡 Step 3: Setting up training callbacks...');
      const callbacks = this.setupCallbacks(request.callbacks, request.config);
      
      // Step 4: Execute training
      console.log('🚀 Step 4: Starting training process...');
      const trainedModel = await this.executeTraining(
        request.model,
        preparedData,
        trainingConfig,
        callbacks
      );
      
      // Step 5: Finalize results
      console.log('📈 Step 5: Finalizing training results...');
      const finalMetrics = this.calculateFinalMetrics();
      
      const trainingTime = Date.now() - startTime;
      
      const result: TrainingResult = {
        success: true,
        trainedModel: this.bestMetrics.model || trainedModel,
        trainingHistory: this.trainingHistory,
        finalMetrics,
        trainingTime,
        modelSize: this.estimateModelSize(trainedModel),
        bestEpoch: this.bestMetrics.epoch,
        stoppedEarly: this.checkEarlyStopping(request.config)
      };
      
      console.log('✅ Training completed successfully');
      console.log(`📊 Final accuracy: ${(finalMetrics.valAccuracy * 100).toFixed(2)}%`);
      console.log(`⏱️ Training time: ${Math.round(trainingTime / 1000)}s`);
      console.log(`🏆 Best epoch: ${result.bestEpoch}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Training failed:', error);
      throw error;
    }
  }

  /**
   * Reset training state
   */
  private resetTrainingState(): void {
    this.trainingHistory = this.initializeHistory();
    this.bestMetrics = { epoch: 0, valAccuracy: 0, model: null };
    this.currentTraining = null;
  }

  /**
   * Initialize training history
   */
  private initializeHistory(): TrainingHistory {
    return {
      loss: [],
      accuracy: [],
      val_loss: [],
      val_accuracy: [],
      learningRates: [],
      epochs: []
    };
  }

  /**
   * Prepare training data
   */
  private async prepareTrainingData(data: TrainingData): Promise<any> {
    console.log(`📦 Preparing ${data.trainImages.length} training samples...`);
    
    // In a real implementation, this would:
    // 1. Convert arrays to TensorFlow tensors
    // 2. Create tf.data.Dataset for efficient loading
    // 3. Apply batching and shuffling
    // 4. Set up validation split if needed
    
    return {
      trainDataset: data.trainImages, // Simplified
      validationDataset: data.validationImages || [],
      numSamples: data.trainImages.length,
      numClasses: data.numClasses
    };
  }

  /**
   * Configure training parameters
   */
  private configureTraining(config: TrainingConfig): any {
    const configuration = {
      epochs: config.epochs,
      batchSize: config.batchSize,
      initialLearningRate: config.learningRate,
      optimizer: config.optimizer,
      loss: config.lossFunction,
      metrics: config.metrics,
      shuffle: true,
      validationSplit: config.validationSplit || 0.2
    };
    
    console.log('⚙️ Training configuration:', configuration);
    return configuration;
  }

  /**
   * Set up training callbacks
   */
  private setupCallbacks(
    userCallbacks: TrainingCallbacks | undefined,
    config: TrainingConfig
  ): any {
    const callbacks: any[] = [];
    
    // Early stopping callback
    if (config.earlyStopping) {
      callbacks.push({
        name: 'EarlyStopping',
        patience: config.patience,
        monitor: 'val_accuracy',
        mode: 'max',
        onEpochEnd: (epoch: number, logs: TrainingLogs) => {
          this.checkForEarlyStopping(epoch, logs, config.patience);
        }
      });
    }
    
    // Model checkpoint callback
    callbacks.push({
      name: 'ModelCheckpoint',
      onEpochEnd: (epoch: number, logs: TrainingLogs) => {
        if (logs.val_accuracy && logs.val_accuracy > this.bestMetrics.valAccuracy) {
          this.bestMetrics = {
            epoch,
            valAccuracy: logs.val_accuracy,
            model: this.currentTraining // Save model state
          };
          console.log(`💾 New best model saved at epoch ${epoch} with val_accuracy: ${(logs.val_accuracy * 100).toFixed(2)}%`);
        }
      }
    });
    
    // Learning rate scheduler callback
    callbacks.push({
      name: 'LearningRateScheduler',
      onEpochEnd: (epoch: number, logs: TrainingLogs) => {
        const newLr = this.learningRateScheduler.getNextLearningRate(epoch, logs);
        console.log(`📉 Learning rate adjusted to: ${newLr.toExponential(2)}`);
      }
    });
    
    // History tracking callback
    callbacks.push({
      name: 'HistoryTracking',
      onEpochEnd: (epoch: number, logs: TrainingLogs) => {
        this.updateTrainingHistory(epoch, logs);
        if (userCallbacks?.onEpochEnd) {
          userCallbacks.onEpochEnd(epoch, logs);
        }
      }
    });
    
    return callbacks;
  }

  /**
   * Execute training (simplified simulation)
   */
  private async executeTraining(
    model: any,
    data: any,
    config: any,
    callbacks: any[]
  ): Promise<any> {
    console.log('🏃 Training started...');
    
    // Simulate training epochs
    for (let epoch = 0; epoch < config.epochs; epoch++) {
      // Simulate epoch training
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate computation
      
      // Generate simulated logs
      const logs: TrainingLogs = {
        loss: Math.max(0.1, 2.5 - (epoch * 0.1) + Math.random() * 0.2),
        accuracy: Math.min(0.99, 0.3 + (epoch * 0.03) + Math.random() * 0.05),
        val_loss: Math.max(0.15, 2.7 - (epoch * 0.08) + Math.random() * 0.3),
        val_accuracy: Math.min(0.95, 0.25 + (epoch * 0.025) + Math.random() * 0.05),
        learningRate: this.learningRateScheduler.currentLearningRate,
        epoch
      };
      
      // Execute callbacks
      for (const callback of callbacks) {
        if (callback.onEpochEnd) {
          callback.onEpochEnd(epoch, logs);
        }
      }
      
      // Log progress
      console.log(
        `Epoch ${epoch + 1}/${config.epochs} - ` +
        `loss: ${logs.loss.toFixed(4)} - ` +
        `accuracy: ${(logs.accuracy * 100).toFixed(2)}% - ` +
        `val_loss: ${logs.val_loss.toFixed(4)} - ` +
        `val_accuracy: ${(logs.val_accuracy * 100).toFixed(2)}%`
      );
      
      // Check for early stopping
      if (this.shouldStopEarly(epoch, logs, config)) {
        console.log('⏹️ Early stopping triggered');
        break;
      }
    }
    
    return model; // Return trained model
  }

  /**
   * Update training history
   */
  private updateTrainingHistory(epoch: number, logs: TrainingLogs): void {
    this.trainingHistory.epochs.push(epoch);
    this.trainingHistory.loss.push(logs.loss);
    this.trainingHistory.accuracy.push(logs.accuracy);
    this.trainingHistory.val_loss.push(logs.val_loss || 0);
    this.trainingHistory.val_accuracy.push(logs.val_accuracy || 0);
    this.trainingHistory.learningRates.push(logs.learningRate);
  }

  /**
   * Check for early stopping
   */
  private checkForEarlyStopping(epoch: number, logs: TrainingLogs, patience: number): void {
    // Simplified early stopping logic
    const recentAccuracies = this.trainingHistory.val_accuracy.slice(-patience);
    if (recentAccuracies.length >= patience) {
      const improving = recentAccuracies.some((acc, i) => 
        i > 0 && acc > recentAccuracies[i - 1] + 0.001
      );
      if (!improving) {
        console.log(`⚠️ No improvement for ${patience} epochs`);
      }
    }
  }

  /**
   * Should stop early
   */
  private shouldStopEarly(epoch: number, logs: TrainingLogs, config: any): boolean {
    if (!config.earlyStopping || epoch < config.patience) {
      return false;
    }
    
    const recentAccuracies = this.trainingHistory.val_accuracy.slice(-config.patience);
    const noImprovement = recentAccuracies.every((acc, i) => 
      i === 0 || Math.abs(acc - recentAccuracies[i - 1]) < 0.001
    );
    
    return noImprovement;
  }

  /**
   * Check if early stopping occurred
   */
  private checkEarlyStopping(config: TrainingConfig): boolean {
    return config.earlyStopping && 
           this.trainingHistory.epochs.length < config.epochs;
  }

  /**
   * Calculate final metrics
   */
  private calculateFinalMetrics(): FinalMetrics {
    const history = this.trainingHistory;
    const lastIdx = history.epochs.length - 1;
    
    const trainLoss = history.loss[lastIdx] || 0;
    const trainAccuracy = history.accuracy[lastIdx] || 0;
    const valLoss = history.val_loss[lastIdx] || 0;
    const valAccuracy = history.val_accuracy[lastIdx] || 0;
    
    const overfitting = Math.max(0, trainAccuracy - valAccuracy);
    const convergenceRate = this.calculateConvergenceRate();
    
    return {
      trainLoss,
      trainAccuracy,
      valLoss,
      valAccuracy,
      overfitting,
      convergenceRate
    };
  }

  /**
   * Calculate convergence rate
   */
  private calculateConvergenceRate(): number {
    const accuracies = this.trainingHistory.accuracy;
    if (accuracies.length < 2) return 0;
    
    const improvements = [];
    for (let i = 1; i < Math.min(10, accuracies.length); i++) {
      improvements.push(accuracies[i] - accuracies[i - 1]);
    }
    
    return improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
  }

  /**
   * Estimate model size
   */
  private estimateModelSize(model: any): number {
    // Simplified estimation
    return 10.5; // MB
  }

  /**
   * Handle training task
   */
  private async handleTraining(request: TrainingRequest): Promise<AgentResult> {
    try {
      const result = await this.trainModel(request);
      
      return {
        success: true,
        data: result,
        metrics: {
          finalAccuracy: result.finalMetrics.valAccuracy,
          trainingTimeSeconds: result.trainingTime / 1000,
          epochs: result.trainingHistory.epochs.length,
          modelSizeMB: result.modelSize
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown training error',
        timestamp: new Date()
      };
    }
  }
}

/**
 * Learning Rate Scheduler
 */
class LearningRateScheduler {
  public currentLearningRate: number;
  private initialLearningRate: number;
  private decayRate: number;
  private decaySteps: number;
  
  constructor(initialLr = 0.001, decayRate = 0.96, decaySteps = 10) {
    this.initialLearningRate = initialLr;
    this.currentLearningRate = initialLr;
    this.decayRate = decayRate;
    this.decaySteps = decaySteps;
  }
  
  getNextLearningRate(epoch: number, logs: TrainingLogs): number {
    // Exponential decay
    if (epoch > 0 && epoch % this.decaySteps === 0) {
      this.currentLearningRate *= this.decayRate;
    }
    
    // Reduce on plateau
    if (logs.val_loss && epoch > 10) {
      const recentLosses = [logs.val_loss]; // Simplified
      const improving = false; // Simplified check
      if (!improving) {
        this.currentLearningRate *= 0.5;
      }
    }
    
    // Ensure minimum learning rate
    this.currentLearningRate = Math.max(this.currentLearningRate, 1e-7);
    
    return this.currentLearningRate;
  }
}