export type AgentId = 
  | 'research_agent' 
  | 'coding_agent' 
  | 'planning_agent' 
  | 'task_agent' 
  | 'calendar_agent' 
  | 'meeting_agent' 
  | 'knowledge_agent' 
  | 'writing_agent' 
  | 'analysis_agent'
  | 'verification_agent';

export type AgentTaskStatus = 'pending' | 'working' | 'completed' | 'failed';

export interface AgentResult {
  status: AgentTaskStatus;
  summary: string;
  data: any;
  sources?: string[];
  actions?: any[];
  warnings?: string[];
  confidence: 'high' | 'medium' | 'low';
  errors?: string[];
}

export interface AgentTask {
  id: string;
  agentId: AgentId;
  description: string;
  dependsOn?: string[];
  status: AgentTaskStatus;
  result?: AgentResult;
}

export interface AgentWorkflow {
  id: string;
  goal: string;
  tasks: AgentTask[];
  status: AgentTaskStatus;
}
