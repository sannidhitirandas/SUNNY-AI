export type MessageRole = 'user' | 'assistant' | 'system';
export type DeliveryStatus = 'sending' | 'sent' | 'failed';

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  deliveryStatus: DeliveryStatus;
  isDemoResponse?: boolean;
  model?: string;
  errorMessage?: string;
  attachments?: ChatAttachment[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
}

export type StarterIntent = 'listen' | 'laugh' | 'encourage' | 'anything';
