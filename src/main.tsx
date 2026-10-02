import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { MemoryProvider } from '@/context/MemoryContext';
import { ChatProvider } from '@/context/ChatContext';
import App from './App';
import { authService, NATIVE_AUTH_CALLBACK_URL } from '@/services/authService';
import './index.css';

const handleNativeAuthUrl = async (url: string) => {
  try {
    const callback = new URL(url);
    if (
      callback.protocol !== 'sunnyai:' ||
      callback.host !== 'auth' ||
      callback.pathname !== '/callback'
    ) return;
  } catch {
    return;
  }
  const result = await authService.completeAuthRedirect(url);
  if (result.error) {
    window.alert(result.error);
    return;
  }
  if (result.recovery) {
    window.dispatchEvent(new Event('sunny:password-recovery'));
  }
};

if (Capacitor.isNativePlatform()) {
  void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    void handleNativeAuthUrl(url);
  });
  void CapacitorApp.getLaunchUrl().then((launch) => {
    if (launch?.url) void handleNativeAuthUrl(launch.url);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <PreferencesProvider>
        <MemoryProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </MemoryProvider>
      </PreferencesProvider>
    </AuthProvider>
  </React.StrictMode>
);
