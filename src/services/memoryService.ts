import { Memory, MemoryCategory } from '@/types/memory';
import { cloudStorageService } from './cloudStorageService';

export const memoryService = {
  async getMemories(): Promise<Memory[]> {
    return await cloudStorageService.getMemories();
  },

  async saveMemories(memories: Memory[]): Promise<boolean> {
    await Promise.all(memories.map((memory) => cloudStorageService.saveMemory(memory)));
    return true;
  },

  async addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    const newMemory: Memory = {
      ...memory,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await cloudStorageService.saveMemory(newMemory);
    return newMemory;
  },

  async updateMemory(
    id: string,
    updates: Partial<Pick<Memory, 'title' | 'content' | 'category' | 'userConfirmed'>>
  ): Promise<Memory | null> {
    const memories = await this.getMemories();
    const existing = memories.find((memory) => memory.id === id);
    if (!existing) return null;

    const updatedMemory: Memory = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await cloudStorageService.saveMemory(updatedMemory);
    return updatedMemory;
  },

  async deleteMemory(id: string): Promise<boolean> {
    await cloudStorageService.deleteMemory(id);
    return true;
  },

  async clearAllMemories(): Promise<boolean> {
    await cloudStorageService.clearAllMemories();
    return true;
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
