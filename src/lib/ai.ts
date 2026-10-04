import { authFetch } from './apiClient';

export async function sendMessage(messages: { role: string; content: string }[], model: string) {
  const response = await authFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'AI API Error');
  }
  const data = await response.json();
  return data;
}
