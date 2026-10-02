import type { Memory, MemoryCategory } from '@/types/memory';

const MEMORY_CATEGORIES: MemoryCategory[] = [
  'personal',
  'relationships',
  'events',
  'ongoing',
  'preferences',
];

const SENSITIVE_PATTERN = /\b(password|passphrase|api key|secret key|private key|credit card|social security|ssn|bank account|seed phrase|recovery phrase|one[- ]time code|verification code|\botp\b)\b/i;

export interface AutomaticMemoryCandidate {
  key: string;
  title: string;
  content: string;
  category: MemoryCategory;
  existingMemoryId?: string;
  expiresAt?: string;
}

export function normalizeMemoryKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function parseAutomaticMemoryCandidates(
  response: string,
  existingMemories: Pick<Memory, 'id' | 'memoryKey' | 'category'>[] = []
): AutomaticMemoryCandidate[] {
  const firstBrace = response.indexOf('{');
  const lastBrace = response.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.slice(firstBrace, lastBrace + 1));
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== 'object') return [];
  const rawMemories = (parsed as { memories?: unknown }).memories;
  if (!Array.isArray(rawMemories)) return [];

  const candidates: AutomaticMemoryCandidate[] = [];
  const seenKeys = new Set<string>();

  for (const raw of rawMemories.slice(0, 8)) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    if (
      item.confirmed !== true ||
      typeof item.key !== 'string' ||
      typeof item.title !== 'string' ||
      typeof item.content !== 'string' ||
      typeof item.category !== 'string' ||
      !MEMORY_CATEGORIES.includes(item.category as MemoryCategory)
    ) {
      continue;
    }

    const rawKey = item.key.startsWith(`${item.category}:`)
      ? item.key.slice(item.category.length + 1)
      : item.key;
    const key = normalizeMemoryKey(rawKey);
    const title = item.title.trim();
    const content = item.content.trim();
    if (
      !key ||
      !title ||
      !content ||
      title.length > 120 ||
      content.length > 600 ||
      SENSITIVE_PATTERN.test(`${title} ${content}`)
    ) {
      continue;
    }

    const memoryKey = `${item.category}:${key}`;
    if (seenKeys.has(memoryKey)) continue;
    seenKeys.add(memoryKey);

    const matchingMemory = existingMemories.find(
      (memory) =>
        (typeof item.existingMemoryId === 'string' && memory.id === item.existingMemoryId) ||
        memory.memoryKey === memoryKey
    );
    const expiresAt =
      typeof item.expiresAt === 'string' &&
      Number.isFinite(Date.parse(item.expiresAt)) &&
      Date.parse(item.expiresAt) > Date.now()
        ? new Date(item.expiresAt).toISOString()
        : undefined;

    candidates.push({
      key,
      title,
      content,
      category: item.category as MemoryCategory,
      existingMemoryId: matchingMemory?.id,
      expiresAt,
    });
  }

  return candidates;
}

export function mergeAutomaticMemories(
  existingMemories: Memory[],
  candidates: AutomaticMemoryCandidate[],
  userId: string,
  sourceSessionId: string,
  now = new Date().toISOString()
): Memory[] {
  const memories = [...existingMemories];

  for (const candidate of candidates) {
    const memoryKey = `${candidate.category}:${candidate.key}`;
    const index = memories.findIndex(
      (memory) =>
        (candidate.existingMemoryId && memory.id === candidate.existingMemoryId) ||
        memory.memoryKey === memoryKey
    );
    const previous = index >= 0 ? memories[index] : undefined;
    const next: Memory = {
      id: previous?.id ?? `mem-auto-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      userId,
      title: candidate.title,
      content: candidate.content,
      category: candidate.category,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      userConfirmed: previous?.userConfirmed ?? false,
      sourceSessionId: previous?.sourceSessionId ?? sourceSessionId,
      memoryKey,
      expiresAt: candidate.expiresAt,
      isDemoData: false,
    };

    if (index >= 0) memories[index] = next;
    else memories.unshift(next);
  }

  return memories;
}

export function selectRelevantMemories<T extends {
  title: string;
  content: string;
  category: string;
  expiresAt?: string;
}>(
  memories: T[],
  message: string,
  maxMemories = 6
): T[] {
  const queryWords = new Set(
    message
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 3)
  );
  if (queryWords.size === 0) return [];

  const now = Date.now();
  return memories
    .filter((memory) => !memory.expiresAt || Date.parse(memory.expiresAt) > now)
    .map((memory, index) => {
      const words = new Set(
        `${memory.title} ${memory.content} ${memory.category}`
          .toLowerCase()
          .replace(/[^a-z0-9\s']/g, ' ')
          .split(/\s+/)
      );
      let score = 0;
      for (const word of queryWords) {
        if (words.has(word)) score += word.length >= 6 ? 3 : 1;
      }
      return { memory, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxMemories)
    .map((item) => item.memory);
}

export async function loadMemoriesSafely<T>(
  load: () => Promise<T[]>
): Promise<{ memories: T[]; available: boolean; error?: unknown }> {
  try {
    return { memories: await load(), available: true };
  } catch (error) {
    return { memories: [], available: false, error };
  }
}

export function onlyMemoriesForUser(memories: Memory[], userId: string): Memory[] {
  return memories.filter((memory) => memory.userId === userId);
}

export function removeMemoryById(memories: Memory[], id: string): Memory[] {
  return memories.filter((memory) => memory.id !== id);
}

export function selectGuestMemoriesToImport(
  guestMemories: Memory[],
  accountMemories: Memory[]
): Memory[] {
  const accountKeys = new Set(
    accountMemories
      .map((memory) => memory.memoryKey)
      .filter((key): key is string => Boolean(key))
  );
  const accountFingerprints = new Set(
    accountMemories.map((memory) =>
      `${memory.category}:${normalizeMemoryKey(`${memory.title} ${memory.content}`)}`
    )
  );
  const importKeys = new Set<string>();

  return guestMemories.filter((memory) => {
    const fingerprint = `${memory.category}:${normalizeMemoryKey(`${memory.title} ${memory.content}`)}`;
    if (
      (memory.memoryKey && accountKeys.has(memory.memoryKey)) ||
      accountFingerprints.has(fingerprint) ||
      importKeys.has(memory.memoryKey || fingerprint)
    ) {
      return false;
    }
    importKeys.add(memory.memoryKey || fingerprint);
    return true;
  });
}