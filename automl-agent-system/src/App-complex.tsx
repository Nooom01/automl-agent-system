import { useState, useEffect } from 'react';
import { TensorFlowUtils } from './utils/tensorflow';
import { AgentManager } from './agents/AgentManager';
import './App.css';

function App() {
  const [tfStatus, setTfStatus] = useState<string>('Initializing...');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [agentManager, setAgentManager] = useState<AgentManager | null>(null);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Initialize TensorFlow.js
        await TensorFlowUtils.initialize();
        setTfStatus('Ready');
        setSystemInfo(TensorFlowUtils.getSystemInfo());

        // Initialize AgentManager
        const manager = AgentManager.getInstance();
        setAgentManager(manager);
        
        console.log('✅ System initialization completed');
      } catch (error) {
        console.error('❌ System initialization failed:', error);
        setTfStatus('Failed');
      }
    };

    initializeSystem();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AutoML-Agent System
          </h1>
          <p className="text-lg text-gray-600">
            Intelligent Image Classification with Natural Language
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TensorFlow.js Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              TensorFlow.js Status
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  tfStatus === 'Ready' 
                    ? 'bg-green-100 text-green-800' 
                    : tfStatus === 'Failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {tfStatus}
                </span>
              </div>
              
              {systemInfo && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Backend:</span>
                    <span className="font-medium">{systemInfo.backend}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{systemInfo.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">WebGL:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      systemInfo.features.webgl 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {systemInfo.features.webgl ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tensors:</span>
                    <span className="font-medium">{systemInfo.memory.numTensors}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Agent Manager Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Agent Manager Status
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                  {agentManager ? 'Initialized' : 'Initializing...'}
                </span>
              </div>
              
              {agentManager && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Registered Agents:</span>
                    <span className="font-medium">{agentManager.getAllAgents().length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active Session:</span>
                    <span className="font-medium">
                      {agentManager.getCurrentSession() ? 'Yes' : 'No'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Phase 1: Foundation - Completed ✅
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Completed Tasks:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ React + TypeScript + Vite setup</li>
                <li>✅ Base agent class hierarchy</li>
                <li>✅ AgentManager singleton with event system</li>
                <li>✅ Basic TensorFlow.js integration</li>
                <li>✅ Project structure and TypeScript types</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Next Phase:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>🔄 Natural Language Processing</li>
                <li>🔄 Specialized Agent Implementations</li>
                <li>🔄 Knowledge Base System</li>
                <li>🔄 Basic UI Components</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Development Info */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6 text-center text-sm text-gray-600">
          <p>
            AutoML-Agent System - Phase 1 Foundation Complete
          </p>
          <p className="mt-1">
            Ready for Phase 2: Core Agent Implementation
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;