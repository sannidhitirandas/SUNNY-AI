import React, { useState } from 'react';
import { privacyService } from '@/services/privacyService';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import { useMemories } from '@/context/MemoryContext';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import {
  ArrowLeft,
  ShieldCheck,
  Heart,
  Lock,
  Trash2,
  Download,
  MessageSquareX,
  RefreshCw,
  Code,
  X,
} from 'lucide-react';

interface PrivacyScreenProps {
  onBack: () => void;
  onResetToOnboarding: () => void;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onBack, onResetToOnboarding }) => {
  const { preferences, toggleMemory, resetOnboarding } = usePreferences();
  const { clearChat } = useChat();
  const { clearAllMemories } = useMemories();
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const highlights = privacyService.getPrivacyHighlights();

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

  const handleExport = async () => {
    const jsonString = await privacyService.exportAllUserData();
    setExportNotice(jsonString);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear Conversation History?\nAll current chat messages will be permanently deleted from your Sunny account.')) {
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

  const handleDeleteEverything = async () => {
    if (window.confirm('Permanently Delete Everything?\nThis will wipe all preferences, chat messages, and saved memories, resetting the app to fresh onboarding.')) {
      await privacyService.deleteAccountAndAllData();
      await clearChat();
      await clearAllMemories();
      await resetOnboarding();
      onResetToOnboarding();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Top Bar */}
      <div className="flex items-center gap-3 py-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg bg-[#21163A] border border-[#392858] text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
          aria-label="Back to settings"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">Privacy & Data Controls</h1>
      </div>

      {/* Intro Card */}
      <AppCard className="p-5 mb-5 border-[#FFD84D]/25 bg-[#17102C]">
        <h2 className="text-base font-bold text-white mb-1.5">Your Privacy Comes First</h2>
        <p className="text-xs text-[#C6B8E5] leading-relaxed">
          Sunny is designed for intimate, reflective, personal thoughts. We believe you should have complete transparency and instant control over what is remembered.
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
          subtitle="When off, no personal memories are created or recalled"
          icon={<ShieldCheck size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={preferences.memoryEnabled}
          onSwitchChange={toggleMemory}
        />
      </SettingsSection>

      {/* Data Actions */}
      <SettingsSection title="DATA ACTIONS">
        <SettingsRow
          title="Export My Complete Data"
          subtitle="View or save the data associated with your Sunny account"
          icon={<Download size={16} className="text-[#A8D9A0]" />}
          onPress={handleExport}
        />
        <SettingsRow
          title="Clear Chat Messages"
          subtitle="Wipe conversation without deleting memories"
          icon={<MessageSquareX size={16} className="text-[#FF8D9A]" />}
          destructive
          onPress={handleClearHistory}
        />
        <SettingsRow
          title="Wipe Saved Memories"
          subtitle="Remove all personal notes and topics"
          icon={<Trash2 size={16} className="text-[#FF8D9A]" />}
          destructive
          onPress={handleClearMemories}
        />
        <SettingsRow
          title="Reset Everything & Start Over"
          subtitle="Permanently delete your account and associated cloud data"
          icon={<RefreshCw size={16} className="text-[#FF8D9A]" />}
          destructive
          onPress={handleDeleteEverything}
        />
      </SettingsSection>

      {deleteError && (
        <div className="mt-4 p-3 rounded-2xl bg-[#3A1722] border border-[#7A3045] text-sm text-[#FFD0D8]" role="alert">
          {deleteError}
        </div>
      )}

      <div className="mt-4">
        <AppButton
          title="Export JSON Data Package"
          onPress={handleExport}
          variant="secondary"
          fullWidth
          icon={<Code size={18} className="text-[#FFD84D]" />}
        />
      </div>

      {/* Data Export Notice Modal */}
      {exportNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#21163A] border border-[#392858] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#392858]">
              <h3 className="text-base font-bold text-[#FFD84D]">Export Package (JSON)</h3>
              <button
                type="button"
                onClick={() => setExportNotice(null)}
                className="text-[#9B8AB9] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <pre className="p-3 bg-[#17102C] border border-[#392858] rounded-xl text-[11px] text-[#A8D9A0] font-mono max-h-48 overflow-y-auto mb-4 select-all">
              {exportNotice}
            </pre>
            <div className="flex items-center gap-2">
              <AppButton
                title="Copy to Clipboard"
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
