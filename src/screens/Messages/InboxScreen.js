import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMessages } from '../../context/MessagesContext';

const COLORS = {
  background: '#1E1F25',
  card: '#2A2B31',
  text: '#E5E7EB',
  muted: '#9CA3AF',
};

export default function InboxScreen({ navigation }) {
  const { threads, createContact, loading } = useMessages();

  // We only show a single conversation for the inmate's linked family.
  // Use the first existing thread from backend, or create a local
  // placeholder thread named "Family" when the user taps into chat.
  const familyThread = useMemo(() => {
    if (threads && threads.length > 0) {
      return threads[0];
    }
    return null;
  }, [threads]);

  // Ensure there is always at least one "Family" thread available.
  // If no threads exist yet (fresh install / first use), create a
  // local placeholder contact so the inmate can immediately start
  // messaging. The first actual message will promote this thread
  // to a real backend thread and send it to the admin panel.
  useEffect(() => {
    if (!familyThread && !loading) {
      createContact('Family', '', 'Family');
    }
  }, [familyThread, createContact, loading]);

  const handleOpenThread = () => {
    if (!familyThread) return;
    navigation.navigate('Thread', { threadId: familyThread.id });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Secure messaging with your family</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#6366F1" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : !familyThread ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No family linked</Text>
            <Text style={styles.emptyText}>
              Once your account is linked to a family contact, you will see their details here.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.familyCard}
            activeOpacity={0.8}
            onPress={handleOpenThread}
          >
            <View style={styles.familyAvatar}>
              <Text style={styles.familyAvatarText}>
                {(familyThread.contactName || 'F').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.familyInfo}>
              <Text style={styles.familyLabel}>Family</Text>
              <Text style={styles.familyName}>{familyThread.contactName || 'Family'}</Text>
              <Text style={styles.familyHint}>Tap to open inbox and send a message</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.text,
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  familyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  familyAvatarText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  familyInfo: {
    flex: 1,
  },
  familyLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  familyName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  familyHint: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 12,
  },
});