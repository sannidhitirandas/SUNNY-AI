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

/** One theme's bubble colours for a wallpaper. */
export interface ChatBubbleColors {
  /** Sunny's bubbles. */
  sunny: GradientStops;
  /** Your bubbles. */
  you: GradientStops;
  /** Text colour on your bubbles (Sunny's bubbles keep the theme's normal text). */
  youText: string;
}

/**
 * Bubble background gradients sampled from each wallpaper's palette.
 * `dark`: deep tones for Sunny, vivid tones for you, white text on both.
 * `light`: soft pastel tints with dark text, for the light theme.
 */
export interface ChatBubbleGradient {
  dark: ChatBubbleColors;
  light: ChatBubbleColors;
}

export interface ChatBackgroundOption {
  id: ChatBackgroundId;
  label: string;
  pc: string | null;
  mobile: string | null;
  thumb: string | null;
  bubbleGradient: ChatBubbleGradient | null;
}

const entry = (
  id: Exclude<ChatBackgroundId, 'none'>,
  label: string,
  bubbleGradient: ChatBubbleGradient
): ChatBackgroundOption => ({
  id,
  label,
  pc: `/chat-backgrounds/${id}-pc.png`,
  mobile: `/chat-backgrounds/${id}-mobile.jpg`,
  thumb: `/chat-backgrounds/${id}-pc.png`,
  bubbleGradient,
});

export const CHAT_BACKGROUNDS: ChatBackgroundOption[] = [
  { id: 'none', label: 'Plain', pc: null, mobile: null, thumb: null, bubbleGradient: null },
  // Indigo night + plum field / pink clouds + warm window glow
  entry('lavender-cottage', 'Lavender Cottage', {
    dark: { sunny: ['#2A1B52', '#3A2368', '#5A2A6E'], you: ['#8F2E7E', '#B23C8C', '#CC5A6E'], youText: '#FFFFFF' },
    light: { sunny: ['#FBEFFA', '#F1E6FF', '#FFE9EF'], you: ['#F7C6E3', '#E3CCFF', '#FFD9B8'], youText: '#2A1740' },
  }),
  // Deep blue room / neon cyan, violet skyline, magenta glow
  entry('moonlit-window', 'Moonlit Window', {
    dark: { sunny: ['#12255C', '#2A1A6B', '#5A1A6A'], you: ['#0E7C9A', '#4C3FD0', '#B02A8C'], youText: '#FFFFFF' },
    light: { sunny: ['#E8F6FB', '#EEE8FF', '#FBE9F5'], you: ['#B8ECF8', '#CFC4FF', '#F7C2E4'], youText: '#2A1740' },
  }),
  // Twilight blue / sakura pink and violet clouds
  entry('sakura-skyline', 'Sakura Skyline', {
    dark: { sunny: ['#1E2A6A', '#4A2A7A', '#7A2A62'], you: ['#C23A86', '#8A3FC4', '#4A58D8'], youText: '#FFFFFF' },
    light: { sunny: ['#FDEAF3', '#EAEEFF', '#F5E8FF'], you: ['#FBB9D9', '#C7D2FF', '#E2C3FA'], youText: '#2A1740' },
  }),
  // Deep violet sky / magenta clouds, peach horizon
  entry('violet-dusk', 'Violet Dusk', {
    dark: { sunny: ['#2E1068', '#4A1A82', '#7A1F7A'], you: ['#6A2FD0', '#A02FB8', '#D0507A'], youText: '#FFFFFF' },
    light: { sunny: ['#F0E8FF', '#F9E8FA', '#FFEFE6'], you: ['#D9C2FF', '#F5BBE9', '#FFD3B8'], youText: '#2A1740' },
  }),
  // Lavender blooms / pink clouds, golden sunrise
  entry('lavender-meadow', 'Lavender Meadow', {
    dark: { sunny: ['#281F63', '#43297C', '#6B3470'], you: ['#6F46D8', '#A83FA8', '#BE6A38'], youText: '#FFFFFF' },
    light: { sunny: ['#F1EAFF', '#FCEAF3', '#FFF3D6'], you: ['#DCCBFF', '#FAC0DE', '#FFE49A'], youText: '#2A1740' },
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
    bubbleGradient: getChatBackgroundOption(backgroundId).bubbleGradient,
    setChatBackground,
    device,
    availableBackgrounds: getDeviceChatBackgrounds(device),
  };
};
