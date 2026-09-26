import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import { StarterIntent } from '@/types/chat';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { Badge } from '@/components/ui/Badge';
import { GreetingCard } from '@/components/home/GreetingCard';
import { ConversationStarter } from '@/components/home/ConversationStarter';
import { DailySunshineCard } from '@/components/home/DailySunshineCard';
import { RecentConversations } from '@/components/home/RecentConversations';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { messages, startConversationWithIntent } = useChat();

  const displayName = preferences.preferredName || user?.displayName || 'sunshine';

  const handleTalkToSunny = () => {
    router.push('/(tabs)/chat');
  };

  const handleSelectIntent = async (intent: StarterIntent) => {
    await startConversationWithIntent(intent);
    router.push('/(tabs)/chat');
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top App Header */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <SunnyLogo size="small" />
            <View style={styles.headerTitles}>
              <View style={styles.titleRow}>
                <Text style={styles.brandTitle}>Sunny</Text>
                <Text style={styles.sunEmoji}>☀️</Text>
              </View>
              <Text style={styles.brandSubtitle}>Your little corner of sunshine</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Badge label="Demo mode" variant="yellow" style={styles.badge} />
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={styles.settingsIconBtn}
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

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
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitles: {
    marginLeft: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  sunEmoji: {
    fontSize: 16,
    marginLeft: 4,
  },
  brandSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    marginRight: Spacing.xs,
  },
  settingsIconBtn: {
    padding: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.elevatedCard,
  },
});
