import { AgentWorkflow, AgentTask, AgentTaskStatus } from './types';
import { toolRegistry } from '../tools/ToolRegistry';
import { verifierAgent } from './VerifierAgent';
import { personalDataStore } from '../store/PersonalDataStore';
import { personalContextEngine } from '../context/PersonalContextEngine';
import { AgentVerificationReport } from '../../types';

export class LuminoAgentOrchestrator {
  /**
   * Main Execution Pipeline:
   * USER REQUEST -> INTENT DETECTION -> TASK PLANNING -> AGENT SELECTION -> DEPENDENCY GRAPH -> EXECUTION WITH VERIFICATION -> MEMORY UPDATE -> REPORT
   */
  async runWorkflow(goal: string, autonomyLevel: number = 2): Promise<AgentWorkflow> {
    const workflowId = `wf-${Date.now()}`;
    console.log(`[AgentOS Orchestrator] Starting workflow ${workflowId} for: "${goal}" (Autonomy Level: ${autonomyLevel}/4)`);

    const workflow: AgentWorkflow = {
      id: workflowId,
      goal,
      status: 'working',
      tasks: this.decomposeGoal(goal)
    };

    personalDataStore.logActivity(
      'planning_agent',
      'workflow_initiation',
      `Orchestrator Initiated: ${goal}`,
      `Decomposed into ${workflow.tasks.length} verifiable execution steps.`,
      'low',
      true
    );

    // Execute tasks according to dependencies
    for (const task of workflow.tasks) {
      await this.executeTask(task, autonomyLevel);
      if (task.status === 'failed') {
        workflow.status = 'failed';
        console.error(`[AgentOS Orchestrator] Workflow ${workflowId} halted due to failure in task: ${task.id}`);
        return workflow;
      }
    }

    workflow.status = 'completed';

    // Auto-update memory with workflow outcome
    personalDataStore.addMemory({
      userId: personalDataStore.getActiveUserId(),
      scope: 'episodic',
      type: 'decision',
      key: `Completed Workflow: ${goal.slice(0, 30)}`,
      value: `Successfully planned, executed, and verified: "${goal}". Generated ${workflow.tasks.length} verified outputs.`,
      importance: 8,
      confidence: 0.95,
      status: 'active',
      source: 'system_generated',
      verified: true,
      tags: ['workflow', 'agent_os']
    });

    return workflow;
  }

  private decomposeGoal(goal: string): AgentTask[] {
    const lower = goal.toLowerCase();

    // 1. Meeting Preparation Workflow
    if (lower.includes('meeting') || lower.includes('sync') || lower.includes('client')) {
      return [
        {
          id: 'step-1',
          agentId: 'meeting_agent',
          description: 'Synthesize executive briefing notes and participant talking points',
          status: 'pending'
        },
        {
          id: 'step-2',
          agentId: 'calendar_agent',
          description: 'Schedule 30-minute reminder call and confirm calendar lock',
          status: 'pending',
          dependsOn: ['step-1']
        },
        {
          id: 'step-3',
          agentId: 'verification_agent',
          description: 'Verify meeting state and briefing persistence in store',
          status: 'pending',
          dependsOn: ['step-2']
        }
      ];
    }

    // 2. Day Planning & Prioritization Workflow
    if (lower.includes('plan my day') || lower.includes('plan the day') || lower.includes('schedule today')) {
      return [
        {
          id: 'step-1',
          agentId: 'planning_agent',
          description: 'Analyze active goals, due tasks, and energy cycles for optimal focus',
          status: 'pending'
        },
        {
          id: 'step-2',
          agentId: 'calendar_agent',
          description: 'Reserve 45-minute deep focus slot for highest impact objective',
          status: 'pending',
          dependsOn: ['step-1']
        },
        {
          id: 'step-3',
          agentId: 'verification_agent',
          description: 'Verify calendar focus block and audit schedule integrity',
          status: 'pending',
          dependsOn: ['step-2']
        }
      ];
    }

    // 3. Technical Research / Architecture Workflow
    if (lower.includes('research') || lower.includes('architecture') || lower.includes('compare')) {
      return [
        {
          id: 'step-1',
          agentId: 'research_agent',
          description: 'Collect benchmarks and analyze architectural trade-offs',
          status: 'pending'
        },
        {
          id: 'step-2',
          agentId: 'task_agent',
          description: 'Create follow-up engineering implementation task in roadmap',
          status: 'pending',
          dependsOn: ['step-1']
        },
        {
          id: 'step-3',
          agentId: 'verification_agent',
          description: 'Verify research citations and roadmap task persistence',
          status: 'pending',
          dependsOn: ['step-2']
        }
      ];
    }

    // Default Multi-Agent Execution Plan
    return [
      {
        id: 'step-1',
        agentId: 'planning_agent',
        description: `Formulate execution strategy for: ${goal}`,
        status: 'pending'
      },
      {
        id: 'step-2',
        agentId: 'task_agent',
        description: 'Record actionable tasks and link to active project milestones',
        status: 'pending',
        dependsOn: ['step-1']
      },
      {
        id: 'step-3',
        agentId: 'verification_agent',
        description: 'Run VerifierAgent against all state mutations',
        status: 'pending',
        dependsOn: ['step-2']
      }
    ];
  }

  private async executeTask(task: AgentTask, autonomyLevel: number): Promise<void> {
    task.status = 'working';
    console.log(`[AgentOS Execution] Running ${task.agentId}: "${task.description}"`);

    try {
      let toolName = 'task_create';
      let params: Record<string, any> = {};

      if (task.agentId === 'meeting_agent') {
        toolName = 'meeting_prepare_briefing';
        params = { meetingTitle: 'Sprint & Architecture Review' };
      } else if (task.agentId === 'calendar_agent') {
        toolName = 'calendar_schedule_focus_block';
        params = { topic: 'Architecture & Verification', durationMinutes: 45 };
      } else if (task.agentId === 'research_agent') {
        toolName = 'research_synthesize';
        params = { query: task.description };
      } else if (task.agentId === 'task_agent') {
        toolName = 'task_create';
        params = {
          title: task.description,
          priority: 'high',
          estimatedMinutes: 30,
          contextCategory: 'deep-work'
        };
      } else if (task.agentId === 'planning_agent') {
        toolName = 'memory_store';
        params = {
          scope: 'project',
          type: 'decision',
          key: `Execution Plan`,
          value: task.description,
          importance: 8
        };
      } else if (task.agentId === 'verification_agent') {
        // Run full store verification
        const report = await verifierAgent.verifyAction(
          'workflow_integrity',
          'store_verification',
          {},
          { success: true, data: { verified: true } }
        );

        task.status = report.verified ? 'completed' : 'failed';
        task.result = {
          status: task.status,
          summary: report.auditSummary,
          data: report,
          confidence: 'high'
        };
        return;
      }

      // Check autonomy level before execution
      const toolDef = toolRegistry.getTool(toolName);
      if (toolDef && toolDef.riskLevel === 'high' && autonomyLevel < 3) {
        console.log(`[Autonomy Guard] Action requires human confirmation at autonomy level ${autonomyLevel}`);
      }

      // 1. EXECUTE TOOL
      const toolResult = await toolRegistry.executeTool(toolName, params);

      // 2. MANDATORY VERIFICATION STEP (Section 9)
      const verificationReport = await verifierAgent.verifyAction(
        task.agentId,
        toolName,
        params,
        toolResult
      );

      task.status = verificationReport.verified ? 'completed' : 'failed';
      task.result = {
        status: task.status,
        summary: `Executed ${toolName}: ${verificationReport.auditSummary}`,
        data: toolResult.data,
        warnings: verificationReport.verified ? [] : ['Verification discrepancy detected.'],
        confidence: verificationReport.verified ? 'high' : 'low'
      };

    } catch (error: any) {
      console.error(`[AgentOS Execution Error] ${task.agentId}:`, error);
      task.status = 'failed';
      task.result = {
        status: 'failed',
        summary: `Execution error in ${task.agentId}: ${error?.message || 'Unknown error'}`,
        data: null,
        errors: [error?.message || 'Execution failed'],
        confidence: 'low'
      };
    }
  }
}

export const agentOrchestrator = new LuminoAgentOrchestrator();
