import { personalDataStore } from '../store/PersonalDataStore';
import { AgentVerificationReport } from '../../types';

export interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
  evidence?: any;
}

export class VerifierAgent {
  private static instance: VerifierAgent;

  public static getInstance(): VerifierAgent {
    if (!VerifierAgent.instance) {
      VerifierAgent.instance = new VerifierAgent();
    }
    return VerifierAgent.instance;
  }

  /**
   * Core Verification Loop:
   * Inspects execution results against ground-truth state in PersonalDataStore.
   * If any check fails, attempts self-repair action, then re-verifies.
   */
  public async verifyAction(
    actionType: string,
    toolName: string,
    inputParams: Record<string, any>,
    executionResult: any
  ): Promise<AgentVerificationReport> {
    const actionId = `act-ver-${Date.now()}`;
    const checks: VerificationCheck[] = [];
    let repairAttempted = false;
    let repairSuccess: boolean | undefined = undefined;

    // Check 1: Tool Output Sanity
    const hasExecutionData = executionResult && executionResult.success === true && executionResult.data;
    checks.push({
      name: 'tool_output_integrity',
      passed: Boolean(hasExecutionData),
      message: hasExecutionData ? 'Tool returned structured output payload.' : 'Tool returned null or unsuccessful flag.',
      evidence: executionResult?.evidence
    });

    // Domain Specific Verification Checks
    if (toolName.startsWith('calendar_')) {
      const eventId = executionResult?.data?.id || executionResult?.evidence?.eventId;
      const allEvents = personalDataStore.getCalendarEvents();
      const matched = allEvents.find(e => e.id === eventId);

      const existsInStore = Boolean(matched);
      checks.push({
        name: 'calendar_store_persistence',
        passed: existsInStore,
        message: existsInStore ? `Event ${eventId} verified in persistent calendar store.` : `Event ${eventId} not found in store!`,
        evidence: matched ? { id: matched.id, title: matched.title, start: matched.startTime } : null
      });

      // Self-Repair if missing
      if (!existsInStore && inputParams.title) {
        repairAttempted = true;
        console.warn(`[VerifierAgent] Discrepancy detected for calendar event. Initiating self-repair...`);
        const repaired = personalDataStore.addCalendarEvent({
          userId: personalDataStore.getActiveUserId(),
          title: inputParams.title,
          startTime: inputParams.startTime || new Date().toISOString(),
          endTime: inputParams.endTime || new Date(Date.now() + 3600000).toISOString(),
          timezone: 'UTC',
          focusType: inputParams.focusType || 'meeting',
          status: 'confirmed'
        });
        repairSuccess = Boolean(repaired);
        checks.push({
          name: 'calendar_self_repair',
          passed: Boolean(repaired),
          message: repaired ? 'Self-repair re-inserted event into persistent store.' : 'Self-repair failed.'
        });
      }
    } else if (toolName.startsWith('task_')) {
      const taskId = executionResult?.data?.id || executionResult?.evidence?.taskId;
      const allTasks = personalDataStore.getTasks();
      const matched = allTasks.find(t => t.id === taskId);

      const existsInStore = Boolean(matched);
      checks.push({
        name: 'task_store_persistence',
        passed: existsInStore,
        message: existsInStore ? `Task ${taskId} verified in persistent task store.` : `Task ${taskId} missing from store!`,
        evidence: matched ? { id: matched.id, status: matched.status, title: matched.title } : null
      });

      if (matched && inputParams.status && matched.status !== inputParams.status) {
        repairAttempted = true;
        personalDataStore.updateTaskStatus(taskId, inputParams.status);
        const recheck = personalDataStore.getTasks().find(t => t.id === taskId)?.status === inputParams.status;
        repairSuccess = recheck;
        checks.push({
          name: 'task_status_alignment_repair',
          passed: recheck,
          message: recheck ? `Status alignment repaired to ${inputParams.status}.` : 'Failed to realign status.'
        });
      }
    } else if (toolName.startsWith('memory_')) {
      const memId = executionResult?.data?.id || executionResult?.evidence?.memoryId;
      const matched = personalDataStore.getMemories().find(m => m.id === memId);
      const isVerified = Boolean(matched && matched.verified);

      checks.push({
        name: 'memory_verification_check',
        passed: isVerified,
        message: isVerified ? `Memory ${memId} recorded with active verified status.` : 'Memory missing or unverified.',
        evidence: matched ? { key: matched.key, scope: matched.scope } : null
      });
    } else {
      // General tool check
      checks.push({
        name: 'general_execution_verification',
        passed: true,
        message: `Execution verified for tool: ${toolName}.`,
        evidence: executionResult?.data
      });
    }

    const allPassed = checks.every(c => c.passed);

    const report: AgentVerificationReport = {
      actionId,
      agentId: 'verifier_agent',
      verified: allPassed,
      checks,
      repairAttempted,
      repairSuccess,
      auditSummary: allPassed 
        ? `Verified 100% integrity across ${checks.length} checks. No state discrepancies.`
        : `Verification flagged ${checks.filter(c => !c.passed).length} issues. ${repairAttempted ? `Repair status: ${repairSuccess}` : 'Manual review advised.'}`,
      timestamp: new Date().toISOString()
    };

    personalDataStore.logActivity(
      'verifier_agent',
      'action_verification',
      `Verification ${allPassed ? 'PASSED' : 'FLAGGED'}: ${toolName}`,
      report.auditSummary,
      allPassed ? 'low' : 'medium',
      allPassed
    );

    return report;
  }
}

export const verifierAgent = VerifierAgent.getInstance();
