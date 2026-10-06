import { ChatMessage, StarterIntent } from '@/types/chat';
import { Memory } from '@/types/memory';
import { PersonalityTone } from '@/types/user';
import { cloudStorageService } from './cloudStorageService';
import { apiUrl } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { storageService } from './storageService';
import type { AutomaticMemoryCandidate } from './automaticMemory';
import { getVibeStarterText } from '@/lib/vibeStarterMessages';
import { NORMAL_CHAT_GREETING } from '@/lib/chatEntry';
import { createChatRequestBody } from '@/lib/chatRequest';

const createInitialMessages = (): ChatMessage[] => [{
  id: `welcome-msg-${crypto.randomUUID()}`, sessionId: 'default-session', role: 'assistant',
  content: NORMAL_CHAT_GREETING, createdAt: new Date().toISOString(),
  deliveryStatus: 'sent', isDemoResponse: false,
}];

export interface SendMessageOptions {
  message: string;
  history: ChatMessage[];
  tone?: PersonalityTone;
  intent?: StarterIntent | null;
  preferredName?: string;
  memoryEnabled?: boolean;
  memories?: Memory[];
  sessionId?: string;
  files?: File[];
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read attachment.'));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });

export const chatService = {
  async getMessages(sessionId: string = 'default-session'): Promise<ChatMessage[]> {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const saved = await cloudStorageService.getChatMessages(sessionId);
      return saved.length > 0 ? saved : createInitialMessages();
    }
    const local = await storageService.getItem<ChatMessage[]>(`@sunny_guest_chat_messages_${sessionId}`, []);
    return local.length > 0 ? local : createInitialMessages();
  },

  async saveMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await cloudStorageService.saveChatMessages(sessionId, messages);
      return;
    }
    await storageService.setItem(`@sunny_guest_chat_messages_${sessionId}`, messages);
  },

  async clearMessages(sessionId: string = 'default-session'): Promise<void> {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await cloudStorageService.clearChatMessages(sessionId);
      return;
    }
    await storageService.removeItem(`@sunny_guest_chat_messages_${sessionId}`);
  },

  getStarterGreeting(intent: StarterIntent, _tone: PersonalityTone = 'adaptive'): string {
    return getVibeStarterText(intent);
  },

  async sendMessageToAI(options: SendMessageOptions): Promise<{
    text: string;
    memoriesUpdated: boolean;
    memoryUpdates: AutomaticMemoryCandidate[];
  }> {
    const {
      message, history, tone = 'adaptive', intent = null, preferredName,
      memoryEnabled = true, memories = [], sessionId = 'default-session', files = [],
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const formattedHistory = history
        .filter((m) => m.deliveryStatus !== 'failed')
        .map((m) => ({ role: m.role, content: m.content }));

      const { data: { session } } = await supabase.auth.getSession();
      const memoryPayloads = memoryEnabled && !session
        ? memories.map((m) => ({ id: m.id, memoryKey: m.memoryKey, title: m.title, content: m.content, category: m.category, expiresAt: m.expiresAt }))
        : [];

      const attachments = await Promise.all(files.map(async (file) => ({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: await fileToDataUrl(file),
      })));

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers,
        body: JSON.stringify(createChatRequestBody({
          message: message.trim(), history: formattedHistory, tone, intent,
          preferredName: preferredName?.trim() || undefined, memoryEnabled,
          memories: memoryPayloads, sessionId, attachments,
        })),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `Server responded with status ${response.status}`);
      if (!data || !data.success || typeof data.text !== 'string') throw new Error(data?.error || 'Received an invalid response format from Sunny AI.');

      const memoryUpdates = Array.isArray(data.memoryUpdates)
        ? data.memoryUpdates.filter((item: unknown): item is AutomaticMemoryCandidate =>
            Boolean(item) && typeof item === 'object' &&
            typeof (item as AutomaticMemoryCandidate).key === 'string' &&
            typeof (item as AutomaticMemoryCandidate).title === 'string' &&
            typeof (item as AutomaticMemoryCandidate).content === 'string' &&
            ['personal', 'relationships', 'events', 'ongoing', 'preferences'].includes((item as AutomaticMemoryCandidate).category))
        : [];

      return { text: data.text, memoriesUpdated: data.memoriesUpdated === true, memoryUpdates };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') throw new Error('Sunny took a bit too long to respond. Please tap Retry to try again.');
      if (err instanceof Error) throw err;
      throw new Error('Sunny had a brief connection stumble. Please tap Retry to try again.');
    }
  },
};
