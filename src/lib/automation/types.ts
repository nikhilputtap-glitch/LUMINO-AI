export type TriggerType = 'TIME' | 'CALENDAR' | 'TASK' | 'GOAL';

export interface AutomationTrigger {
  type: TriggerType;
  schedule?: string; // Cron or ISO date
  event?: string; // Event ID or description
}

export interface AutomationAction {
  agentId: string;
  workflowGoal: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  enabled: boolean;
}
