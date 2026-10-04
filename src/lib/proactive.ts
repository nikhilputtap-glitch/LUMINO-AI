import { ProactiveEvent, EventType } from '../types';
import { personalDataStore } from './store/PersonalDataStore';

export const NotificationDeduplicationService = {
  isDuplicate: (type: EventType, title: string) => {
    return personalDataStore.getProactiveEvents().some(e => e.type === type && e.title === title && e.status === 'NOTIFIED');
  }
};

export const ProactiveDetectionEngine = {
  detectEvents: (): ProactiveEvent[] => {
    const tasks = personalDataStore.getTasks();
    const calendar = personalDataStore.getCalendarEvents();
    const now = new Date();
    const detected: ProactiveEvent[] = [];

    // 1. Check for overdue tasks or tasks due soon
    tasks.forEach(task => {
      if (task.status === 'done') return;
      const dueDate = new Date(task.dueDate);
      const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 3600);

      if (diffHours < 0) {
        createOrUpdateEvent(
          'TASK_OVERDUE', 
          `Critical: Task "${task.title}" is overdue`, 
          `Deadline was ${task.dueDate}. Priority: ${task.priority.toUpperCase()}`,
          'Review task blockers and reschedule or execute immediately'
        );
      } else if (diffHours <= 24) {
        createOrUpdateEvent(
          'DEADLINE_APPROACHING', 
          `Deadline Approaching: "${task.title}"`, 
          `Due within 24 hours (${task.dueDate}). Estimated time: ${task.estimatedMinutes || 30}m.`,
          'Start focus session now'
        );
      }
    });

    // 2. Check for upcoming calendar events today
    calendar.forEach(event => {
      const eventTime = new Date(event.startTime);
      const diffMins = (eventTime.getTime() - now.getTime()) / (1000 * 60);

      if (diffMins > 0 && diffMins <= 45) {
        createOrUpdateEvent(
          'MEETING_APPROACHING', 
          `Upcoming Meeting: "${event.title}" in ${Math.round(diffMins)}m`, 
          `Scheduled for ${eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Prep briefing is ready.`,
          'Trigger 30-minute reminder briefing call'
        );
      }
    });

    return personalDataStore.getProactiveEvents();
  }
};

function createOrUpdateEvent(type: EventType, title: string, description: string, recommendedAction?: string) {
  if (NotificationDeduplicationService.isDuplicate(type, title)) return;

  const events = personalDataStore.getProactiveEvents();
  const existingEvent = events.find(e => e.type === type && e.title === title);
  if (!existingEvent) {
    const uid = personalDataStore.getActiveUserId();
    const newEvent: ProactiveEvent = {
        id: `pro-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: uid,
        type: type,
        title: title,
        description: description,
        source: 'Personal Context Engine',
        relevanceScore: 0.95,
        urgency: 'high',
        status: 'DETECTED',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        recommendedAction
    };
    events.push(newEvent);
  }
}
