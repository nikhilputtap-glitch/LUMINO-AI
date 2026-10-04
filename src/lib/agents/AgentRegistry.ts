import { AgentId } from './types';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  capabilities: string[];
}

export const AgentRegistry: Record<AgentId, AgentDefinition> = {
  research_agent: {
    id: 'research_agent',
    name: 'Research Agent',
    description: 'Researches questions and gathers information.',
    capabilities: ['web research', 'source analysis', 'fact gathering']
  },
  coding_agent: {
    id: 'coding_agent',
    name: 'Coding Agent',
    description: 'Generates, reviews, and debugs code.',
    capabilities: ['code generation', 'debugging', 'code review']
  },
  planning_agent: {
    id: 'planning_agent',
    name: 'Planning Agent',
    description: 'Decomposes goals into projects and tasks.',
    capabilities: ['planning', 'prioritization', 'task decomposition']
  },
  task_agent: {
    id: 'task_agent',
    name: 'Task Agent',
    description: 'Manages tasks.',
    capabilities: ['create', 'update', 'prioritize']
  },
  calendar_agent: {
    id: 'calendar_agent',
    name: 'Calendar Agent',
    description: 'Manages calendar events.',
    capabilities: ['read', 'suggest', 'create']
  },
  meeting_agent: {
    id: 'meeting_agent',
    name: 'Meeting Agent',
    description: 'Prepares for and summarizes meetings.',
    capabilities: ['prepare', 'summarize', 'follow-up']
  },
  knowledge_agent: {
    id: 'knowledge_agent',
    name: 'Knowledge Agent',
    description: 'Retrieves and connects user knowledge.',
    capabilities: ['search', 'retrieve', 'summarize']
  },
  writing_agent: {
    id: 'writing_agent',
    name: 'Writing Agent',
    description: 'Drafts emails and documents.',
    capabilities: ['drafting', 'summarizing', 'editing']
  },
  analysis_agent: {
    id: 'analysis_agent',
    name: 'Analysis Agent',
    description: 'Analyzes information and identifies patterns.',
    capabilities: ['compare', 'analyze', 'risk detection']
  },
  verification_agent: {
    id: 'verification_agent',
    name: 'Verification Agent',
    description: 'Verifies outputs for consistency and accuracy.',
    capabilities: ['consistency check', 'accuracy verification']
  }
};
