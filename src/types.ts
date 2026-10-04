export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    programDetails?: {
      language?: string;
      code?: string;
      output?: string;
    };
    action?: any;
    suggestedFollowUps?: string[];
    timestamp: string;
    agentVerification?: AgentVerificationReport;
  }>;
  summary?: string;
  keyTakeaways?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  primaryGoal: string;
  currentFocus: string;
  theme: 'dark' | 'light';
  timezone: string;
  autonomyLevel: 0 | 1 | 2 | 3 | 4;
}

export interface Project {
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  deadline?: string;
  keyDecisions?: Array<{ id: string; decision: string; date: string; impact: string }>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  tasksCount?: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: 'career' | 'health' | 'learning' | 'startup' | 'personal';
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'completed' | 'paused';
  progress: number;
  targetOutcome?: string;
  milestones?: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  goalId?: string;
  projectId?: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  estimatedMinutes?: number;
  energyLevel?: 'high' | 'medium' | 'low';
  contextCategory?: 'deep-work' | 'quick-win' | 'communication' | 'admin';
  blockedReason?: string;
  dependencyIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Action {
  type: 'reminder' | 'meeting' | 'alarm' | 'task_exec' | 'focus_block' | 'research';
  title: string;
  scheduledAt: string;
  reminderAt?: string;
  status: 'pending' | 'confirmed' | 'executed' | 'failed';
  requiresConfirmation?: boolean;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location?: string;
  participants?: string[];
  reminderSettings?: number; // minutes before
  prepTimeMinutes?: number;
  focusType?: 'meeting' | 'deep_work' | 'prep' | 'personal';
  status: 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface MeetingContext {
  id: string;
  eventId: string;
  goalIds?: string[];
  taskIds?: string[];
  notes?: string;
  decisions?: string;
  actionItems?: string[];
  prepBriefing?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  userId: string;
  scope: 'conversation' | 'long_term' | 'episodic' | 'semantic' | 'project' | 'preference';
  type: 'preference' | 'goal' | 'project' | 'work_style' | 'context' | 'fact' | 'decision';
  key: string;
  value: string;
  importance: number; // 1 to 10 scale
  confidence: number; // 0.0 to 1.0 scale
  status: 'active' | 'archived' | 'expired' | 'deleted';
  source: 'user_explicit' | 'user_confirmed' | 'system_generated' | 'observed';
  projectId?: string;
  goalId?: string;
  tags?: string[];
  verified?: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
}

export interface KnowledgeFile {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunk {
  id: string;
  fileId: string;
  content: string;
  pageNumber?: number;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'goal' | 'project' | 'task' | 'person' | 'skill' | 'doc' | 'decision';
  properties: Record<string, any>;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relation: 'CONTRIBUTES_TO' | 'DEPENDS_ON' | 'BLOCKS' | 'PREPARES_FOR' | 'COLLABORATES_WITH' | 'REQUIRES_SKILL';
}

export interface PersonalKnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface WhatMattersNowAnalysis {
  generatedAt: string;
  greeting: string;
  timeContext: string;
  summary: string;
  topPriority: {
    id: string;
    title: string;
    type: 'task' | 'meeting' | 'goal' | 'project';
    urgency: 'critical' | 'high' | 'medium';
    deadline?: string;
    whyItMatters: string;
    estimatedMinutes: number;
    nextAction: string;
    canAutoExecute?: boolean;
  };
  nextActions: Array<{
    id: string;
    title: string;
    category: string;
    durationMinutes: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    whyItMatters: string;
    actionType: string;
    isAutomated: boolean;
  }>;
  blockedWork: Array<{
    id: string;
    title: string;
    reason: string;
    unblockSuggestion: string;
  }>;
  todaySchedule: Array<{
    id: string;
    time: string;
    title: string;
    type: 'meeting' | 'deep_work' | 'prep' | 'break' | 'personal';
    durationMinutes: number;
    status: 'upcoming' | 'current' | 'done';
    prepBriefing?: string;
  }>;
  autoActionsAvailable: Array<{
    id: string;
    title: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high';
    requiresConfirmation: boolean;
    agent: string;
  }>;
  urgencyMatrix: {
    doFirst: string[];
    schedule: string[];
    delegateOrAutomate: string[];
    eliminate: string[];
  };
}

export interface AgentVerificationReport {
  actionId: string;
  agentId: string;
  verified: boolean;
  checks: Array<{ name: string; passed: boolean; message: string; evidence?: any }>;
  repairAttempted: boolean;
  repairSuccess?: boolean;
  auditSummary: string;
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  description: string;
  triggerType: 'schedule' | 'meeting_upcoming' | 'task_overdue' | 'goal_stalled' | 'webhook';
  triggerConfig: Record<string, any>;
  conditions: Array<{ field: string; operator: 'equals' | 'greater_than' | 'contains' | 'is_empty'; value: any }>;
  actions: Array<{ tool: string; params: Record<string, any>; riskLevel: 'low' | 'medium' | 'high' }>;
  enabled: boolean;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed';
  auditCount: number;
}

export interface ActivityAuditItem {
  id: string;
  timestamp: string;
  userId: string;
  agentId: string;
  actionType: string;
  title: string;
  description: string;
  status: 'executed' | 'verified' | 'failed' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  verificationDetails?: string;
  humanApproved?: boolean;
}

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'INTERRUPTED' | 'ERROR';

export type EventType = 'DEADLINE_APPROACHING' | 'MEETING_APPROACHING' | 'TASK_OVERDUE' | 'TASK_BLOCKED' | 'GOAL_AT_RISK' | 'SCHEDULE_CONFLICT' | 'UNANSWERED_IMPORTANT_EMAIL' | 'NEW_RELEVANT_DOCUMENT' | 'PROJECT_STAGNATION' | 'TIME_WINDOW_AVAILABLE' | 'TASK_CLUSTER' | 'MISSED_TASK' | 'FOLLOW_UP_DUE';

export type EventStatus = 'DETECTED' | 'QUEUED' | 'NOTIFIED' | 'DISMISSED' | 'ACTED' | 'EXPIRED';

export interface ProactiveEvent {
  id: string;
  userId: string;
  type: EventType;
  title: string;
  description: string;
  source: string;
  relevanceScore: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: EventStatus;
  createdAt: string;
  expiresAt: string;
  lastNotifiedAt?: string;
  recommendedAction?: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'not_connected' | 'connecting' | 'connected' | 'error';
  permissions: string[];
  createdAt: string;
}

