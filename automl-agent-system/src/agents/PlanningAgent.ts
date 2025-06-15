/**
 * PlanningAgent - Strategic Intelligence for AutoML
 * 
 * Creates multiple optimization strategies and selects the best approach
 * based on requirements, constraints, and available resources.
 */

import { BaseAgent, AgentTask, AgentResult, ParsedRequirement } from './BaseAgent';

export interface OptimizationPlan {
  id: string;
  name: string;
  description: string;
  strategy: MLStrategy;
  expectedAccuracy: number;
  estimatedTime: number;
  priority: number;
  resourceRequirements: ResourceRequirements;
  successProbability: number;
}

export interface MLStrategy {
  approach: 'transfer_learning' | 'data_centric' | 'ensemble';
  architecture: string;
  dataAugmentation: string[];
  trainingConfig: TrainingConfig;
  categories: string[];
  optimizations: string[];
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
}

export interface ResourceRequirements {
  memoryMB: number;
  estimatedTrainingTime: number;
  computeIntensity: 'low' | 'medium' | 'high';
  gpuRequired: boolean;
}

export interface PlanningRequest {
  requirement: ParsedRequirement;
  dataInfo: {
    trainingSize: number;
    testSize: number;
    categories: string[];
    constraints: any[];
  };
}

export class PlanningAgent extends BaseAgent {
  private strategyTemplates: Map<string, Partial<MLStrategy>>;
  private knowledgeBase: any; // Will be properly typed later

  constructor(id: string, knowledgeBase?: any) {
    super(id, 'Planning Agent');
    this.knowledgeBase = knowledgeBase;
    this.initializeStrategyTemplates();
  }

  protected async onInitialize(): Promise<void> {
    console.log('🧠 Initializing Planning Agent...');
    console.log('📋 Strategy templates loaded:', this.strategyTemplates.size);
    console.log('📚 Knowledge base:', this.knowledgeBase ? 'Connected' : 'Standalone');
  }

  protected async onExecute(task: AgentTask): Promise<AgentResult> {
    if (task.type === 'create_optimization_plans') {
      return await this.handlePlanningRequest(task.data as PlanningRequest);
    }
    
    throw new Error(`Unknown task type: ${task.type}`);
  }

  protected async onCleanup(): Promise<void> {
    console.log('🧹 Cleaning up Planning Agent...');
  }

  /**
   * Main planning method - creates multiple optimization strategies
   */
  async createOptimizationPlans(request: PlanningRequest): Promise<OptimizationPlan[]> {
    console.log('🎯 Creating optimization plans for requirement...');
    
    const plans: OptimizationPlan[] = [];
    
    // Strategy 1: Transfer Learning Approach
    plans.push(await this.createTransferLearningPlan(request));
    
    // Strategy 2: Data-Centric Approach  
    plans.push(await this.createDataCentricPlan(request));
    
    // Strategy 3: Ensemble Approach
    plans.push(await this.createEnsemblePlan(request));
    
    // Sort by priority and expected performance
    plans.sort((a, b) => {
      const scoreA = a.expectedAccuracy * 0.7 + a.successProbability * 0.3;
      const scoreB = b.expectedAccuracy * 0.7 + b.successProbability * 0.3;
      return scoreB - scoreA;
    });
    
    console.log(`✅ Generated ${plans.length} optimization plans`);
    return plans;
  }

  /**
   * Create transfer learning strategy
   */
  private async createTransferLearningPlan(request: PlanningRequest): Promise<OptimizationPlan> {
    const { requirement, dataInfo } = request;
    
    // Select best pre-trained model based on task
    const architecture = this.selectPretrainedModel(requirement, dataInfo);
    
    const strategy: MLStrategy = {
      approach: 'transfer_learning',
      architecture,
      dataAugmentation: this.selectDataAugmentation(requirement, 'moderate'),
      trainingConfig: this.createTrainingConfig(requirement, 'transfer_learning'),
      categories: requirement.categories,
      optimizations: [
        'freeze_base_layers',
        'gradual_unfreezing',
        'adaptive_learning_rate',
        'class_weight_balancing'
      ]
    };

    const plan: OptimizationPlan = {
      id: `plan_transfer_${Date.now()}`,
      name: 'Transfer Learning Strategy',
      description: `Fine-tune ${architecture} for ${requirement.categories.length} classes with proven transfer learning techniques`,
      strategy,
      expectedAccuracy: this.estimateAccuracy(strategy, dataInfo),
      estimatedTime: this.estimateTrainingTime(strategy, dataInfo),
      priority: requirement.priority === 'balanced' ? 1 : requirement.priority === 'accuracy' ? 1 : 2,
      resourceRequirements: {
        memoryMB: 1500,
        estimatedTrainingTime: 8,
        computeIntensity: 'medium',
        gpuRequired: false
      },
      successProbability: 0.85
    };

    console.log(`📋 Created transfer learning plan: ${plan.name}`);
    return plan;
  }

  /**
   * Create data-centric strategy
   */
  private async createDataCentricPlan(request: PlanningRequest): Promise<OptimizationPlan> {
    const { requirement, dataInfo } = request;
    
    const strategy: MLStrategy = {
      approach: 'data_centric',
      architecture: 'MobileNetV2', // Lightweight for data experiments
      dataAugmentation: this.selectDataAugmentation(requirement, 'aggressive'),
      trainingConfig: this.createTrainingConfig(requirement, 'data_centric'),
      categories: requirement.categories,
      optimizations: [
        'smart_data_augmentation',
        'synthetic_data_generation',
        'class_balancing',
        'noise_reduction',
        'quality_filtering'
      ]
    };

    const plan: OptimizationPlan = {
      id: `plan_data_${Date.now()}`,
      name: 'Data-Centric Strategy',
      description: `Maximize data quality and quantity with aggressive augmentation for ${requirement.categories.length} classes`,
      strategy,
      expectedAccuracy: this.estimateAccuracy(strategy, dataInfo),
      estimatedTime: this.estimateTrainingTime(strategy, dataInfo),
      priority: dataInfo.trainingSize < 100 ? 1 : 3, // Prioritize if low data
      resourceRequirements: {
        memoryMB: 1200,
        estimatedTrainingTime: 12,
        computeIntensity: 'high',
        gpuRequired: false
      },
      successProbability: 0.75
    };

    console.log(`📋 Created data-centric plan: ${plan.name}`);
    return plan;
  }

  /**
   * Create ensemble strategy
   */
  private async createEnsemblePlan(request: PlanningRequest): Promise<OptimizationPlan> {
    const { requirement, dataInfo } = request;
    
    const strategy: MLStrategy = {
      approach: 'ensemble',
      architecture: 'Multi-Model Ensemble',
      dataAugmentation: this.selectDataAugmentation(requirement, 'varied'),
      trainingConfig: this.createTrainingConfig(requirement, 'ensemble'),
      categories: requirement.categories,
      optimizations: [
        'diverse_architectures',
        'voting_mechanism',
        'model_stacking',
        'confidence_weighting',
        'cross_validation'
      ]
    };

    const plan: OptimizationPlan = {
      id: `plan_ensemble_${Date.now()}`,
      name: 'Ensemble Strategy',
      description: `Combine multiple models with voting for maximum accuracy across ${requirement.categories.length} classes`,
      strategy,
      expectedAccuracy: this.estimateAccuracy(strategy, dataInfo),
      estimatedTime: this.estimateTrainingTime(strategy, dataInfo),
      priority: requirement.priority === 'accuracy' ? 1 : requirement.priority === 'balanced' ? 2 : 3,
      resourceRequirements: {
        memoryMB: 2500,
        estimatedTrainingTime: 20,
        computeIntensity: 'high',
        gpuRequired: true
      },
      successProbability: 0.80
    };

    console.log(`📋 Created ensemble plan: ${plan.name}`);
    return plan;
  }

  /**
   * Initialize strategy templates
   */
  private initializeStrategyTemplates(): void {
    this.strategyTemplates = new Map([
      ['transfer_learning_fast', {
        approach: 'transfer_learning' as const,
        architecture: 'MobileNetV2',
        dataAugmentation: ['horizontal_flip', 'rotation_10'],
        optimizations: ['freeze_base_layers', 'adaptive_lr']
      }],
      ['transfer_learning_accurate', {
        approach: 'transfer_learning' as const,
        architecture: 'ResNet50',
        dataAugmentation: ['horizontal_flip', 'rotation_15', 'zoom_0.1', 'brightness_0.2'],
        optimizations: ['gradual_unfreezing', 'cyclical_lr', 'mixup']
      }],
      ['data_centric_small', {
        approach: 'data_centric' as const,
        architecture: 'EfficientNetB0',
        dataAugmentation: ['all_transforms', 'cutmix', 'mixup', 'autoaugment'],
        optimizations: ['synthetic_generation', 'active_learning']
      }]
    ]);
  }

  /**
   * Select best pre-trained model
   */
  private selectPretrainedModel(requirement: ParsedRequirement, dataInfo: any): string {
    const categoryCount = requirement.categories.length;
    const timeLimit = requirement.timeLimit || 30;
    
    if (requirement.priority === 'speed' || timeLimit < 10) {
      return 'MobileNetV2'; // Fast and lightweight
    }
    
    if (requirement.priority === 'accuracy' || requirement.targetAccuracy > 0.9) {
      return categoryCount > 5 ? 'ResNet50' : 'EfficientNetB3'; // More accurate
    }
    
    // Balanced approach
    return categoryCount > 10 ? 'EfficientNetB1' : 'MobileNetV2';
  }

  /**
   * Select data augmentation strategy
   */
  private selectDataAugmentation(requirement: ParsedRequirement, intensity: 'moderate' | 'aggressive' | 'varied'): string[] {
    const base = ['horizontal_flip', 'rotation_15'];
    
    if (intensity === 'moderate') {
      return [...base, 'zoom_0.1', 'brightness_0.1'];
    }
    
    if (intensity === 'aggressive') {
      return [...base, 'zoom_0.2', 'brightness_0.2', 'contrast_0.2', 'cutout', 'mixup'];
    }
    
    // varied for ensemble
    return [...base, 'zoom_0.15', 'brightness_0.15', 'rotation_20', 'shear_0.1'];
  }

  /**
   * Create training configuration
   */
  private createTrainingConfig(requirement: ParsedRequirement, approach: MLStrategy['approach']): TrainingConfig {
    const timeLimit = requirement.timeLimit || 30;
    const targetAccuracy = requirement.targetAccuracy;
    
    // Base configuration
    let config: TrainingConfig = {
      epochs: 50,
      batchSize: 32,
      learningRate: 0.001,
      optimizer: 'adam',
      lossFunction: 'categorical_crossentropy',
      metrics: ['accuracy', 'top_1_accuracy'],
      earlyStopping: true,
      patience: 5
    };

    // Adjust based on approach
    if (approach === 'transfer_learning') {
      config.learningRate = 0.0001; // Lower for fine-tuning
      config.epochs = Math.min(30, Math.floor(timeLimit * 1.5));
    } else if (approach === 'data_centric') {
      config.epochs = Math.min(100, Math.floor(timeLimit * 2));
      config.batchSize = 16; // Smaller for more augmented data
    } else if (approach === 'ensemble') {
      config.epochs = Math.min(40, Math.floor(timeLimit * 1.2));
      config.learningRate = 0.0005;
    }

    // Adjust for time constraints
    if (requirement.priority === 'speed') {
      config.epochs = Math.min(config.epochs, 20);
      config.patience = 3;
    }

    // Adjust for accuracy requirements
    if (targetAccuracy > 0.9) {
      config.epochs = Math.max(config.epochs, 30);
      config.patience = 8;
    }

    return config;
  }

  /**
   * Estimate expected accuracy
   */
  private estimateAccuracy(strategy: MLStrategy, dataInfo: any): number {
    let baseAccuracy = 0.75; // Base estimate
    
    // Adjust for strategy
    if (strategy.approach === 'transfer_learning') {
      baseAccuracy = 0.82;
    } else if (strategy.approach === 'ensemble') {
      baseAccuracy = 0.85;
    } else if (strategy.approach === 'data_centric') {
      baseAccuracy = 0.78;
    }
    
    // Adjust for data size
    const dataRatio = Math.min(dataInfo.trainingSize / 1000, 1);
    baseAccuracy += dataRatio * 0.1;
    
    // Adjust for category count
    const categoryPenalty = Math.max(0, (strategy.categories.length - 2) * 0.02);
    baseAccuracy -= categoryPenalty;
    
    // Adjust for architecture
    if (strategy.architecture.includes('ResNet') || strategy.architecture.includes('EfficientNet')) {
      baseAccuracy += 0.03;
    }
    
    return Math.min(0.95, Math.max(0.65, baseAccuracy));
  }

  /**
   * Estimate training time
   */
  private estimateTrainingTime(strategy: MLStrategy, dataInfo: any): number {
    let baseTime = 10; // Base time in minutes
    
    // Adjust for approach
    if (strategy.approach === 'transfer_learning') {
      baseTime = 8;
    } else if (strategy.approach === 'ensemble') {
      baseTime = 20;
    } else if (strategy.approach === 'data_centric') {
      baseTime = 12;
    }
    
    // Adjust for data size
    const sizeMultiplier = Math.sqrt(dataInfo.trainingSize / 100);
    baseTime *= sizeMultiplier;
    
    // Adjust for epochs
    const epochMultiplier = strategy.trainingConfig.epochs / 50;
    baseTime *= epochMultiplier;
    
    // Adjust for categories
    const categoryMultiplier = 1 + (strategy.categories.length - 2) * 0.1;
    baseTime *= categoryMultiplier;
    
    return Math.max(5, Math.round(baseTime));
  }

  /**
   * Handle planning request task
   */
  private async handlePlanningRequest(request: PlanningRequest): Promise<AgentResult> {
    try {
      const plans = await this.createOptimizationPlans(request);
      
      return {
        success: true,
        data: { plans },
        metrics: {
          plansGenerated: plans.length,
          averageExpectedAccuracy: plans.reduce((sum, p) => sum + p.expectedAccuracy, 0) / plans.length,
          averageEstimatedTime: plans.reduce((sum, p) => sum + p.estimatedTime, 0) / plans.length
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown planning error',
        timestamp: new Date()
      };
    }
  }
}