import { ModelConfig } from './types';

export const ModelRegistry: ModelConfig[] = [
  // Flagship & Google Models
  { id: 'lumino-6.7omg', provider: 'google', capabilities: ['FLAGSHIP', 'REASONING', 'STUDIO_MEDIA', 'CODING', 'VISION', 'GENERAL'], costTier: 'high' },
  { id: 'lumino-pro', provider: 'google', capabilities: ['REASONING', 'LONG_CONTEXT', 'CODING'], costTier: 'medium' },
  { id: 'lumino-6.4', provider: 'google', capabilities: ['FAST', 'GENERAL', 'CODING'], costTier: 'low' },
  { id: 'gemini-2.5-flash', provider: 'google', capabilities: ['FAST', 'GENERAL', 'CODING', 'REASONING'], costTier: 'low' },
  { id: 'gemini-3.1-pro-preview', provider: 'google', capabilities: ['REASONING', 'LONG_CONTEXT', 'CODING'], costTier: 'high' },
  
  // OpenAI Models
  { id: 'gpt-4o', provider: 'openai', capabilities: ['FLAGSHIP', 'REASONING', 'CODING', 'VISION', 'GENERAL'], costTier: 'high' },
  { id: 'gpt-4o-mini', provider: 'openai', capabilities: ['FAST', 'GENERAL', 'CODING'], costTier: 'low' },
  { id: 'o1-mini', provider: 'openai', capabilities: ['REASONING', 'CODING'], costTier: 'high' },

  // Anthropic Models
  { id: 'claude-3-5-sonnet', provider: 'anthropic', capabilities: ['FLAGSHIP', 'REASONING', 'CODING', 'VISION', 'LONG_CONTEXT'], costTier: 'high' },
  { id: 'claude-3-5-haiku', provider: 'anthropic', capabilities: ['FAST', 'GENERAL', 'CODING'], costTier: 'low' }
];
