import { useCallback, useEffect, useState } from 'react';

export type ChatBackgroundId =
  | 'none'
  | 'lavender-cottage'
  | 'moonlit-window'
  | 'sakura-skyline'
  | 'violet-dusk'
  | 'lavender-meadow';

export type ChatBackgroundDevice = 'pc' | 'mobile';

type GradientStops = [string, string, string];

/**
 * Text gradient for Sunny's messages, colour-picked from each wallpaper.
 * `dark` = light pastel stops for the dark theme's dark bubbles.
 * `light` = deeper stops that stay readable on the light theme's white bubbles.
 */
export interface ChatTextGradient {
  dark: GradientStops;
  light: GradientStops;
}

export interface ChatBackgroundOption {
  id: ChatBackgroundId;
  label: string;
  pc: string | null;
  mobile: string | null;
  thumb: string | null;
  textGradient: ChatTextGradient | null;
}

const entry = (
  id: Exclude<ChatBackgroundId, 'none'>,
  label: string,
  textGradient: ChatTextGradient
): ChatBackgroundOption => ({
  id,
  label,
  pc: `/chat-backgrounds/${id}-pc.png`,
  mobile: `/chat-backgrounds/${id}-mobile.jpg`,
  thumb: `/chat-backgrounds/${id}-pc.png`,
  textGradient,
});

export const CHAT_BACKGROUNDS: ChatBackgroundOption[] = [
  { id: 'none', label: 'Plain', pc: null, mobile: null, thumb: null, textGradient: null },
  // Pink cloud edges -> lilac field -> warm window glow
  entry('lavender-cottage', 'Lavender Cottage', {
    dark: ['#FFC9E6', '#E4CCFF', '#FFE6B3'],
    light: ['#B0267A', '#6B2BC4', '#A0580A'],
  }),
  // Neon cyan curtains -> violet skyline -> magenta glow
  entry('moonlit-window', 'Moonlit Window', {
    dark: ['#9EEBFF', '#E2B8FF', '#FFC2E3'],
    light: ['#0A6E8C', '#7A2BC4', '#B0206E'],
  }),
  // Sakura pink -> twilight blue -> soft lilac
  entry('sakura-skyline', 'Sakura Skyline', {
    dark: ['#FFB8DC', '#C9D4FF', '#F0C8FF'],
    light: ['#B0206E', '#2F4FC0', '#8A2BB8'],
  }),
  // Deep violet sky -> magenta clouds -> peach horizon
  entry('violet-dusk', 'Violet Dusk', {
    dark: ['#E0C8FF', '#FFB8F0', '#FFD6B0'],
    light: ['#6A1FC0', '#B0208F', '#A04A10'],
  }),
  // Lavender blooms -> pink clouds -> golden sunrise
  entry('lavender-meadow', 'Lavender Meadow', {
    dark: ['#E6D4FF', '#FFC4E4', '#FFE49A'],
    light: ['#6A3FC0', '#B0267A', '#8A6200'],
  }),
];

const LEGACY_STORAGE_KEY = '@sunny_chat_background';
const PC_STORAGE_KEY = '@sunny_chat_background_pc';
const MOBILE_STORAGE_KEY = '@sunny_chat_background_mobile';
const CHANGE_EVENT = 'sunny-chat-background-change';

export const getChatBackgroundOption = (
  id: string | null | undefined
): ChatBackgroundOption =>
  CHAT_BACKGROUNDS.find((option) => option.id === id) ?? CHAT_BACKGROUNDS[0];

export const getDeviceChatBackgrounds = (
  device: ChatBackgroundDevice
): ChatBackgroundOption[] =>
  CHAT_BACKGROUNDS.map((option) => ({
    ...option,
    thumb: device === 'pc' ? option.pc : option.mobile,
  }));

// Single rule for "is this a phone/tablet?" used by the picker, storage AND the
// wallpaper image. Narrow windows, or touch-first devices up to tablet width
// (so a phone held sideways still counts as mobile).
const MOBILE_QUERY =
  '(max-width: 767px), (pointer: coarse) and (max-width: 1024px)';

const getDevice = (): ChatBackgroundDevice =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
    ? 'mobile'
    : 'pc';

const getStorageKey = (device: ChatBackgroundDevice) =>
  device === 'mobile' ? MOBILE_STORAGE_KEY : PC_STORAGE_KEY;

const readStored = (device: ChatBackgroundDevice): ChatBackgroundId => {
  try {
    const key = getStorageKey(device);
    const saved = window.localStorage.getItem(key);

    if (saved) return getChatBackgroundOption(saved).id;

    // Migrate the previous single wallpaper choice to this device only.
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      window.localStorage.setItem(key, getChatBackgroundOption(legacy).id);
      return getChatBackgroundOption(legacy).id;
    }

    return 'none';
  } catch {
    return 'none';
  }
};

/**
 * Wallpaper choices are stored separately for desktop and mobile and are not
 * synced to account preferences. Settings and ChatScreen stay in sync via an event.
 */
export const useChatBackground = () => {
  const [device, setDevice] = useState<ChatBackgroundDevice>(getDevice);
  const [backgroundId, setBackgroundId] = useState<ChatBackgroundId>(
    () => readStored(getDevice())
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const updateDevice = () => {
      setDevice(mediaQuery.matches ? 'mobile' : 'pc');
    };

    updateDevice();
    mediaQuery.addEventListener('change', updateDevice);
    return () => mediaQuery.removeEventListener('change', updateDevice);
  }, []);

  useEffect(() => {
    const sync = () => setBackgroundId(readStored(device));

    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [device]);

  const setChatBackground = useCallback(
    (id: ChatBackgroundId) => {
      try {
        window.localStorage.setItem(getStorageKey(device), id);
      } catch {
        // Storage can be unavailable; the choice then lasts only for this session.
      }

      setBackgroundId(id);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [device]
  );

  return {
    backgroundId,
    background: getChatBackgroundOption(backgroundId),
    // The image for THIS device only (null for "Plain"); ChatScreen renders this.
    wallpaperSrc: (() => {
      const option = getChatBackgroundOption(backgroundId);
      return device === 'mobile' ? option.mobile : option.pc;
    })(),
    textGradient: getChatBackgroundOption(backgroundId).textGradient,
    setChatBackground,
    device,
    availableBackgrounds: getDeviceChatBackgrounds(device),
  };
};
