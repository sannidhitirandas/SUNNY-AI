import { Memory, MemoryCategory } from '@/types/memory';
import { storageService } from './storageService';

export const memoryService = {
  async getMemories(): Promise<Memory[]> {
    const saved = await storageService.getItem<Memory[]>(storageService.KEYS.MEMORIES, []);
    // Remove legacy sample/demo memories so they are never presented as user data.
    const realMemories = saved.filter((memory) => !memory.isDemoData && !memory.id.startsWith('demo-mem-'));
    if (realMemories.length !== saved.length) {
      await storageService.setItem(storageService.KEYS.MEMORIES, realMemories);
    }
    return realMemories;
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
