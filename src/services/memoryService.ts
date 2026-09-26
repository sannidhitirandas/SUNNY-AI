import { Memory, MemoryCategory } from '@/types/memory';
import { storageService } from './storageService';

const DEMO_MEMORIES: Memory[] = [
  {
    id: 'demo-mem-1',
    userId: 'demo-user',
    title: 'Favorite relaxation activity',
    content: 'Enjoys taking evening walks with indie music to decompress.',
    category: 'personal',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    userConfirmed: true,
    isDemoData: true,
  },
  {
    id: 'demo-mem-2',
    userId: 'demo-user',
    title: 'Ongoing creative project',
    content: 'Working on a digital art project and practicing watercolor styling.',
    category: 'ongoing',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    userConfirmed: true,
    isDemoData: true,
  },
  {
    id: 'demo-mem-3',
    userId: 'demo-user',
    title: 'Pet companion',
    content: 'Has a cheerful golden retriever named Milo who loves tennis balls.',
    category: 'relationships',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    userConfirmed: true,
    isDemoData: true,
  },
  {
    id: 'demo-mem-4',
    userId: 'demo-user',
    title: 'Conversation pace preference',
    content: 'Prefers gentle check-ins rather than long lists of advice when stressed.',
    category: 'preferences',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    userConfirmed: true,
    isDemoData: true,
  },
];

export const memoryService = {
  async getMemories(): Promise<Memory[]> {
    return await storageService.getItem<Memory[]>(storageService.KEYS.MEMORIES, DEMO_MEMORIES);
  },

  async saveMemories(memories: Memory[]): Promise<boolean> {
    return await storageService.setItem(storageService.KEYS.MEMORIES, memories);
  },

  async addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    const memories = await this.getMemories();
    const newMemory: Memory = {
      ...memory,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newMemory, ...memories];
    await this.saveMemories(updated);
    return newMemory;
  },

  async updateMemory(id: string, updates: Partial<Pick<Memory, 'title' | 'content' | 'category' | 'userConfirmed'>>): Promise<Memory | null> {
    const memories = await this.getMemories();
    const index = memories.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updatedMemory: Memory = {
      ...memories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    memories[index] = updatedMemory;
    await this.saveMemories(memories);
    return updatedMemory;
  },

  async deleteMemory(id: string): Promise<boolean> {
    const memories = await this.getMemories();
    const filtered = memories.filter((m) => m.id !== id);
    return await this.saveMemories(filtered);
  },

  async clearAllMemories(): Promise<boolean> {
    return await this.saveMemories([]);
  },

  async resetDemoMemories(): Promise<Memory[]> {
    await this.saveMemories(DEMO_MEMORIES);
    return DEMO_MEMORIES;
  },

  filterMemories(memories: Memory[], category: MemoryCategory | 'all', search: string): Memory[] {
    return memories.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  },
};
