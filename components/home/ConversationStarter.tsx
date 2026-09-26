import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StarterIntent } from '@/types/chat';
import { AppCard } from '../ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ConversationStarterProps {
  onSelectIntent: (intent: StarterIntent) => void;
}

interface StarterOption {
  intent: StarterIntent;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const STARTER_OPTIONS: StarterOption[] = [
  {
    intent: 'listen',
    title: 'I need someone to listen',
    description: "Let's talk about what's on your mind.",
    iconName: 'heart',
    iconColor: '#FF8D9A',
  },
  {
    intent: 'laugh',
    title: 'Distract me and make me laugh',
    description: "Let's find something fun to talk about.",
    iconName: 'happy',
    iconColor: Colors.sunshineYellow,
  },
  {
    intent: 'encourage',
    title: 'I need a little encouragement',
    description: "Let's take things one step at a time.",
    iconName: 'sunny',
    iconColor: Colors.warmGold,
  },
  {
    intent: 'anything',
    title: "Let's talk about anything",
    description: 'Random thoughts, everyday stories, anything goes.',
    iconName: 'chatbubbles',
    iconColor: '#A8D9A0',
  },
];

export const ConversationStarter: React.FC<ConversationStarterProps> = ({ onSelectIntent }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>What's the vibe today?</Text>
      <View style={styles.list}>
        {STARTER_OPTIONS.map((item) => (
          <AppCard
            key={item.intent}
            onPress={() => onSelectIntent(item.intent)}
            style={styles.card}
            padding={Spacing.md}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: `${item.iconColor}18` }]}>
                <Ionicons name={item.iconName} size={22} color={item.iconColor} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          </AppCard>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  sectionHeader: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.xs,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
