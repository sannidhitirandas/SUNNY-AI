import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { Memory, MemoryCategory } from '@/types/memory';
import { memoryService } from '@/services/memoryService';
import { supabase } from '@/lib/supabase';
import { usePreferences } from './PreferencesContext';
import type { AutomaticMemoryCandidate } from '@/services/automaticMemory';
import { useAuth } from './AuthContext';
import { storageService } from '@/services/storageService';

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
  refreshMemories: () => Promise<void>;
  applyAutomaticGuestMemories: (candidates: AutomaticMemoryCandidate[], sessionId: string) => Promise<void>;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePreferences();
  const { user, isLoading: authLoading } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const loadRequestRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const loadMemories = async () => {
      const requestId = ++loadRequestRef.current;
      try {
        const items = await memoryService.getMemories();
        if (mounted && requestId === loadRequestRef.current) setMemories(items);
      } catch (e) {
        console.warn('[MemoryContext] Error loading cloud memories:', e);
        if (mounted && requestId === loadRequestRef.current) setMemories([]);
      } finally {
        if (mounted && requestId === loadRequestRef.current) setIsLoading(false);
      }
    };

    void loadMemories();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'TOKEN_REFRESHED') return;
      loadRequestRef.current += 1;
      setMemories([]);
      setIsLoading(true);
      if (session?.user) {
        window.setTimeout(() => {
          if (mounted) void loadMemories();
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading || !user || typeof window === 'undefined') return;
    let mounted = true;

    const offerGuestMemoryImport = async () => {
      const guestMemories = await memoryService.getGuestMemories();
      if (!mounted || guestMemories.length === 0) return;

      const choiceKey = `@sunny_guest_memory_migration_${user.id}`;
      const guestSnapshot = guestMemories
        .map((memory) => `${memory.id}:${memory.updatedAt}`)
        .sort()
        .join('|');
      const previousChoice = await storageService.getItem<string>(choiceKey, '');
      if (!mounted || previousChoice === guestSnapshot) return;

      const shouldImport = window.confirm(
        `Sunny found ${guestMemories.length} memories saved on this device. Import memories that are not already in your account? Existing account memories will not be overwritten. Choose Cancel to keep guest memories separate on this device.`
      );

      if (!mounted) return;
      if (!shouldImport) {
        await storageService.setItem(choiceKey, guestSnapshot);
        return;
      }

      try {
        const result = await memoryService.importGuestMemories();
        await storageService.setItem(choiceKey, guestSnapshot);
        setMemories(await memoryService.getMemories());
        window.alert(
          `Imported ${result.imported} memories. ${result.skipped} existing or duplicate memories were left unchanged.`
        );
      } catch (error) {
        console.warn('[MemoryContext] Guest memory import failed:', error);
        window.alert('Sunny could not finish importing memories. Your guest memories are still saved on this device.');
      }
    };

    void offerGuestMemoryImport();
    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id]);

  const filteredMemories = useMemo(() => {
    if (!preferences.memoryEnabled) return [];
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
    if (updated) setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const deleteMemory = async (id: string) => {
    await memoryService.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const clearAllMemories = async () => {
    await memoryService.clearAllMemories();
    setMemories([]);
  };

  const refreshMemories = async () => {
    const items = await memoryService.getMemories();
    setMemories(items);
  };

  const applyAutomaticGuestMemories = async (
    candidates: AutomaticMemoryCandidate[],
    sessionId: string
  ) => {
    const updated = await memoryService.saveAutomaticGuestMemories(candidates, sessionId);
    setMemories(updated);
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
        refreshMemories,
        applyAutomaticGuestMemories,
      }}>
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemories = () => {
  const context = useContext(MemoryContext);
  if (!context) throw new Error('useMemories must be used within a MemoryProvider');
  return context;
};
