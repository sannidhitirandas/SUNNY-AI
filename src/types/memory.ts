export type MemoryCategory = 
  | 'personal' 
  | 'relationships' 
  | 'events' 
  | 'ongoing' 
  | 'preferences';

export interface Memory {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: MemoryCategory;
  createdAt: string;
  updatedAt: string;
  userConfirmed: boolean;
  sourceSessionId?: string;
  isDemoData?: boolean;
  memoryKey?: string;
  expiresAt?: string;
}
