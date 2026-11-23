import React, { useEffect, useRef, useState } from 'react';
import { useMemories } from '@/context/MemoryContext';
import { usePreferences } from '@/context/PreferencesContext';
import { audioService } from '@/services/audioService';
import { Memory, MemoryCategory } from '@/types/memory';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { MemoryModal } from '@/components/memories/MemoryModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Search, X, Lock, Sparkles, Brain, ShieldCheck } from 'lucide-react';
import { SunnySun } from '@/components/brand/SunnySun';

const FILTER_CATEGORIES: { label: string; value: MemoryCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Events', value: 'events' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Preferences', value: 'preferences' },
];

type DeckPhase = 'idle' | 'dragging' | 'returning' | 'exiting';
const SWIPE_DISTANCE = 90; // px a card must travel to count as a swipe
const EXIT_MS = 260;
const RETURN_MS = 240;

export const MemoriesScreen: React.FC = () => {
  const { preferences, toggleMemory } = usePreferences();
  const {
    filteredMemories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    addMemory,
    updateMemory,
    deleteMemory,
  } = useMemories();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeMemoryIndex, setActiveMemoryIndex] = useState(0);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  // Card deck: swipe or tap the arrows. Next = card exits left, previous = exits right.
  const [deckPhase, setDeckPhase] = useState<DeckPhase>('idle');
  const [dragX, setDragX] = useState(0);
  const [exitDir, setExitDir] = useState<1 | 0 | -1>(0);
  const dragRef = useRef<{ x: number; y: number; id: number; t: number; active: boolean } | null>(null);
  const deckTimer = useRef<number | undefined>(undefined);

  const total = filteredMemories.length;
  const safeIndex = total > 0 ? activeMemoryIndex % total : 0;

  useEffect(() => () => window.clearTimeout(deckTimer.current), []);

  // Start from the first card whenever the filter or search changes the list.
  useEffect(() => {
    window.clearTimeout(deckTimer.current);
    setActiveMemoryIndex(0);
    setDeckPhase('idle');
    setDragX(0);
    setExitDir(0);
  }, [selectedCategory, searchQuery]);

  const goTo = (direction: 1 | -1) => {
    if (total < 2 || deckPhase === 'exiting') return;
    window.clearTimeout(deckTimer.current);
    const commit = () => {
      setActiveMemoryIndex((safeIndex + direction + total) % total);
      setDragX(0);
      setDeckPhase('idle');
    };
    setExitDir(direction);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      commit();
      return;
    }
    setDeckPhase('exiting');
    deckTimer.current = window.setTimeout(commit, EXIT_MS);
  };

  const handleDeckPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (total < 2 || deckPhase === 'exiting') return;
    // Let taps on Edit / Delete behave like normal buttons.
    if ((event.target as HTMLElement).closest('button')) return;
    window.clearTimeout(deckTimer.current);
    dragRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId, t: performance.now(), active: false };
  };

  const handleDeckPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      // Only take over for clearly horizontal movement so vertical scrolling still works.
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      drag.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDeckPhase('dragging');
    }
    setDragX(dx);
  };

  const handleDeckPointerEnd = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.active) return;
    const dx = event.clientX - drag.x;
    const elapsed = Math.max(performance.now() - drag.t, 1);
    const width = event.currentTarget.getBoundingClientRect().width;
    const farEnough = Math.abs(dx) > Math.min(SWIPE_DISTANCE, width * 0.25);
    const quickFlick = Math.abs(dx) > 30 && Math.abs(dx) / elapsed > 0.5;
    if (!cancelled && (farEnough || quickFlick)) {
      goTo(dx < 0 ? 1 : -1);
      return;
    }
    setDeckPhase('returning');
    setDragX(0);
    deckTimer.current = window.setTimeout(() => setDeckPhase('idle'), RETURN_MS);
  };

  const deckFrontStyle: React.CSSProperties =
    deckPhase === 'dragging'
      ? { transform: `translateX(${dragX}px) rotate(${dragX / 24}deg)`, transition: 'none' }
      : deckPhase === 'exiting'
        ? {
            transform: `translateX(${exitDir === 1 ? '-125%' : '125%'}) rotate(${exitDir === 1 ? -14 : 14}deg)`,
            opacity: 0,
            transition: `transform ${EXIT_MS}ms cubic-bezier(.4,0,1,1), opacity ${EXIT_MS}ms ease-in`,
          }
        : deckPhase === 'returning'
          ? { transform: 'translateX(0) rotate(0)', transition: `transform ${RETURN_MS}ms cubic-bezier(.2,.9,.3,1.2)` }
          : {};

  const dotCount = Math.min(total, 7);
  const activeDot = total <= 7 ? safeIndex : Math.round((safeIndex / (total - 1)) * (dotCount - 1));

  const handleOpenAdd = () => {
    setEditingMemory(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setModalVisible(true);
  };

  const handleSaveModal = async (data: {
    title: string;
    content: string;
    category: MemoryCategory;
    userConfirmed: boolean;
  }) => {
    if (editingMemory) {
      await updateMemory(editingMemory.id, data);
    } else {
      await addMemory(data);
    }
    void audioService.play('success');
  };

  return (
    <div className="sunny-memories-screen flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-7xl mx-auto w-full pb-8 sm:pb-10 lg:px-10 xl:px-14">
      {/* Shared Sunny website header */}
      <div className="flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-2.5">
          <SunnySun compact className="h-14 w-14 shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-white tracking-tight">Sunny</h1>
              <span className="text-sm" aria-hidden="true">☀️</span>
            </div>
            <p className="text-[11px] text-[#D6C2F2]">Your little corner of sunshine</p>
          </div>
        </div>
        <button type="button" onClick={handleOpenAdd} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gradient-to-r from-[#8B2BE2] to-[#D946EF] px-4 py-2 text-sm font-bold text-white shadow-[0_8px_28px_rgba(217,70,239,0.35)] transition-all hover:brightness-110 active:scale-95 cursor-pointer">
          <Plus size={17} />
          <span>Add memory</span>
        </button>
      </div>

      {/* Warm, spacious page intro matching the Home screen */}
      <section className="sunny-memories-hero relative isolate mb-7 overflow-hidden rounded-[30px] border border-[#8B6AA8]/30 bg-gradient-to-br from-[#381A60] via-[#1D1431] to-[#12051F] p-5 shadow-[0_18px_55px_rgba(0,0,0,.2)] sm:p-7 lg:p-9">
        <div aria-hidden="true" className="sunny-memory-glow pointer-events-none absolute -right-8 -top-12 h-56 w-56 rounded-full bg-[#E879F9]/[0.10] blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[#E9DFF8]">
              <Sparkles size={15} className="text-[#E879F9]" /> YOUR LITTLE MEMORY VAULT
            </span>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#F8F1FF] sm:text-4xl">The little things that matter 💛</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#D6C2F2] sm:text-base">
              A private space for the details you choose to share with Sunny. You’re always in control of what stays.
            </p>
          </div>
          <div className="sunny-memory-count flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.055] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] sm:min-w-40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E879F9]/10 text-[#E879F9]">
              <Brain size={22} />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none text-white">{filteredMemories.length}</p>
              <p className="mt-1 text-xs text-[#D6C2F2]">saved {filteredMemories.length === 1 ? 'memory' : 'memories'}</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-[#D6C2F2]">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#A8D9A0]" /> Consent-first</span>
          <span className="inline-flex items-center gap-1.5"><Lock size={14} className="text-[#E879F9]" /> Review or delete anytime</span>
        </div>
      </section>

      {!preferences.memoryEnabled ? (
        <div className="my-16">
          <EmptyState
            title="Memory is turned off"
            description="Sunny is currently not saving or recalling any personal memories. You can turn it back on anytime."
            actionTitle="Enable Memory"
            onAction={() => toggleMemory(true)}
            icon={<Lock size={36} className="text-[#E879F9]" />}
          />
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="sunny-memory-search relative my-5 flex max-w-2xl items-center">
            <Search size={16} className="absolute left-3.5 text-[#AA92CC]" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#6B3F96]/50 bg-[#1E0B33]/90 py-3 pl-10 pr-10 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,.12)] outline-none transition-all placeholder:text-[#AA92CC] focus:border-[#E879F9]/60 focus:ring-2 focus:ring-[#E879F9]/[0.08]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#AA92CC] hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="sunny-memory-filters mb-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {FILTER_CATEGORIES.map((item) => {
              const isSelected = selectedCategory === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedCategory(item.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'border-[#E879F9]/55 bg-[#E879F9]/15 text-[#E879F9] shadow-[0_4px_16px_rgba(217,70,239,.08)]'
                      : 'border-[#6B3F96]/45 bg-[#25103F]/80 text-[#B9AACA] hover:border-[#E879F9]/30 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Memory Count */}
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <span className="text-sm font-semibold text-[#E9DFF8]">Your saved details</span>
            <span className="text-xs text-[#AA92CC]">Choose a card to edit or remove it</span>
          </div>

          {/* Memory card deck */}
          {filteredMemories.length > 0 ? (
            <section className="sunny-memory-deck mx-auto w-full max-w-2xl" aria-label="Stacked memories">
              <div className="mb-5 flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-semibold text-[#F8F1FF]">A little collection of you</p>
                  <p className="mt-1 text-xs text-[#AA92CC]">Every card holds something worth remembering</p>
                </div>
                <span className="sunny-memory-deck-counter">
                  {(safeIndex + 1).toString().padStart(2, '0')}
                  <span> / {filteredMemories.length.toString().padStart(2, '0')}</span>
                </span>
              </div>

              <div className="sunny-memory-deck-stage">
                {filteredMemories.length > 1 && (
                  <>
                    <div className="sunny-memory-deck-sheet sunny-memory-deck-sheet-back" aria-hidden="true" />
                    <div className="sunny-memory-deck-sheet sunny-memory-deck-sheet-middle" aria-hidden="true" />
                  </>
                )}
                <div
                  className={`sunny-memory-deck-front ${total > 1 ? 'is-swipeable' : ''} ${deckPhase === 'dragging' ? 'is-dragging' : ''}`}
                  style={deckFrontStyle}
                  onPointerDown={handleDeckPointerDown}
                  onPointerMove={handleDeckPointerMove}
                  onPointerUp={(event) => handleDeckPointerEnd(event)}
                  onPointerCancel={(event) => handleDeckPointerEnd(event, true)}
                >
                  <div
                    className="sunny-memory-deck-arrive"
                    key={filteredMemories[safeIndex].id}
                    style={{ '--arrive-x': `${exitDir * 36}px` } as React.CSSProperties}
                  >
                    <MemoryCard
                      memory={filteredMemories[safeIndex]}
                      onEdit={handleOpenEdit}
                      onDelete={deleteMemory}
                    />
                  </div>
                </div>
              </div>

              {filteredMemories.length > 1 && (
                <div className="sunny-memory-deck-navigation">
                  <button
                    type="button"
                    onClick={() => goTo(-1)}
                    className="sunny-memory-deck-control"
                    aria-label="Previous memory"
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                  <div className="sunny-memory-deck-progress" aria-hidden="true">
                    {Array.from({ length: dotCount }, (_, index) => (
                      <span key={index} className={index === activeDot ? 'is-active' : ''} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    className="sunny-memory-deck-control"
                    aria-label="Next memory"
                  >
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </section>
          ) : (
            <EmptyState
              title={searchQuery ? 'No matching memories' : 'No memories saved yet'}
              description={
                searchQuery
                  ? `No memories matched "${searchQuery}". Try a different search term.`
                  : 'As you chat, Sunny can save useful details here when memory is enabled. You can also add a memory yourself.'
              }
            />
          )}
        </>
      )}

      {/* Add / Edit Memory Modal */}
      <MemoryModal
        visible={modalVisible}
        editingMemory={editingMemory}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveModal}
      />
    </div>
  );
};
