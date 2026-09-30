import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { MemoryProvider } from '@/context/MemoryContext';
import { ChatProvider } from '@/context/ChatContext';
import App from './App';
import './index.css';

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
