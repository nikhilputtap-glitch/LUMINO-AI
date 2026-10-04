/**
 * Production OpenAI Provider
 * Connects directly to OpenAI Chat Completions API with streaming/text support.
 * Configured via OPENAI_API_KEY environment variable.
 */
export class OpenAIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async generate(
    model: string, 
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options: { temperature?: number; max_tokens?: number } = {}
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    // Map model names to valid OpenAI targets
    const openAiModel = model.includes('mini') ? 'gpt-4o-mini' : (model === 'o1-mini' ? 'o1-mini' : 'gpt-4o');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: openAiModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2048
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
