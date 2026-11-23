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
    <AppCard className="sunny-memory-card group mb-0 rounded-[24px] border border-[#4A2A73]/45 bg-gradient-to-br from-[#25103F] to-[#1E0B33] p-4 shadow-[0_10px_28px_rgba(0,0,0,.14)] transition-all duration-200 hover:-translate-y-1 hover:border-[#E879F9]/35 hover:shadow-[0_16px_34px_rgba(0,0,0,.22)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge
            label={memory.category.toUpperCase()}
            variant={getCategoryBadgeVariant(memory.category) as any}
          />
          {memory.isDemoData && (
            <Badge label="Sample" variant="muted" />
          )}
        </div>
        <span className="shrink-0 text-[11px] text-[#AA92CC]">{formatDate(memory.createdAt)}</span>
      </div>

      <h3 className="mb-1.5 text-[17px] font-semibold tracking-tight text-white">
        {memory.title}
      </h3>
      <p className="mb-5 text-sm leading-relaxed text-[#D6C2F2]">
        {memory.content}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
        <div className="flex items-center gap-1.5 text-xs text-[#B9AACA]">
          <ShieldCheck size={14} className="text-[#A8D9A0]" />
          <span>Consent confirmed</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(memory)}
            className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#381A60] px-3 py-2 text-xs font-semibold text-white transition-all hover:border-[#E879F9]/25 hover:bg-[#43206A] active:scale-95"
          >
            <Pencil size={13} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[#FF8D9A]/15 bg-[#FF8D9A]/[0.09] px-3 py-2 text-xs font-semibold text-[#FF9DA8] transition-all hover:border-[#FF8D9A]/30 hover:bg-[#FF8D9A]/[0.16] active:scale-95"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </AppCard>
  );
};
