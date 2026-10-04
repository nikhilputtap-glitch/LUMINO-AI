import { personalDataStore } from '../store/PersonalDataStore';
import { 
  UserProfile, 
  Goal, 
  Project, 
  Task, 
  CalendarEvent, 
  Memory, 
  PersonalKnowledgeGraph 
} from '../../types';

export interface ContextSnapshot {
  user: UserProfile;
  activeGoals: Goal[];
  activeProjects: Project[];
  dueTasks: Task[];
  blockedTasks: Task[];
  todayEvents: CalendarEvent[];
  relevantMemories: Memory[];
  knowledgeGraph: PersonalKnowledgeGraph;
  timeContext: {
    currentTimeIso: string;
    localTimeDisplay: string;
    dayOfWeek: string;
    isWorkHours: boolean;
    energyWindow: 'high_focus' | 'moderate' | 'wind_down';
  };
}

export class PersonalContextEngine {
  private static instance: PersonalContextEngine;

  public static getInstance(): PersonalContextEngine {
    if (!PersonalContextEngine.instance) {
      PersonalContextEngine.instance = new PersonalContextEngine();
    }
    return PersonalContextEngine.instance;
  }

  public getTimeContext() {
    const now = new Date();
    const hours = now.getHours();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const localTimeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isWorkHours = hours >= 9 && hours <= 18;

    let energyWindow: 'high_focus' | 'moderate' | 'wind_down' = 'moderate';
    if (hours >= 9 && hours <= 13) {
      energyWindow = 'high_focus'; // Morning deep work peak
    } else if (hours >= 14 && hours <= 17) {
      energyWindow = 'moderate'; // Execution & syncs
    } else {
      energyWindow = 'wind_down'; // Review & planning
    }

    return {
      currentTimeIso: now.toISOString(),
      localTimeDisplay,
      dayOfWeek,
      isWorkHours,
      energyWindow
    };
  }

  public buildSnapshot(): ContextSnapshot {
    const raw = personalDataStore.getRawContextSnapshot();
    const todayStr = new Date().toISOString().split('T')[0];

    const activeGoals = raw.goals.filter(g => g.status === 'active');
    const activeProjects = raw.projects.filter(p => p.status === 'active');
    
    // Sort tasks: In-progress first, then critical/high due today
    const dueTasks = raw.tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
        if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
        const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });

    const blockedTasks = raw.tasks.filter(t => t.status === 'blocked');

    // Filter today's calendar events
    const todayEvents = raw.calendar.filter(evt => {
      return evt.startTime.startsWith(todayStr) || (evt.status === 'confirmed');
    });

    // High importance memories
    const relevantMemories = raw.memories
      .filter(m => m.status === 'active')
      .sort((a, b) => (b.importance * b.confidence) - (a.importance * a.confidence));

    return {
      user: raw.profile,
      activeGoals,
      activeProjects,
      dueTasks,
      blockedTasks,
      todayEvents,
      relevantMemories,
      knowledgeGraph: raw.knowledgeGraph,
      timeContext: this.getTimeContext()
    };
  }

  /**
   * Constructs an optimized textual context packet ready for LLM consumption
   */
  public buildPromptContext(intent?: string, userQuery?: string): string {
    const snapshot = this.buildSnapshot();
    const tc = snapshot.timeContext;

    // Filter memories based on keyword relevance if query provided
    let matchedMemories = snapshot.relevantMemories;
    if (userQuery) {
      const qLower = userQuery.toLowerCase();
      const scored = snapshot.relevantMemories.map(m => {
        let score = m.importance;
        if (qLower.includes(m.key.toLowerCase())) score += 10;
        if (m.tags?.some(tag => qLower.includes(tag.toLowerCase()))) score += 6;
        if (qLower.includes(m.value.toLowerCase().slice(0, 15))) score += 4;
        return { memory: m, score };
      });
      matchedMemories = scored.sort((a, b) => b.score - a.score).slice(0, 6).map(s => s.memory);
    } else {
      matchedMemories = matchedMemories.slice(0, 5);
    }

    const lines: string[] = [
      `[TEMPORAL CONTEXT] Today is ${tc.dayOfWeek}, ${tc.localTimeDisplay} (${tc.energyWindow} energy cycle). Autonomy Level: ${snapshot.user.autonomyLevel}/4.`,
      `[USER PROFILE] ${snapshot.user.name} | Primary Objective: "${snapshot.user.primaryGoal}" | Focus: "${snapshot.user.currentFocus}"`,
      '',
      `[ACTIVE GOALS & ROADMAPS]:`,
      ...snapshot.activeGoals.map(g => `• ${g.title} (${g.progress}% done) — Target: ${g.deadline} | Outcome: ${g.targetOutcome || g.description}`),
      '',
      `[ACTIVE PROJECTS]:`,
      ...snapshot.activeProjects.map(p => `• ${p.title} [Priority: ${p.priority.toUpperCase()}] (${p.progress}% done) — ${p.description}`),
      '',
      `[TASKS IN FOCUS & QUEUE]:`,
      ...snapshot.dueTasks.slice(0, 5).map(t => `• [${t.status.toUpperCase()}] ${t.title} (Priority: ${t.priority}, Est: ${t.estimatedMinutes || 30}m, Energy: ${t.energyLevel || 'medium'})${t.blockedReason ? ` [BLOCKED: ${t.blockedReason}]` : ''}`),
      '',
      `[UPCOMING CALENDAR & MEETINGS]:`,
      ...snapshot.todayEvents.map(e => `• ${new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${e.title} (${e.location || 'Virtual'})${e.reminderSettings ? ` [${e.reminderSettings}m reminder call armed]` : ''}`),
      '',
      `[CORE PERSONAL MEMORIES & VERIFIED FACTS]:`,
      ...matchedMemories.map(m => `• [${m.scope.toUpperCase()}] ${m.key}: ${m.value} (Importance: ${m.importance}/10)`),
    ];

    return lines.join('\n');
  }
}

export const personalContextEngine = PersonalContextEngine.getInstance();
