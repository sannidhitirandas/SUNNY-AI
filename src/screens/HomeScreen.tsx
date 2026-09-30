import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import { StarterIntent } from '@/types/chat';
import { SunnyLogo } from '@/components/brand/SunnyLogo';

import { GreetingCard } from '@/components/home/GreetingCard';
import { ConversationStarter } from '@/components/home/ConversationStarter';
import { DailySunshineCard } from '@/components/home/DailySunshineCard';
import { RecentConversations } from '@/components/home/RecentConversations';
import { Settings } from 'lucide-react';

interface HomeScreenProps {
  onNavigateToTab: (tab: 'home' | 'chat' | 'memories' | 'settings') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { messages, startConversationWithIntent } = useChat();

  const displayName = preferences.preferredName || user?.displayName || 'sunshine';

  const handleTalkToSunny = () => {
    onNavigateToTab('chat');
  };

  const handleSelectIntent = async (intent: StarterIntent) => {
    await startConversationWithIntent(intent);
    onNavigateToTab('chat');
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Top App Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <div className="flex items-center gap-2.5">
          <SunnyLogo size="small" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-white tracking-tight">Sunny</h1>
              <span className="text-sm">☀️</span>
            </div>
            <p className="text-[11px] text-[#C6B8E5]">Your little corner of sunshine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() => onNavigateToTab('settings')}
            className="p-1.5 rounded-lg bg-[#302149] text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
            aria-label="Open settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Welcoming Greeting Card */}
      <GreetingCard
        displayName={displayName}
        onTalkPress={handleTalkToSunny}
      />

      {/* Conversation Starter Vibe Cards */}
      <ConversationStarter onSelectIntent={handleSelectIntent} />

      {/* Daily Sunshine Reflection Card */}
      <DailySunshineCard />

      {/* Recent Conversation History Preview */}
      <RecentConversations
        lastMessage={lastMessage}
        onResume={handleTalkToSunny}
      />
    </div>
  );
};
