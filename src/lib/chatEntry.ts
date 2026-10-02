import type { ChatMessage, StarterIntent } from '@/types/chat';
import {
  createVibeStarterMessage,
  getVibeStarterText,
  isVibeStarterMessage,
} from './vibeStarterMessages';

export const NORMAL_CHAT_GREETING = "Hey, sunshine! 🌞 I'm really glad you're here. What's on your mind today?";

const LEGACY_NORMAL_GREETINGS = new Set([
  "Hey, sunshine! ☀️ I'm really glad you're here. What's on your mind today?",
  "Hey, sunshine! 🌞 I'm really glad you're here. What's on your mind today?",
]);

export type ChatEntrySource =
  | { source: 'normal' }
  | { source: 'vibe'; selectedVibe: StarterIntent };

export function isNormalChatGreeting(message: ChatMessage): boolean {
  return message.role === 'assistant' && LEGACY_NORMAL_GREETINGS.has(message.content);
}

export function isChatEntryStarter(message: ChatMessage): boolean {
  return isNormalChatGreeting(message) || isVibeStarterMessage(message);
}

export function createNormalChatGreeting(id: string, createdAt: string): ChatMessage {
  return {
    id,
    sessionId: 'default-session',
    role: 'assistant',
    content: NORMAL_CHAT_GREETING,
    createdAt,
    deliveryStatus: 'sent',
    isDemoResponse: false,
    model: 'sunny',
  };
}

export function applyChatEntry(
  history: ChatMessage[],
  entry: ChatEntrySource,
  generatedStarter: ChatMessage
): { messages: ChatMessage[]; changed: boolean } {
  const realMessages = history.filter((message) => !isChatEntryStarter(message));
  const existingStarters = history.filter(isChatEntryStarter);

  if (entry.source === 'normal') {
    if (realMessages.length > 0) {
      const normalizedHistory = normalizeChatEntryStarters(history);
      return {
        messages: normalizedHistory,
        changed: !sameMessageIds(history, normalizedHistory),
      };
    }

    const hasNormalGreeting = existingStarters.some(isNormalChatGreeting);
    if (hasNormalGreeting && existingStarters.length === 1) {
      return { messages: history, changed: false };
    }
    return { messages: [generatedStarter], changed: true };
  }

  const selectedText = getVibeStarterText(entry.selectedVibe);
  if (
    existingStarters.length === 1 &&
    existingStarters[0].content === selectedText
  ) {
    return { messages: history, changed: false };
  }

  const selectedStarter = createVibeStarterMessage(
    entry.selectedVibe,
    generatedStarter.id,
    generatedStarter.createdAt
  );
  return { messages: [...realMessages, selectedStarter], changed: true };
}

export function normalizeChatEntryStarters(history: ChatMessage[]): ChatMessage[] {
  let latestStarterIndex = -1;
  history.forEach((message, index) => {
    if (isChatEntryStarter(message)) latestStarterIndex = index;
  });
  return history.filter(
    (message, index) => !isChatEntryStarter(message) || index === latestStarterIndex
  );
}

function sameMessageIds(left: ChatMessage[], right: ChatMessage[]): boolean {
  return left.length === right.length && left.every((message, index) => message.id === right[index]?.id);
}