import React, { useState } from 'react';
import { privacyService } from '@/services/privacyService';
import { usePreferences } from '@/context/PreferencesContext';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useMemories } from '@/context/MemoryContext';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import {
  ArrowLeft,
  ShieldCheck,
  Heart,
  Lock,
  Trash2,
  MessageSquareX,
  RefreshCw,
} from 'lucide-react';

interface PrivacyScreenProps {
  onBack: () => void;
  onResetToOnboarding: () => void;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onBack, onResetToOnboarding }) => {
  const { user } = useAuth();
  const { preferences, toggleMemory, resetAfterAccountDeletion } = usePreferences();
  const { clearChat } = useChat();
  const { clearAllMemories } = useMemories();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const highlights = privacyService.getPrivacyHighlights(Boolean(user));

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck size={20} className="text-[#FFD84D]" />;
      case 'Heart':
        return <Heart size={20} className="text-[#FF8D9A]" />;
      case 'Lock':
        return <Lock size={20} className="text-[#FFD84D]" />;
      case 'Trash2':
        return <Trash2 size={20} className="text-[#FF8D9A]" />;
      default:
        return <ShieldCheck size={20} className="text-[#FFD84D]" />;
    }
  };

  const handleClearHistory = async () => {
    const location = user ? 'your Supabase account' : 'this device';
    if (window.confirm(`Clear Conversation History?\nChat messages stored in ${location} will be permanently deleted. Saved memories will stay intact.`)) {
      await clearChat();
      alert('Chat history cleared.');
    }
  };

  const handleClearMemories = async () => {
    if (window.confirm('Clear All Saved Memories?\nAll memory entries will be permanently removed. Sunny will no longer remember these details.')) {
      await clearAllMemories();
      alert('All memories cleared.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await privacyService.deleteAccountAndAllData();
      await resetAfterAccountDeletion();
      onResetToOnboarding();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Sunny could not delete this account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Top Bar */}
      <div className="flex items-center gap-3 py-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#21163A] border border-[#392858] text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
          aria-label="Back to settings"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">Privacy & Data Controls</h1>
      </div>

      {/* Intro Card */}
      <AppCard className="p-5 mb-5 border-[#FFD84D]/25 bg-[#17102C]">
        <h2 className="text-base font-bold text-white mb-1.5">Where Sunny data is stored</h2>
        <p className="text-xs text-[#C6B8E5] leading-relaxed">
          {user
            ? 'You are signed in. Chat history, memories, and preferences are associated with your Supabase account.'
            : 'You are using Sunny as a guest. Chat history, memories, and preferences are saved on this device.'}
        </p>
      </AppCard>

      {/* Highlights */}
      <div className="space-y-3 mb-6">
        {highlights.map((h, i) => (
          <div key={i} className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#21163A] border border-[#392858]">
            <div className="w-9 h-9 rounded-xl bg-[#302149] flex items-center justify-center shrink-0 mt-0.5">
              {getIcon(h.icon)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{h.title}</h3>
              <p className="text-xs text-[#C6B8E5] leading-relaxed mt-0.5">{h.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Memory Consent */}
      <SettingsSection title="MEMORY CONSENT">
        <SettingsRow
          title="Sunny Memory Active"
          subtitle={`Memory is ${preferences.memoryEnabled ? 'on' : 'off'} for this ${user ? 'account' : 'device'}`}
          icon={<ShieldCheck size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={preferences.memoryEnabled}
          onSwitchChange={toggleMemory}
        />
      </SettingsSection>

      {/* Data Actions */}
      <SettingsSection title="DATA ACTIONS">
        <SettingsRow
          title="Clear Chat Messages"
          subtitle={user ? 'Delete chat history from your Supabase account' : 'Delete guest chat history from this device'}
          icon={<MessageSquareX size={16} className="text-[#FF8D9A]" />}
          destructive
          onPress={handleClearHistory}
        />
        <SettingsRow
          title="Wipe Saved Memories"
          subtitle={user ? 'Remove memories stored with your Supabase account' : 'Remove guest memories stored on this device'}
          icon={<Trash2 size={16} className="text-[#FF8D9A]" />}
          destructive
          onPress={handleClearMemories}
        />
        {user ? (
          <SettingsRow
            title="Delete Account & Cloud Data"
            subtitle="Permanently delete your Supabase account and associated cloud rows"
            icon={<RefreshCw size={16} className="text-[#FF8D9A]" />}
            destructive
            onPress={() => {
              setDeleteConfirmation('');
              setDeleteError(null);
              setDeleteDialogVisible(true);
            }}
          />
        ) : (
          <p className="px-4 py-3 text-xs text-[#C6B8E5]">
            Guest data is not linked to an account. Clear guest chats and memories above; guest preferences remain on this device.
          </p>
        )}
      </SettingsSection>

      {deleteDialogVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            className="w-full max-w-md bg-[#21163A] border border-[#FF8D9A]/40 rounded-2xl p-5 shadow-2xl"
          >
            <h2 id="delete-account-title" className="text-lg font-bold text-[#FF8D9A]">Delete your Sunny account?</h2>
            <p id="delete-account-description" className="mt-2 text-sm text-[#C6B8E5] leading-relaxed">
              This permanently deletes your Supabase Auth account and its cloud chat, memory, and preference records. Sunny will sign you out and clear account-associated local caches. Separate guest-only data is kept.
            </p>
            <AppInput
              label="Type DELETE to confirm"
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="DELETE"
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
              disabled={isDeleting}
              containerStyle="mt-4"
            />
            {deleteError && <p role="alert" className="mb-3 text-sm text-[#FFD0D8]">{deleteError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AppButton
                title="Cancel"
                onPress={() => setDeleteDialogVisible(false)}
                variant="ghost"
                disabled={isDeleting}
              />
              <AppButton
                title="Delete account permanently"
                onPress={handleDeleteAccount}
                variant="danger"
                loading={isDeleting}
                disabled={deleteConfirmation !== 'DELETE'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
