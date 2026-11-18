import React, { useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ArrowUp, FileText, Paperclip, X } from 'lucide-react';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

interface SunnyNativeFile { name: string; mimeType: string; size: number; path?: string; data?: string; }
interface SunnyFilePickerPlugin { pickFile(): Promise<{ files: SunnyNativeFile[] }>; releaseFile(options: { path: string }): Promise<void>; }
const SunnyFilePicker = registerPlugin<SunnyFilePickerPlugin>('SunnyFilePicker');

interface MessageComposerProps {
  onSend: (text: string, files: File[]) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  isKeyboardVisible?: boolean;
}

const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const compressImageIfNeeded = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) return file;
  return new Promise((resolve) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url); const max = 1600; let { width, height } = img;
      if (width > max || height > max) { if (width > height) { height = Math.round(height * max / width); width = max; } else { width = Math.round(width * max / height); height = max; } }
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d'); if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => { if (!blob || blob.size >= file.size) return resolve(file); resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', .85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); }; img.src = url;
  });
};

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, disabled = false, placeholder = "Tell Sunny what's on your mind...", onFocus, onBlur, isKeyboardVisible = false }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preparingAttachment, setPreparingAttachment] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addFiles = async (selected: File[]) => {
    if (!selected.length) return; setFileError(null);
    const compressed: File[] = [];
    for (const file of selected) { try { compressed.push(await compressImageIfNeeded(file)); } catch { compressed.push(file); } }
    setFiles((current) => {
      const next = [...current];
      for (const file of compressed) {
        if (next.some((item) => item.name === file.name && item.size === file.size)) continue;
        if (next.length >= MAX_FILES) { setFileError(`You can attach up to ${MAX_FILES} files per message.`); break; }
        if (file.size > MAX_FILE_SIZE) { setFileError(`${file.name} is larger than 50 MB.`); continue; }
        if (next.reduce((sum, item) => sum + item.size, 0) + file.size > MAX_TOTAL_SIZE) { setFileError('Attachments must be 50 MB or smaller in total.'); break; }
        next.push(file);
      }
      return next;
    });
  };

  const pickWebFile = (): Promise<File[]> => new Promise((resolve) => {
    let resolved = false;
    const finish = (files: File[]) => { if (resolved) return; resolved = true; window.removeEventListener('focus', onFocusCheck); resolve(files); };
    const input = document.createElement('input'); input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.json,.md,.png,.jpg,.jpeg,.webp';
    input.onchange = () => finish(input.files?.length ? Array.from(input.files) : []);
    if ('oncancel' in input) (input as unknown as { oncancel: () => void }).oncancel = () => finish([]);
    const onFocusCheck = () => { window.setTimeout(() => { if (!resolved) finish(input.files?.length ? Array.from(input.files) : []); }, 500); };
    window.addEventListener('focus', onFocusCheck, { once: true }); input.click();
  });

  const handleAttach = async () => {
    if (disabled || preparingAttachment || sending || files.length >= MAX_FILES) return;
    setFileError(null); setPreparingAttachment(true);
    try {
      if (Capacitor.isNativePlatform()) {
        let result: { files: SunnyNativeFile[] } | null = null;
        try { result = await SunnyFilePicker.pickFile(); }
        catch { const fallback = await pickWebFile(); if (fallback.length) await addFiles(fallback); return; }
        if (!result?.files?.length) return;
        const converted: File[] = [];
        for (const item of result.files.slice(0, MAX_FILES - files.length)) {
          try {
            if (!item.path) throw new Error(`Unable to read selected file: ${item.name}`);
            const response = await fetch(Capacitor.convertFileSrc(item.path));
            if (!response.ok) throw new Error(`Unable to read selected file: ${item.name}`);
            const blob = await response.blob();
            converted.push(new File([blob], item.name, { type: item.mimeType || blob.type || 'application/octet-stream' }));
          } finally { if (item.path) await SunnyFilePicker.releaseFile({ path: item.path }).catch(() => undefined); }
        }
        await addFiles(converted); return;
      }
      const selected = await pickWebFile(); if (selected.length) await addFiles(selected);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel|dismiss/i.test(message)) setFileError(`Could not attach file: ${message}`);
    } finally { setPreparingAttachment(false); }
  };

  const removeFile = (index: number) => { setFiles((current) => current.filter((_, i) => i !== index)); setFileError(null); };
  const handleSend = async () => {
    if ((!text.trim() && !files.length) || disabled || preparingAttachment || sending) return;
    const content = text.trim(); const attachments = [...files];
    setText(''); setFiles([]); setFileError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(true);
    try { await onSend(content, attachments); }
    catch { setText(content); setFiles(attachments); }
    finally { setSending(false); }
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void handleSend(); }
  };
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value); event.target.style.height = 'auto'; event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
  };
  const isSendDisabled = disabled || preparingAttachment || sending || (!text.trim() && !files.length);

  return (
    <div className={`sunny-composer-wrap bg-transparent px-3 pt-2 transition-[padding] duration-200 ease-out sm:px-5 ${isKeyboardVisible ? 'pb-1' : 'pb-3'}`}>
      <div className="mx-auto w-full max-w-4xl sm:px-6">
        {fileError && <div className="mb-2 rounded-xl border border-[#FF8D9A]/20 bg-[#FF8D9A]/[0.07] px-3 py-2 text-xs text-[#FF9DA8]" role="alert">{fileError}</div>}
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 px-1" aria-label="Attached files">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`} className="flex max-w-full items-center gap-2 rounded-2xl border border-[#7656A5]/45 bg-[#21163A]/95 px-3 py-2 shadow-sm">
                <FileText size={15} className="shrink-0 text-[#A78BFA]" />
                <div className="min-w-0"><p className="max-w-[180px] truncate text-xs text-white">{file.name}</p><p className="text-[10px] text-[#9B8AB9]">{formatSize(file.size)}</p></div>
                <button type="button" onClick={() => removeFile(index)} disabled={preparingAttachment || sending} className="cursor-pointer p-1 text-[#9B8AB9] hover:text-white" aria-label={`Remove ${file.name}`}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="sunny-composer flex items-end gap-2 rounded-[27px] border border-[#7656A5]/45 bg-[#1B1430]/95 px-2.5 py-2 shadow-[0_10px_35px_rgba(0,0,0,.24)] backdrop-blur-xl transition-all duration-200">
          <button type="button" onClick={() => void handleAttach()} disabled={disabled || preparingAttachment || sending || files.length >= MAX_FILES} className="mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#C6B8E5] transition-all hover:bg-[#302149] hover:text-[#A78BFA] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Attach files" title="Attach files">
            <Paperclip size={18} />
          </button>
          <textarea ref={textareaRef} value={text} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} onBlur={onBlur} placeholder={placeholder} rows={1} maxLength={1000} className="min-h-10 max-h-[120px] flex-1 resize-none bg-transparent px-1 py-2.5 text-base leading-6 text-white outline-none placeholder:text-[#9B8AB9] focus:outline-none" />
          <button type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => void handleSend()} disabled={isSendDisabled} className={`sunny-send-button mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${isSendDisabled ? 'bg-white/[0.06] text-[#9B8AB9] cursor-not-allowed opacity-50' : 'bg-[#A78BFA] text-[#100B22] shadow-[0_4px_16px_rgba(167,139,250,.22)] hover:brightness-105'}`} aria-label="Send message">
            <ArrowUp size={19} strokeWidth={2.7} />
          </button>
        </div>
        {preparingAttachment && <p className="mt-2 px-3 text-[11px] text-[#B6A6CC]">Preparing attachment…</p>}
      </div>
    </div>
  );
};
