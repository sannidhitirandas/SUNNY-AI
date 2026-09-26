import React, { useState, useEffect } from 'react';
import { Memory, MemoryCategory } from '@/types/memory';
import { AppInput } from '../ui/AppInput';
import { AppButton } from '../ui/AppButton';
import { X } from 'lucide-react';

interface MemoryModalProps {
  visible: boolean;
  editingMemory?: Memory | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    category: MemoryCategory;
    userConfirmed: boolean;
  }) => void;
}

const CATEGORIES: { label: string; value: MemoryCategory }[] = [
  { label: 'Personal', value: 'personal' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Events', value: 'events' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Preferences', value: 'preferences' },
];

export const MemoryModal: React.FC<MemoryModalProps> = ({
  visible,
  editingMemory,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('personal');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title);
      setContent(editingMemory.content);
      setCategory(editingMemory.category);
    } else {
      setTitle('');
      setContent('');
      setCategory('personal');
    }
    setError('');
  }, [editingMemory, visible]);

  if (!visible) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please provide a title for this memory.');
      return;
    }
    if (!content.trim()) {
      setError('Please provide details for this memory.');
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      userConfirmed: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#21163A] border border-[#392858] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#392858]">
          <h2 className="text-lg font-bold text-white">
            {editingMemory ? 'Edit Memory' : 'Add New Memory'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#C6B8E5] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-[#C6B8E5] leading-relaxed mb-4">
            Sunny only stores memories you explicitly confirm. You can update or delete them whenever you wish.
          </p>

          <AppInput
            label="Memory Title"
            placeholder="e.g. Favorite book, sister's birthday, morning routine"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (error) setError('');
            }}
          />

          <div className="mb-4">
            <label className="text-xs font-medium text-[#C6B8E5] mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFD84D]/15 border-[#FFD84D] text-[#FFD84D] font-bold'
                        : 'bg-[#302149] border-[#392858] text-[#C6B8E5] hover:border-white/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <AppInput
            label="Details / Reflection"
            placeholder="What would you like Sunny to remember?"
            value={content}
            onChangeText={(text) => {
              setContent(text);
              if (error) setError('');
            }}
            multiline
            numberOfLines={4}
          />

          {error && <p className="text-xs text-[#FF8D9A] mb-4 font-medium">{error}</p>}

          <div className="flex flex-col gap-2 mt-4">
            <AppButton
              title={editingMemory ? 'Save Changes' : 'Save Memory'}
              onPress={handleSave}
              variant="primary"
              fullWidth
            />
            <AppButton
              title="Cancel"
              onPress={onClose}
              variant="ghost"
              fullWidth
            />
          </div>
        </div>
      </div>
    </div>
  );
};
