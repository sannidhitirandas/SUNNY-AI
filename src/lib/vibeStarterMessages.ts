import type { ChatMessage, StarterIntent } from '@/types/chat';

const VIBE_STARTERS: Record<StarterIntent, string> = {
  listen: "I'm right here with you. Take all the time you need—what's been weighing on your heart or mind?",
  laugh: 'Tiny adventure time! 😄 Would you like a silly question, a bizarre fun fact, or just a little playful distraction?',
  encourage: "Hey, take a slow breath with me. 💛 You don't have to carry the whole mountain today. What feels heavy right now?",
  anything: "Anything goes! A random thought, something cool you saw today, or just daydreaming—what are you thinking about?",
};

export function getVibeStarterText(intent: StarterIntent): string {
  return VIBE_STARTERS[intent];
}

export function createVibeStarterMessage(
  intent: StarterIntent,
  id: string,
  createdAt: string
): ChatMessage {
  return {
    id,
    sessionId: 'default-session',
    role: 'assistant',
    content: getVibeStarterText(intent),
    createdAt,
    deliveryStatus: 'sent',
    isDemoResponse: false,
    model: 'sunny',
  };
}

export function nextVibeStarterTimestamp(
  messages: ChatMessage[],
  now = Date.now()
): string {
  const latestExistingTime = messages.reduce((latest, message) => {
    const timestamp = Date.parse(message.createdAt);
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, 0);
  return new Date(Math.max(now, latestExistingTime + 1)).toISOString();
}

export function isVibeStarterMessage(message: ChatMessage): boolean {
  return message.role === 'assistant' &&
    (Object.values(VIBE_STARTERS) as string[]).includes(message.content);
}

export function replaceVibeStarterMessages(
  messages: ChatMessage[],
  selectedStarter: ChatMessage
): { messages: ChatMessage[]; removedIds: string[] } {
  const removedIds = messages
    .filter(isVibeStarterMessage)
    .map((message) => message.id);
  const preservedMessages = messages.filter((message) => !isVibeStarterMessage(message));

  return {
    messages: [...preservedMessages, selectedStarter],
    removedIds,
  };
}

export function normalizeHydratedVibeStarters(messages: ChatMessage[]): ChatMessage[] {
  let latestStarterIndex = -1;
  messages.forEach((message, index) => {
    if (isVibeStarterMessage(message)) latestStarterIndex = index;
  });

  return messages.filter(
    (message, index) => !isVibeStarterMessage(message) || index === latestStarterIndex
  );
}