import { ChatMessage, StarterIntent } from '@/types/chat';
import { Memory } from '@/types/memory';
import { PersonalityTone } from '@/types/user';

import { cloudStorageService } from './cloudStorageService';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg-1',
    sessionId: 'default-session',
    role: 'assistant',
    content:
      "Hey, sunshine! ☀️ I'm really glad you're here. What's on your mind today?",
    createdAt: new Date().toISOString(),
    deliveryStatus: 'sent',
    isDemoResponse: false,
  },
];

export interface SendMessageOptions {
  message: string;
  history: ChatMessage[];
  tone?: PersonalityTone;
  preferredName?: string;
  memoryEnabled?: boolean;
  memories?: Memory[];
  sessionId?: string;
}

export const chatService = {
  async getMessages(sessionId: string = 'default-session'): Promise<ChatMessage[]> {
    const saved = await cloudStorageService.getChatMessages(sessionId);
    return saved.length > 0 ? saved : INITIAL_MESSAGES;
  },

  async saveMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    await cloudStorageService.saveChatMessages(sessionId, messages);
  },

  async clearMessages(sessionId: string = 'default-session'): Promise<void> {
    await cloudStorageService.clearChatMessages(sessionId);
  },

  getStarterGreeting(
    intent: StarterIntent,
    _tone: PersonalityTone = 'adaptive'
  ): string {
    switch (intent) {
      case 'listen':
        return "I'm right here with you. Take all the time you need—what's been weighing on your heart or mind?";

      case 'laugh':
        return 'Tiny adventure time! 😄 Would you like a silly question, a bizarre fun fact, or just a little playful distraction?';

      case 'encourage':
        return "Hey, take a slow breath with me. 💛 You don't have to carry the whole mountain today. What feels heavy right now?";

      case 'anything':
      default:
        return "Anything goes! A random thought, something cool you saw today, or just daydreaming—what are you thinking about?";
    }
  },

  async sendMessageToAI(options: SendMessageOptions): Promise<{ text: string }> {
    const {
      message,
      history,
      tone = 'adaptive',
      preferredName,
      memoryEnabled = true,
      memories = [],
      sessionId = 'default-session',
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const formattedHistory = history
        .filter((m) => m.deliveryStatus !== 'failed')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const memoryPayloads = memoryEnabled
        ? memories.map((m) => ({
            title: m.title,
            content: m.content,
            category: m.category,
          }))
        : [];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          history: formattedHistory,
          preferredTone: tone,
          preferredName: preferredName?.trim() || undefined,
          memoryEnabled,
          memories: memoryPayloads,
          sessionId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Server responded with status ${response.status}`);
      }

      if (!data || !data.success || typeof data.text !== 'string') {
        throw new Error(data?.error || 'Received an invalid response format from Sunny AI.');
      }

      return { text: data.text };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Sunny took a bit too long to respond. Please tap Retry to try again.');
      }

      if (err instanceof Error) throw err;

      throw new Error('Sunny had a brief connection stumble. Please tap Retry to try again.');
    }
  },
};
