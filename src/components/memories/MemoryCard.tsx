import React from 'react';
import { Memory } from '@/types/memory';
import { AppCard } from '../ui/AppCard';
import { Badge } from '../ui/Badge';
import { ShieldCheck, Pencil, Trash2 } from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  onEdit,
  onDelete,
}) => {
  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'personal':
        return 'purple';
      case 'relationships':
        return 'yellow';
      case 'events':
        return 'green';
      default:
        return 'purple';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to forget "${memory.title}"? This cannot be undone.`)) {
      onDelete(memory.id);
    }
  };

  return (
    <AppCard className="p-4 sm:p-5 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge
            label={memory.category.toUpperCase()}
            variant={getCategoryBadgeVariant(memory.category) as any}
          />
          {memory.isDemoData && (
            <Badge label="Sample" variant="muted" />
          )}
        </div>
        <span className="text-xs text-[#9B8AB9]">{formatDate(memory.createdAt)}</span>
      </div>

      <h3 className="text-base font-semibold text-white mb-1.5">
        {memory.title}
      </h3>
      <p className="text-sm text-[#C6B8E5] leading-relaxed mb-4">
        {memory.content}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-[#9B8AB9]">
          <ShieldCheck size={14} className="text-[#A8D9A0]" />
          <span>Consent confirmed</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(memory)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#302149] hover:bg-[#3d2a5c] text-xs font-medium text-[#C6B8E5] transition-colors cursor-pointer"
          >
            <Pencil size={13} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF8D9A]/15 hover:bg-[#FF8D9A]/25 text-xs font-medium text-[#FF8D9A] transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </AppCard>
  );
};
