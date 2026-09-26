import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface MessageComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = "Tell Sunny what's on your mind...",
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    const content = text;
    setText('');
    onSend(content);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const isSendDisabled = disabled || text.trim().length === 0;

  return (
    <div className="p-3 bg-[#17102C] border-t border-[#392858]">
      <div className="flex items-end gap-2 bg-[#1B1430] border border-[#392858] focus-within:border-[#FFD84D] rounded-2xl px-3.5 py-1.5 transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          maxLength={1000}
          className="flex-1 bg-transparent text-white placeholder-[#9B8AB9] text-sm focus:outline-none resize-none py-2 max-h-[120px] leading-relaxed"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isSendDisabled}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all cursor-pointer ${
            isSendDisabled
              ? 'bg-white/5 text-[#9B8AB9] cursor-not-allowed opacity-40'
              : 'bg-[#FFD84D] hover:bg-[#F6BD45] text-[#100B22] shadow-[0_2px_8px_rgba(255,216,77,0.3)] active:scale-95'
          }`}
          aria-label="Send message"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex justify-between items-center px-1 mt-1 text-[10px] text-[#9B8AB9]">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>{text.length}/1000</span>
      </div>
    </div>
  );
};
