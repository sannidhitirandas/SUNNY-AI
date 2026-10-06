import type { StarterIntent } from '@/types/chat';
import type { PersonalityTone } from '@/types/user';

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
