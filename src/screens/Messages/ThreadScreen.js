import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useMessages } from '../../context/MessagesContext';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  background: '#1E1F25',
  card: '#2A2B31',
  border: '#374151',
  text: '#E5E7EB',
  meBubble: '#4B5563',
  themBubble: '#111827',
  accent: '#8B5CF6',
  secondaryText: '#9CA3AF',
  success: '#10B981',
  danger: '#EF4444',
  white: '#FFFFFF',
};

export default function ThreadScreen({ route, navigation }) {
  const { threadId } = route.params || {};
  const { getThreadById, sendMessage } = useMessages();
  const { accessToken, user } = useAuth();
  const [text, setText] = useState('');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const thread = useMemo(() => getThreadById(threadId), [getThreadById, threadId]);

  // Keep local messages state in sync with context thread for local / optimistic updates
  useEffect(() => {
    if (thread?.messages) {
      setMessages(thread.messages);
    }
  }, [thread]);

  // Load full history from backend for real (non-local) threads
  useEffect(() => {
    const loadFromBackend = async () => {
      if (!accessToken || !thread || thread.id?.startsWith('local_')) return;

      try {
        const res = await fetch(`https://freedom-tech.onrender.com/messages/threads/${thread.id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        const currentUserId = user?.id || user?._id;

        const mapped = (data.messages || []).map((m) => ({
          id: m._id,
          text: m.body,
          fromMe: currentUserId && m.senderId && (m.senderId._id === currentUserId || m.senderId === currentUserId),
          createdAt: m.createdAt,
          status: (m.readBy && m.readBy.length > 0) ? 'read' : 'sent',
        }));

        setMessages(mapped);
      } catch {
        // ignore network errors here, UI will still show local messages
      }
    };

    loadFromBackend();
  }, [accessToken, thread?.id, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleSend = () => {
    if (!text.trim() || !thread) return;
    sendMessage(thread.id, text.trim(), true);
    setText('');
    // Focus input after sending
    inputRef.current?.focus();
  };

  // Attachment Functions
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        sendMessage(thread.id, `📷 Image: ${result.assets[0].uri}`, true);
        setShowAttachmentModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        sendMessage(thread.id, `🎥 Video: ${result.assets[0].uri}`, true);
        setShowAttachmentModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        sendMessage(thread.id, `📄 Document: ${result.name}`, true);
        setShowAttachmentModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setRecording(null);
      
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
          sendMessage(thread.id, `🎤 Voice Message: ${uri}`, true);
        }
      }
      
      setRecordingTime(0);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item, index }) => {
    const isMe = item.fromMe;
    const timeLabel = formatTime(item.createdAt);
    const showDate = index === 0 || formatDate(messages[index - 1]?.createdAt) !== formatDate(item.createdAt);

    return (
      <View style={styles.messageContainer}>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageRow,
            isMe ? styles.messageRowMe : styles.messageRowThem,
          ]}
        >
          {!isMe && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {thread?.contactName?.charAt(0) || 'C'}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleThem,
            ]}
          >
            <Text style={styles.bubbleText}>{item.text}</Text>
            <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextThem]}>
              {timeLabel}
            </Text>
          </View>
          {isMe && (
            <View style={styles.statusIcon}>
              <Ionicons 
                name="checkmark-done" 
                size={14} 
                color={item.status === 'read' ? '#6366F1' : '#94A3B8'} 
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const AttachmentModal = () => (
    <Modal
      visible={showAttachmentModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAttachmentModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowAttachmentModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.attachmentModal}>
              <Text style={styles.modalTitle}>Attach File</Text>
              
              <View style={styles.attachmentOptions}>
                <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
                  <View style={[styles.optionIcon, { backgroundColor: '#3B82F6' }]}>
                    <Ionicons name="image" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionText}>Photos</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.attachmentOption} onPress={pickVideo}>
                  <View style={[styles.optionIcon, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="videocam" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionText}>Videos</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.attachmentOption} onPress={pickDocument}>
                  <View style={[styles.optionIcon, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="document" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionText}>Documents</Text>
                </TouchableOpacity>

                
              </View>

              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAttachmentModal(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // Use padding on both platforms so the input bar moves up with the
      // keyboard on Android as well, matching the family app behavior.
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.contactInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {thread?.contactName?.charAt(0) || 'F'}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {thread?.contactName || 'Family'}
              </Text>
              <Text style={styles.headerSubtitle}>Secure messaging with your family</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />



      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.attachmentButton}
            onPress={() => setShowAttachmentModal(true)}
          >
            <Ionicons name="add" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.secondaryText}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
            />
            {text.length > 0 && (
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => {/* Emoji picker logic */}}
              >
                <Ionicons name="happy" size={20} color={COLORS.secondaryText} />
              </TouchableOpacity>
            )}
          </View>

          {text.trim().length > 0 ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        
        {text.length > 0 && (
          <Text style={styles.charCount}>
            {text.length}/1000
          </Text>
        )}
      </View>

      <AttachmentModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.secondaryText,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  iconButtonPrimary: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  iconButtonSecondary: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 2,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: 'rgba(45, 48, 71, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    color: COLORS.secondaryText,
    fontSize: 12,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
    maxWidth: '100%',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowThem: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  bubbleMe: {
    backgroundColor: COLORS.meBubble,
    borderBottomRightRadius: 8,
  },
  bubbleThem: {
    backgroundColor: COLORS.themBubble,
    borderBottomLeftRadius: 8,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
  timeText: {
    marginTop: 4,
    fontSize: 11,
    opacity: 0.8,
  },
  timeTextMe: {
    color: '#E0E7FF',
    textAlign: 'right',
  },
  timeTextThem: {
    color: '#CBD5E1',
  },
  statusIcon: {
    marginLeft: 4,
    marginBottom: 4,
  },
  inputContainer: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachmentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiButton: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    padding: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.meBubble,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: COLORS.meBubble,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  charCount: {
    textAlign: 'center',
    color: COLORS.secondaryText,
    fontSize: 11,
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  attachmentOption: {
    alignItems: 'center',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
  },
  modalCloseButton: {
    backgroundColor: 'rgba(45, 48, 71, 0.5)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Recording Styles
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
  },
  recordingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stopRecordingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText:{
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '500',
  }
});