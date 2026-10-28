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
  onFocus?: () => void;
  onBlur?: () => void;
  isKeyboardVisible?: boolean;
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

const compressImageIfNeeded = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          const compressedName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          resolve(new File([blob], compressedName, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = "Tell Sunny what's on your mind...",
  onFocus,
  onBlur,
  isKeyboardVisible = false,
}) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preparingAttachment, setPreparingAttachment] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addFiles = async (selected: File[]) => {
    if (selected.length === 0) return;
    setFileError(null);

    const compressedList: File[] = [];
    for (const f of selected) {
      try {
        const compressed = await compressImageIfNeeded(f);
        compressedList.push(compressed);
      } catch {
        compressedList.push(f);
      }
    }

    setFiles((currentFiles) => {
      const next = [...currentFiles];
      for (const file of compressedList) {
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
      let resolved = false;
      const finish = (resultFiles: File[]) => {
        if (resolved) return;
        resolved = true;
        window.removeEventListener('focus', onFocusCheck);
        resolve(resultFiles);
      };

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.json,.md,.png,.jpg,.jpeg,.webp';
      input.multiple = false;

      input.onchange = () => {
        if (input.files && input.files.length > 0) {
          finish(Array.from(input.files));
        } else {
          finish([]);
        }
      };

      if ('oncancel' in input) {
        (input as unknown as { oncancel: () => void }).oncancel = () => finish([]);
      }

      const onFocusCheck = () => {
        setTimeout(() => {
          if (!resolved) {
            finish(input.files && input.files.length > 0 ? Array.from(input.files) : []);
          }
        }, 500);
      };

      window.addEventListener('focus', onFocusCheck, { once: true });
      input.click();
    });
  };

  const handleAttach = async () => {
    if (disabled || preparingAttachment || sending || files.length >= MAX_FILES) return;

    setFileError(null);
    setPreparingAttachment(true);

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
          console.log('[Sunny] Native picker returned 0 files or user cancelled');
          return;
        }

        const remaining = MAX_FILES - files.length;
        const converted: File[] = [];

        for (const item of result.files.slice(0, remaining)) {
          try {
            let blob: Blob | null = null;

            if (item.path) {
              try {
                const webPath = Capacitor.convertFileSrc(item.path);
                const response = await fetch(webPath);
                if (response.ok) {
                  blob = await response.blob();
                }
              } catch (err) {
                console.warn('[Sunny] Failed to fetch converted file src path:', err);
              }
            }

            if (!blob && item.data) {
              try {
                blob = await base64ToBlob(item.data, item.mimeType);
              } catch (err) {
                console.warn('[Sunny] Failed to convert base64 to blob:', err);
              }
            }

            if (!blob) {
              throw new Error(`Unable to read selected file: ${item.name}`);
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
        await addFiles(converted);
        return;
      }

      const webSelected = await triggerWebFileInput();
      if (webSelected.length > 0) {
        await addFiles(webSelected);
      }
    } catch (error) {
      console.error('[Sunny] File picker error:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel|dismiss/i.test(message)) {
        setFileError(`Could not attach file: ${message}`);
      }
    } finally {
      setPreparingAttachment(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSend = async () => {
    if ((!text.trim() && files.length === 0) || disabled || preparingAttachment || sending) return;
    const content = text.trim();
    const attachments = [...files];
    setText('');
    setFiles([]);
    setFileError(null);
    setSending(true);
    try {
      await onSend(content, attachments);
    } catch {
      setText(content);
      setFiles(attachments);
    } finally {
      setSending(false);
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
    if (!disabled && !preparingAttachment && !sending && textareaRef.current) textareaRef.current.focus();
  }, [disabled, preparingAttachment, sending]);

  const isSendDisabled = disabled || preparingAttachment || sending || (!text.trim() && files.length === 0);

  return (
    <div className={`border-t border-white/[0.04] bg-gradient-to-t from-[#100B22] via-[#100B22]/[0.98] to-[#100B22]/90 px-3 pt-3 sm:px-5 ${isKeyboardVisible ? 'pb-1' : 'pb-3'}`}>
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
              <button type="button" onClick={() => removeFile(index)} disabled={preparingAttachment || sending} className="p-1 text-[#9B8AB9] hover:text-white cursor-pointer" aria-label={`Remove ${file.name}`}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-[26px] border border-[#604477]/55 bg-[#1B1430] px-2.5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-colors duration-200 focus-within:border-[#604477]/55 focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={() => void handleAttach()}
          disabled={disabled || preparingAttachment || sending || files.length >= MAX_FILES}
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
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled || preparingAttachment || sending}
          rows={1}
          maxLength={1000}
          className="min-h-10 max-h-[120px] flex-1 resize-none bg-transparent px-1 py-2.5 text-base leading-6 text-white outline-none placeholder:text-[#9B8AB9]/90 focus:outline-none disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isSendDisabled}
          className={`mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
            isSendDisabled
              ? 'bg-white/5 text-[#9B8AB9] cursor-not-allowed opacity-40'
              : 'bg-[#302149] text-[#FFD84D] border border-[#604477]/70 hover:bg-[#3A2853] hover:border-[#8C75B5]/70'
          }`}
          aria-label="Send message"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
      {preparingAttachment && <p className="mt-2 px-3 text-[11px] text-[#B6A6CC]">Preparing attachment…</p>}
      </div>
    </div>
  );
};
