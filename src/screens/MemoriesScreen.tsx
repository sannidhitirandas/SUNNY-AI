import React, { useState } from 'react';
import { useMemories } from '@/context/MemoryContext';
import { usePreferences } from '@/context/PreferencesContext';
import { audioService } from '@/services/audioService';
import { Memory, MemoryCategory } from '@/types/memory';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { MemoryModal } from '@/components/memories/MemoryModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Search, X, Lock, Sparkles, Brain, ShieldCheck } from 'lucide-react';
import { SunnyLogo } from '@/components/brand/SunnyLogo';

const FILTER_CATEGORIES: { label: string; value: MemoryCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Events', value: 'events' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Preferences', value: 'preferences' },
];

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
          <SunnyLogo size="small" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-white tracking-tight">Sunny</h1>
              <span className="text-sm" aria-hidden="true">☀️</span>
            </div>
            <p className="text-[11px] text-[#C6B8E5]">Your little corner of sunshine</p>
          </div>
        </div>
        <button type="button" onClick={handleOpenAdd} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#F5D27A] px-4 py-2 text-sm font-bold text-[#100B22] shadow-[0_8px_28px_rgba(255,216,77,0.12)] transition-all hover:bg-[#F6BD45] active:scale-95 cursor-pointer">
          <Plus size={17} />
          <span>Add memory</span>
        </button>
      </div>

      {/* Warm, spacious page intro matching the Home screen */}
      <section className="sunny-memories-hero relative isolate mb-7 overflow-hidden rounded-[30px] border border-[#8B6AA8]/30 bg-gradient-to-br from-[#302044] via-[#1D1431] to-[#100B22] p-5 shadow-[0_18px_55px_rgba(0,0,0,.2)] sm:p-7 lg:p-9">
        <div aria-hidden="true" className="sunny-memory-glow pointer-events-none absolute -right-8 -top-12 h-56 w-56 rounded-full bg-[#F5D27A]/[0.10] blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[#E9DFF8]">
              <Sparkles size={15} className="text-[#F5D27A]" /> YOUR LITTLE MEMORY VAULT
            </span>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#F8F1FF] sm:text-4xl">The little things that matter 💛</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#C6B8E5] sm:text-base">
              A private space for the details you choose to share with Sunny. You’re always in control of what stays.
            </p>
          </div>
          <div className="sunny-memory-count flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.055] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] sm:min-w-40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5D27A]/10 text-[#F5D27A]">
              <Brain size={22} />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none text-white">{filteredMemories.length}</p>
              <p className="mt-1 text-xs text-[#C6B8E5]">saved {filteredMemories.length === 1 ? 'memory' : 'memories'}</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-[#C6B8E5]">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#A8D9A0]" /> Consent-first</span>
          <span className="inline-flex items-center gap-1.5"><Lock size={14} className="text-[#F5D27A]" /> Review or delete anytime</span>
        </div>
      </section>

      {!preferences.memoryEnabled ? (
        <div className="my-16">
          <EmptyState
            title="Memory is turned off"
            description="Sunny is currently not saving or recalling any personal memories. You can turn it back on anytime."
            actionTitle="Enable Memory"
            onAction={() => toggleMemory(true)}
            icon={<Lock size={36} className="text-[#F5D27A]" />}
          />
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="sunny-memory-search relative my-5 flex max-w-2xl items-center">
            <Search size={16} className="absolute left-3.5 text-[#9B8AB9]" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#604477]/50 bg-[#1B1430]/90 py-3 pl-10 pr-10 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,.12)] outline-none transition-all placeholder:text-[#9B8AB9] focus:border-[#F5D27A]/60 focus:ring-2 focus:ring-[#F5D27A]/[0.08]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#9B8AB9] hover:text-white"
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
                      ? 'border-[#F5D27A]/55 bg-[#F5D27A]/15 text-[#F5D27A] shadow-[0_4px_16px_rgba(255,216,77,.08)]'
                      : 'border-[#604477]/45 bg-[#21163A]/80 text-[#B9AACA] hover:border-[#F5D27A]/30 hover:text-white'
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
            <span className="text-xs text-[#9B8AB9]">Choose a card to edit or remove it</span>
          </div>

          {/* Memory card deck */}
          {filteredMemories.length > 0 ? (
            <section className="sunny-memory-deck mx-auto w-full max-w-2xl" aria-label="Stacked memories">
              <div className="mb-5 flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-semibold text-[#F8F1FF]">A little collection of you</p>
                  <p className="mt-1 text-xs text-[#9B8AB9]">Every card holds something worth remembering</p>
                </div>
                <span className="sunny-memory-deck-counter">
                  {((activeMemoryIndex % filteredMemories.length) + 1).toString().padStart(2, '0')}
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
                <div className="sunny-memory-deck-front" key={filteredMemories[activeMemoryIndex % filteredMemories.length].id}>
                  <MemoryCard
                    memory={filteredMemories[activeMemoryIndex % filteredMemories.length]}
                    onEdit={handleOpenEdit}
                    onDelete={deleteMemory}
                  />
                </div>
              </div>

              {filteredMemories.length > 1 && (
                <div className="sunny-memory-deck-navigation">
                  <button
                    type="button"
                    onClick={() => setActiveMemoryIndex((current) => (current - 1 + filteredMemories.length) % filteredMemories.length)}
                    className="sunny-memory-deck-control"
                    aria-label="Previous memory"
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                  <div className="sunny-memory-deck-progress" aria-hidden="true">
                    {filteredMemories.slice(0, Math.min(filteredMemories.length, 7)).map((memory, index) => (
                      <span key={memory.id} className={index === activeMemoryIndex % filteredMemories.length ? 'is-active' : ''} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMemoryIndex((current) => (current + 1) % filteredMemories.length)}
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
