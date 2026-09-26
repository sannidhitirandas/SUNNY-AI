import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Memory, MemoryCategory } from '@/types/memory';
import { memoryService } from '@/services/memoryService';
import { usePreferences } from './PreferencesContext';

interface MemoryContextType {
  memories: Memory[];
  filteredMemories: Memory[];
  searchQuery: string;
  selectedCategory: MemoryCategory | 'all';
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: MemoryCategory | 'all') => void;
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { userId?: string }) => Promise<void>;
  updateMemory: (id: string, updates: Partial<Pick<Memory, 'title' | 'content' | 'category' | 'userConfirmed'>>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  clearAllMemories: () => Promise<void>;
  resetDemoMemories: () => Promise<void>;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePreferences();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const items = await memoryService.getMemories();
      setMemories(items);
    } catch (e) {
      console.warn('Error loading memories', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMemories = useMemo(() => {
    if (!preferences.memoryEnabled) {
      return [];
    }
    return memoryService.filterMemories(memories, selectedCategory, searchQuery);
  }, [memories, selectedCategory, searchQuery, preferences.memoryEnabled]);

  const addMemory = async (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { userId?: string }) => {
    const created = await memoryService.addMemory({
      ...memory,
      userId: memory.userId || 'current-user',
    });
    setMemories((prev) => [created, ...prev]);
  };

  const updateMemory = async (
    id: string,
    updates: Partial<Pick<Memory, 'title' | 'content' | 'category' | 'userConfirmed'>>
  ) => {
    const updated = await memoryService.updateMemory(id, updates);
    if (updated) {
      setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
  };

  const deleteMemory = async (id: string) => {
    await memoryService.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const clearAllMemories = async () => {
    await memoryService.clearAllMemories();
    setMemories([]);
  };

  const resetDemoMemories = async () => {
    const demoItems = await memoryService.resetDemoMemories();
    setMemories(demoItems);
  };

  return (
    <MemoryContext.Provider
      value={{
        memories,
        filteredMemories,
        searchQuery,
        selectedCategory,
        isLoading,
        setSearchQuery,
        setSelectedCategory,
        addMemory,
        updateMemory,
        deleteMemory,
        clearAllMemories,
        resetDemoMemories,
      }}>
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemories = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemories must be used within a MemoryProvider');
  }
  return context;
};
