import { Capacitor } from '@capacitor/core';

const NATIVE_API_BASE_URL = 'https://sunny-ai-1.onrender.com';

export const apiUrl = (path: string): string => {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_API_BASE_URL}${path}`;
  }

  return path;
};
