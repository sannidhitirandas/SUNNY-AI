import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useMemories } from '@/context/MemoryContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Memory, MemoryCategory } from '@/types/memory';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { MemoryModal } from '@/components/memories/MemoryModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppButton } from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';

const FILTER_CATEGORIES: { label: string; value: MemoryCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Events', value: 'events' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Preferences', value: 'preferences' },
];

export default function MemoriesScreen() {
  const { preferences, toggleMemory } = usePreferences();
  const {
    memories,
    filteredMemories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    addMemory,
    updateMemory,
    deleteMemory,
    resetDemoMemories,
  } = useMemories();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const handleOpenAdd = () => {
    setEditingMemory(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setModalVisible(true);
  };

  const handleSaveModal = async (data: {
    title: string;
    content: string;
    category: MemoryCategory;
    userConfirmed: boolean;
  }) => {
    if (editingMemory) {
      await updateMemory(editingMemory.id, data);
    } else {
      await addMemory(data);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your little memories 💛</Text>
          <TouchableOpacity
            onPress={handleOpenAdd}
            style={styles.addButton}
            accessibilityLabel="Add new memory"
          >
            <Ionicons name="add" size={20} color={Colors.textDark} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          The little things Sunny can remember for you, kept safe with your consent.
        </Text>
      </View>

      {!preferences.memoryEnabled ? (
        <View style={styles.disabledContainer}>
          <EmptyState
            title="Memory is turned off"
            description="Sunny is currently not saving or recalling any personal memories. You can turn it back on anytime."
            actionTitle="Enable Memory"
            onAction={() => toggleMemory(true)}
            icon={<Ionicons name="lock-closed-outline" size={40} color={Colors.sunshineYellow} />}
          />
        </View>
      ) : (
        <>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              placeholder="Search memories..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Filter Chips */}
          <View style={styles.filterScroll}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FILTER_CATEGORIES}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.filterContent}
              renderItem={({ item }) => {
                const isSelected = selectedCategory === item.value;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(item.value)}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Memory List */}
          <FlatList
            data={filteredMemories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemoryCard
                memory={item}
                onEdit={handleOpenEdit}
                onDelete={deleteMemory}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.countRow}>
                <Text style={styles.countText}>
                  {filteredMemories.length} saved {filteredMemories.length === 1 ? 'memory' : 'memories'}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <EmptyState
                title={searchQuery ? 'No matching memories' : 'No memories saved yet'}
                description={
                  searchQuery
                    ? `No memories matched "${searchQuery}". Try a different search term.`
                    : 'Tap "Add" in the top corner to save your first memory, or restore sample demo memories.'
                }
                actionTitle={searchQuery ? undefined : 'Restore Sample Memories'}
                onAction={searchQuery ? undefined : resetDemoMemories}
              />
            }
          />
        </>
      )}

      {/* Add / Edit Memory Modal */}
      <MemoryModal
        visible={modalVisible}
        editingMemory={editingMemory}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sunshineYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  addButtonText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    marginLeft: 2,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
  },
  filterScroll: {
    marginVertical: Spacing.sm,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.yellowSubtle,
    borderColor: Colors.sunshineYellow,
  },
  filterChipText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: Colors.sunshineYellow,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: Spacing.xxl,
  },
  countRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  countText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
