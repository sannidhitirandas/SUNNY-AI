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
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import { useMemories } from '@/context/MemoryContext';
import { privacyService } from '@/services/privacyService';
import { PersonalityTone } from '@/types/user';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { Badge } from '@/components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
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

  const [toneModalVisible, setToneModalVisible] = useState<boolean>(false);
  const [nameModalVisible, setNameModalVisible] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>(preferences.preferredName || '');

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

  const handleClearChatHistory = () => {
    Alert.alert(
      'Clear Conversation History?',
      'This will remove all current chat messages. Saved memories will stay intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Chat',
          style: 'destructive',
          onPress: async () => {
            await clearChat();
            Alert.alert('Cleared', 'Your conversation history has been cleared.');
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    const dataJson = await privacyService.exportAllUserData();
    Alert.alert(
      'Data Export Ready',
      `Your local data was prepared:\n\n${dataJson.slice(0, 240)}...\n\n(In production, this downloads or emails your full JSON data package).`
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account & All Data?',
      'This will permanently wipe all local chat history, memories, and preferences. You will be returned to the initial onboarding screen.',
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your Sunny companion experience</Text>
          <Badge label="Prototype Demo Mode" variant="yellow" style={styles.badge} />
        </View>

        {/* Section A — Your Sunny */}
        <SettingsSection title="YOUR SUNNY">
          <SettingsRow
            title="Conversation Personality"
            subtitle="Change how Sunny responds to you"
            iconName="sparkles"
            rightText={
              preferences.preferredTone.charAt(0).toUpperCase() +
              preferences.preferredTone.slice(1)
            }
            onPress={() => setToneModalVisible(true)}
          />
          <SettingsRow
            title="Preferred Name"
            subtitle="What Sunny calls you"
            iconName="person"
            rightText={preferences.preferredName || user?.displayName || 'Set Name'}
            onPress={() => {
              setNewName(preferences.preferredName || user?.displayName || '');
              setNameModalVisible(true);
            }}
          />
          <SettingsRow
            title="Theme"
            subtitle="Dark Purple & Sunshine Yellow"
            iconName="color-palette"
            rightText="Active"
            showChevron={false}
          />
        </SettingsSection>

        {/* Section B — Memory */}
        <SettingsSection title="MEMORY & PERSISTENCE">
          <SettingsRow
            title="Enable Memory"
            subtitle="Allow Sunny to remember approved details"
            iconName="bookmark"
            isSwitch
            switchValue={preferences.memoryEnabled}
            onSwitchChange={toggleMemory}
          />
          <SettingsRow
            title="Manage Saved Memories"
            subtitle="View, edit, or delete personal notes"
            iconName="list"
            onPress={() => router.push('/(tabs)/memories')}
          />
          <SettingsRow
            title="Memory Privacy Explanation"
            subtitle="How memory works with your consent"
            iconName="shield-checkmark"
            onPress={() => router.push('/settings/privacy')}
          />
        </SettingsSection>

        {/* Section C — Notifications */}
        <SettingsSection title="NOTIFICATIONS">
          <SettingsRow
            title="Notification Preferences"
            subtitle="Configure morning, afternoon & evening check-ins"
            iconName="notifications"
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingsRow
            title="Quiet Hours"
            subtitle="10:00 PM – 8:00 AM local time"
            iconName="moon"
            rightText="Active"
            onPress={() => router.push('/settings/notifications')}
          />
        </SettingsSection>

        {/* Section D — Privacy and security */}
        <SettingsSection title="PRIVACY & SECURITY">
          <SettingsRow
            title="Privacy & Data Controls"
            subtitle="Review what is stored and managed locally"
            iconName="lock-closed"
            onPress={() => router.push('/settings/privacy')}
          />
          <SettingsRow
            title="Export My Data"
            subtitle="Download your preferences, notes, and chats"
            iconName="download-outline"
            onPress={handleExportData}
          />
          <SettingsRow
            title="Clear Chat History"
            subtitle="Erase current chat session messages"
            iconName="chatbubble-ellipses-outline"
            destructive
            onPress={handleClearChatHistory}
          />
        </SettingsSection>

        {/* Section E — Help and safety */}
        <SettingsSection title="HELP & SAFETY">
          <SettingsRow
            title="Help & Emotional Safety"
            subtitle="Crisis hotlines, support resources & boundaries"
            iconName="heart-circle"
            iconColor="#FF8D9A"
            onPress={() => router.push('/settings/safety')}
          />
          <SettingsRow
            title="About Sunny"
            subtitle="Mission, technology stack, and app version"
            iconName="information-circle"
            onPress={() => router.push('/settings/about')}
          />
        </SettingsSection>

        {/* Section F — Account */}
        <SettingsSection title="ACCOUNT">
          <SettingsRow
            title="Account Profile"
            subtitle={user?.email || 'Demo Guest Account'}
            iconName="person-circle"
            showChevron={false}
          />
          <SettingsRow
            title="Replay Onboarding"
            subtitle="Experience the introductory flow again"
            iconName="refresh-circle"
            onPress={async () => {
              await resetOnboarding();
              router.push('/onboarding');
            }}
          />
          <SettingsRow
            title="Sign Out"
            iconName="log-out"
            onPress={handleSignOut}
          />
          <SettingsRow
            title="Delete Account & Data"
            subtitle="Permanently erase all data on this device"
            iconName="trash"
            destructive
            onPress={handleDeleteAccount}
          />
        </SettingsSection>
      </ScrollView>

      {/* Tone Picker Modal */}
      <Modal visible={toneModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setToneModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Sunny's Personality</Text>
            {TONES.map((item) => {
              const isSelected = preferences.preferredTone === item.tone;
              return (
                <TouchableOpacity
                  key={item.tone}
                  onPress={async () => {
                    await updateTone(item.tone);
                    setToneModalVisible(false);
                  }}
                  style={[styles.toneOption, isSelected && styles.toneOptionSelected]}
                >
                  <View style={styles.toneTextCol}>
                    <Text style={[styles.toneLabel, isSelected && styles.toneLabelSelected]}>
                      {item.label}
                    </Text>
                    <Text style={styles.toneDesc}>{item.desc}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.sunshineYellow} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Name Modal */}
      <Modal visible={nameModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNameModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>What should Sunny call you?</Text>
            <AppInput
              placeholder="e.g. Alex, Sam, Sunshine"
              value={newName}
              onChangeText={setNewName}
              containerStyle={{ marginTop: Spacing.sm }}
            />
            <View style={styles.modalButtons}>
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
                style={{ marginTop: 4 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: Spacing.huge,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.elevatedCard,
  },
  toneOptionSelected: {
    borderColor: Colors.sunshineYellow,
    backgroundColor: Colors.yellowSubtle,
  },
  toneTextCol: {
    flex: 1,
  },
  toneLabel: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toneLabelSelected: {
    color: Colors.sunshineYellow,
  },
  toneDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalButtons: {
    marginTop: Spacing.md,
  },
});
