import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMessages } from '../../context/MessagesContext';

const COLORS = {
  background: '#1E1F25',
  card: '#2A2B31',
  border: '#3C3C43',
  text: '#E5E7EB',
  muted: '#9CA3AF',
  primary: '#E63946',
};

export default function ComposeScreen({ navigation }) {
  const { startNewThread } = useMessages();
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleStart = async () => {
    if (!contactName.trim() || !message.trim()) {
      Alert.alert('Missing info', 'Please enter a contact name and a message.');
      return;
    }

    try {
      const thread = await startNewThread(contactName.trim(), phone.trim(), message.trim());
      if (!thread || !thread.id) {
        throw new Error('Could not start conversation');
      }
      navigation.replace('Thread', { threadId: thread.id });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to start conversation.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>New Message</Text>

      <View style={styles.card}>
        <Text style={styles.label}>To (Contact name)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mom"
          placeholderTextColor={COLORS.muted}
          value={contactName}
          onChangeText={setContactName}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Phone Number (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 03001234567"
          placeholderTextColor={COLORS.muted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Type your message..."
          placeholderTextColor={COLORS.muted}
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <TouchableOpacity style={styles.sendButton} onPress={handleStart}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 15,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
