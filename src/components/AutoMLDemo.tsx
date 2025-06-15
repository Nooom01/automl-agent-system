import { useState } from 'react';
import { RequirementParser } from '../nlp/RequirementParser';
import { ResponseGenerator } from '../response/ResponseGenerator';
import { ExecutionProgress } from '../execution/ParallelExecutor';

interface DemoState {
  step: number;
  isRunning: boolean;
  requirement: any;
  strategies: string[];
  results: any[];
  finalResult: any;
}

export function AutoMLDemo() {
  const [demoState, setDemoState] = useState<DemoState>({
    step: 0,
    isRunning: false,
    requirement: null,
    strategies: [],
    results: [],
    finalResult: null
  });
  
  const [executionProgress, setExecutionProgress] = useState<ExecutionProgress[]>([]);
  const [selectedExample, setSelectedExample] = useState<number>(0);

  const examples = [
    {
      text: "Create a classifier for dogs vs cats with 95% accuracy",
      description: "Binary classification with high accuracy target",
      expected: { accuracy: 0.96, categories: ['dogs', 'cats'] }
    },
    {
      text: "Build a fast model to identify 5 types of flowers",
      description: "Multi-class classification optimized for speed",
      expected: { accuracy: 0.89, categories: ['roses', 'tulips', 'daisies', 'sunflowers', 'lilies'] }
    },
    {
      text: "I need to classify medical images for cancer detection",
      description: "High-stakes binary classification",
      expected: { accuracy: 0.94, categories: ['benign', 'malignant'] }
    },
    {
      text: "Classify product defects in manufacturing with 90% accuracy in under 5 minutes",
      description: "Industrial application with time constraints",
      expected: { accuracy: 0.92, categories: ['defective', 'normal'] }
    }
  ];

  const runFullDemo = async () => {
    if (demoState.isRunning) return;
    
    const example = examples[selectedExample];
    
    setDemoState(prev => ({ ...prev, isRunning: true, step: 1 }));
    
    // Step 1: Parse requirement
    await new Promise(resolve => setTimeout(resolve, 1000));
    const parser = new RequirementParser();
    const requirement = parser.parseRequirement(example.text);
    setDemoState(prev => ({ ...prev, requirement, step: 2 }));
    
    // Step 2: Generate strategies
    await new Promise(resolve => setTimeout(resolve, 1500));
    const strategies = ['transfer-learning', 'data-centric', 'ensemble'];
    setDemoState(prev => ({ ...prev, strategies, step: 3 }));
    
    // Step 3: Execute strategies in parallel
    await simulateParallelExecution(strategies, requirement);
    
    // Step 4: Generate results
    const mockResults = strategies.map((strategy, idx) => ({
      strategyId: strategy,
      success: true,
      finalMetrics: {
        accuracy: example.expected.accuracy - 0.02 + (idx * 0.01),
        loss: 0.15 + (idx * 0.05),
        trainingTime: 120 + (idx * 30),
        modelSize: 20 + (idx * 5)
      }
    }));
    
    setDemoState(prev => ({ 
      ...prev, 
      results: mockResults, 
      finalResult: mockResults[0],
      step: 5 
    }));
    
    // Complete demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    setDemoState(prev => ({ ...prev, step: 6 }));
    
    // Reset after showing results
    setTimeout(() => {
      setDemoState({
        step: 0,
        isRunning: false,
        requirement: null,
        strategies: [],
        results: [],
        finalResult: null
      });
      setExecutionProgress([]);
    }, 5000);
  };

  const simulateParallelExecution = async (strategies: string[], requirement: any) => {
    const phases = ['data', 'model', 'training', 'evaluation'] as const;
    
    for (const phase of phases) {
      // Start all strategies for this phase
      const progressStates = strategies.map(strategy => ({
        strategyId: strategy,
        phase,
        progress: 0,
        status: 'running' as const,
        message: `${phase} processing for ${strategy}...`
      }));
      
      setExecutionProgress(progressStates);
      
      // Simulate progress for all strategies
      for (let progress = 25; progress <= 100; progress += 25) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setExecutionProgress(prev => 
          prev.map(p => ({ ...p, progress }))
        );
      }
      
      // Mark phase complete
      setExecutionProgress(prev => 
        prev.map(p => ({ ...p, status: 'completed' as const }))
      );
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setDemoState(prev => ({ ...prev, step: 4 }));
    setExecutionProgress([]);
  };

  const formatStrategyName = (strategy: string) => {
    return strategy.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPhaseIcon = (phase: string) => {
    const icons = {
      data: '📊',
      model: '🏗️',
      training: '🚀',
      evaluation: '📈'
    };
    return icons[phase as keyof typeof icons] || '⚙️';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-3xl mr-3">🎬</span>
        Complete AutoML Pipeline Demo
      </h2>

      {/* Example Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Choose an Example:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examples.map((example, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedExample(idx)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedExample === idx
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-medium text-gray-800 mb-1">
                "{example.text}"
              </div>
              <div className="text-sm text-gray-600">
                {example.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Run Demo Button */}
      <div className="text-center mb-6">
        <button
          onClick={runFullDemo}
          disabled={demoState.isRunning}
          className={`px-8 py-3 rounded-lg font-semibold text-lg ${
            demoState.isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
          }`}
        >
          {demoState.isRunning ? 'Running Full Demo...' : 'Run Complete Demo'}
        </button>
      </div>

      {/* Demo Steps */}
      {demoState.isRunning && (
        <div className="space-y-4">
          {/* Step 1: Requirement Parsing */}
          <div className={`p-4 rounded-lg transition-all ${
            demoState.step >= 1 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center">
                <span className="text-2xl mr-2">🧠</span>
                Step 1: Natural Language Processing
              </h4>
              {demoState.step >= 1 && <span className="text-green-600">✅</span>}
            </div>
            {demoState.requirement && (
              <div className="mt-2 text-sm">
                <div>Task: {demoState.requirement.taskType}</div>
                <div>Categories: {demoState.requirement.categories.join(', ')}</div>
                <div>Target Accuracy: {demoState.requirement.constraints.accuracy}%</div>
              </div>
            )}
          </div>

          {/* Step 2: Strategy Planning */}
          <div className={`p-4 rounded-lg transition-all ${
            demoState.step >= 2 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center">
                <span className="text-2xl mr-2">📋</span>
                Step 2: Strategy Generation
              </h4>
              {demoState.step >= 2 && <span className="text-green-600">✅</span>}
            </div>
            {demoState.strategies.length > 0 && (
              <div className="mt-2 flex space-x-2">
                {demoState.strategies.map(strategy => (
                  <span key={strategy} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {formatStrategyName(strategy)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Parallel Execution */}
          <div className={`p-4 rounded-lg transition-all ${
            demoState.step >= 3 ? 'bg-green-50 border-l-4 border-green-500' : 
            demoState.step === 3 ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center">
                <span className="text-2xl mr-2">⚡</span>
                Step 3: Parallel Execution
              </h4>
              {demoState.step > 3 && <span className="text-green-600">✅</span>}
            </div>
            
            {executionProgress.length > 0 && (
              <div className="mt-3 space-y-2">
                {executionProgress.map((progress, idx) => (
                  <div key={`${progress.strategyId}-${progress.phase}`} className="flex items-center space-x-3">
                    <span className="text-sm w-20">{getPhaseIcon(progress.phase)} {progress.phase}</span>
                    <span className="text-sm w-24">{formatStrategyName(progress.strategyId)}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    <span className="text-sm w-12">{progress.progress}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 4: Results Comparison */}
          <div className={`p-4 rounded-lg transition-all ${
            demoState.step >= 4 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Step 4: Results Analysis
              </h4>
              {demoState.step >= 4 && <span className="text-green-600">✅</span>}
            </div>
            
            {demoState.results.length > 0 && (
              <div className="mt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Strategy</th>
                      <th className="text-left py-1">Accuracy</th>
                      <th className="text-left py-1">Time</th>
                      <th className="text-left py-1">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoState.results.map((result, idx) => (
                      <tr key={result.strategyId} className={idx === 0 ? 'bg-yellow-50' : ''}>
                        <td className="py-1">
                          {formatStrategyName(result.strategyId)}
                          {idx === 0 && <span className="ml-2 text-yellow-600">🏆</span>}
                        </td>
                        <td className="py-1">{(result.finalMetrics.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-1">{result.finalMetrics.trainingTime}s</td>
                        <td className="py-1">{result.finalMetrics.modelSize}MB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Step 5: Final Report */}
          {demoState.step >= 5 && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500">
              <h4 className="font-semibold flex items-center mb-2">
                <span className="text-2xl mr-2">🎉</span>
                Final Result
              </h4>
              {demoState.finalResult && (
                <div className="text-sm space-y-1">
                  <div>✅ <strong>Success!</strong> Model created with {(demoState.finalResult.finalMetrics.accuracy * 100).toFixed(1)}% accuracy</div>
                  <div>🚀 Best Strategy: {formatStrategyName(demoState.finalResult.strategyId)}</div>
                  <div>⏱️ Training Time: {demoState.finalResult.finalMetrics.trainingTime} seconds</div>
                  <div>📦 Model Size: {demoState.finalResult.finalMetrics.modelSize} MB</div>
                  <div className="mt-2 text-green-700 font-medium">
                    🎯 Ready for deployment and real-world testing!
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Demo Complete Message */}
      {demoState.step === 6 && (
        <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <h3 className="text-xl font-bold text-purple-800 mb-2">
            🎊 Demo Complete!
          </h3>
          <p className="text-purple-700">
            This is how the AutoML-Agent system works end-to-end. 
            Try the interactive chat above for a real experience!
          </p>
        </div>
      )}
    </div>
  );
}