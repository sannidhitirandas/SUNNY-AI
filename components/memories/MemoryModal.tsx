import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Memory, MemoryCategory } from '@/types/memory';
import { AppInput } from '../ui/AppInput';
import { AppButton } from '../ui/AppButton';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface MemoryModalProps {
  visible: boolean;
  editingMemory?: Memory | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    category: MemoryCategory;
    userConfirmed: boolean;
  }) => void;
}

const CATEGORIES: { label: string; value: MemoryCategory }[] = [
  { label: 'Personal', value: 'personal' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Events', value: 'events' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Preferences', value: 'preferences' },
];

export const MemoryModal: React.FC<MemoryModalProps> = ({
  visible,
  editingMemory,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<MemoryCategory>('personal');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title);
      setContent(editingMemory.content);
      setCategory(editingMemory.category);
    } else {
      setTitle('');
      setContent('');
      setCategory('personal');
    }
    setError('');
  }, [editingMemory, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please provide a title for this memory.');
      return;
    }
    if (!content.trim()) {
      setError('Please provide details for this memory.');
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      userConfirmed: true,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editingMemory ? 'Edit Memory' : 'Add New Memory'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.explainer}>
              Sunny only stores memories you explicitly confirm. You can update or delete them whenever you wish.
            </Text>

            <AppInput
              label="Memory Title"
              placeholder="e.g. Favorite book, sister's birthday, morning routine"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError('');
              }}
            />

            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setCategory(cat.value)}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppInput
              label="Details / Reflection"
              placeholder="What would you like Sunny to remember?"
              value={content}
              onChangeText={(text) => {
                setContent(text);
                if (error) setError('');
              }}
              multiline
              numberOfLines={4}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <AppButton
                title={editingMemory ? 'Save Changes' : 'Save Memory'}
                onPress={handleSave}
                variant="primary"
                fullWidth
              />
              <AppButton
                title="Cancel"
                onPress={onClose}
                variant="ghost"
                fullWidth
                style={styles.cancelBtn}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.xl,
  },
  explainer: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  categoryLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.elevatedCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.yellowSubtle,
    borderColor: Colors.sunshineYellow,
  },
  categoryChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: Colors.sunshineYellow,
    fontWeight: '700',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  actions: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  cancelBtn: {
    marginTop: 4,
  },
});
