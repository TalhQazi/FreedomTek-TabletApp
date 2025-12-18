import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_WIDTH < 375;

const COLORS = {
  background: '#0F0F23',
  text: '#E8EAED',
  muted: '#94A3B8',
  card: '#1A1A2E',
  border: '#2D3047',
  program: '#3B82F6', // blue
  medical: '#FBBF24', // yellow
  meal: '#F97316', // orange
  recreation: '#10B981', // green
  admin: '#EF4444', // red,
};

const BASE_URL = 'https://freedom-tech.onrender.com';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getCategoryColor(category) {
  switch (category) {
    case 'Program':
    case 'Classes / Programs':
      return COLORS.program;
    case 'Medical / Appointment':
    case 'Medical / Appointments':
      return COLORS.medical;
    case 'Meal':
    case 'Chow Time':
      return COLORS.meal;
    case 'Recreation':
    case 'Yard / Recreation':
      return COLORS.recreation;
    case 'Facility Admin':
      return COLORS.admin;
    case 'Work':
      return COLORS.program;
    default:
      return COLORS.muted;
  }
}

export default function ScheduleScreen() {
  const { accessToken, logout } = useAuth();

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [categoryColors, setCategoryColors] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/schedule/categories`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            Alert.alert('Session expired', 'Please log in again to view your schedule.', [
              { text: 'OK', onPress: () => logout() },
            ]);
          }
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          const map = {};
          data.forEach((cat) => {
            if (cat?.name && cat?.color) {
              map[cat.name] = cat.color;
            }
          });
          setCategoryColors(map);
        }
      } catch {
        // ignore schedule category load errors; fall back to static colors
      }
    })();

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BASE_URL}/schedule/events`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            Alert.alert('Session expired', 'Please log in again to view your schedule.', [
              { text: 'OK', onPress: () => logout() },
            ]);
          } else {
            let message = 'Failed to load schedule.';
            try {
              const err = await res.json();
              if (err?.error) message = err.error;
            } catch {
              // ignore parse errors
            }
            setError(message);
          }
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          setEvents([]);
        }
      } catch {
        setError('Failed to load schedule. Please check your connection.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const getColorForCategory = (category) => {
    if (category && categoryColors[category]) {
      return categoryColors[category];
    }
    return getCategoryColor(category);
  };

  const handleOpenEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseEvent = () => {
    setSelectedEvent(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>View your daily facility schedule</Text>
        </View>

        {/* Schedule Events List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size={isTablet ? 'large' : 'small'} color={COLORS.program} />
              <Text style={styles.emptyTitle}>Loading schedule…</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="warning-outline" size={isTablet ? 64 : 48} color={COLORS.admin} />
              <Text style={styles.emptyTitle}>Unable to load schedule</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : events.length > 0 ? (
            <FlatList
              data={events}
              keyExtractor={(item) => item._id || item.id}
              renderItem={({ item }) => {
                const timeLabel = item.startTime && item.endTime
                  ? `${item.startTime} - ${item.endTime}`
                  : item.startTime || '';

                const mappedEvent = {
                  id: item._id || item.id,
                  time: timeLabel,
                  title: item.title,
                  category: 'Schedule',
                  description: item.description,
                  location: item.location,
                };

                const color = COLORS.program;

                return (
                  <TouchableOpacity
                    style={styles.eventCard}
                    activeOpacity={0.8}
                    onPress={() => handleOpenEvent(mappedEvent)}
                  >
                    <View style={[styles.eventCategoryBar, { backgroundColor: color }]} />
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeaderRow}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                      </View>
                      {timeLabel ? (
                        <Text style={styles.eventTime}>{timeLabel}</Text>
                      ) : null}
                      {item.location ? (
                        <Text style={styles.eventLocation}>{item.location}</Text>
                      ) : null}
                      {item.description ? (
                        <Text style={styles.eventDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.eventsContent}
              showsVerticalScrollIndicator={false}
            />
          ) : Object.keys(categoryColors).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={isTablet ? 64 : 48} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>No schedule available</Text>
              <Text style={styles.emptyText}>
                When facility staff publish a schedule, it will appear here.
              </Text>
            </View>
          ) : (
            // Fallback: show categories when no events exist yet
            <FlatList
              data={Object.keys(categoryColors)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const color = getColorForCategory(item);
                return (
                  <View style={styles.eventCard}>
                    <View style={[styles.eventCategoryBar, { backgroundColor: color }]} />
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeaderRow}>
                        <Text style={styles.eventTitle}>{item}</Text>
                        <View style={[styles.categoryPill, { borderColor: color }]} > 
                          <Text style={[styles.categoryPillText, { color }]} numberOfLines={1}>
                            {item}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.eventDescription}>
                        This is a schedule category managed by facility staff.
                      </Text>
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.eventsContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Event Detail Modal */}
        <Modal
          visible={!!selectedEvent}
          animationType="slide"
          transparent
          onRequestClose={handleCloseEvent}
          statusBarTranslucent
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedEvent?.title}
                </Text>
                <TouchableOpacity onPress={handleCloseEvent} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalMetaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={COLORS.muted} />
                  <Text style={styles.metaText}>{selectedEvent?.time}</Text>
                </View>
                {selectedEvent?.location ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={16} color={COLORS.muted} />
                    <Text style={styles.metaText}>{selectedEvent.location}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalCategoryRow}>
                <View
                  style={[
                    styles.modalCategoryDot,
                    { backgroundColor: getColorForCategory(selectedEvent?.category || '') },
                  ]}
                />
                <Text style={styles.modalCategoryText}>{selectedEvent?.category}</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalSectionLabel}>Details</Text>
                <Text style={styles.modalDescription}>
                  {selectedEvent?.description || 'No additional details provided for this event.'}
                </Text>
              </View>

              <View style={styles.modalFooter}>
                <Text style={styles.modalHintText}>
                  Schedule is managed by facility staff. Changes cannot be made from this tablet.
                </Text>
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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: isSmallDevice ? 40 : isTablet ? 80 : 60,
    paddingHorizontal: isTablet ? 32 : 20,
    paddingBottom: isTablet ? 20 : 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: isTablet ? 36 : isSmallDevice ? 24 : 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: isTablet ? 16 : isSmallDevice ? 12 : 14,
    color: COLORS.muted,
  },
  daysRow: {
    paddingVertical: isTablet ? 16 : 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  daysContent: {
    paddingHorizontal: isTablet ? 20 : 12,
    gap: isTablet ? 12 : 8,
  },
  dayChip: {
    paddingHorizontal: isTablet ? 20 : 14,
    paddingVertical: isTablet ? 12 : 8,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: isTablet ? 12 : 8,
    minWidth: isTablet ? 80 : undefined,
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: COLORS.program,
    borderColor: COLORS.program,
  },
  dayChipText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 20 : 16,
  },
  eventsContent: {
    paddingBottom: isTablet ? 32 : 24,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: isTablet ? 20 : 16,
    marginBottom: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: isTablet ? 100 : 80,
  },
  eventCategoryBar: {
    width: 6,
  },
  eventContent: {
    flex: 1,
    padding: isTablet ? 16 : 12,
    justifyContent: 'center',
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTime: {
    fontSize: isTablet ? 15 : 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: isTablet ? 12 : 10,
    paddingVertical: isTablet ? 4 : 3,
    borderWidth: 1,
    maxWidth: isSmallDevice ? 80 : 100,
  },
  categoryPillText: {
    fontSize: isTablet ? 12 : 11,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: isTablet ? 18 : 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: isTablet ? 24 : 20,
  },
  eventDescription: {
    fontSize: isTablet ? 14 : 13,
    color: COLORS.muted,
    lineHeight: isTablet ? 20 : 18,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: isTablet ? 13 : 12,
    color: COLORS.muted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 60 : 40,
  },
  emptyTitle: {
    marginTop: isTablet ? 16 : 12,
    fontSize: isTablet ? 20 : 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyText: {
    marginTop: isTablet ? 8 : 4,
    fontSize: isTablet ? 15 : 13,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: isTablet ? 48 : 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    paddingHorizontal: isTablet ? 40 : 18,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: isTablet ? 28 : 24,
    padding: isTablet ? 28 : 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: isTablet ? '80%' : '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: isTablet ? 16 : 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: isTablet ? 24 : 20,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 12,
    lineHeight: isTablet ? 32 : 28,
  },
  closeButton: {
    padding: 4,
    marginTop: 4,
  },
  modalMetaRow: {
    flexDirection: isSmallDevice ? 'column' : 'row',
    alignItems: isSmallDevice ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    marginBottom: isTablet ? 16 : 12,
    gap: isSmallDevice ? 8 : 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: isTablet ? 15 : 13,
    color: COLORS.muted,
  },
  modalCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: isTablet ? 20 : 16,
  },
  modalCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalCategoryText: {
    fontSize: isTablet ? 15 : 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalBody: {
    marginBottom: isTablet ? 20 : 16,
  },
  modalSectionLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: isTablet ? 15 : 13,
    color: COLORS.text,
    lineHeight: isTablet ? 24 : 20,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: isTablet ? 16 : 10,
  },
  modalHintText: {
    fontSize: isTablet ? 13 : 12,
    color: COLORS.muted,
    lineHeight: isTablet ? 18 : 16,
  },
});