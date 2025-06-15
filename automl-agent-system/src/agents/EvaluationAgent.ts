import { BaseAgent, AgentTask, AgentResult } from './BaseAgent';
import * as tf from '@tensorflow/tfjs';

interface EvaluationRequest {
  model: tf.LayersModel;
  testData: {
    x: tf.Tensor;
    y: tf.Tensor;
  };
  categories: string[];
  metrics?: string[];
}

interface EvaluationResult {
  accuracy: number;
  loss: number;
  confusionMatrix: number[][];
  perClassMetrics: {
    category: string;
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }[];
  overallMetrics: {
    avgPrecision: number;
    avgRecall: number;
    avgF1Score: number;
    totalSamples: number;
  };
  performanceAnalysis: {
    strongestClass: string;
    weakestClass: string;
    recommendations: string[];
  };
}

export class EvaluationAgent extends BaseAgent {
  constructor() {
    super('evaluation-agent', 'Evaluation Agent');
  }

  protected async onInitialize(): Promise<void> {
    console.log('EvaluationAgent initialized');
  }

  protected async onExecute(task: AgentTask): Promise<AgentResult> {
    console.log('EvaluationAgent executing task:', task.type);

    const mockResult: EvaluationResult = {
      accuracy: 0.925,
      loss: 0.234,
      confusionMatrix: [
        [920, 80],
        [70, 930]
      ],
      perClassMetrics: [
        {
          category: 'dogs',
          precision: 0.929,
          recall: 0.920,
          f1Score: 0.924,
          support: 1000
        },
        {
          category: 'cats',
          precision: 0.921,
          recall: 0.930,
          f1Score: 0.925,
          support: 1000
        }
      ],
      overallMetrics: {
        avgPrecision: 0.925,
        avgRecall: 0.925,
        avgF1Score: 0.925,
        totalSamples: 2000
      },
      performanceAnalysis: {
        strongestClass: 'cats',
        weakestClass: 'dogs',
        recommendations: [
          'Model performs well overall with 92.5% accuracy',
          'Consider augmenting dog images for better performance',
          'Confusion mainly occurs between similar breeds'
        ]
      }
    };

    return {
      success: true,
      data: mockResult,
      agentId: this.id,
      timestamp: new Date()
    };
  }

  protected async onCleanup(): Promise<void> {
    console.log('EvaluationAgent cleanup');
  }

  async evaluateModel(request: EvaluationRequest): Promise<EvaluationResult> {
    const { model, testData, categories, metrics = ['accuracy', 'precision', 'recall', 'f1'] } = request;

    // Basic evaluation
    const evalResult = model.evaluate(testData.x, testData.y) as tf.Scalar[];
    const loss = await evalResult[0].data();
    const accuracy = await evalResult[1].data();

    // Get predictions for confusion matrix
    const predictions = model.predict(testData.x) as tf.Tensor;
    const predClasses = predictions.argMax(-1);
    const trueClasses = testData.y.argMax(-1);

    // Calculate confusion matrix
    const confusionMatrix = await this.calculateConfusionMatrix(
      predClasses,
      trueClasses,
      categories.length
    );

    // Calculate per-class metrics
    const perClassMetrics = this.calculatePerClassMetrics(confusionMatrix, categories);

    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(perClassMetrics, testData.y.shape[0]);

    // Performance analysis
    const performanceAnalysis = this.analyzePerformance(perClassMetrics, confusionMatrix);

    // Clean up tensors
    evalResult.forEach(t => t.dispose());
    predictions.dispose();
    predClasses.dispose();
    trueClasses.dispose();

    return {
      accuracy: accuracy[0],
      loss: loss[0],
      confusionMatrix,
      perClassMetrics,
      overallMetrics,
      performanceAnalysis
    };
  }

  private async calculateConfusionMatrix(
    predictions: tf.Tensor1D,
    labels: tf.Tensor1D,
    numClasses: number
  ): Promise<number[][]> {
    const predArray = await predictions.array();
    const labelArray = await labels.array();

    const matrix: number[][] = Array(numClasses).fill(null)
      .map(() => Array(numClasses).fill(0));

    for (let i = 0; i < predArray.length; i++) {
      matrix[labelArray[i]][predArray[i]]++;
    }

    return matrix;
  }

  private calculatePerClassMetrics(
    confusionMatrix: number[][],
    categories: string[]
  ): EvaluationResult['perClassMetrics'] {
    const numClasses = categories.length;
    const metrics = [];

    for (let i = 0; i < numClasses; i++) {
      const truePositive = confusionMatrix[i][i];
      const falsePositive = confusionMatrix.reduce((sum, row, idx) => 
        idx !== i ? sum + row[i] : sum, 0);
      const falseNegative = confusionMatrix[i].reduce((sum, val, idx) => 
        idx !== i ? sum + val : sum, 0);
      const support = confusionMatrix[i].reduce((sum, val) => sum + val, 0);

      const precision = truePositive / (truePositive + falsePositive) || 0;
      const recall = truePositive / (truePositive + falseNegative) || 0;
      const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

      metrics.push({
        category: categories[i],
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        f1Score: Math.round(f1Score * 1000) / 1000,
        support
      });
    }

    return metrics;
  }

  private calculateOverallMetrics(
    perClassMetrics: EvaluationResult['perClassMetrics'],
    totalSamples: number
  ): EvaluationResult['overallMetrics'] {
    const avgPrecision = perClassMetrics.reduce((sum, m) => sum + m.precision, 0) / perClassMetrics.length;
    const avgRecall = perClassMetrics.reduce((sum, m) => sum + m.recall, 0) / perClassMetrics.length;
    const avgF1Score = perClassMetrics.reduce((sum, m) => sum + m.f1Score, 0) / perClassMetrics.length;

    return {
      avgPrecision: Math.round(avgPrecision * 1000) / 1000,
      avgRecall: Math.round(avgRecall * 1000) / 1000,
      avgF1Score: Math.round(avgF1Score * 1000) / 1000,
      totalSamples
    };
  }

  private analyzePerformance(
    perClassMetrics: EvaluationResult['perClassMetrics'],
    confusionMatrix: number[][]
  ): EvaluationResult['performanceAnalysis'] {
    // Find strongest and weakest classes
    const sortedByF1 = [...perClassMetrics].sort((a, b) => b.f1Score - a.f1Score);
    const strongestClass = sortedByF1[0].category;
    const weakestClass = sortedByF1[sortedByF1.length - 1].category;

    // Generate recommendations
    const recommendations: string[] = [];

    // Overall performance
    const avgF1 = perClassMetrics.reduce((sum, m) => sum + m.f1Score, 0) / perClassMetrics.length;
    if (avgF1 >= 0.9) {
      recommendations.push(`Excellent performance with ${Math.round(avgF1 * 100)}% average F1 score`);
    } else if (avgF1 >= 0.8) {
      recommendations.push(`Good performance with ${Math.round(avgF1 * 100)}% average F1 score`);
    } else {
      recommendations.push(`Model needs improvement - ${Math.round(avgF1 * 100)}% average F1 score`);
    }

    // Class imbalance
    const f1Variance = this.calculateVariance(perClassMetrics.map(m => m.f1Score));
    if (f1Variance > 0.01) {
      recommendations.push('Significant performance variance between classes detected');
    }

    // Specific class issues
    perClassMetrics.forEach(metric => {
      if (metric.precision < 0.8) {
        recommendations.push(`Improve precision for ${metric.category} - too many false positives`);
      }
      if (metric.recall < 0.8) {
        recommendations.push(`Improve recall for ${metric.category} - too many false negatives`);
      }
    });

    // Confusion patterns
    for (let i = 0; i < confusionMatrix.length; i++) {
      for (let j = 0; j < confusionMatrix[i].length; j++) {
        if (i !== j && confusionMatrix[i][j] > confusionMatrix[i][i] * 0.1) {
          recommendations.push(
            `High confusion between ${perClassMetrics[i].category} and ${perClassMetrics[j].category}`
          );
        }
      }
    }

    return {
      strongestClass,
      weakestClass,
      recommendations: recommendations.slice(0, 5) // Top 5 recommendations
    };
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length;
  }

  async crossValidate(
    model: tf.LayersModel,
    data: { x: tf.Tensor, y: tf.Tensor },
    folds: number = 5
  ): Promise<{
    meanAccuracy: number;
    stdAccuracy: number;
    foldResults: number[];
  }> {
    const numSamples = data.x.shape[0];
    const foldSize = Math.floor(numSamples / folds);
    const accuracies: number[] = [];

    for (let i = 0; i < folds; i++) {
      const startIdx = i * foldSize;
      const endIdx = i === folds - 1 ? numSamples : (i + 1) * foldSize;

      // Create validation fold
      const valX = data.x.slice([startIdx, 0], [endIdx - startIdx, -1]);
      const valY = data.y.slice([startIdx, 0], [endIdx - startIdx, -1]);

      // Create training folds (everything except validation)
      const trainX1 = startIdx > 0 ? data.x.slice([0, 0], [startIdx, -1]) : null;
      const trainX2 = endIdx < numSamples ? data.x.slice([endIdx, 0], [numSamples - endIdx, -1]) : null;
      
      const trainY1 = startIdx > 0 ? data.y.slice([0, 0], [startIdx, -1]) : null;
      const trainY2 = endIdx < numSamples ? data.y.slice([endIdx, 0], [numSamples - endIdx, -1]) : null;

      // Concatenate training data
      const trainX = trainX1 && trainX2 ? tf.concat([trainX1, trainX2], 0) : (trainX1 || trainX2)!;
      const trainY = trainY1 && trainY2 ? tf.concat([trainY1, trainY2], 0) : (trainY1 || trainY2)!;

      // Clone and train model
      const foldModel = await this.cloneModel(model);
      await foldModel.fit(trainX, trainY, {
        epochs: 10,
        verbose: 0
      });

      // Evaluate on validation fold
      const evalResult = foldModel.evaluate(valX, valY) as tf.Scalar[];
      const accuracy = await evalResult[1].data();
      accuracies.push(accuracy[0]);

      // Clean up
      valX.dispose();
      valY.dispose();
      trainX1?.dispose();
      trainX2?.dispose();
      trainY1?.dispose();
      trainY2?.dispose();
      trainX.dispose();
      trainY.dispose();
      evalResult.forEach(t => t.dispose());
    }

    const meanAccuracy = accuracies.reduce((sum, a) => sum + a, 0) / folds;
    const variance = accuracies.reduce((sum, a) => sum + Math.pow(a - meanAccuracy, 2), 0) / folds;
    const stdAccuracy = Math.sqrt(variance);

    return {
      meanAccuracy: Math.round(meanAccuracy * 1000) / 1000,
      stdAccuracy: Math.round(stdAccuracy * 1000) / 1000,
      foldResults: accuracies.map(a => Math.round(a * 1000) / 1000)
    };
  }

  private async cloneModel(model: tf.LayersModel): Promise<tf.LayersModel> {
    const modelConfig = model.toJSON();
    const clonedModel = await tf.loadLayersModel({
      load: async () => modelConfig
    } as any);
    
    clonedModel.compile({
      optimizer: model.optimizer,
      loss: model.loss,
      metrics: model.metrics
    });

    return clonedModel;
  }
}