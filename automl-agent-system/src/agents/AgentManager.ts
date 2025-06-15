/**
 * AgentManager - Central Control System
 * Simplified version without complex dependencies
 */

import { BaseAgent, AgentStatus } from './BaseAgent';

export class AgentManager {
  private static instance: AgentManager;
  private agents: Map<string, BaseAgent> = new Map();

  private constructor() {
    console.log('🚀 AgentManager initialized');
  }

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  registerAgent(agent: BaseAgent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`Agent ${agent.id} already registered`);
      return;
    }

    this.agents.set(agent.id, agent);
    console.log(`📝 Registered agent: ${agent.name} (${agent.id})`);
  }

  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn(`Agent ${agentId} not found`);
      return;
    }

    this.agents.delete(agentId);
    console.log(`📝 Unregistered agent: ${agent.name} (${agentId})`);
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  async initializeAllAgents(): Promise<void> {
    console.log('🚀 Initializing all agents...');
    
    const initPromises = Array.from(this.agents.values()).map(agent => 
      agent.initialize().catch(error => {
        console.error(`Failed to initialize agent ${agent.id}:`, error);
        return false;
      })
    );

    await Promise.all(initPromises);
    console.log('✅ All agents initialization completed');
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down AgentManager...');
    
    const cleanupPromises = Array.from(this.agents.values()).map(agent => 
      agent.cleanup().catch(error => {
        console.error(`Failed to cleanup agent ${agent.id}:`, error);
        return false;
      })
    );

    await Promise.all(cleanupPromises);
    this.agents.clear();
    
    console.log('✅ AgentManager shutdown completed');
  }
}