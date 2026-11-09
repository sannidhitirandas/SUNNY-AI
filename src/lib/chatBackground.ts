import { useCallback, useEffect, useState } from 'react';

export type ChatBackgroundId =
  | 'none'
  | 'lavender-cottage'
  | 'moonlit-window'
  | 'sakura-skyline'
  | 'violet-dusk'
  | 'lavender-meadow';

export interface ChatBackgroundOption {
  id: ChatBackgroundId;
  label: string;
  /** Wide image for desktop / landscape screens; null for the plain theme background. */
  pc: string | null;
  /** Tall image for phones in portrait; null for the plain theme background. */
  mobile: string | null;
  /** Small preview used in the Settings picker. */
  thumb: string | null;
}

const entry = (id: Exclude<ChatBackgroundId, 'none'>, label: string): ChatBackgroundOption => ({
  id,
  label,
  pc: `/chat-backgrounds/${id}-pc.jpg`,
  mobile: `/chat-backgrounds/${id}-mobile.jpg`,
  thumb: `/chat-backgrounds/${id}-thumb.jpg`,
});

export const CHAT_BACKGROUNDS: ChatBackgroundOption[] = [
  { id: 'none', label: 'Plain', pc: null, mobile: null, thumb: null },
  entry('lavender-cottage', 'Lavender Cottage'),
  entry('moonlit-window', 'Moonlit Window'),
  entry('sakura-skyline', 'Sakura Skyline'),
  entry('violet-dusk', 'Violet Dusk'),
  entry('lavender-meadow', 'Lavender Meadow'),
];

const STORAGE_KEY = '@sunny_chat_background';
const CHANGE_EVENT = 'sunny-chat-background-change';

export const getChatBackgroundOption = (id: string | null | undefined): ChatBackgroundOption =>
  CHAT_BACKGROUNDS.find((option) => option.id === id) ?? CHAT_BACKGROUNDS[0];

const readStored = (): ChatBackgroundId => {
  try {
    return getChatBackgroundOption(window.localStorage.getItem(STORAGE_KEY)).id;
  } catch {
    return 'none';
  }
};

/**
 * Per-device chat wallpaper. Kept in localStorage (not in synced preferences)
 * so it needs no database change; ChatScreen and Settings stay in sync via a window event.
 */
export const useChatBackground = () => {
  const [backgroundId, setBackgroundId] = useState<ChatBackgroundId>(readStored);

  useEffect(() => {
    const sync = () => setBackgroundId(readStored());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setChatBackground = useCallback((id: ChatBackgroundId) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage can be unavailable; the choice then lasts only for this session.
    }
    setBackgroundId(id);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { backgroundId, background: getChatBackgroundOption(backgroundId), setChatBackground };
};
