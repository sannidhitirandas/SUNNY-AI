import React, { useEffect, useRef, useState } from 'react';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { ArrowUp, FileText, Paperclip, X } from 'lucide-react';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;


const pickedFileToFile = async (picked: {
  name: string;
  mimeType: string;
  modifiedAt?: number;
  blob?: Blob;
  webPath?: string;
  data?: string;
  path?: string;
}) => {
  let blob = picked.blob;

  // Native Android can provide both webPath and Base64 data. Prefer the
  // native data because some Android document providers expose a webPath
  // that the WebView cannot fetch reliably.
  if (!blob && picked.data) {
    const byteString = atob(picked.data);
    const bytes = new Uint8Array(byteString.length);
    for (let index = 0; index < byteString.length; index += 1) {
      bytes[index] = byteString.charCodeAt(index);
    }
    blob = new Blob([bytes], { type: picked.mimeType });
  }

  if (!blob && picked.webPath) {
    const response = await fetch(picked.webPath);
    if (!response.ok) throw new Error(`Unable to read ${picked.name}`);
    blob = await response.blob();
  }

  if (!blob) throw new Error(`Unable to read ${picked.name}`);

  return new File([blob], picked.name, {
    type: picked.mimeType || blob.type || 'application/octet-stream',
    lastModified: picked.modifiedAt ?? Date.now(),
  });
};

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
        setFileError(`${file.name} is larger than 5 MB.`);
        continue;
      }
      const totalSize = next.reduce((sum, item) => sum + item.size, 0) + file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        setFileError('Attachments must be 10 MB or smaller in total.');
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
      const result = await FilePicker.pickFiles({
        // Android is most reliable with a single selection. The user can tap
        // the attachment button again for additional files.
        limit: 1,
        // Do not filter MIME types in the native picker. Android document
        // providers often report extensions with inconsistent MIME types.
        // The server still performs the final file-type validation.
        readData: true,
      });

      if (!result.files?.length) {
        setFileError('No file was returned by the Android file picker.');
        return;
      }

      const remaining = MAX_FILES - files.length;
      const picked = result.files.slice(0, remaining);
      const converted: File[] = [];

      for (const item of picked) {
        converted.push(await pickedFileToFile(item));
      }

      addFiles(converted);

      if (result.files.length > remaining) {
        setFileError(`You can attach up to ${MAX_FILES} files per message.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel|dismiss/i.test(message)) {
        setFileError('Could not attach the selected file. Please try again.');
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
