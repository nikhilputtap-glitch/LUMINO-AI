import { Memory, ChatSession } from '../types';
import { personalDataStore } from './store/PersonalDataStore';

export const MemoryClassifier = {
    classify: (content: string): Memory['scope'] => {
        const lower = content.toLowerCase();
        if (lower.includes('project') || lower.includes('mvp') || lower.includes('code') || lower.includes('app')) return 'project';
        if (lower.includes('goal') || lower.includes('target') || lower.includes('objective')) return 'semantic';
        if (lower.includes('prefer') || lower.includes('like') || lower.includes('favorite') || lower.includes('avoid')) return 'preference';
        return 'long_term';
    }
};

export const MemoryService = {
    createMemory: (
        userId: string, 
        scope: Memory['scope'], 
        type: Memory['type'], 
        key: string, 
        value: string, 
        source: Memory['source'],
        importance: number = 8,
        confidence: number = 0.95
    ): Memory => {
        const uid = userId || personalDataStore.getActiveUserId();
        const existingList = personalDataStore.getMemories();
        const existing = existingList.find(m => m.key.toLowerCase() === key.toLowerCase() && m.value.toLowerCase() === value.toLowerCase());
        if (existing) {
            existing.updatedAt = new Date().toISOString();
            existing.lastUsedAt = new Date().toISOString();
            return existing;
        }

        return personalDataStore.addMemory({
            userId: uid,
            scope,
            type,
            key,
            value,
            importance,
            confidence,
            status: 'active',
            source
        });
    },
    
    // Semantic + Recency + Importance Memory Retrieval
    retrieveRelevantMemories: (query: string, scope?: Memory['scope']): Memory[] => {
        const q = query.toLowerCase();
        const words = q.split(/\s+/).filter(w => w.length > 2);
        const memories = personalDataStore.getMemories().filter(m => m.status === 'active' && (!scope || m.scope === scope));

        // Score each memory
        const scored = memories.map(m => {
            let score = 0;
            const content = `${m.key} ${m.value} ${m.scope} ${m.type}`.toLowerCase();

            // Direct substring match
            if (content.includes(q)) score += 50;

            // Word token overlap
            words.forEach(w => {
                if (content.includes(w)) score += 15;
            });

            // Importance weight (1-10)
            score += (m.importance || 5) * 2;

            // Confidence weight (0-1)
            score += (m.confidence || 0.8) * 10;

            // Recency boost (memories accessed or updated in last 7 days)
            const ageDays = (Date.now() - new Date(m.updatedAt || m.createdAt).getTime()) / (1000 * 86400);
            if (ageDays < 7) score += 10;

            return { memory: m, score };
        });

        // Filter and sort by relevance score
        return scored
            .filter(item => item.score > 20 || q.length < 3)
            .sort((a, b) => b.score - a.score)
            .map(item => item.memory);
    },

    saveConversationSession: (session: ChatSession) => {
        if (!session.messages || session.messages.length === 0) return;
        // Auto-extract key memories from this session
        MemoryService.extractMemoriesFromSession(session);
    },

    extractMemoriesFromSession: (session: ChatSession) => {
        if (!session.messages || session.messages.length === 0) return;
        const uid = personalDataStore.getActiveUserId();

        const firstUserMsg = session.messages.find(m => m.role === 'user')?.content;
        const summaryText = `In chat session "${session.title}" (${new Date(session.createdAt).toLocaleDateString()}): User discussed "${firstUserMsg?.slice(0, 100)}".`;
        MemoryService.createMemory(uid, 'long_term', 'fact', `Chat Session: ${session.title}`, summaryText, 'user_explicit');

        session.messages.forEach(msg => {
            const lower = msg.content.toLowerCase();
            if (msg.role === 'user') {
                if (lower.includes('meeting') || lower.includes('sync') || lower.includes('call')) {
                    MemoryService.createMemory(uid, 'long_term', 'fact', `Meeting Mentioned`, msg.content, 'user_explicit');
                }
                if (lower.includes('goal') || lower.includes('launch') || lower.includes('build') || lower.includes('target')) {
                    MemoryService.createMemory(uid, 'semantic', 'goal', `Goal / Focus Area`, msg.content, 'user_explicit');
                }
                if (lower.includes('my name') || lower.includes('i am') || lower.includes('i prefer')) {
                    MemoryService.createMemory(uid, 'preference', 'preference', `User Preference`, msg.content, 'user_explicit');
                }
            }
            if (msg.action && msg.action.type === 'meeting') {
                const meetingDesc = `Meeting "${msg.action.title}" scheduled for ${msg.action.scheduledAt}. Prep: ${msg.action.prepSummary || 'Briefing call ready'}`;
                MemoryService.createMemory(uid, 'long_term', 'fact', `Scheduled Meeting: ${msg.action.title}`, meetingDesc, 'system_generated');
            }
        });
    },

    getPastConversationsContext: (): string => {
        const memories = personalDataStore.getMemories().filter(m => m.scope === 'long_term' || m.scope === 'conversation');
        if (memories.length === 0) {
            return "No previous chat sessions archived yet.";
        }
        return memories.slice(0, 5).map((m, idx) => `Memory #${idx + 1} [${m.key}]: ${m.value}`).join('\n');
    },
    
    deleteMemory: (id: string) => {
        personalDataStore.deleteMemory(id);
    }
};
