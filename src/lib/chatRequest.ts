import type { StarterIntent } from '@/types/chat';
import type { PersonalityTone } from '@/types/user';

/**
 * Keep the request focused on recent context. Older messages remain in chat
 * storage and can still be loaded in the UI, but sending the full transcript
 * on every turn increases upload time and provider processing latency.
 */
export function limitConversationHistory<T extends { role: string; content: string }>(
  history: T[],
  maxMessages = 12,
  maxCharacters = 12000
): T[] {
  const selected: T[] = [];
  let characters = 0;

  for (let index = history.length - 1; index >= 0 && selected.length < maxMessages; index -= 1) {
    const item = history[index];
    if (!item || typeof item.content !== 'string' || !item.content.trim()) continue;
    const remaining = maxCharacters - characters;
    if (remaining <= 0) break;
    const content = item.content.length > remaining
      ? item.content.slice(-remaining)
      : item.content;
    selected.unshift(content === item.content ? item : { ...item, content });
    characters += content.length;
  }

  return selected;
}



interface ChatRequestBodyOptions<HistoryItem, MemoryItem, AttachmentItem> {
  message: string;
  history: HistoryItem[];
  tone: PersonalityTone;
  intent: StarterIntent | null;
  preferredName?: string;
  memoryEnabled: boolean;
  memories: MemoryItem[];
  sessionId: string;
  attachments?: AttachmentItem[];
}

export function createChatRequestBody<HistoryItem, MemoryItem, AttachmentItem>(
  options: ChatRequestBodyOptions<HistoryItem, MemoryItem, AttachmentItem>
) {
  return {
    message: options.message,
    history: options.history,
    preferredTone: options.tone,
    ...(options.intent ? { intent: options.intent } : {}),
    preferredName: options.preferredName,
    memoryEnabled: options.memoryEnabled,
    memories: options.memories,
    sessionId: options.sessionId,
    ...(options.attachments?.length ? { attachments: options.attachments } : {}),
  };
}
