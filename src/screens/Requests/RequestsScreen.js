import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';

import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  background: '#0F0F23',
  text: '#E8EAED',
  muted: '#94A3B8',
  primary: '#6366F1',
  accent: '#8B5CF6',
  card: '#1A1A2E',
  border: '#2D3047',
  danger: '#EF4444',
  success: '#10B981',
};

const REQUEST_TYPES = [
  'Medical Request',
  'Maintenance Request',
  'Commissary Request',
  'Appointment Request',
  'Grievance Form',
  'Clothing Request',
  'Cleaning Supplies Request',
  'Facility Forms Request',
];

const BASE_URL = 'https://freedom-tech.onrender.com';

export default function RequestsScreen() {
  const { accessToken, logout } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('Medical Request');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadRequests();
  }, [accessToken]);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/requests`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        let message = 'Failed to load requests.';
        try {
          const err = await res.json();
          if (err?.error) {
            message = err.error;
          }
        } catch {}

        if (res.status === 401) {
          Alert.alert('Session expired', 'Please log in again to view requests.', [
            { text: 'OK', onPress: () => logout() },
          ]);
          return;
        }

        setError(message);
        setRequests([]);
        return;
      }

      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setSelectedType('Medical Request');
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
        type: selectedType,
        title: selectedType,
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
        let message = 'Failed to submit request.';
        try {
          const err = await res.json();
          if (err?.error) {
            message = err.error;
          }
        } catch {}

        if (res.status === 401) {
          Alert.alert('Session expired', 'Please log in again to submit requests.', [
            { text: 'OK', onPress: () => logout() },
          ]);
          return;
        }
        Alert.alert('Error', message);
        return;
      }

      const created = await res.json();
      setRequests((prev) => [created, ...prev]);
      closeModal();
    } catch {
      Alert.alert('Error', 'Failed to submit request.');
    }
  };

  const filteredRequests = useMemo(() => {
    if (filterType === 'All') return requests;
    return requests.filter((r) => r.type === filterType);
  }, [requests, filterType]);

  const getStatusPresentation = (status) => {
    const value = status || 'open';
    if (value === 'open') {
      return { label: 'Open', style: styles.statusPending };
    }
    if (value === 'in_progress') {
      return { label: 'In Progress', style: styles.statusPending };
    }
    if (value === 'closed') {
      return { label: 'Closed', style: styles.statusApproved };
    }
    return { label: value, style: styles.statusPending };
  };

  const renderRequestItem = ({ item }) => {
    const { label, style } = getStatusPresentation(item.status);
    const createdAt = item.createdAt || item.date;
    let displayDate = '';
    if (createdAt) {
      try {
        displayDate = new Date(createdAt).toISOString().split('T')[0];
      } catch {
        displayDate = createdAt;
      }
    }

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeaderRow}>
          <Text style={styles.requestType} numberOfLines={1}>
            {item.type}
          </Text>
          <View style={[styles.statusPill, style]}>
            <Text style={styles.statusText}>{label}</Text>
          </View>
        </View>

        {displayDate ? <Text style={styles.requestDate}>{displayDate}</Text> : null}

        <Text style={styles.requestDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    );
  };

  const renderTypeFilterChip = (type) => {
    const isActive = filterType === type;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setFilterType(type)}
        activeOpacity={0.8}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {type}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTypeOption = (type) => {
    const isActive = selectedType === type;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.typeOption, isActive && styles.typeOptionActive]}
        onPress={() => setSelectedType(type)}
        activeOpacity={0.8}
      >
        <Text style={[styles.typeOptionText, isActive && styles.typeOptionTextActive]}>
          {type}
        </Text>
      </TouchableOpacity>
    );
  };

  const hasRequests = filteredRequests.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Requests</Text>
            <TouchableOpacity style={styles.newButton} onPress={openModal} activeOpacity={0.8}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.newButtonText}>New Request</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Send official requests to facility staff</Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          <View style={styles.filterChipsScroll}>
            <FlatList
              data={['All', ...REQUEST_TYPES]}
              horizontal
              keyExtractor={(item) => item}
              renderItem={({ item }) => renderTypeFilterChip(item)}
              contentContainerStyle={styles.filterChipsContainer}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        </View>

        {/* Requests List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={40} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>Loading requests...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={40} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>Unable to load requests</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
            </View>
          ) : !hasRequests ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptySubtitle}>Tap "New Request" to submit your first request.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRequests}
              keyExtractor={(item) => item._id || item.id}
              renderItem={renderRequestItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* New Request Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={isModalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Request</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeIconButton}>
                  <Ionicons name="close" size={22} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Request Type</Text>
              <View style={styles.typeOptionsContainer}>
                <FlatList
                  data={REQUEST_TYPES}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => renderTypeOption(item)}
                  contentContainerStyle={styles.typeOptionsContent}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              <Text style={styles.sectionLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="Describe your request in detail..."
                placeholderTextColor={COLORS.muted}
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={[styles.submitButton, !description.trim() && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={!description.trim()}
              >
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </TouchableOpacity>
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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
  },
  filtersRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChipsScroll: {
    flexDirection: 'row',
  },
  filterChipsContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestType: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.border,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  statusPending: {
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  requestDate: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 13,
    color: COLORS.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeIconButton: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 6,
    marginTop: 8,
  },
  typeOptionsContainer: {
    maxHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  typeOptionsContent: {
    paddingVertical: 4,
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  typeOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  typeOptionText: {
    fontSize: 13,
    color: COLORS.text,
  },
  typeOptionTextActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  textArea: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
    maxHeight: 160,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});