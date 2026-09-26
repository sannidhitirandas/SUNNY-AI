import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import { useMemories } from '@/context/MemoryContext';
import { privacyService } from '@/services/privacyService';
import { PersonalityTone } from '@/types/user';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  User as UserIcon,
  Palette,
  Bookmark,
  List,
  ShieldCheck,
  Bell,
  Moon,
  Lock,
  Download,
  MessageSquareX,
  HeartHandshake,
  Info,
  UserCheck,
  RotateCcw,
  LogOut,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';

interface SettingsScreenProps {
  onNavigateToTab: (tab: 'home' | 'chat' | 'memories' | 'settings') => void;
  onNavigateSubscreen: (screen: 'notifications' | 'privacy' | 'safety' | 'about') => void;
  onReplayOnboarding: () => void;
  onSignOut: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToTab,
  onNavigateSubscreen,
  onReplayOnboarding,
  onSignOut,
}) => {
  const { user, logout } = useAuth();
  const {
    preferences,
    updateTone,
    updatePreferredName,
    toggleMemory,
    resetOnboarding,
  } = usePreferences();
  const { clearChat } = useChat();
  const { clearAllMemories } = useMemories();

  const [toneModalVisible, setToneModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [newName, setNewName] = useState(preferences.preferredName || '');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const TONES: { tone: PersonalityTone; label: string; desc: string }[] = [
    { tone: 'adaptive', label: 'Adaptive', desc: 'Balances tone to your conversations' },
    { tone: 'playful', label: 'Playful', desc: 'Lighthearted, witty, and fun' },
    { tone: 'gentle', label: 'Gentle', desc: 'Soft, empathetic, and validating' },
    { tone: 'calm', label: 'Calm', desc: 'Grounded, mindful, and unhurried' },
  ];

  const handleSaveName = async () => {
    if (newName.trim()) {
      await updatePreferredName(newName.trim());
    }
    setNameModalVisible(false);
  };

  const handleClearChatHistory = async () => {
    if (window.confirm('Clear Conversation History?\nThis will remove all current chat messages. Saved memories will stay intact.')) {
      await clearChat();
      alert('Your conversation history has been cleared.');
    }
  };

  const handleExportData = async () => {
    const dataJson = await privacyService.exportAllUserData();
    setExportNotice(dataJson);
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
      onSignOut();
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Delete Account & All Data?\nThis will permanently wipe all local chat history, memories, and preferences. You will be returned to the initial onboarding screen.')) {
      await privacyService.deleteAccountAndAllData();
      await clearChat();
      await clearAllMemories();
      await resetOnboarding();
      onReplayOnboarding();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="pt-2 pb-4 mb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-[#C6B8E5] mt-1">Customize your Sunny companion experience</p>
        <div className="mt-2.5">
          <Badge label="Prototype Demo Mode" variant="yellow" />
        </div>
      </div>

      {/* Section A — Your Sunny */}
      <SettingsSection title="YOUR SUNNY">
        <SettingsRow
          title="Conversation Personality"
          subtitle="Change how Sunny responds to you"
          icon={<Sparkles size={16} className="text-[#FFD84D]" />}
          rightText={preferences.preferredTone.charAt(0).toUpperCase() + preferences.preferredTone.slice(1)}
          onPress={() => setToneModalVisible(true)}
        />
        <SettingsRow
          title="Preferred Name"
          subtitle="What Sunny calls you"
          icon={<UserIcon size={16} className="text-[#FFD84D]" />}
          rightText={preferences.preferredName || user?.displayName || 'Set Name'}
          onPress={() => {
            setNewName(preferences.preferredName || user?.displayName || '');
            setNameModalVisible(true);
          }}
        />
        <SettingsRow
          title="Theme"
          subtitle="Dark Purple & Sunshine Yellow"
          icon={<Palette size={16} className="text-[#FFD84D]" />}
          rightText="Active"
          showChevron={false}
        />
      </SettingsSection>

      {/* Section B — Memory */}
      <SettingsSection title="MEMORY & PERSISTENCE">
        <SettingsRow
          title="Enable Memory"
          subtitle="Allow Sunny to remember approved details"
          icon={<Bookmark size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={preferences.memoryEnabled}
          onSwitchChange={toggleMemory}
        />
        <SettingsRow
          title="Manage Saved Memories"
          subtitle="View, edit, or delete personal notes"
          icon={<List size={16} className="text-[#FFD84D]" />}
          onPress={() => onNavigateToTab('memories')}
        />
        <SettingsRow
          title="Memory Privacy Explanation"
          subtitle="How memory works with your consent"
          icon={<ShieldCheck size={16} className="text-[#A8D9A0]" />}
          onPress={() => onNavigateSubscreen('privacy')}
        />
      </SettingsSection>

      {/* Section C — Notifications */}
      <SettingsSection title="NOTIFICATIONS">
        <SettingsRow
          title="Notification Preferences"
          subtitle="Configure morning, afternoon & evening check-ins"
          icon={<Bell size={16} className="text-[#FFD84D]" />}
          onPress={() => onNavigateSubscreen('notifications')}
        />
        <SettingsRow
          title="Quiet Hours"
          subtitle="10:00 PM – 8:00 AM local time"
          icon={<Moon size={16} className="text-[#C6B8E5]" />}
          rightText="Active"
          onPress={() => onNavigateSubscreen('notifications')}
        />
      </SettingsSection>

      {/* Section D — Privacy & Security */}
      <SettingsSection title="PRIVACY & SECURITY">
        <SettingsRow
          title="Privacy & Data Controls"
          subtitle="Review what is stored and managed locally"
          icon={<Lock size={16} className="text-[#FFD84D]" />}
          onPress={() => onNavigateSubscreen('privacy')}
        />
        <SettingsRow
          title="Export My Data"
          subtitle="Download your preferences, notes, and chats"
          icon={<Download size={16} className="text-[#A8D9A0]" />}
          onPress={handleExportData}
        />
        <SettingsRow
          title="Clear Chat History"
          subtitle="Erase current chat session messages"
          icon={<MessageSquareX size={16} className="text-[#FF8D9A]" />}
          destructive
          onPress={handleClearChatHistory}
        />
      </SettingsSection>

      {/* Section E — Help & Safety */}
      <SettingsSection title="HELP & SAFETY">
        <SettingsRow
          title="Help & Emotional Safety"
          subtitle="Crisis hotlines, support resources & boundaries"
          icon={<HeartHandshake size={16} className="text-[#FF8D9A]" />}
          onPress={() => onNavigateSubscreen('safety')}
        />
        <SettingsRow
          title="About Sunny"
          subtitle="Mission, technology stack, and app version"
          icon={<Info size={16} className="text-[#C6B8E5]" />}
          onPress={() => onNavigateSubscreen('about')}
        />
      </SettingsSection>

      {/* Section F — Account */}
      <SettingsSection title="ACCOUNT">
        <SettingsRow
          title="Account Profile"
          subtitle={user?.email || 'Demo Guest Account'}
          icon={<UserCheck size={16} className="text-[#FFD84D]" />}
          showChevron={false}
        />
        <SettingsRow
          title="Replay Onboarding"
          subtitle="Experience the introductory flow again"
          icon={<RotateCcw size={16} className="text-[#C6B8E5]" />}
          onPress={async () => {
            await resetOnboarding();
            onReplayOnboarding();
          }}
        />
        <SettingsRow
          title="Sign Out"
          icon={<LogOut size={16} className="text-[#FF8D9A]" />}
          destructive
          onPress={handleSignOut}
        />
        <SettingsRow
          title="Delete Account & Data"
          subtitle="Permanently erase all data on this device"
          icon={<Trash2 size={16} className="text-[#FF8D9A]" />}
          destructive
          onPress={handleDeleteAccount}
        />
      </SettingsSection>

      {/* Tone Picker Modal */}
      {toneModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#21163A] border border-[#392858] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-3">
              Choose Sunny's Personality
            </h3>
            <div className="space-y-2 mb-4">
              {TONES.map((item) => {
                const isSelected = preferences.preferredTone === item.tone;
                return (
                  <button
                    key={item.tone}
                    type="button"
                    onClick={async () => {
                      await updateTone(item.tone);
                      setToneModalVisible(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#FFD84D] bg-[#FFD84D]/15'
                        : 'border-[#392858] bg-[#302149] hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className={`text-sm font-semibold block ${isSelected ? 'text-[#FFD84D]' : 'text-white'}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-[#C6B8E5] block mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={18} className="text-[#FFD84D] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
            <AppButton
              title="Close"
              onPress={() => setToneModalVisible(false)}
              variant="ghost"
              fullWidth
            />
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {nameModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#21163A] border border-[#392858] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-3">
              What should Sunny call you?
            </h3>
            <AppInput
              placeholder="e.g. Alex, Sam, Sunshine"
              value={newName}
              onChangeText={setNewName}
            />
            <div className="flex flex-col gap-2 mt-4">
              <AppButton
                title="Save Name"
                onPress={handleSaveName}
                variant="primary"
                fullWidth
              />
              <AppButton
                title="Cancel"
                onPress={() => setNameModalVisible(false)}
                variant="ghost"
                fullWidth
              />
            </div>
          </div>
        </div>
      )}

      {/* Data Export Notice Modal */}
      {exportNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#21163A] border border-[#392858] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#392858]">
              <h3 className="text-base font-bold text-[#FFD84D]">Data Export Ready</h3>
              <button
                type="button"
                onClick={() => setExportNotice(null)}
                className="text-[#9B8AB9] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-[#C6B8E5] mb-3">
              Your local companion dataset in standard JSON format:
            </p>
            <pre className="p-3 bg-[#17102C] border border-[#392858] rounded-xl text-[11px] text-[#A8D9A0] font-mono max-h-48 overflow-y-auto mb-4 select-all">
              {exportNotice}
            </pre>
            <div className="flex items-center gap-2">
              <AppButton
                title="Copy JSON"
                onPress={() => {
                  navigator.clipboard?.writeText(exportNotice);
                  alert('Copied to clipboard!');
                }}
                variant="primary"
                fullWidth
              />
              <AppButton
                title="Close"
                onPress={() => setExportNotice(null)}
                variant="ghost"
                fullWidth
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
