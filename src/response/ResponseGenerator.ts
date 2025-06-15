import { ParsedRequirement } from '../types';
import { ExecutionResult } from '../execution/ParallelExecutor';
import { KnowledgeBase, KnowledgeEntry } from '../knowledge/KnowledgeBase';

export interface ResponseOptions {
  verbosity: 'minimal' | 'normal' | 'detailed';
  includeRecommendations: boolean;
  includeTechnicalDetails: boolean;
  format: 'text' | 'markdown' | 'json';
}

export class ResponseGenerator {
  private knowledgeBase: KnowledgeBase;

  constructor() {
    this.knowledgeBase = new KnowledgeBase();
  }

  generateWelcomeMessage(): string {
    return `🤖 **AutoML Agent System Ready**

I can help you create custom image classifiers using natural language. Just tell me what you want to classify!

**Example requests:**
- "Create a classifier for dogs vs cats with 95% accuracy"
- "Build a model to identify 10 types of flowers"
- "I need to classify product defects in manufacturing images"

**What I'll do:**
1. 📊 Analyze your requirements
2. 🔄 Design multiple optimization strategies
3. 🚀 Train models in parallel
4. 📈 Compare results and recommend the best

**Ready to start?** Tell me what you'd like to classify!`;
  }

  generateRequirementConfirmation(
    requirement: ParsedRequirement,
    options: Partial<ResponseOptions> = {}
  ): string {
    const { verbosity = 'normal', format = 'markdown' } = options;

    if (format === 'json') {
      return JSON.stringify(requirement, null, 2);
    }

    let response = `✅ **Requirement Understood**\n\n`;
    
    response += `**Task:** ${this.formatTaskType(requirement.taskType)} Classification\n`;
    response += `**Categories:** ${requirement.categories.join(', ')}\n`;
    
    if (requirement.constraints.accuracy) {
      response += `**Target Accuracy:** ${requirement.constraints.accuracy}%\n`;
    }
    
    if (requirement.constraints.trainingTime) {
      response += `**Time Limit:** ${requirement.constraints.trainingTime} seconds\n`;
    }

    if (verbosity === 'detailed') {
      response += `\n**Technical Details:**\n`;
      response += `- Task Type: ${requirement.taskType}\n`;
      response += `- Number of Classes: ${requirement.categories.length}\n`;
      response += `- Binary Classification: ${requirement.categories.length === 2 ? 'Yes' : 'No'}\n`;
      
      if (requirement.datasetInfo.size) {
        response += `- Dataset Size: ${requirement.datasetInfo.size} samples\n`;
      }
    }

    response += `\n*Starting optimization process...*`;

    return response;
  }

  generateProgressUpdate(
    phase: string,
    progress: number,
    message: string,
    options: Partial<ResponseOptions> = {}
  ): string {
    const { verbosity = 'normal' } = options;

    if (verbosity === 'minimal') {
      return `${phase}: ${progress}%`;
    }

    const progressBar = this.createProgressBar(progress);
    let response = `**${this.formatPhase(phase)}** ${progressBar} ${progress}%\n`;
    
    if (verbosity === 'detailed') {
      response += `└─ ${message}\n`;
    }

    return response;
  }

  generateStrategyComparison(
    results: ExecutionResult[],
    bestStrategy: ExecutionResult,
    options: Partial<ResponseOptions> = {}
  ): string {
    const { 
      verbosity = 'normal', 
      includeRecommendations = true,
      includeTechnicalDetails = false 
    } = options;

    let response = `📊 **Strategy Comparison Results**\n\n`;

    // Summary table
    response += `| Strategy | Accuracy | Training Time | Model Size |\n`;
    response += `|----------|----------|---------------|------------|\n`;
    
    results
      .filter(r => r.success)
      .sort((a, b) => b.finalMetrics.accuracy - a.finalMetrics.accuracy)
      .forEach(result => {
        const isWinner = result.strategyId === bestStrategy.strategyId;
        const marker = isWinner ? ' 🏆' : '';
        response += `| ${this.formatStrategyName(result.strategyId)}${marker} | `;
        response += `${(result.finalMetrics.accuracy * 100).toFixed(1)}% | `;
        response += `${this.formatTime(result.finalMetrics.trainingTime)} | `;
        response += `${result.finalMetrics.modelSize} MB |\n`;
      });

    response += `\n**🎯 Winner: ${this.formatStrategyName(bestStrategy.strategyId)}**\n`;
    response += `- Achieved ${(bestStrategy.finalMetrics.accuracy * 100).toFixed(1)}% accuracy\n`;

    if (verbosity === 'detailed' && includeTechnicalDetails) {
      response += `\n**Technical Details:**\n`;
      response += `- Final Loss: ${bestStrategy.finalMetrics.loss.toFixed(4)}\n`;
      response += `- Total Parameters: ~${this.estimateParameters(bestStrategy.finalMetrics.modelSize)}M\n`;
      response += `- Training Epochs: ${this.estimateEpochs(bestStrategy.finalMetrics.trainingTime)}\n`;
    }

    if (includeRecommendations) {
      response += `\n**💡 Recommendations:**\n`;
      const recommendations = this.generateRecommendations(results, bestStrategy);
      recommendations.forEach(rec => {
        response += `- ${rec}\n`;
      });
    }

    return response;
  }

  generateErrorMessage(
    error: Error | string,
    context: string,
    options: Partial<ResponseOptions> = {}
  ): string {
    const { verbosity = 'normal', includeRecommendations = true } = options;
    const errorMessage = error instanceof Error ? error.message : error;

    let response = `❌ **Error in ${context}**\n\n`;
    response += `**Issue:** ${errorMessage}\n`;

    if (includeRecommendations) {
      const solutions = this.knowledgeBase.suggestSolutions(errorMessage);
      
      if (solutions.actions.length > 0) {
        response += `\n**🔧 Suggested Solutions:**\n`;
        solutions.actions.forEach((action, idx) => {
          response += `${idx + 1}. ${action}\n`;
        });
      }

      if (verbosity === 'detailed' && solutions.primary.length > 0) {
        response += `\n**📚 Related Knowledge:**\n`;
        solutions.primary.forEach(entry => {
          response += `- **${entry.title}**: ${entry.content.substring(0, 100)}...\n`;
        });
      }
    }

    response += `\n*Please try again or adjust your requirements.*`;

    return response;
  }

  generateFinalReport(
    requirement: ParsedRequirement,
    result: ExecutionResult,
    options: Partial<ResponseOptions> = {}
  ): string {
    const { 
      verbosity = 'normal',
      includeTechnicalDetails = false,
      includeRecommendations = true 
    } = options;

    let response = `🎉 **Model Training Complete!**\n\n`;

    // Summary
    response += `**✅ Successfully created ${requirement.taskType} classifier**\n`;
    response += `- Categories: ${requirement.categories.join(', ')}\n`;
    response += `- Final Accuracy: ${(result.finalMetrics.accuracy * 100).toFixed(1)}%\n`;
    
    if (requirement.constraints.accuracy) {
      const metTarget = result.finalMetrics.accuracy * 100 >= requirement.constraints.accuracy;
      response += `- Target Accuracy: ${requirement.constraints.accuracy}% `;
      response += metTarget ? '✅ Achieved!' : '❌ Not met';
      response += '\n';
    }

    // Performance metrics
    response += `\n**📊 Performance Metrics:**\n`;
    response += `- Training Time: ${this.formatTime(result.finalMetrics.trainingTime)}\n`;
    response += `- Model Size: ${result.finalMetrics.modelSize} MB\n`;
    response += `- Strategy Used: ${this.formatStrategyName(result.strategyId)}\n`;

    if (includeTechnicalDetails && verbosity === 'detailed') {
      response += `\n**🔬 Technical Details:**\n`;
      response += `- Final Loss: ${result.finalMetrics.loss.toFixed(4)}\n`;
      response += `- Architecture: ${this.inferArchitecture(result.strategyId)}\n`;
      response += `- Optimization: ${this.inferOptimizer(result.strategyId)}\n`;
    }

    if (includeRecommendations) {
      response += `\n**🚀 Next Steps:**\n`;
      response += `1. Test the model with new images\n`;
      response += `2. Monitor performance in production\n`;
      response += `3. Retrain periodically with new data\n`;
      
      if (result.finalMetrics.accuracy < 0.9) {
        response += `4. Consider collecting more training data\n`;
        response += `5. Try ensemble methods for better accuracy\n`;
      }
    }

    response += `\n**Ready to use your model!** 🎯`;

    return response;
  }

  generateKnowledgeResponse(
    query: string,
    entries: KnowledgeEntry[],
    options: Partial<ResponseOptions> = {}
  ): string {
    const { verbosity = 'normal' } = options;

    if (entries.length === 0) {
      return `No relevant information found for "${query}". Try rephrasing your question.`;
    }

    let response = `📚 **Knowledge Base Results**\n\n`;

    entries.forEach((entry, idx) => {
      response += `**${idx + 1}. ${entry.title}**\n`;
      
      if (verbosity === 'minimal') {
        response += `${entry.content.substring(0, 150)}...\n\n`;
      } else {
        response += `${entry.content}\n`;
        
        if (entry.examples && entry.examples.length > 0) {
          response += `\n*Examples:*\n`;
          entry.examples.slice(0, verbosity === 'detailed' ? 5 : 2).forEach(ex => {
            response += `- ${ex}\n`;
          });
        }
        
        response += '\n';
      }
    });

    return response;
  }

  // Helper methods
  private formatTaskType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private formatPhase(phase: string): string {
    const phaseMap: Record<string, string> = {
      'data': '📊 Data Processing',
      'model': '🏗️ Model Design',
      'training': '🚀 Training',
      'evaluation': '📈 Evaluation'
    };
    return phaseMap[phase] || phase;
  }

  private formatStrategyName(strategyId: string): string {
    const parts = strategyId.split('-');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(1)}m`;
    } else {
      return `${(seconds / 3600).toFixed(1)}h`;
    }
  }

  private createProgressBar(progress: number): string {
    const filled = Math.floor(progress / 10);
    const empty = 10 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  private estimateParameters(modelSizeMB: number): number {
    // Rough estimate: 4 bytes per parameter
    return Math.round(modelSizeMB * 1024 * 1024 / 4 / 1000000);
  }

  private estimateEpochs(trainingTime: number): number {
    // Rough estimate based on typical training times
    return Math.round(trainingTime / 10);
  }

  private inferArchitecture(strategyId: string): string {
    if (strategyId.includes('transfer')) {
      return 'Transfer Learning (MobileNetV2 base)';
    } else if (strategyId.includes('ensemble')) {
      return 'Ensemble (Multiple CNNs)';
    } else {
      return 'Custom CNN Architecture';
    }
  }

  private inferOptimizer(strategyId: string): string {
    if (strategyId.includes('fast')) {
      return 'Adam (lr=0.001)';
    } else {
      return 'Adam with Learning Rate Scheduling';
    }
  }

  private generateRecommendations(
    results: ExecutionResult[],
    bestStrategy: ExecutionResult
  ): string[] {
    const recommendations: string[] = [];

    // Accuracy-based recommendations
    if (bestStrategy.finalMetrics.accuracy >= 0.95) {
      recommendations.push('Excellent accuracy achieved! Consider optimizing for speed or size.');
    } else if (bestStrategy.finalMetrics.accuracy >= 0.90) {
      recommendations.push('Good accuracy. Fine-tuning or more data could push it higher.');
    } else {
      recommendations.push('Consider collecting more diverse training data.');
      recommendations.push('Try ensemble methods or deeper architectures.');
    }

    // Speed recommendations
    const fastestResult = results
      .filter(r => r.success)
      .sort((a, b) => a.finalMetrics.trainingTime - b.finalMetrics.trainingTime)[0];
    
    if (fastestResult && fastestResult.strategyId !== bestStrategy.strategyId) {
      const speedup = bestStrategy.finalMetrics.trainingTime / fastestResult.finalMetrics.trainingTime;
      if (speedup > 2) {
        recommendations.push(
          `${this.formatStrategyName(fastestResult.strategyId)} is ${speedup.toFixed(1)}x faster ` +
          `with ${(fastestResult.finalMetrics.accuracy * 100).toFixed(1)}% accuracy`
        );
      }
    }

    // Model size recommendations
    if (bestStrategy.finalMetrics.modelSize > 50) {
      recommendations.push('Consider model compression techniques for deployment.');
    }

    return recommendations.slice(0, 3);
  }
}