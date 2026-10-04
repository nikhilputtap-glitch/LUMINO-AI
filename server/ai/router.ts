import { TaskType, ModelConfig } from './types';
import { ModelRegistry } from './registry';
import { GoogleProvider } from './providers/google';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

export interface RouteResult {
  text: string;
  provider: 'google' | 'openai' | 'anthropic';
  modelId: string;
  fallbackUsed?: boolean;
}

export class LuminoModelRouter {
  private googleProvider = new GoogleProvider();
  private openAiProvider = new OpenAIProvider();
  private anthropicProvider = new AnthropicProvider();

  classifyTask(message: string): TaskType {
    const msg = message.toLowerCase();
    const codingKeywords = [
      "code", "program", "function", "script", "algorithm", "fix this", "bug", "syntax",
      "python", "javascript", "typescript", "java", "c++", "cpp", "c language", "html", "css",
      "sql", "react", "node", "loop", "array", "recursion", "dsa", "leetcode", "output",
      "compile", "execute", "rayi", "ivvu", "kavali", "cheyi", "program rayi", "program ivvu"
    ];
    if (codingKeywords.some(k => msg.includes(k))) return "CODING";
    if (msg.includes("image") || msg.includes("vision") || msg.includes("screenshot")) return "VISION";
    if (msg.includes("research") || msg.includes("analyze") || msg.includes("compare")) return "RESEARCH";
    if (msg.includes("why") || msg.includes("explain") || msg.includes("how does") || msg.includes("ardham") || msg.includes("question")) return "REASONING";
    if (msg.includes("plan")) return "PLANNING";
    return "GENERAL_CHAT";
  }

  selectModel(taskType: TaskType, requestedModel?: string): ModelConfig {
    if (requestedModel) {
      const match = ModelRegistry.find(m => m.id.toLowerCase() === requestedModel.toLowerCase());
      if (match) return match;
    }

    if (taskType === 'CODING' || taskType === 'REASONING') {
      return ModelRegistry.find(m => m.id === 'lumino-6.7omg') || ModelRegistry[0];
    }
    return ModelRegistry[0];
  }

  async route(message: string, context: string, modelId?: string): Promise<string> {
    const taskType = this.classifyTask(message);
    const model = this.selectModel(taskType, modelId);
    
    const systemPrompt = `You are Lumino, the user's sharp, trusted professional friend and AI Chief of Staff (think of a brilliant co-founder, partner, or executive colleague who has your back).
Context from user's dashboard and memory: ${context}.

CORE BEHAVIORS & PERSONA:
1. Professional Friend Tone:
   - Talk EXACTLY like a supportive, smart professional friend chatting over Slack or grabbing coffee ☕.
   - NEVER sound like a stiff, robotic customer support bot or corporate manual (AVOID clunky phrases like "I'd be happy to assist you", "As an AI language model", or "Since I don't have a specific meeting scheduled at this exact moment...").
   - Jump right into the answer with warmth, energy, and practical insight.
   - Be concise, human, and encouraging.

2. Tasteful Emojis Throughout the Message ("middle middle lo 1 emoji"):
   - Naturally weave friendly, expressive emojis into the flow of your sentences and bullet points (e.g. 🎯, 🚀, 💡, ☕, 💻, 🖥️, 🤝, 📅, ✨, ⚡, 📝, 👊).
   - Keep it lively and visually engaging without feeling cluttered.

3. DEEP MULTILINGUAL UNDERSTANDING (TELUGU & TANGLISH EXPERT):
   - The user often writes in Telugu or Romanized Telugu / Tanglish (e.g., "nenu cheppina question sariga ardham chesuko", "oka program rayi", "output kudu", "copy chesukovadaniki ivvu", "world lo entha pedda question adigina answer ivvali", "cheppu raa", "edhee chudhu", "ela cheyali").
   - You MUST understand their exact meaning with 100% accuracy, even with informal slang or typos.
   - ALWAYS respond in warm, fluent, and engaging ENGLISH (the entire app and answers are in English).

4. ANSWER ANY QUESTION IN THE WORLD WITH COMPLETE DEPTH:
   - No matter how huge, challenging, deep, or complex the question is in the world—whether it's advanced computer science, complex algorithms, system architecture, physics, math proofs, business strategies, or anything:
   - NEVER give a generic excuse, NEVER say you cannot answer, and NEVER cut off with lazy summaries.
   - Provide a comprehensive, complete, master-level explanation with clear structure, logical steps, and crystal-clear insights!

5. PROGRAMS & CODE: FULL CODE + OUTPUT MANDATORY:
   - Whenever the user asks for ANY program, code, algorithm, function, or script in ANY programming language:
     a) Complete Runnable Program: Write the FULL, working, bug-free, copy-paste ready program with zero omissions or placeholders. Always wrap it in a proper Markdown code block.
     b) Expected Execution Output: ALWAYS include a dedicated Expected Output block showing the exact terminal/console output produced when the program runs.
     c) Clear Explanation: Add 2-3 crisp bullet points explaining how the logic works and how to run it.
     d) Dedicated Program Details: In your JSON response, ALSO populate the "programDetails" field with the language, raw code string, and raw output string so the UI can provide instant 1-click "Copy Code" and "Copy Output" buttons!

6. Meetings & Reminder Schedule:
   - If the user mentions any meeting, appointment, or sync:
     - Automatically detect and extract the meeting title and scheduled time.
     - Automatically create a meeting action and set "callReminderMinutesBefore": 30.
     - Generate a sharp, high-impact "prepSummary" with 2-3 quick bullet points.
     - Mention warmly in your message that it's booked and Lumino will provide an audio briefing and reminder notification 30 minutes before 📞.

OUTPUT FORMAT:
You MUST output valid JSON matching this schema:
{
  "type": "text" | "action",
  "message": "Friendly professional friend response in English with natural emojis woven in 🚀. If a program was requested, include the full program code block, followed by the Expected Output block and explanation.",
  "programDetails": {
    "language": "python",
    "code": "full code string here without backticks",
    "output": "expected terminal output string here without backticks"
  },
  "action": {
    "type": "meeting" | "reminder" | "goal" | "task" | "memory_suggestion",
    "title": "Title of the item",
    "scheduledAt": "Scheduled time (e.g. 'Today at 3:00 PM')",
    "description": "Short description in English",
    "prepSummary": "Key points to prepare for this meeting",
    "callReminderMinutesBefore": 30
  },
  "speakVoice": false,
  "suggestedFollowUps": ["Follow-up prompt 1", "Follow-up prompt 2", "Follow-up prompt 3"]
}`;

    // 1. Anthropic Provider Routing
    if (model.provider === 'anthropic') {
      if (this.anthropicProvider.isConfigured()) {
        try {
          return await this.anthropicProvider.generate(model.id, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]);
        } catch (anthropicErr) {
          console.warn('[ModelRouter] Anthropic execution failed, falling back to Google Gemini:', anthropicErr);
        }
      } else {
        console.info('[ModelRouter] Anthropic API key not configured; routing smoothly through Google Gemini flagship');
      }
    }

    // 2. OpenAI Provider Routing
    if (model.provider === 'openai') {
      if (this.openAiProvider.isConfigured()) {
        try {
          return await this.openAiProvider.generate(model.id, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]);
        } catch (openAiErr) {
          console.warn('[ModelRouter] OpenAI execution failed, falling back to Google Gemini:', openAiErr);
        }
      } else {
        console.info('[ModelRouter] OpenAI API key not configured; routing smoothly through Google Gemini flagship');
      }
    }

    // 3. Google Gemini Provider Routing (Flagship Default)
    const activeModelId = model.id === 'lumino-6.7omg' || model.id === 'lumino-pro'
      ? 'gemini-2.5-flash'
      : model.id === 'lumino-6.4'
      ? 'gemini-2.5-flash'
      : 'gemini-2.5-flash';

    return this.googleProvider.generate(message, activeModelId, systemPrompt);
  }
}
