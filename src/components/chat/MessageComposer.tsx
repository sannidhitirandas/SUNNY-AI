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
  path?: string;
  data?: string;
}

interface SunnyFilePickerPlugin {
  pickFile(): Promise<{ files: SunnyNativeFile[] }>;
  releaseFile(options: { path: string }): Promise<void>;
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

const base64ToBlob = async (base64Data: string, contentType: string = 'application/octet-stream'): Promise<Blob> => {
  const cleanData = base64Data.trim();
  const dataUrl = cleanData.startsWith('data:')
    ? cleanData
    : `data:${contentType};base64,${cleanData}`;
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('Failed to process file data.');
  }
  return await response.blob();
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

    setFiles((currentFiles) => {
      const next = [...currentFiles];
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
      console.log('[Sunny] addFiles updated files state:', next.map(f => f.name));
      return next;
    });
  };

  const triggerWebFileInput = (): Promise<File[]> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.json,.md,.png,.jpg,.jpeg,.webp';
      input.multiple = false;
      input.onchange = () => {
        if (input.files && input.files.length > 0) {
          resolve(Array.from(input.files));
        } else {
          resolve([]);
        }
      };
      input.click();
    });
  };

  const handleAttach = async () => {
    if (disabled || preparing || files.length >= MAX_FILES) return;

    setFileError(null);
    setPreparing(true);

    try {
      if (Capacitor.isNativePlatform()) {
        console.log('[Sunny] Calling native SunnyFilePicker.pickFile()');
        let result: { files: SunnyNativeFile[] } | null = null;
        try {
          result = await SunnyFilePicker.pickFile();
          console.log('[Sunny] Native SunnyFilePicker result:', result);
        } catch (nativeErr) {
          console.warn('[Sunny] Native file picker failed, falling back to Web file input:', nativeErr);
          const webSelected = await triggerWebFileInput();
          if (webSelected.length > 0) {
            addFiles(webSelected);
          }
          return;
        }

        if (!result?.files?.length) {
          // If native picker returned 0 files, try web chooser fallback
          console.log('[Sunny] Native picker returned 0 files, trying web input fallback');
          const webSelected = await triggerWebFileInput();
          if (webSelected.length > 0) {
            addFiles(webSelected);
          }
          return;
        }

        const remaining = MAX_FILES - files.length;
        const converted: File[] = [];

        for (const item of result.files.slice(0, remaining)) {
          try {
            let blob: Blob;

            if (item.data) {
              blob = await base64ToBlob(item.data, item.mimeType);
            } else if (item.path) {
              const webPath = Capacitor.convertFileSrc(item.path);
              const response = await fetch(webPath);
              if (!response.ok) {
                throw new Error('Unable to read selected file.');
              }
              blob = await response.blob();
            } else {
              throw new Error('Unable to read selected file.');
            }

            converted.push(new File([blob], item.name, {
              type: item.mimeType || blob.type || 'application/octet-stream',
            }));
          } finally {
            if (item.path) {
              await SunnyFilePicker.releaseFile({ path: item.path }).catch(() => undefined);
            }
          }
        }

        console.log('[Sunny] Converted files:', converted.map(f => ({ name: f.name, size: f.size, type: f.type })));
        addFiles(converted);
        return;
      }

      const webSelected = await triggerWebFileInput();
      if (webSelected.length > 0) {
        addFiles(webSelected);
      }
    } catch (error) {
      console.error('[Sunny] File picker error:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel|dismiss/i.test(message)) {
        setFileError(`Could not attach file: ${message}`);
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
    <div className="border-t border-white/[0.04] bg-gradient-to-t from-[#100B22] via-[#100B22]/[0.98] to-[#100B22]/90 px-3 pb-3 pt-4 sm:px-5">
      <div className="mx-auto w-full max-w-3xl">
      {fileError && (
        <div className="mb-2 px-3 text-xs text-[#FF9DA8]" role="alert">{fileError}</div>
      )}

      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 px-1" aria-label="Attached files">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`} className="flex max-w-full items-center gap-2 rounded-2xl border border-[#604477]/45 bg-[#21163A]/95 px-3 py-2 shadow-sm">
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

      <div className="flex items-end gap-2 rounded-[26px] border border-[#604477]/55 bg-[#1B1430] px-2.5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all duration-200 focus-within:border-[#A58BCB]/80 focus-within:shadow-[0_0_0_3px_rgba(165,139,203,0.10),0_8px_30px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={() => void handleAttach()}
          disabled={disabled || preparing || files.length >= MAX_FILES}
          className="mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#C6B8E5] transition-colors duration-200 hover:bg-[#302149] hover:text-[#FFD84D] disabled:cursor-not-allowed disabled:opacity-40"
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
          className="min-h-10 max-h-[120px] flex-1 resize-none bg-transparent px-1 py-2.5 text-[14px] leading-5 text-white outline-none placeholder:text-[#9B8AB9]/90 focus:outline-none disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isSendDisabled}
          className={`mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
            isSendDisabled
              ? 'bg-white/5 text-[#9B8AB9] cursor-not-allowed opacity-40'
              : 'bg-[#FFD84D] text-[#100B22] shadow-[0_3px_12px_rgba(255,216,77,0.22)] hover:bg-[#FFE477]'
          }`}
          aria-label="Send message"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
      {preparing && <p className="mt-2 px-3 text-[11px] text-[#B6A6CC]">Preparing attachment…</p>}
      </div>
    </div>
  );
};
