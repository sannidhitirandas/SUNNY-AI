import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { privacyService } from '@/services/privacyService';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import { useMemories } from '@/context/MemoryContext';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();
  const { preferences, toggleMemory, resetOnboarding } = usePreferences();
  const { clearChat } = useChat();
  const { clearAllMemories } = useMemories();
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const highlights = privacyService.getPrivacyHighlights();

  const handleExport = async () => {
    setExportLoading(true);
    const jsonString = await privacyService.exportAllUserData();
    setExportLoading(false);

    Alert.alert(
      'Export Complete',
      `Your complete local data has been prepared.\n\nSummary:\n• App: Sunny\n• Payload Size: ${jsonString.length} bytes\n• Location: Local device storage only`,
      [{ text: 'Close' }]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Conversation History?',
      'All current chat messages will be deleted from your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            await clearChat();
            Alert.alert('Success', 'Chat history cleared.');
          },
        },
      ]
    );
  };

  const handleClearMemories = () => {
    Alert.alert(
      'Clear All Saved Memories?',
      'All memory entries will be permanently removed. Sunny will no longer remember these details.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Memories',
          style: 'destructive',
          onPress: async () => {
            await clearAllMemories();
            Alert.alert('Success', 'All memories cleared.');
          },
        },
      ]
    );
  };

  const handleDeleteEverything = () => {
    Alert.alert(
      'Permanently Delete Everything?',
      'This will wipe all preferences, chat messages, and saved memories, resetting the app to fresh onboarding.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await privacyService.deleteAccountAndAllData();
            await clearChat();
            await clearAllMemories();
            await resetOnboarding();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Intro Card */}
        <AppCard style={styles.introCard} padding={Spacing.lg}>
          <Text style={styles.introTitle}>Your Privacy Comes First</Text>
          <Text style={styles.introText}>
            Sunny is designed for intimate, reflective, personal thoughts. We believe you should have complete transparency and instant control over what is remembered.
          </Text>
        </AppCard>

        {/* Highlights */}
        <View style={styles.highlightsContainer}>
          {highlights.map((h, i) => (
            <View key={i} style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <Ionicons name={h.icon as any} size={20} color={Colors.sunshineYellow} />
              </View>
              <View style={styles.highlightTextCol}>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                <Text style={styles.highlightDesc}>{h.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Memory Consent */}
        <SettingsSection title="MEMORY CONSENT">
          <SettingsRow
            title="Sunny Memory Active"
            subtitle="When off, no personal memories are created or recalled"
            iconName="bookmark"
            isSwitch
            switchValue={preferences.memoryEnabled}
            onSwitchChange={toggleMemory}
          />
        </SettingsSection>

        {/* Export & Deletion */}
        <SettingsSection title="DATA ACTIONS">
          <SettingsRow
            title="Export My Complete Data"
            subtitle="View or save your local dataset in standard JSON"
            iconName="download-outline"
            onPress={handleExport}
          />
          <SettingsRow
            title="Clear Chat Messages"
            subtitle="Wipe conversation without deleting memories"
            iconName="chatbubble-ellipses-outline"
            destructive
            onPress={handleClearHistory}
          />
          <SettingsRow
            title="Wipe Saved Memories"
            subtitle="Remove all personal notes and topics"
            iconName="trash-bin-outline"
            destructive
            onPress={handleClearMemories}
          />
          <SettingsRow
            title="Reset Everything & Start Over"
            subtitle="Clear all storage and return to onboarding"
            iconName="refresh"
            destructive
            onPress={handleDeleteEverything}
          />
        </SettingsSection>

        {/* Export Button */}
        <View style={styles.exportBtnContainer}>
          <AppButton
            title="Export JSON Data Package"
            onPress={handleExport}
            loading={exportLoading}
            variant="secondary"
            fullWidth
            icon={<Ionicons name="code-download-outline" size={18} color={Colors.sunshineYellow} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  introCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderColor: 'rgba(255, 216, 77, 0.25)',
  },
  introTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  introText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  highlightsContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  highlightTextCol: {
    flex: 1,
  },
  highlightTitle: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  highlightDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  exportBtnContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
});
