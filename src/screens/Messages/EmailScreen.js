import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = 'https://freedom-tech.onrender.com';

const COLORS = {
  background: '#0F0F23',
  card: '#1A1A2E',
  border: '#2D3047',
  text: '#E8EAED',
  muted: '#94A3B8',
  primary: '#6366F1',
  accent: '#8B5CF6',
  success: '#10B981',
  danger: '#EF4444',
};

const MOCK_CONTACTS = [
  { id: 'c1', name: 'Facility Staff', role: 'Administration', color: '#6366F1' },
  { id: 'c2', name: 'Case Manager', role: 'Support Team', color: '#8B5CF6' },
  { id: 'c3', name: 'Program Coordinator', role: 'Education', color: '#10B981' },
  { id: 'c4', name: 'Counselor', role: 'Mental Health', color: '#F59E0B' },
];

// Helper to format preview text for thread list
function preview(body) {
  if (!body) return '';
  const trimmed = body.trim();
  if (trimmed.length <= 80) return trimmed;
  return trimmed.slice(0, 77) + '...';
}

export default function EmailScreen() {
  const { accessToken, user } = useAuth();

  // Backend data
  const [threads, setThreads] = useState([]); // raw thread objects from API
  const [selectedThreadMessages, setSelectedThreadMessages] = useState([]); // messages for open thread

  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [composeVisible, setComposeVisible] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState(MOCK_CONTACTS[0]?.id ?? '');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accessToken) {
      loadThreadsFromApi();
    }

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [accessToken]);

  const loadThreadsFromApi = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/messages/threads`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        let message = 'Failed to load messages.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {
          // ignore parse error
        }
        setError(message);
        setThreads([]);
        return;
      }
      const data = await res.json();
      // data is array of thread objects
      const sorted = [...data].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      setThreads(sorted);
    } catch {
      setError('Failed to load messages.');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const openThread = async (threadId) => {
    setSelectedThreadId(threadId);
    setSelectedThreadMessages([]);
    try {
      const res = await fetch(`${BASE_URL}/messages/threads/${threadId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        let message = 'Failed to load conversation.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {
          // ignore
        }
        Alert.alert('Error', message);
        return;
      }
      const data = await res.json();
      setSelectedThreadMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      Alert.alert('Error', 'Failed to load conversation.');
    }
  };

  const closeThread = () => {
    setSelectedThreadId(null);
    setSelectedThreadMessages([]);
  };

  const openCompose = (thread) => {
    // When replying from an existing backend thread, we receive a thread object
    if (thread) {
      const subject = thread.subject || '';
      const nextSubject = subject
        ? subject.startsWith('Re:')
          ? subject
          : `Re: ${subject}`
        : '';
      setComposeSubject(nextSubject);
    } else {
      // New message (starting a new conversation) – subject starts empty
      setComposeSubject('');
      setComposeRecipient(MOCK_CONTACTS[0]?.id ?? '');
    }
    setComposeBody('');
    setComposeVisible(true);
  };

  const closeCompose = () => {
    Keyboard.dismiss();
    setComposeVisible(false);
  };

  const handleSend = async () => {
    if (!composeBody.trim()) {
      Alert.alert('Error', 'Please write a message');
      return;
    }

    // For now we only support replying to existing threads with backend
    if (!selectedThreadId) {
      Alert.alert('Coming Soon', 'Starting new conversations is not yet connected to the server. Please reply within an existing conversation.');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/messages/threads/${selectedThreadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          body: composeBody.trim(),
          attachments: [],
        }),
      });

      if (!res.ok) {
        let message = 'Failed to send message.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {
          // ignore
        }
        Alert.alert('Error', message);
        return;
      }

      const sent = await res.json();

      setSelectedThreadMessages((prev) => [...prev, sent]);
      setComposeBody('');
      setComposeVisible(false);
      // Refresh thread list order
      loadThreadsFromApi();
      Alert.alert('Success', 'Message sent successfully');
    } catch {
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const handleDelete = (threadId) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: implement delete thread API call
            Alert.alert('Coming Soon', 'Deleting conversations is not yet connected to the server.');
          },
        },
      ]
    );
  };

  const markAsUnread = () => {
    // Backend does not yet track unread per user; this is a placeholder
    Alert.alert('Info', 'Unread tracking will be added in a later update.');
  };

  // Filter threads from backend based on active tab and search
  const filteredThreads = threads.filter((thread) => {
    const subject = thread.subject?.toLowerCase() ?? '';
    const creatorName = thread.createdBy?.firstName?.toLowerCase() ?? '';
    const matchesSearch =
      subject.includes(searchQuery.toLowerCase()) ||
      creatorName.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'sent':
        return user && thread.createdBy && thread.createdBy._id === user.id;
      case 'unread':
        // No real unread flag yet; show none for now
        return false;
      default:
        return true;
    }
  });

  const getThreadById = (threadId) => threads.find((t) => t._id === threadId) ?? null;

  const getContactColor = (senderName) => {
    const contact = MOCK_CONTACTS.find((c) => c.name === senderName);
    return contact?.color || COLORS.primary;
  };

  const renderEmailCard = ({ item }) => {
    const contactName = item.createdBy?.firstName || 'Staff';
    const subject = item.subject || 'No subject';
    const dateObj = item.lastMessageAt ? new Date(item.lastMessageAt) : null;
    const timeLabel = dateObj
      ? dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : '';
    const previewText = ''; // we do not have last message body here without extra API call
    const contactColor = getContactColor(contactName);
    const unread = false; // unread tracking not yet implemented with backend

    return (
      <TouchableOpacity
        style={[styles.card, unread && styles.cardUnread]}
        onPress={() => openThread(item._id)}

        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: contactColor + '20' }]}>
            <Text style={[styles.avatarText, { color: contactColor }]}>
              {contactName.charAt(0)}
            </Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sender, unread && styles.senderUnread]} numberOfLines={1}>
                {contactName}
              </Text>
              <Text style={styles.time}>{timeLabel}</Text>
            </View>
            <Text style={[styles.subject, unread && styles.subjectUnread]} numberOfLines={1}>
              {subject}
            </Text>
            <Text style={styles.preview} numberOfLines={2}>
              {previewText || 'Open to view conversation'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {unread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>NEW</Text>
            </View>
          )}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                markAsUnread();
              }}
            >
              <Ionicons name="mail-unread" size={16} color={COLORS.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item._id);
              }}
            >
              <Ionicons name="trash" size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isOutgoing = user && item.senderId && item.senderId._id === user.id;
    const senderName = item.senderId?.firstName || 'Staff';
    const contactColor = getContactColor(senderName);

    return (
      <View style={[styles.messageContainer, isOutgoing ? styles.messageOutContainer : styles.messageInContainer]}>
        {!isOutgoing && (
          <View style={[styles.messageAvatar, { backgroundColor: contactColor + '20' }]}>
            <Text style={[styles.messageAvatarText, { color: contactColor }]}>
              {senderName.charAt(0)}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubble, isOutgoing ? styles.messageOut : styles.messageIn]}>
          {!isOutgoing && (
            <Text style={styles.messageSender}>{senderName}</Text>
          )}
          <Text style={[styles.messageBody, isOutgoing && styles.messageBodyOut]}>
            {item.body}
          </Text>
          <Text style={[styles.messageTime, isOutgoing && styles.messageTimeOut]}>
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  const selectedThread = selectedThreadId ? getThreadById(selectedThreadId) : null;
  const unreadCount = 0; // backend unread not yet wired

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Mailbox</Text>
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.composeButton}
            onPress={() => openCompose(null)}
          >
            <Ionicons name="create" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Secure communication with facility staff
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search emails..."
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All Mail
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
            onPress={() => setActiveTab('unread')}
          >
            <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
            onPress={() => setActiveTab('sent')}
          >
            <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
              Sent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Email List */}
      {filteredThreads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-open" size={64} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No emails found' : 'No emails yet'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try different search terms' : 'Send your first email to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => openCompose(null)}
            >
              <Ionicons name="create" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Compose Email</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredThreads}
          keyExtractor={(item) => item._id}
          renderItem={renderEmailCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Thread Modal */}
      <Modal
        visible={!!selectedThread}
        animationType="slide"
        transparent
        onRequestClose={closeThread}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.threadCard}>
            <View style={styles.threadHeader}>
              <TouchableOpacity onPress={closeThread} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.threadHeaderContent}>
                <Text style={styles.threadSubject} numberOfLines={1}>
                  {selectedThread?.subject || 'Conversation'}
                </Text>
              </View>
              <Text style={styles.threadMeta}>
                {selectedThreadMessages.length} messages
              </Text>
              <TouchableOpacity 
                style={styles.threadActionButton}
                onPress={() => openCompose(selectedThread)}
              >
                <Ionicons name="arrow-redo" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedThread ? [...selectedThreadMessages].reverse() : []}
              keyExtractor={(item) => item._id || item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.threadMessages}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.threadFooter}>
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => openCompose(selectedThread)}
              >
                <Ionicons name="arrow-undo" size={18} color="#FFFFFF" />
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Compose Modal - COMPLETELY FIXED */}
      <Modal
        visible={composeVisible}
        animationType="slide"
        transparent
        onRequestClose={closeCompose}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.composeBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.composeContainer}>
              <View style={styles.composeCard}>
                <View style={styles.composeHeader}>
                  <Text style={styles.composeTitle}>New Message</Text>
                  <TouchableOpacity onPress={closeCompose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.composeScrollView}
                  contentContainerStyle={styles.composeContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>To</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.recipientContainer}
                    >
                      {MOCK_CONTACTS.map(contact => (
                        <TouchableOpacity
                          key={contact.id}
                          style={[
                            styles.recipientOption,
                            composeRecipient === contact.id && styles.recipientOptionActive,
                          ]}
                          onPress={() => setComposeRecipient(contact.id)}
                        >
                          <View style={[styles.recipientAvatar, { backgroundColor: contact.color + '20' }]}>
                            <Text style={[styles.recipientAvatarText, { color: contact.color }]}>
                              {contact.name.charAt(0)}
                            </Text>
                          </View>
                          <View>
                            <Text style={[
                              styles.recipientName,
                              composeRecipient === contact.id && styles.recipientNameActive
                            ]}>
                              {contact.name}
                            </Text>
                            <Text style={styles.recipientRole}>{contact.role}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Subject</Text>
                    <TextInput
                      value={composeSubject}
                      onChangeText={setComposeSubject}
                      placeholder="Enter subject..."
                      placeholderTextColor={COLORS.muted}
                      style={styles.input}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Message</Text>
                    <TextInput
                      value={composeBody}
                      onChangeText={setComposeBody}
                      placeholder="Write your message here..."
                      placeholderTextColor={COLORS.muted}
                      style={[styles.input, styles.bodyInput]}
                      multiline
                      textAlignVertical="top"
                      scrollEnabled={false}
                    />
                  </View>
                </ScrollView>

                {/* Send Button - ALWAYS VISIBLE AND ACCESSIBLE */}
                <View style={styles.composeFooter}>
                  <TouchableOpacity
                    style={[styles.sendButton, (!composeBody.trim() || !composeSubject.trim()) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!composeBody.trim() || !composeSubject.trim()}
                  >
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.sendText}>Send Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  unreadCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  composeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 16,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    padding: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 15, 35, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sender: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.muted,
    flex: 1,
    marginRight: 8,
  },
  senderUnread: {
    color: COLORS.text,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 6,
  },
  subjectUnread: {
    color: COLORS.text,
  },
  preview: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Thread Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  threadCard: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  threadHeaderContent: {
    flex: 1,
  },
  threadSubject: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  threadMeta: {
    fontSize: 12,
    color: COLORS.muted,
  },
  threadActionButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  threadMessages: {
    padding: 20,
    paddingBottom: 80,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageInContainer: {
    justifyContent: 'flex-start',
  },
  messageOutContainer: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 16,
  },
  messageIn: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
  },
  messageOut: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 4,
  },
  messageBody: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  messageBodyOut: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 6,
    textAlign: 'right',
  },
  messageTimeOut: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  threadFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  replyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Compose Modal Styles - PERFECTLY FIXED
  composeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  composeContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  composeCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  composeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  composeScrollView: {
    // let content define height so fields are visible between header and footer
  },
  composeContent: {
    padding: 20,
    paddingBottom: 120, // Extra space for send button when keyboard is open
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  recipientContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  recipientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    minWidth: 160,
  },
  recipientOptionActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  recipientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  recipientNameActive: {
    color: COLORS.primary,
  },
  recipientRole: {
    fontSize: 12,
    color: COLORS.muted,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
  },
  bodyInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  composeFooter: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});