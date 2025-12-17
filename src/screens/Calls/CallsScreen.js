import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const BASE_URL = 'https://freedom-tech.onrender.com';

export default function CallsScreen() {
  const { accessToken, logout } = useAuth();
  const navigation = useNavigation();

  const [calls, setCalls] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadCalls();
  }, [accessToken]);

  // Incoming call realtime listener is now handled globally in MainTabs via CallNotificationListener

  useFocusEffect(
    React.useCallback(() => {
      if (!accessToken) return;
      loadCalls();
    }, [accessToken]),
  );

  const loadCalls = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/requests`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        let message = 'Failed to load call requests.';
        try {
          const err = await res.json();
          if (err?.error) {
            message = err.error;
          }
        } catch {}

        if (res.status === 401) {
          Alert.alert('Session expired', 'Please log in again to view call requests.', [
            { text: 'OK', onPress: () => logout() },
          ]);
          return;
        }

        setError(message);
        setCalls([]);
        return;
      }

      const data = await res.json();
      const filtered = Array.isArray(data)
        ? data.filter((r) => r.type === 'Call Request')
        : [];
      setCalls(filtered);
    } catch {
      setError('Failed to load call requests.');
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setDescription('');
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      return;
    }

    try {
      const body = {
        type: 'Call Request',
        title: 'Call Request',
        description: description.trim(),
        priority: 'normal',
      };

      const res = await fetch(`${BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let message = 'Failed to submit call request.';
        try {
          const err = await res.json();
          if (err?.error) {
            message = err.error;
          }
        } catch {}

        if (res.status === 401) {
          Alert.alert('Session expired', 'Please log in again to submit call requests.', [
            { text: 'OK', onPress: () => logout() },
          ]);
          return;
        }
        Alert.alert('Error', message);
        return;
      }

      const created = await res.json();
      setCalls((prev) => [created, ...prev]);
      closeModal();
      Alert.alert(
        'Call request sent',
        'Your call request has been sent to the admin. When it is approved, you will be able to call your family from this screen.',
      );
    } catch {
      Alert.alert('Error', 'Failed to submit call request.');
    }
  };

  const renderCallItem = (item) => {
    const date = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
    const isExpired = item.status === 'closed' && item.comment === 'expired_by_call';

    // Map backend status (open/in_progress/closed) and comment flag
    // to friendly display status for the pill
    let displayStatus = 'Pending';
    if (item.status === 'in_progress') displayStatus = 'Approved';
    if (item.status === 'closed') displayStatus = isExpired ? 'Expired' : 'Rejected';

    const canCall = item.status === 'in_progress';

    return (
      <View key={item._id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>📞</Text>
          </View>
          <View style={styles.cardHeaderContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Call Request........</Text>
              <View
                style={[
                  styles.statusPill,
                  displayStatus === 'Approved'
                    ? styles.statusPillApproved
                    : displayStatus === 'Rejected'
                    ? styles.statusPillRejected
                    : styles.statusPillPending,
                ]}
              >
                <Text style={styles.statusPillText}>{displayStatus}</Text>
              </View>
            </View>
            <Text style={styles.cardDate}>{date}</Text>
          </View>
        </View>
        
        <Text style={styles.cardDescription}>{item.description}</Text>
        
        <View style={styles.cardFooter}>
          {canCall ? (
            <TouchableOpacity
              style={styles.callNowButton}
              onPress={async () => {
                try {
                  const res = await fetch(`${BASE_URL}/calls`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ requestId: item._id }),
                  });

                  if (!res.ok) {
                    let message = 'Failed to create call session';
                    try {
                      const errBody = await res.json();
                      if (errBody && errBody.error) {
                        message = errBody.error;
                      }
                    } catch {}

                    throw new Error(message);
                  }

                  const created = await res.json();
                  console.log('[Calls] Created call session', created);

                  navigation.navigate('OutgoingCall', {
                    toLabel: 'Family',
                    requestId: item._id,
                    callId: created.callId,
                    channelName: created.channelName,
                    roomUrl: created.roomUrl,
                    token: created.token,
                  });
                } catch (err) {
                  console.error('Failed to start call session', err);
                  Alert.alert('Error', err.message || 'Unable to start call session. Please try again.');
                }
              }}
            >
              <Text style={styles.callNowIcon}>▶</Text>
              <Text style={styles.callNowText}>Start Call</Text>
            </TouchableOpacity>
          ) : item.status === 'open' ? (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingIcon}>⏳</Text>
              <Text style={styles.cannotCallText}>Awaiting approval</Text>
            </View>
          ) : isExpired ? (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingIcon}>⌛</Text>
              <Text style={styles.cannotCallText}>This request has expired. Please send a new request.</Text>
            </View>
          ) : (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingIcon}>⛔</Text>
              <Text style={styles.cannotCallText}>Call already done.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
                                                                        
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.headerTitle}>Call Requests</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Request secure calls to your approved contacts</Text>


        {/* New Request Button */}
        <TouchableOpacity style={styles.newRequestButton} onPress={openModal}>
          <Text style={styles.newRequestIcon}>+</Text>
          <Text style={styles.newRequestText}>New Call Request</Text>
        </TouchableOpacity>

        {/* Call Requests List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Requests</Text>
          <TouchableOpacity onPress={loadCalls}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCalls}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : calls.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📞</Text>
            <Text style={styles.emptyTitle}>No call requests yet</Text>
            <Text style={styles.emptySubtitle}>Create your first request to get started</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          >
            {calls.map(renderCallItem)}
          </ScrollView>
        )}

        {/* New Request Modal */}
        <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Call Request</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                Describe who you want to call and why. This will be reviewed by an administrator.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Request Details</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={6}
                  placeholder="Example: I'd like to call my mother at her approved number to discuss family matters."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  autoFocus
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]} 
                  onPress={closeModal}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSubmit]} 
                  onPress={handleSubmit}
                  disabled={!description.trim()}
                >
                  <Text style={styles.modalButtonSubmitText}>Submit Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 20,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  demoCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  demoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  demoIcon: {
    fontSize: 28,
  },
  demoContent: {
    flex: 1,
  },
  demoTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  demoSubtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    opacity: 0.9,
  },
  arrowIcon: {
    color: '#7C3AED',
    fontSize: 24,
    fontWeight: '300',
  },
  newRequestButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  newRequestIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    marginRight: 8,
  },
  newRequestText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '700',
  },
  refreshText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
  },
  cardDate: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  cardDescription: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  callNowButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 8,
    fontWeight: '700',
  },
  callNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  waitingIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#FBBF24',
  },
  cannotCallText: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusPillApproved: {
    backgroundColor: '#10B981',
  },
  statusPillRejected: {
    backgroundColor: '#EF4444',
  },
  statusPillPending: {
    backgroundColor: '#F59E0B',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    maxWidth: '80%',
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyTitle: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    maxWidth: '80%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '800',
  },
  modalClose: {
    color: '#94A3B8',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 28,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    color: '#F1F5F9',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#334155',
  },
  charCount: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#334155',
  },
  modalButtonCancelText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSubmit: {
    backgroundColor: '#7C3AED',
  },
  modalButtonSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});