import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_WIDTH < 375;

const COLORS = {
  background: '#1E1F25',
  text: '#E5E7EB',
  card: '#2A2B31',
  border: '#3C3C43',
  primary: '#E63946',
  primaryText: '#FFFFFF',
  muted: '#9CA3AF',
};

const STORAGE_KEY = 'notes';

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // note or null
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const saved = raw ? JSON.parse(raw) : [];
        setNotes(Array.isArray(saved) ? saved : []);
      } catch {}
    })();
  }, []);

  const saveAll = async (next) => {
    setNotes(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const startAdd = () => {
    setEditing(null);
    setTitle('');
    setBody('');
    setOpen(true);
  };

  const startEdit = (note) => {
    setEditing(note);
    setTitle(note.title);
    setBody(note.body);
    setOpen(true);
  };

  const onSave = () => {
    if (!title.trim() && !body.trim()) {
      Alert.alert('Empty note', 'Please write a title or body.');
      return;
    }
    const ts = Date.now();
    if (editing) {
      const updated = notes.map((n) => (n.id === editing.id ? { ...n, title, body, updatedAt: ts } : n));
      saveAll(updated);
    } else {
      const newNote = { id: ts, title, body, updatedAt: ts };
      saveAll([newNote, ...notes]);
    }
    setOpen(false);
  };

  const onDelete = (note) => {
    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveAll(notes.filter((n) => n.id !== note.id)) },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => startEdit(item)} 
      onLongPress={() => onDelete(item)} 
      activeOpacity={0.85}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title || 'Untitled Note'}
          </Text>
          <Text style={styles.cardBody} numberOfLines={3}>
            {item.body || 'No content'}
          </Text>
          <Text style={styles.cardDate}>
            {new Date(item.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.iconsCol}>
          <TouchableOpacity onPress={() => startEdit(item)} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="create-outline" size={isTablet ? 22 : 20} color="#93c5fd" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="trash-outline" size={isTablet ? 22 : 20} color="#fca5a5" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const emptyComponent = useMemo(() => (
    <View style={styles.emptyWrap}>
      <Ionicons name="document-text-outline" size={isTablet ? 80 : 60} color={COLORS.muted} />
      <Text style={styles.emptyTitle}>No notes yet</Text>
      <Text style={styles.emptyText}>Tap the + button to create your first note</Text>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notes</Text>
            <Text style={styles.headerSubtitle}>
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </Text>
          </View>
        </View>

        {/* Notes List */}
        <FlatList
          data={notes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={emptyComponent}
          showsVerticalScrollIndicator={false}
        />

        {/* FAB Button */}
        <TouchableOpacity style={styles.fab} onPress={startAdd} activeOpacity={0.9}>
          <Ionicons name="add" size={isTablet ? 32 : 28} color={COLORS.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Add/Edit Note Modal */}
      <Modal 
        transparent 
        visible={open} 
        animationType="slide" 
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity 
                onPress={() => setOpen(false)} 
                style={styles.closeButton}
                hitSlop={10}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Title"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              autoFocus={!editing}
            />
            <TextInput
              placeholder="Write your note..."
              placeholderTextColor={COLORS.muted}
              style={[styles.input, styles.textarea]}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnGhost]} 
                onPress={() => setOpen(false)}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={onSave}>
                <Text style={styles.btnText}>
                  {editing ? 'Save' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  container: { 
    flex: 1 
  },
  header: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: isSmallDevice ? 40 : isTablet ? 60 : 50,
    paddingBottom: isTablet ? 20 : 16,
  },
  headerContent: {
    paddingHorizontal: isTablet ? 24 : 20,
  },
  headerTitle: { 
    color: COLORS.text, 
    fontSize: isTablet ? 32 : 28, 
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: { 
    color: COLORS.muted, 
    fontSize: isTablet ? 16 : 14,
  },
  listContent: {
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 20 : 16,
    paddingBottom: isTablet ? 120 : 100,
    flexGrow: 1,
  },
  separator: {
    height: isTablet ? 16 : 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: isTablet ? 16 : 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: isTablet ? 20 : 16,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: { 
    color: COLORS.text, 
    fontSize: isTablet ? 18 : 16, 
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: { 
    color: COLORS.text, 
    opacity: 0.9,
    fontSize: isTablet ? 15 : 14,
    lineHeight: isTablet ? 22 : 20,
    marginBottom: 8,
  },
  cardDate: {
    color: COLORS.muted,
    fontSize: isTablet ? 13 : 12,
    opacity: 0.7,
  },
  iconsCol: { 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: isTablet ? 16 : 12,
  },
  iconBtn: { 
    padding: 6,
  },
  emptyWrap: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: isTablet ? 100 : 80,
    paddingHorizontal: 24,
  },
  emptyTitle: { 
    color: COLORS.text, 
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: { 
    color: COLORS.muted, 
    fontSize: isTablet ? 16 : 14,
    textAlign: 'center',
    lineHeight: isTablet ? 22 : 20,
  },
  fab: {
    position: 'absolute',
    right: isTablet ? 32 : 24,
    bottom: isTablet ? 32 : 24,
    width: isTablet ? 64 : 56,
    height: isTablet ? 64 : 56,
    borderRadius: isTablet ? 32 : 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    paddingHorizontal: isTablet ? 40 : 16,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : 20,
    maxHeight: isTablet ? '80%' : '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isTablet ? 20 : 16,
  },
  modalTitle: { 
    color: COLORS.text, 
    fontSize: isTablet ? 24 : 20, 
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: '#1F2127',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: isTablet ? 12 : 10,
    padding: isTablet ? 16 : 12,
    fontSize: isTablet ? 16 : 14,
    marginBottom: isTablet ? 16 : 12,
  },
  textarea: { 
    minHeight: isTablet ? 160 : 120,
    textAlignVertical: 'top',
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: isTablet ? 16 : 12,
    marginTop: 8,
  },
  btn: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: isTablet ? 14 : 12, 
    paddingHorizontal: isTablet ? 20 : 16, 
    borderRadius: isTablet ? 12 : 10,
    minWidth: 80,
    alignItems: 'center',
  },
  btnText: { 
    color: COLORS.primaryText, 
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
  },
  btnGhost: { 
    backgroundColor: 'transparent', 
    borderWidth: 1, 
    borderColor: COLORS.border,
  },
  btnGhostText: { 
    color: COLORS.text, 
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
  },
});