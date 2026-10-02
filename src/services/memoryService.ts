import { Memory, MemoryCategory } from '@/types/memory';
import { cloudStorageService } from './cloudStorageService';
import { storageService } from './storageService';
import { supabase } from '@/lib/supabase';
import {
  mergeAutomaticMemories,
  normalizeMemoryKey,
  removeMemoryById,
  selectGuestMemoriesToImport,
  type AutomaticMemoryCandidate,
} from './automaticMemory';

const GUEST_MEMORIES_KEY = storageService.KEYS.GUEST_MEMORIES;

async function isSignedIn(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

async function getLocalMemories(): Promise<Memory[]> {
  return storageService.getItem<Memory[]>(GUEST_MEMORIES_KEY, []);
}

async function saveLocalMemories(memories: Memory[]): Promise<void> {
  await storageService.setItem(GUEST_MEMORIES_KEY, memories);
}

export const memoryService = {
  async getMemories(): Promise<Memory[]> {
    return (await isSignedIn()) ? cloudStorageService.getMemories() : getLocalMemories();
  },

  async saveMemories(memories: Memory[]): Promise<boolean> {
    if (await isSignedIn()) {
      await Promise.all(memories.map((memory) => cloudStorageService.saveMemory(memory)));
    } else {
      await saveLocalMemories(memories);
    }
    return true;
  },

  async addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    const newMemory: Memory = {
      ...memory,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (await isSignedIn()) {
      await cloudStorageService.saveMemory(newMemory);
    } else {
      const memories = await getLocalMemories();
      await saveLocalMemories([newMemory, ...memories]);
    }
    return newMemory;
  },

  async updateMemory(
    id: string,
    updates: Partial<Pick<Memory, 'title' | 'content' | 'category' | 'userConfirmed'>>
  ): Promise<Memory | null> {
    const memories = await this.getMemories();
    const existing = memories.find((memory) => memory.id === id);
    if (!existing) return null;

    const updatedMemory: Memory = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    if (await isSignedIn()) {
      await cloudStorageService.saveMemory(updatedMemory);
    } else {
      await saveLocalMemories(memories.map((memory) => memory.id === id ? updatedMemory : memory));
    }
    return updatedMemory;
  },

  async deleteMemory(id: string): Promise<boolean> {
    if (await isSignedIn()) {
      await cloudStorageService.deleteMemory(id);
    } else {
      await saveLocalMemories(removeMemoryById(await getLocalMemories(), id));
    }
    return true;
  },

  async clearAllMemories(): Promise<boolean> {
    if (await isSignedIn()) {
      await cloudStorageService.clearAllMemories();
    } else {
      await saveLocalMemories([]);
    }
    return true;
  },

  async saveAutomaticGuestMemories(
    candidates: AutomaticMemoryCandidate[],
    sourceSessionId: string
  ): Promise<Memory[]> {
    if (await isSignedIn()) {
      throw new Error('Guest memories cannot be transferred into an account automatically.');
    }
    const current = await getLocalMemories();
    const updated = mergeAutomaticMemories(current, candidates, 'guest', sourceSessionId);
    const saved = await storageService.setItem(GUEST_MEMORIES_KEY, updated);
    if (!saved) throw new Error('Guest memories could not be saved on this device.');
    return updated;
  },

  async getGuestMemories(): Promise<Memory[]> {
    return getLocalMemories();
  },

  async importGuestMemories(): Promise<{ imported: number; skipped: number }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Sign in before importing guest memories.');

    const guestMemories = await getLocalMemories();
    const accountMemories = await cloudStorageService.getMemories();
    const toImport = selectGuestMemoriesToImport(guestMemories, accountMemories);
    let imported = 0;

    for (const memory of toImport) {
      const id = `mem-import-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const importedMemory: Memory = {
        ...memory,
        id,
        userId: session.user.id,
        memoryKey:
          memory.memoryKey ||
          `guest-import:${memory.category}:${normalizeMemoryKey(memory.title)}:${id.slice(-8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemoData: false,
      };
      if (await cloudStorageService.insertMemoryIfMissing(importedMemory)) imported += 1;
    }

    const removed = await storageService.removeItem(GUEST_MEMORIES_KEY);
    if (!removed) throw new Error('Imported memories but could not clear the guest copy.');
    return { imported, skipped: guestMemories.length - imported };
  },

  filterMemories(memories: Memory[], category: MemoryCategory | 'all', search: string): Memory[] {
    return memories.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const q = search.trim().toLowerCase();
      const matchesSearch = q === '' || item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  },
};
