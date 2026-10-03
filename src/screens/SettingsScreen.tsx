import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import { audioService } from '@/services/audioService';
import { PersonalityTone, SunnyTheme } from '@/types/user';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';

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
  MessageSquareX,
  HeartHandshake,
  Info,
  UserCheck,
  RotateCcw,
  LogOut,
  Trash2,
  CheckCircle2,
  Volume2,
  Music,
} from 'lucide-react';

interface SettingsScreenProps {
  onNavigateToTab: (tab: 'home' | 'chat' | 'memories' | 'settings') => void;
  onNavigateSubscreen: (screen: 'notifications' | 'privacy' | 'safety' | 'about') => void;
  onReplayOnboarding: () => void;
  onSignOut: () => void;
}

const VolumeSliderRow: React.FC<{
  title: string;
  value: number;
  disabled?: boolean;
  onChange: (val: number) => void;
}> = ({ title, value, disabled = false, onChange }) => {
  const percentage = Math.round(value * 100);
  return (
    <div className={`flex flex-col gap-1.5 px-4 py-3 border-b border-[#392858]/40 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
        <span className="text-white">{title}</span>
        <span className="text-[#FFD84D] font-semibold">{percentage}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={title}
        className="w-full accent-[#FFD84D] bg-[#21163A] h-2 rounded-lg cursor-pointer"
      />
    </div>
  );
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToTab,
  onNavigateSubscreen,
  onReplayOnboarding,
  onSignOut,
}) => {
  const { user, logout, updateDisplayName } = useAuth();
  const {
    preferences,
    updateTone,
    updatePreferredName,
    updateTheme,
    toggleMemory,
    updateAudioPreferences,
    resetOnboarding,
  } = usePreferences();
  const { clearChat } = useChat();

  const [toneModalVisible, setToneModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newName, setNewName] = useState(preferences.preferredName || '');

  const TONES: { tone: PersonalityTone; label: string; desc: string }[] = [
    { tone: 'adaptive', label: 'Adaptive', desc: 'Balances tone to your conversations' },
    { tone: 'playful', label: 'Playful', desc: 'Lighthearted, witty, and fun' },
    { tone: 'gentle', label: 'Gentle', desc: 'Soft, empathetic, and validating' },
    { tone: 'calm', label: 'Calm', desc: 'Grounded, mindful, and unhurried' },
  ];

  const THEMES: { theme: SunnyTheme; label: string; description: string }[] = [
    { theme: 'sunny-dark', label: 'Sunny Night', description: 'The original dark purple and sunshine palette' },
    { theme: 'sunny-light', label: 'Sunny Day', description: 'A bright, soft version of Sunny’s colors' },
  ];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

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

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
      onSignOut();
    }
  };

  const handleSaveProfile = async () => {
    const normalizedName = profileName.trim();
    if (!normalizedName || normalizedName.length > 60) {
      setProfileError('Enter a display name between 1 and 60 characters.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    try {
      if (user) {
        const result = await updateDisplayName(normalizedName);
        if (!result.success) {
          setProfileError(result.error || 'Sunny could not save your profile name. Please try again.');
          return;
        }
      } else {
        await updatePreferredName(normalizedName);
      }
      setProfileModalVisible(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Sunny could not save your profile name. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="pt-2 pb-4 mb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-[#C6B8E5] mt-1">Customize your Sunny companion experience</p>
        <div className="mt-2.5">

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
          subtitle="Choose Sunny’s appearance"
          icon={<Palette size={16} className="text-[#FFD84D]" />}
          rightText={preferences.theme === 'sunny-light' ? 'Sunny Day' : 'Sunny Night'}
          onPress={() => setThemeModalVisible(true)}
        />
      </SettingsSection>

      {/* Section Audio — Audio & Sounds */}
      <SettingsSection title="AUDIO & SOUNDS">
        <SettingsRow
          title="Sound Effects"
          subtitle="Play UI sounds for chat, buttons, and events"
          icon={<Volume2 size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={preferences.audioPreferences.soundEnabled}
          onSwitchChange={(enabled) => updateAudioPreferences({ soundEnabled: enabled })}
        />
        <SettingsRow
          title="Background Music"
          subtitle="Calm ambient music in the background"
          icon={<Music size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={preferences.audioPreferences.musicEnabled}
          onSwitchChange={(enabled) => updateAudioPreferences({ musicEnabled: enabled })}
        />
        <VolumeSliderRow
          title="Master Volume"
          value={preferences.audioPreferences.masterVolume}
          onChange={(vol) => updateAudioPreferences({ masterVolume: vol })}
        />
        <VolumeSliderRow
          title="Sound Effects Volume"
          value={preferences.audioPreferences.sfxVolume}
          disabled={!preferences.audioPreferences.soundEnabled}
          onChange={(vol) => updateAudioPreferences({ sfxVolume: vol })}
        />
        <VolumeSliderRow
          title="Music Volume"
          value={preferences.audioPreferences.musicVolume}
          disabled={!preferences.audioPreferences.musicEnabled}
          onChange={(vol) => updateAudioPreferences({ musicVolume: vol })}
        />

        {/* Background Music Track Selection */}
        <div className="px-4 py-3 space-y-2 border-t border-[#392858]/40">
          <span className="text-xs font-semibold text-[#C6B8E5] block tracking-wider uppercase mb-1">Background Music Track</span>
          <div className="space-y-1.5">
            {[
              { id: 'ambient', label: 'Sunny Ambience', desc: 'The official default Sunny app ambience' },
              { id: 'midnight-notes', label: 'Midnight Notes on the Floor', desc: 'Emotional / warm / reflective' },
              { id: 'blossoms', label: 'Blossoms on the Pavement', desc: 'Playful / upbeat' },
              { id: 'dust', label: 'Dust in the Curtains', desc: 'Hopeful / uplifting' },
              { id: 'after-school-rain', label: 'After-School Rain', desc: 'Dreamy / relaxed' },
            ].map((opt) => {
              const isSelected = preferences.audioPreferences.selectedBackgroundMusic === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={async () => {
                    await updateAudioPreferences({ selectedBackgroundMusic: opt.id as any });
                    if (preferences.audioPreferences.musicEnabled) {
                      await audioService.playNonChatMusic(opt.id as any);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    isSelected ? 'border-[#FFD84D] bg-[#FFD84D]/15' : 'border-[#392858] bg-[#21163A] hover:border-white/20'
                  }`}
                >
                  <div>
                    <span className={`text-xs sm:text-sm font-semibold block ${isSelected ? 'text-[#FFD84D]' : 'text-white'}`}>{opt.label}</span>
                    <span className="text-[11px] text-[#9B8AB9] block mt-0.5">{opt.desc}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-[#FFD84D] shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
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
          subtitle={preferences.notificationsEnabled ? 'Preference is on; review Android permission and schedule status' : 'Notification preference is off'}
          icon={<Bell size={16} className="text-[#FFD84D]" />}
          rightText={preferences.notificationsEnabled ? 'On' : 'Off'}
          onPress={() => onNavigateSubscreen('notifications')}
        />
        <SettingsRow
          title="Quiet Hours"
          subtitle={`${formatTime(preferences.notificationPreferences.quietHoursStart)} – ${formatTime(preferences.notificationPreferences.quietHoursEnd)} local time`}
          icon={<Moon size={16} className="text-[#C6B8E5]" />}
          rightText={preferences.notificationPreferences.quietHoursEnabled ? 'On' : 'Off'}
          onPress={() => onNavigateSubscreen('notifications')}
        />
      </SettingsSection>

      {/* Section D — Privacy & Security */}
      <SettingsSection title="PRIVACY & SECURITY">
        <SettingsRow
          title="Privacy & Data Controls"
          subtitle="Review local, account, and AI conversation data"
          icon={<Lock size={16} className="text-[#FFD84D]" />}
          onPress={() => onNavigateSubscreen('privacy')}
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
          subtitle="Mission and app version"
          icon={<Info size={16} className="text-[#C6B8E5]" />}
          onPress={() => onNavigateSubscreen('about')}
        />
      </SettingsSection>

      {/* Section F — Account */}
      <SettingsSection title="ACCOUNT">
        <SettingsRow
          title="Account Profile"
          subtitle={user?.email || 'Guest profile saved on this device'}
          icon={<UserCheck size={16} className="text-[#FFD84D]" />}
          rightText={user?.displayName || preferences.preferredName || 'Set name'}
          onPress={() => {
            setProfileName(user?.displayName || preferences.preferredName || '');
            setProfileError(null);
            setProfileModalVisible(true);
          }}
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
        {user && (
          <SettingsRow
            title="Delete Account & Data"
            subtitle="Review account and cloud deletion details"
            icon={<Trash2 size={16} className="text-[#FF8D9A]" />}
            destructive
            onPress={() => onNavigateSubscreen('privacy')}
          />
        )}
      </SettingsSection>

      {/* Tone Picker Modal */}
      {toneModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="tone-picker-title" className="w-full max-w-sm bg-[#21163A] border border-[#392858] rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 id="tone-picker-title" className="text-base font-bold text-white mb-3">
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

      {themeModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="theme-picker-title" className="w-full max-w-sm bg-[#21163A] border border-[#392858] rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 id="theme-picker-title" className="text-base font-bold text-white mb-3">Choose a theme</h3>
            <div className="space-y-2 mb-4">
              {THEMES.map((item) => {
                const isSelected = preferences.theme === item.theme;
                return (
                  <button
                    key={item.theme}
                    type="button"
                    onClick={async () => {
                      await updateTheme(item.theme);
                      setThemeModalVisible(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isSelected ? 'border-[#FFD84D] bg-[#FFD84D]/15' : 'border-[#392858] bg-[#302149] hover:border-white/20'
                    }`}
                  >
                    <span>
                      <span className={`text-sm font-semibold block ${isSelected ? 'text-[#FFD84D]' : 'text-white'}`}>{item.label}</span>
                      <span className="text-xs text-[#C6B8E5] block mt-0.5">{item.description}</span>
                    </span>
                    {isSelected && <CheckCircle2 size={18} className="text-[#FFD84D] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
            <AppButton title="Close" onPress={() => setThemeModalVisible(false)} variant="ghost" fullWidth />
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {nameModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="preferred-name-title" className="w-full max-w-sm bg-[#21163A] border border-[#392858] rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 id="preferred-name-title" className="text-base font-bold text-white mb-3">
              What should Sunny call you?
            </h3>
            <AppInput
              label="Preferred name"
              placeholder="e.g. Alex, Sam, Sunshine"
              value={newName}
              onChangeText={setNewName}
              maxLength={60}
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

      {profileModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="w-full max-w-sm bg-[#21163A] border border-[#392858] rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 id="profile-title" className="text-base font-bold text-white mb-2">Account profile</h3>
            <p className="text-xs text-[#C6B8E5] mb-4">
              {user
                ? `Signed in as ${user.email}. Only your display name can be changed here.`
                : 'Your guest name is saved with preferences on this device; it is not a cloud account.'}
            </p>
            <AppInput
              label="Display name"
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Your name"
              maxLength={60}
              autoFocus
              disabled={isSavingProfile}
            />
            {profileError && <p role="alert" className="mb-3 text-sm text-[#FFD0D8]">{profileError}</p>}
            <div className="flex flex-col gap-2 mt-4">
              <AppButton
                title="Save profile"
                onPress={handleSaveProfile}
                variant="primary"
                fullWidth
                loading={isSavingProfile}
              />
              <AppButton
                title="Cancel"
                onPress={() => setProfileModalVisible(false)}
                variant="ghost"
                fullWidth
                disabled={isSavingProfile}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
