import { AIProvider } from '../types';
import { GoogleGenAI } from "@google/genai";

export class GoogleProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async generate(prompt: string, model: string, systemInstruction: string = ""): Promise<string> {
    const mappedModel = model === 'lumino-6.7omg' || model === 'lumino-pro'
      ? 'gemini-3.5-flash'
      : model === 'lumino-6.4'
      ? 'gemini-3.1-flash-lite'
      : (model || 'gemini-3.5-flash');

    // Model fallback sequence using tested, active models with available quota
    const fallbackCandidates = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      mappedModel,
      'gemini-flash-latest',
    ];
    const modelsToTry = Array.from(new Set(fallbackCandidates.filter(Boolean)));
    let lastError: any = null;

    for (const m of modelsToTry) {
      try {
        const response = await this.ai.models.generateContent({
          model: m,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || undefined,
            responseMimeType: "application/json",
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        // If JSON mode was rejected or failed on this model, retry standard generation
        try {
          const textResponse = await this.ai.models.generateContent({
            model: m,
            contents: prompt,
            config: systemInstruction ? { systemInstruction } : undefined,
          });
          if (textResponse.text) {
            return textResponse.text;
          }
        } catch (innerErr: any) {
          lastError = innerErr;
        }
        lastError = err;
        console.warn(`Model ${m} failed:`, err?.status || err?.message || err);
      }
    }
    throw lastError || new Error('Failed to generate response');
  }
}
