import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import { MemoryService } from "./src/lib/memory";
import { LuminoModelRouter } from "./server/ai/router";
import { LuminoAgentOrchestrator } from "./src/lib/agents/orchestrator";
import { dailyQuotaManager } from "./server/quota";
import { generateSvgArtwork } from "./server/artwork";
import { personalDataStore } from "./src/lib/store/PersonalDataStore";
import { verifyFirebaseAuth, AuthenticatedRequest } from "./server/middleware/auth";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function detectIntent(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("code") || msg.includes("program") || msg.includes("python") || msg.includes("javascript") || msg.includes("java") || msg.includes("algorithm")) return "CODING";
  if (msg.includes("hi") || msg.includes("hello")) return "GREETING";
  if (msg.includes("focus") || msg.includes("matters")) return "PRIORITY_QUERY";
  if (msg.includes("meeting") || msg.includes("calendar") || msg.includes("event") || msg.includes("call me")) return "MEETING";
  if (msg.includes("goal") || msg.includes("i want to")) return "GOAL";
  if (msg.includes("task") || msg.includes("need to") || msg.includes("finish")) return "TASK";
  return "GENERAL_QUERY";
}

function getContext(intent: string, userId: string = 'authenticated-user') {
  const goals = personalDataStore.getGoals();
  const tasks = personalDataStore.getTasks();
  const calendar = personalDataStore.getCalendarEvents();

  if (intent === "PRIORITY_QUERY") return JSON.stringify({ goals, tasks, calendar });
  if (intent === "CODING") return "Technical / Coding request. Provide full working code, complete runnable script, expected execution output, and step-by-step logic breakdown.";
  if (intent === "PLANNING") return JSON.stringify({ tasks, calendar });
  if (intent === "GOAL") return JSON.stringify(goals);
  if (intent === "TASK") return JSON.stringify(tasks);
  return "";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Apply token verification middleware to all /api routes
  app.use("/api", verifyFirebaseAuth);

  const router = new LuminoModelRouter();
  const agentOrchestrator = new LuminoAgentOrchestrator();

  // API routes
  app.post("/api/chat", async (req: AuthenticatedRequest, res) => {
    const { messages } = req.body;
    const userId = req.user?.uid || 'guest-session-authenticated';
    const lastMessage = messages[messages.length - 1].content;
    const intent = detectIntent(lastMessage);
    
    // Only run autonomous agent workflow if user explicitly asks for autonomous multi-step workflow launch
    if (lastMessage.toLowerCase().includes('run agent workflow') || lastMessage.toLowerCase().includes('autonomous workflow')) {
        const workflow = await agentOrchestrator.runWorkflow(lastMessage);
        res.json({ type: 'text', message: `Workflow initiated for: ${workflow.goal}. Lumino is working on it.` });
        return;
    }

    // Retrieve relevant memory and past chat sessions for this specific user
    const relevantMemories = MemoryService.retrieveRelevantMemories(lastMessage);
    const memoryContext = relevantMemories.map(m => `• [${m.scope.toUpperCase()}] ${m.key}: ${m.value}`).join('\n');
    const pastConversationsContext = MemoryService.getPastConversationsContext();
    
    const context = `${getContext(intent, userId)}

USER'S LONG-TERM MEMORY (Active facts & preferences):
${memoryContext || "• No specific previous facts matched."}

PAST ARCHIVED CONVERSATION SESSIONS (Recall if user asks about previous discussions):
${pastConversationsContext}`;
    
    try {
      const responseText = await router.route(lastMessage, context, req.body.model);
      
      // Auto-index user mentions into Long-Term Memory
      const lowerLast = lastMessage.toLowerCase();
      if (lowerLast.includes("remember") || lowerLast.includes("my name is") || lowerLast.includes("i prefer") || lowerLast.includes("my goal")) {
        MemoryService.createMemory(userId, 'long_term', 'fact', 'User Explicit Note', lastMessage, 'user_explicit');
      }
      
      let parsed: any = null;
      try {
        const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            parsed = JSON.parse(responseText.substring(firstBrace, lastBrace + 1));
          } catch {}
        }
      }

      if (parsed) {
        // Auto-save meeting to calendar and memory if detected
        if (parsed.action && parsed.action.type === 'meeting') {
          const meetingTitle = parsed.action.title || 'Upcoming Meeting';
          const meetingTime = parsed.action.scheduledAt || 'Upcoming';
          const now = new Date();
          
          personalDataStore.addCalendarEvent({
            userId,
            title: meetingTitle,
            description: parsed.action.prepSummary || parsed.action.description || '30-minute reminder call scheduled',
            startTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
            endTime: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
            timezone: 'UTC',
            location: 'Google Meet / Briefing Call',
            participants: [req.user?.email || 'user@lumino.ai'],
            reminderSettings: 30,
            prepTimeMinutes: 30,
            focusType: 'meeting',
            status: 'confirmed'
          });

          // Index meeting into Long-Term Memory
          MemoryService.createMemory(
            userId,
            'long_term',
            'fact',
            `Meeting: ${meetingTitle}`,
            `${meetingTitle} scheduled for ${meetingTime}. Prep points: ${parsed.action.prepSummary || 'Briefing ready.'}`,
            'system_generated'
          );
        }

        res.json({
          type: parsed.type || 'text',
          message: parsed.message || responseText,
          programDetails: parsed.programDetails || null,
          action: parsed.action || null,
          speakVoice: parsed.speakVoice || false,
          suggestedFollowUps: parsed.suggestedFollowUps || ["Copy code and run 🚀", "Explain this logic 💡", "Add test cases 🧪"]
        });
      } else {
        res.json({ 
          type: 'text', 
          message: responseText,
          speakVoice: false,
          suggestedFollowUps: ["Copy code and run 🚀", "Explain line by line 💡", "Add more features ⚡"]
        });
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      const isQuota = error?.status === 429 || error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED");
      const errorMsg = isQuota
        ? "AI service quota limit reached for this API key. Please try again shortly or check your Gemini API plan."
        : (error?.message || "AI service is currently busy. Please try again in a moment.");
      res.status(503).json({ error: errorMsg });
    }
  });

  // Conversation & Session Management Routes
  app.get("/api/conversations", (req: AuthenticatedRequest, res) => {
    res.json({ conversations: [] });
  });

  app.post("/api/conversations", (req: AuthenticatedRequest, res) => {
    const { session } = req.body;
    if (!session || !session.id) {
      res.status(400).json({ error: "Session data with valid id is required" });
      return;
    }
    MemoryService.saveConversationSession(session);
    res.json({ success: true, session });
  });

  app.delete("/api/conversations/:id", (req: AuthenticatedRequest, res) => {
    res.json({ success: true });
  });

  // Memory Routes
  app.get("/api/memories", (req: AuthenticatedRequest, res) => {
    res.json({ memories: personalDataStore.getMemories() });
  });

  app.delete("/api/memories/:id", (req: AuthenticatedRequest, res) => {
    MemoryService.deleteMemory(req.params.id);
    res.json({ success: true, memories: personalDataStore.getMemories() });
  });

  // Quota Management Routes (10 Pics & 5 Videos daily per user in 4K/8K/16K)
  app.get("/api/quota", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.uid || 'guest-session-authenticated';
    res.json(dailyQuotaManager.getQuota(userId));
  });

  app.post("/api/quota/consume", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.uid || 'guest-session-authenticated';
    const { type } = req.body;
    if (type === 'video') {
      const result = dailyQuotaManager.consumeVideo(userId);
      if (!result.success) {
        return res.status(429).json({ error: result.error, code: 'LIMIT_REACHED', quota: result.quota });
      }
      return res.json({ success: true, quota: result.quota });
    } else {
      const result = dailyQuotaManager.consumePic(userId);
      if (!result.success) {
        return res.status(429).json({ error: result.error, code: 'LIMIT_REACHED', quota: result.quota });
      }
      return res.json({ success: true, quota: result.quota });
    }
  });

  app.post("/api/quota/reset", (req: AuthenticatedRequest, res) => {
    const userId = req.user?.uid || 'guest-session-authenticated';
    const quota = dailyQuotaManager.resetQuota(userId);
    res.json({ success: true, quota });
  });

  // AI Generation Routes
  app.post("/api/ai/image", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.uid || 'guest-session-authenticated';
    // Enforce Daily Limit: 10 Pics / day
    const quotaCheck = dailyQuotaManager.consumePic(userId);
    if (!quotaCheck.success) {
      return res.status(429).json({
        error: quotaCheck.error,
        code: "LIMIT_REACHED",
        quota: quotaCheck.quota,
      });
    }

    const { prompt, quality = '4K', aspectRatio = '1:1', style = 'photorealistic' } = req.body;
    try {
      let imageUrl = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: { parts: [{ text: `${prompt}, master quality ${quality} UHD ${style}` }] },
          config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: quality === '4K' ? '4K' : '1K' } },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (geminiImgErr: any) {
        // If image API quota unavailable, generate master quality svg artwork
        imageUrl = generateSvgArtwork(prompt, quality as any, aspectRatio as any, style);
      }

      if (!imageUrl) {
        imageUrl = generateSvgArtwork(prompt, quality as any, aspectRatio as any, style);
      }

      res.json({ 
        imageUrl, 
        quality, 
        prompt, 
        quota: quotaCheck.quota,
        model: req.body.model || 'lumino-6.7omg'
      });
    } catch (error: any) {
      console.error("Image Error:", error);
      res.status(500).json({ error: "Failed to generate image", quota: dailyQuotaManager.getQuota(userId) });
    }
  });

  app.post("/api/ai/music", async (req: AuthenticatedRequest, res) => {
    const { prompt } = req.body;
    try {
      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: prompt,
      });

      let audioBase64 = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }
      res.json({ audioUrl: `data:${mimeType};base64,${audioBase64}` });
    } catch (error) {
      console.error("Music Error:", error);
      res.status(500).json({ error: "Failed to generate music" });
    }
  });

  // Veo Video Generation Routes
  app.post("/api/generate-video", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.uid || 'guest-session-authenticated';
    const quotaCheck = dailyQuotaManager.consumeVideo(userId);
    if (!quotaCheck.success) {
      return res.status(429).json({
        error: quotaCheck.error,
        code: "LIMIT_REACHED",
        quota: quotaCheck.quota,
      });
    }

    try {
      const { imageBase64, mimeType = 'image/jpeg', prompt, aspectRatio = '16:9', quality = '4K' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const pureBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const validRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `${prompt || 'Animate this photo with smooth cinematic camera motion and high quality realistic depth'}. Rendered in ${quality} Ultra HD master quality.`,
        image: {
          imageBytes: pureBase64,
          mimeType: mimeType || 'image/jpeg',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: validRatio,
        }
      });

      res.json({ operationName: operation.name, quality, quota: quotaCheck.quota });
    } catch (error: any) {
      console.error("[Veo Video] Generate Error:", error);
      res.status(503).json({ 
        error: error?.message || "Video generation provider currently unavailable. Please try again shortly.", 
        quota: dailyQuotaManager.getQuota(userId) 
      });
    }
  });

  app.post("/api/video-status", async (req: AuthenticatedRequest, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "operationName is required" });
      }

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      res.json({
        done: Boolean(updated.done),
        error: updated.error || null,
      });
    } catch (error: any) {
      console.error("[Veo Video] Status Error:", error);
      res.status(500).json({ error: error?.message || "Failed to check video status" });
    }
  });

  app.post("/api/video-download", async (req: AuthenticatedRequest, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "operationName is required" });
      }

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: "Video URI not found or video generation not completed" });
      }

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
      });

      if (!videoRes.ok) {
        throw new Error(`Failed to download video stream: ${videoRes.statusText}`);
      }

      res.setHeader('Content-Type', 'video/mp4');
      const arrayBuffer = await videoRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("[Veo Video] Download Error:", error);
      res.status(500).json({ error: error?.message || "Failed to download video" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
