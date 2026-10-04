export type TaskType = 'GENERAL_CHAT' | 'REASONING' | 'CODING' | 'VISION' | 'RESEARCH' | 'PLANNING' | 'TOOL_USE' | 'CLASSIFICATION';

export interface ModelConfig {
  id: string;
  provider: 'google' | 'openai' | 'anthropic';
  capabilities: ('FAST' | 'REASONING' | 'CODING' | 'VISION' | 'LONG_CONTEXT' | 'GENERAL' | 'FLAGSHIP' | 'STUDIO_MEDIA')[];
  costTier: 'low' | 'medium' | 'high';
}

export interface AIProvider {
  generate(prompt: string, model: string, context?: string): Promise<string>;
}
