import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Goal, 
  Project, 
  Task, 
  CalendarEvent, 
  Memory, 
  AutomationRule, 
  ActivityAuditItem, 
  ChatSession,
  UserProfile 
} from '../types';

export class FirebaseService {
  // Ensure User Profile Document exists
  static async syncUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    if (!uid) return;
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        uid,
        ...profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('[FirebaseService] syncUserProfile error:', e);
    }
  }

  // --- GOALS ---
  static async getGoals(uid: string): Promise<Goal[]> {
    if (!uid) return [];
    try {
      const colRef = collection(db, 'users', uid, 'goals');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Goal));
    } catch (e) {
      console.warn('[FirebaseService] getGoals error:', e);
      return [];
    }
  }

  static async saveGoal(uid: string, goal: Goal): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'goals', goal.id);
      await setDoc(docRef, { ...goal, userId: uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('[FirebaseService] saveGoal error:', e);
    }
  }

  static async deleteGoal(uid: string, goalId: string): Promise<void> {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'users', uid, 'goals', goalId));
    } catch (e) {
      console.warn('[FirebaseService] deleteGoal error:', e);
    }
  }

  // --- PROJECTS ---
  static async getProjects(uid: string): Promise<Project[]> {
    if (!uid) return [];
    try {
      const colRef = collection(db, 'users', uid, 'projects');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Project));
    } catch (e) {
      console.warn('[FirebaseService] getProjects error:', e);
      return [];
    }
  }

  static async saveProject(uid: string, project: Project): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'projects', project.id);
      await setDoc(docRef, { ...project, userId: uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('[FirebaseService] saveProject error:', e);
    }
  }

  static async deleteProject(uid: string, projectId: string): Promise<void> {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'users', uid, 'projects', projectId));
    } catch (e) {
      console.warn('[FirebaseService] deleteProject error:', e);
    }
  }

  // --- TASKS ---
  static async getTasks(uid: string): Promise<Task[]> {
    if (!uid) return [];
    try {
      const colRef = collection(db, 'users', uid, 'tasks');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Task));
    } catch (e) {
      console.warn('[FirebaseService] getTasks error:', e);
      return [];
    }
  }

  static async saveTask(uid: string, task: Task): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'tasks', task.id);
      await setDoc(docRef, { ...task, userId: uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('[FirebaseService] saveTask error:', e);
    }
  }

  static async deleteTask(uid: string, taskId: string): Promise<void> {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
    } catch (e) {
      console.warn('[FirebaseService] deleteTask error:', e);
    }
  }

  // --- CALENDAR EVENTS ---
  static async getCalendarEvents(uid: string): Promise<CalendarEvent[]> {
    if (!uid) return [];
    try {
      const colRef = collection(db, 'users', uid, 'calendar');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as CalendarEvent));
    } catch (e) {
      console.warn('[FirebaseService] getCalendarEvents error:', e);
      return [];
    }
  }

  static async saveCalendarEvent(uid: string, event: CalendarEvent): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'calendar', event.id);
      await setDoc(docRef, { ...event, userId: uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('[FirebaseService] saveCalendarEvent error:', e);
    }
  }

  static async deleteCalendarEvent(uid: string, eventId: string): Promise<void> {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'users', uid, 'calendar', eventId));
    } catch (e) {
      console.warn('[FirebaseService] deleteCalendarEvent error:', e);
    }
  }

  // --- MEMORIES ---
  static async getMemories(uid: string): Promise<Memory[]> {
    if (!uid) return [];
    try {
      const colRef = collection(db, 'users', uid, 'memories');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Memory));
    } catch (e) {
      console.warn('[FirebaseService] getMemories error:', e);
      return [];
    }
  }

  static async saveMemory(uid: string, memory: Memory): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'memories', memory.id);
      await setDoc(docRef, { ...memory, userId: uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('[FirebaseService] saveMemory error:', e);
    }
  }

  static async deleteMemory(uid: string, memoryId: string): Promise<void> {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'users', uid, 'memories', memoryId));
    } catch (e) {
      console.warn('[FirebaseService] deleteMemory error:', e);
    }
  }

  // --- CONVERSATIONS ---
  static async getConversations(uid: string): Promise<ChatSession[]> {
    if (!uid) return [];
    try {
      const colRef = collection(db, 'users', uid, 'conversations');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatSession));
    } catch (e) {
      console.warn('[FirebaseService] getConversations error:', e);
      return [];
    }
  }

  static async saveConversation(uid: string, session: ChatSession): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'conversations', session.id);
      await setDoc(docRef, { ...session, userId: uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('[FirebaseService] saveConversation error:', e);
    }
  }

  static async deleteConversation(uid: string, sessionId: string): Promise<void> {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'users', uid, 'conversations', sessionId));
    } catch (e) {
      console.warn('[FirebaseService] deleteConversation error:', e);
    }
  }

  // --- AUTOMATIONS ---
  static async getAutomations(uid: string): Promise<AutomationRule[]> {
    if (!uid) return [];
    try {
      const colRef = collection(db, 'users', uid, 'automations');
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as AutomationRule));
    } catch (e) {
      console.warn('[FirebaseService] getAutomations error:', e);
      return [];
    }
  }

  static async saveAutomation(uid: string, rule: AutomationRule): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'automations', rule.id);
      await setDoc(docRef, { ...rule, userId: uid }, { merge: true });
    } catch (e) {
      console.warn('[FirebaseService] saveAutomation error:', e);
    }
  }

  // --- AUDIT LOGS ---
  static async logActivity(uid: string, log: ActivityAuditItem): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'auditLogs', log.id);
      await setDoc(docRef, { ...log, userId: uid });
    } catch (e) {
      console.warn('[FirebaseService] logActivity error:', e);
    }
  }

  // --- USAGE LOGGING ---
  static async recordUsage(uid: string, usage: { model: string; type: 'pic' | 'video' | 'chat'; tokens?: number; cost?: number }): Promise<void> {
    if (!uid) return;
    try {
      const usageId = `usage-${Date.now()}`;
      const docRef = doc(db, 'users', uid, 'usage', usageId);
      await setDoc(docRef, {
        id: usageId,
        userId: uid,
        timestamp: new Date().toISOString(),
        ...usage
      });
    } catch (e) {
      console.warn('[FirebaseService] recordUsage error:', e);
    }
  }
}
