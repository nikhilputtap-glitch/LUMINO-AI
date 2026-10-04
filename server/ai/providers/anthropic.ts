/**
 * Production Anthropic Provider
 * Connects directly to Anthropic Messages API.
 * Configured via ANTHROPIC_API_KEY environment variable.
 */
export class AnthropicProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
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
      throw new Error('ANTHROPIC_API_KEY is not configured in environment variables');
    }

    // Map model names to valid Anthropic models
    const anthropicModel = model.includes('haiku') 
      ? 'claude-3-5-haiku-20241022' 
      : 'claude-3-5-sonnet-20241022';

    // Separate system message if provided
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const conversationMsgs = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: anthropicModel,
        system: systemMsg,
        messages: conversationMsgs,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2048
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.content?.[0]?.text || '';
  }
}
