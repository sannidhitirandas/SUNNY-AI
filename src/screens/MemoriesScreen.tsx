import React, { useState } from 'react';
import { useMemories } from '@/context/MemoryContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Memory, MemoryCategory } from '@/types/memory';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { MemoryModal } from '@/components/memories/MemoryModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Search, X, Lock } from 'lucide-react';

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
    resetDemoMemories,
  } = useMemories();

  const [modalVisible, setModalVisible] = useState(false);
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
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 pb-1">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-1.5">
            Your little memories 💛
          </h1>
          <p className="text-xs text-[#C6B8E5] mt-0.5">
            The little things Sunny can remember for you, kept safe with your consent.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1 bg-[#FFD84D] hover:bg-[#F6BD45] text-[#100B22] text-xs font-bold px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 ml-2"
        >
          <Plus size={16} />
          <span>Add</span>
        </button>
      </div>

      {!preferences.memoryEnabled ? (
        <div className="my-16">
          <EmptyState
            title="Memory is turned off"
            description="Sunny is currently not saving or recalling any personal memories. You can turn it back on anytime."
            actionTitle="Enable Memory"
            onAction={() => toggleMemory(true)}
            icon={<Lock size={36} className="text-[#FFD84D]" />}
          />
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="relative flex items-center my-3.5">
            <Search size={16} className="absolute left-3.5 text-[#9B8AB9]" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1B1430] border border-[#392858] focus:border-[#FFD84D] focus:outline-none text-white placeholder-[#9B8AB9] text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2.5 transition-colors"
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
            {FILTER_CATEGORIES.map((item) => {
              const isSelected = selectedCategory === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedCategory(item.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#FFD84D]/15 border-[#FFD84D] text-[#FFD84D] font-bold'
                      : 'bg-[#21163A] border-[#392858] text-[#C6B8E5] hover:border-white/20'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Memory Count */}
          <div className="px-1 mb-2">
            <span className="text-[11px] text-[#9B8AB9]">
              {filteredMemories.length} saved {filteredMemories.length === 1 ? 'memory' : 'memories'}
            </span>
          </div>

          {/* Memory List */}
          {filteredMemories.length > 0 ? (
            <div className="space-y-1">
              {filteredMemories.map((item) => (
                <MemoryCard
                  key={item.id}
                  memory={item}
                  onEdit={handleOpenEdit}
                  onDelete={deleteMemory}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={searchQuery ? 'No matching memories' : 'No memories saved yet'}
              description={
                searchQuery
                  ? `No memories matched "${searchQuery}". Try a different search term.`
                  : 'Tap "Add" in the top corner to save your first memory, or restore sample demo memories.'
              }
              actionTitle={searchQuery ? undefined : 'Restore Sample Memories'}
              onAction={searchQuery ? undefined : resetDemoMemories}
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
