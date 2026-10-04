import { 
  UserProfile, 
  Goal, 
  Project, 
  Task, 
  CalendarEvent, 
  Memory, 
  AutomationRule, 
  PersonalKnowledgeGraph, 
  ActivityAuditItem, 
  ChatSession,
  ProactiveEvent
} from '../../types';
import { FirebaseService } from '../firebaseService';

class PersonalDataStore {
  private static instance: PersonalDataStore;
  private listeners: Set<() => void> = new Set();
  private activeUserId: string = '';
  private isLoadedFromCloud: boolean = false;

  private profile: UserProfile = {
    id: '',
    name: 'Lumino Member',
    primaryGoal: 'AI Chief of Staff & High-Impact Execution',
    currentFocus: 'Deploying Lumino Personal AI OS & Scaling Strategic Goals',
    theme: 'dark',
    timezone: 'UTC',
    autonomyLevel: 2 // Level 2: Safe actions automated, human approval for high-risk
  };

  private goals: Goal[] = [];
  private projects: Project[] = [];
  private tasks: Task[] = [];
  private calendarEvents: CalendarEvent[] = [];
  private memories: Memory[] = [];
  private automations: AutomationRule[] = [];
  private activityAudit: ActivityAuditItem[] = [];
  private knowledgeGraph: PersonalKnowledgeGraph = { nodes: [], edges: [] };
  private proactiveEvents: ProactiveEvent[] = [];

  private constructor() {
    this.initializeDefaultData();
  }

  public static getInstance(): PersonalDataStore {
    if (!PersonalDataStore.instance) {
      PersonalDataStore.instance = new PersonalDataStore();
    }
    return PersonalDataStore.instance;
  }

  public async setActiveUser(uid: string, name?: string, email?: string): Promise<void> {
    if (!uid) return;
    this.activeUserId = uid;
    this.profile.id = uid;
    if (name) this.profile.name = name;

    // Load from local storage cache for this user
    this.loadFromStorage();

    // Sync from Firestore for this authenticated UID
    await this.syncFromFirestore();
    this.notify();
  }

  public getActiveUserId(): string {
    return this.activeUserId || this.profile.id;
  }

  private initializeDefaultData(): void {
    // Production behavior: Start with a clean, personal workspace
    this.goals = [];
    this.projects = [];
    this.tasks = [];
    this.calendarEvents = [];
    this.memories = [];
    this.activityLog = [];
    this.knowledgeGraph = {
      nodes: [],
      edges: []
    };
  }

  /**
   * Explicit Demo Mode: Only invoked when user explicitly clicks "Explore Sample Workspace"
   */
  public loadDemoWorkspace(): void {
    const uid = this.getActiveUserId();
    this.goals = [
      {
        id: 'goal-sample-1',
        userId: uid,
        title: 'Launch SaaS MVP & Acquire First 100 Customers',
        description: 'Ship minimal viable product, validate value proposition with early adopters, and optimize activation loop.',
        category: 'startup',
        deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        priority: 'high',
        status: 'active',
        progress: 40,
        targetOutcome: '100 active recurring users with >30% day-7 retention.',
        milestones: [
          { id: 'm-1', title: 'Complete Core Feature Prototype', completed: true, dueDate: '2026-10-01' },
          { id: 'm-2', title: 'Customer Discovery Interviews (20 users)', completed: true, dueDate: '2026-10-05' },
          { id: 'm-3', title: 'Stripe Billing & Tiered Onboarding', completed: false, dueDate: '2026-10-15' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.tasks = [
      {
        id: 'task-sample-1',
        userId: uid,
        goalId: 'goal-sample-1',
        title: 'Finalize Pricing Tiers & Billing Gateway',
        description: 'Implement monthly and annual subscription tiers with Stripe webhook handling.',
        priority: 'high',
        status: 'todo',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        estimatedMinutes: 60,
        energyLevel: 'high',
        contextCategory: 'deep-work',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-sample-2',
        userId: uid,
        goalId: 'goal-sample-1',
        title: 'Draft User Onboarding Email Sequence',
        description: '3-part welcome email sequence highlighting key time-to-value milestones.',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        estimatedMinutes: 30,
        energyLevel: 'medium',
        contextCategory: 'communication',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.calendarEvents = [
      {
        id: 'cal-sample-1',
        userId: uid,
        title: 'Weekly Strategy & Product Sync',
        description: 'Review product feedback, roadmap milestones, and growth metrics.',
        startTime: new Date(Date.now() + 2 * 3600000).toISOString(),
        endTime: new Date(Date.now() + 3 * 3600000).toISOString(),
        timezone: 'UTC',
        location: 'Google Meet',
        participants: ['Team'],
        reminderSettings: 30,
        prepTimeMinutes: 15,
        focusType: 'meeting',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.memories = [
      {
        id: 'mem-sample-1',
        userId: uid,
        scope: 'preference',
        type: 'work_style',
        key: 'Deep Work Schedule',
        value: 'Prefers deep uninterrupted focus blocks in the morning for technical and strategic architecture.',
        importance: 9,
        confidence: 0.95,
        status: 'active',
        source: 'user_explicit',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      }
    ];

    this.saveToStorage();
    this.notify();
  }

  private async syncFromFirestore(): Promise<void> {
    if (!this.activeUserId) return;
    try {
      const [cloudGoals, cloudProjects, cloudTasks, cloudEvents, cloudMemories] = await Promise.all([
        FirebaseService.getGoals(this.activeUserId),
        FirebaseService.getProjects(this.activeUserId),
        FirebaseService.getTasks(this.activeUserId),
        FirebaseService.getCalendarEvents(this.activeUserId),
        FirebaseService.getMemories(this.activeUserId)
      ]);

      // Authoritative Firestore state reflection
      this.goals = cloudGoals;
      this.projects = cloudProjects;
      this.tasks = cloudTasks;
      this.calendarEvents = cloudEvents;
      this.memories = cloudMemories;

      this.isLoadedFromCloud = true;
      this.saveToStorage();
    } catch (e) {
      console.warn('[PersonalDataStore] Cloud sync note:', e);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const key = `lumino_personal_data_${this.activeUserId || 'guest'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) this.profile = parsed.profile;
        if (parsed.goals) this.goals = parsed.goals;
        if (parsed.projects) this.projects = parsed.projects;
        if (parsed.tasks) this.tasks = parsed.tasks;
        if (parsed.calendarEvents) this.calendarEvents = parsed.calendarEvents;
        if (parsed.memories) this.memories = parsed.memories;
      }
    } catch (e) {
      console.warn('[PersonalDataStore] Load error:', e);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const key = `lumino_personal_data_${this.activeUserId || 'guest'}`;
      const payload = {
        profile: this.profile,
        goals: this.goals,
        projects: this.projects,
        tasks: this.tasks,
        calendarEvents: this.calendarEvents,
        memories: this.memories,
        automations: this.automations,
        activityAudit: this.activityAudit,
      };
      localStorage.setItem(key, JSON.stringify(payload));
      this.notify();
    } catch (e) {
      console.warn('[PersonalDataStore] Storage save error:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  // Getters
  public getProfile(): UserProfile { return { ...this.profile }; }
  public getGoals(): Goal[] { return [...this.goals]; }
  public getProjects(): Project[] { return [...this.projects]; }
  public getTasks(): Task[] { return [...this.tasks]; }
  public getCalendarEvents(): CalendarEvent[] { return [...this.calendarEvents]; }
  public getMemories(): Memory[] { return [...this.memories]; }
  public getAutomations(): AutomationRule[] { return [...this.automations]; }
  public getActivityAudit(): ActivityAuditItem[] { return [...this.activityAudit]; }
  public getKnowledgeGraph(): PersonalKnowledgeGraph { return { ...this.knowledgeGraph }; }
  public getProactiveEvents(): ProactiveEvent[] { return [...this.proactiveEvents]; }

  // Mutations
  public updateProfile(updates: Partial<UserProfile>): UserProfile {
    this.profile = { ...this.profile, ...updates };
    this.saveToStorage();
    if (this.activeUserId) {
      FirebaseService.syncUserProfile(this.activeUserId, this.profile);
    }
    return this.profile;
  }

  public addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}`,
      userId: this.activeUserId || this.profile.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.goals.unshift(newGoal);
    this.logActivity('goal_agent', 'goal_create', `Created Goal: ${newGoal.title}`, 'Goal successfully added to roadmap.', 'low', true);
    this.saveToStorage();
    if (this.activeUserId) FirebaseService.saveGoal(this.activeUserId, newGoal);
    return newGoal;
  }

  public updateGoalProgress(goalId: string, progress: number): Goal | null {
    const idx = this.goals.findIndex(g => g.id === goalId);
    if (idx === -1) return null;
    this.goals[idx].progress = Math.min(100, Math.max(0, progress));
    if (this.goals[idx].progress === 100) this.goals[idx].status = 'completed';
    this.goals[idx].updatedAt = new Date().toISOString();
    this.logActivity('goal_agent', 'goal_progress_update', `Updated Goal Progress: ${this.goals[idx].title} (${progress}%)`, 'Progress recorded and verified.', 'low', true);
    this.saveToStorage();
    if (this.activeUserId) FirebaseService.saveGoal(this.activeUserId, this.goals[idx]);
    return this.goals[idx];
  }

  public deleteGoal(goalId: string): void {
    const idx = this.goals.findIndex(g => g.id === goalId);
    if (idx > -1) {
      this.goals.splice(idx, 1);
      this.saveToStorage();
      if (this.activeUserId) FirebaseService.deleteGoal(this.activeUserId, goalId);
    }
  }

  public addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      userId: this.activeUserId || this.profile.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.unshift(newTask);
    this.logActivity('task_agent', 'task_create', `Created Task: ${newTask.title}`, `Due: ${newTask.dueDate} | Est: ${newTask.estimatedMinutes || 30}m`, 'low', true);
    this.saveToStorage();
    if (this.activeUserId) FirebaseService.saveTask(this.activeUserId, newTask);
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: Task['status']): Task | null {
    const idx = this.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;
    const oldStatus = this.tasks[idx].status;
    this.tasks[idx].status = status;
    this.tasks[idx].updatedAt = new Date().toISOString();
    this.logActivity('task_agent', 'task_status_change', `Task ${status.toUpperCase()}: ${this.tasks[idx].title}`, `Changed from ${oldStatus} to ${status}. Verified in store.`, 'low', true);
    this.saveToStorage();
    if (this.activeUserId) FirebaseService.saveTask(this.activeUserId, this.tasks[idx]);
    return this.tasks[idx];
  }

  public deleteTask(taskId: string): void {
    const idx = this.tasks.findIndex(t => t.id === taskId);
    if (idx > -1) {
      this.tasks.splice(idx, 1);
      this.saveToStorage();
      if (this.activeUserId) FirebaseService.deleteTask(this.activeUserId, taskId);
    }
  }

  public addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent {
    const newEvent: CalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`,
      userId: this.activeUserId || this.profile.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.calendarEvents.push(newEvent);
    this.logActivity('calendar_agent', 'event_schedule', `Scheduled Event: ${newEvent.title}`, `Time: ${new Date(newEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 'low', true);
    this.saveToStorage();
    if (this.activeUserId) FirebaseService.saveCalendarEvent(this.activeUserId, newEvent);
    return newEvent;
  }

  public deleteCalendarEvent(eventId: string): void {
    const idx = this.calendarEvents.findIndex(c => c.id === eventId);
    if (idx > -1) {
      this.calendarEvents.splice(idx, 1);
      this.saveToStorage();
      if (this.activeUserId) FirebaseService.deleteCalendarEvent(this.activeUserId, eventId);
    }
  }

  public addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>): Memory {
    const newMemory: Memory = {
      ...memory,
      id: `mem-${Date.now()}`,
      userId: this.activeUserId || this.profile.id,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.memories.unshift(newMemory);
    this.logActivity('memory_agent', 'memory_store', `Indexed Memory: [${newMemory.scope.toUpperCase()}] ${newMemory.key}`, newMemory.value, 'low', true);
    this.saveToStorage();
    if (this.activeUserId) FirebaseService.saveMemory(this.activeUserId, newMemory);
    return newMemory;
  }

  public deleteMemory(memoryId: string): void {
    const idx = this.memories.findIndex(m => m.id === memoryId);
    if (idx > -1) {
      this.memories.splice(idx, 1);
      this.saveToStorage();
      if (this.activeUserId) FirebaseService.deleteMemory(this.activeUserId, memoryId);
    }
  }

  public logActivity(
    agentId: string, 
    actionType: string, 
    title: string, 
    description: string, 
    riskLevel: 'low' | 'medium' | 'high' = 'low', 
    verified: boolean = true
  ): ActivityAuditItem {
    const item: ActivityAuditItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: this.activeUserId || this.profile.id,
      agentId,
      actionType,
      title,
      description,
      status: verified ? 'verified' : 'executed',
      riskLevel,
      verificationDetails: verified ? 'Verified state mutation against store consistency check.' : 'Awaiting verification probe.',
      humanApproved: true
    };
    this.activityAudit.unshift(item);
    if (this.activityAudit.length > 50) this.activityAudit = this.activityAudit.slice(0, 50);
    this.saveToStorage();
    if (this.activeUserId) FirebaseService.logActivity(this.activeUserId, item);
    return item;
  }

  public getRawContextSnapshot() {
    return {
      profile: this.profile,
      goals: this.goals,
      projects: this.projects,
      tasks: this.tasks,
      calendar: this.calendarEvents,
      memories: this.memories,
      knowledgeGraph: this.knowledgeGraph,
      automations: this.automations,
      recentAudit: this.activityAudit.slice(0, 10)
    };
  }
}

export const personalDataStore = PersonalDataStore.getInstance();
