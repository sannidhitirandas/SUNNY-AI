import React, { useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ArrowUp, FileText, Paperclip, X } from 'lucide-react';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

interface SunnyNativeFile {
  name: string;
  mimeType: string;
  size: number;
  data: string;
}

interface SunnyFilePickerPlugin {
  pickFile(): Promise<{ files: SunnyNativeFile[] }>;
}

const SunnyFilePicker = registerPlugin<SunnyFilePickerPlugin>('SunnyFilePicker');

interface MessageComposerProps {
  onSend: (text: string, files: File[]) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = "Tell Sunny what's on your mind...",
}) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addFiles = (selected: File[]) => {
    if (selected.length === 0) return;
    setFileError(null);

    const next = [...files];
    for (const file of selected) {
      if (next.some((item) => item.name === file.name && item.size === file.size)) continue;
      if (next.length >= MAX_FILES) {
        setFileError(`You can attach up to ${MAX_FILES} files per message.`);
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name} is larger than 50 MB.`);
        continue;
      }
      const totalSize = next.reduce((sum, item) => sum + item.size, 0) + file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        setFileError('Attachments must be 50 MB or smaller in total.');
        break;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const handleAttach = async () => {
    if (disabled || preparing || files.length >= MAX_FILES) return;

    setFileError(null);
    setPreparing(true);

    try {
      if (Capacitor.isNativePlatform()) {
        console.log('[Sunny] Native picker returned:', result);
        console.log('[Sunny] Native picker file count:', result?.files?.length ?? 0);
        if (!result?.files?.length) {
          setFileError('Native picker returned no file.');
          return;
        }

        const remaining = MAX_FILES - files.length;
        const converted = result.files.slice(0, remaining).map((item) => {
          console.log('[Sunny] Converting native file:', {
            name: item.name,
            mimeType: item.mimeType,
            size: item.size,
            dataLength: item.data?.length ?? 0,
          });
          const byteString = atob(item.data);
          const bytes = new Uint8Array(byteString.length);
          for (let index = 0; index < byteString.length; index += 1) {
            bytes[index] = byteString.charCodeAt(index);
          }
          return new File([new Blob([bytes], { type: item.mimeType })], item.name, {
            type: item.mimeType || 'application/octet-stream',
          });
        });

        console.log('[Sunny] Converted native files:', converted);
        addFiles(converted);
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.json,.md,.png,.jpg,.jpeg,.webp';
      input.multiple = false;
      input.onchange = () => {
        if (input.files) addFiles(Array.from(input.files));
      };
      input.click();
    } catch (error) {
      console.error('[Sunny] File picker error:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel|dismiss/i.test(message)) {
        setFileError(`Could not attach: ${message}`);
      }
    } finally {
      setPreparing(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSend = async () => {
    if ((!text.trim() && files.length === 0) || disabled || preparing) return;
    const content = text.trim();
    const attachments = [...files];
    setText('');
    setFiles([]);
    setFileError(null);
    setPreparing(true);
    try {
      await onSend(content, attachments);
    } catch {
      setText(content);
      setFiles(attachments);
    } finally {
      setPreparing(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    if (!disabled && !preparing && textareaRef.current) textareaRef.current.focus();
  }, [disabled, preparing]);

  const isSendDisabled = disabled || preparing || (!text.trim() && files.length === 0);

  return (
    <div className="p-3 bg-[#17102C] border-t border-[#392858]">
      {fileError && (
        <div className="mb-2 px-2 text-xs text-[#FF8D9A]" role="alert">{fileError}</div>
      )}

      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2" aria-label="Attached files">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-2 max-w-full rounded-xl bg-[#21163A] border border-[#392858] px-2.5 py-2">
              <FileText size={15} className="text-[#FFD84D] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white truncate max-w-[180px]">{file.name}</p>
                <p className="text-[10px] text-[#9B8AB9]">{formatSize(file.size)}</p>
              </div>
              <button type="button" onClick={() => removeFile(index)} disabled={preparing} className="p-1 text-[#9B8AB9] hover:text-white cursor-pointer" aria-label={`Remove ${file.name}`}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-[#1B1430] border border-[#392858] focus-within:border-[#FFD84D] rounded-2xl px-2.5 py-1.5 transition-colors">
        <button
          type="button"
          onClick={() => void handleAttach()}
          disabled={disabled || preparing || files.length >= MAX_FILES}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[#C6B8E5] hover:text-[#FFD84D] hover:bg-[#302149] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Attach files"
          title="Attach files"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || preparing}
          rows={1}
          maxLength={1000}
          className="flex-1 bg-transparent text-white placeholder-[#9B8AB9] text-sm focus:outline-none resize-none py-2 max-h-[120px] leading-relaxed"
        />

        <button
          type="button"
          onClick={() => void handleSend()}
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
      {preparing && <p className="mt-1.5 text-[10px] text-[#9B8AB9]">Preparing attachment…</p>}
    </div>
  );
};
