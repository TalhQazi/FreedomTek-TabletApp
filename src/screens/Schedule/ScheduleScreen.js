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
  admin: '#EF4444', // red
};

const BASE_URL = 'https://freedom-tech.onrender.com';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Local mock schedule data (Phase-1 only)
const SCHEDULE = {
  Monday: [
    {
      id: 'm1',
      time: '07:30',
      title: 'Morning Chow',
      category: 'Meal',
      description: 'Breakfast service in main chow hall.',
      location: 'Chow Hall A',
    },
    {
      id: 'm2',
      time: '09:00',
      title: 'Education Class: Math Skills',
      category: 'Program',
      description: 'Group session focused on basic numeracy and applied math.',
      location: 'Education Room 2',
    },
    {
      id: 'm3',
      time: '11:30',
      title: 'Midday Chow',
      category: 'Meal',
      description: 'Lunch service in chow hall.',
      location: 'Chow Hall A',
    },
    {
      id: 'm4',
      time: '13:00',
      title: 'Case Manager Check-in',
      category: 'Medical / Appointment',
      description: 'Scheduled one-on-one meeting with your case manager.',
      location: 'Case Management Office',
    },
    {
      id: 'm5',
      time: '15:00',
      title: 'Yard / Recreation',
      category: 'Recreation',
      description: 'Outdoor yard time. Follow posted rules and staff instructions.',
      location: 'Yard B',
    },
    {
      id: 'm6',
      time: '18:00',
      title: 'Evening Chow',
      category: 'Meal',
      description: 'Dinner service in chow hall.',
      location: 'Chow Hall A',
    },
  ],
  Tuesday: [
    {
      id: 't1',
      time: '08:00',
      title: 'Morning Chow',
      category: 'Meal',
      description: 'Breakfast service in main chow hall.',
      location: 'Chow Hall A',
    },
    {
      id: 't2',
      time: '09:30',
      title: 'Vocational Program: Workshop',
      category: 'Program',
      description: 'Hands-on skills development in facility workshop.',
      location: 'Workshop 1',
    },
    {
      id: 't3',
      time: '11:30',
      title: 'Midday Chow',
      category: 'Meal',
      description: 'Lunch service in chow hall.',
      location: 'Chow Hall A',
    },
    {
      id: 't4',
      time: '14:00',
      title: 'Medical Appointment',
      category: 'Medical / Appointment',
      description: 'Routine medical check with facility clinic staff.',
      location: 'Clinic 1',
    },
    {
      id: 't5',
      time: '16:00',
      title: 'Facility Town Hall',
      category: 'Facility Admin',
      description: 'Information session led by facility administration.',
      location: 'Multi-purpose Room',
    },
  ],
  Wednesday: [
    {
      id: 'w1',
      time: '07:30',
      title: 'Morning Chow',
      category: 'Meal',
      description: 'Breakfast service in main chow hall.',
      location: 'Chow Hall A',
    },
    {
      id: 'w2',
      time: '10:00',
      title: 'Library Time',
      category: 'Program',
      description: 'Scheduled access to facility library resources.',
      location: 'Library',
    },
    {
      id: 'w3',
      time: '13:30',
      title: 'Work Assignment: Unit Cleaning',
      category: 'Work',
      description: 'Assigned cleaning duties in housing unit common areas.',
      location: 'Housing Unit B',
    },
    {
      id: 'w4',
      time: '17:30',
      title: 'Evening Chow',
      category: 'Meal',
      description: 'Dinner service in chow hall.',
      location: 'Chow Hall A',
    },
  ],
  Thursday: [
    {
      id: 'th1',
      time: '09:00',
      title: 'Education Class: Reading & Writing',
      category: 'Program',
      description: 'Literacy-focused class to improve reading and writing skills.',
      location: 'Education Room 1',
    },
    {
      id: 'th2',
      time: '15:00',
      title: 'Yard / Recreation',
      category: 'Recreation',
      description: 'Outdoor yard time. Follow posted rules and staff instructions.',
      location: 'Yard A',
    },
  ],
  Friday: [
    {
      id: 'f1',
      time: '07:30',
      title: 'Morning Chow',
      category: 'Meal',
      description: 'Breakfast service in main chow hall.',
      location: 'Chow Hall A',
    },
    {
      id: 'f2',
      time: '10:30',
      title: 'Program: Life Skills Workshop',
      category: 'Program',
      description: 'Group program focused on communication and decision-making.',
      location: 'Program Room 3',
    },
    {
      id: 'f3',
      time: '13:00',
      title: 'Case Manager Follow-up',
      category: 'Medical / Appointment',
      description: 'Follow-up appointment with case manager.',
      location: 'Case Management Office',
    },
  ],
  Saturday: [
    {
      id: 's1',
      time: '09:30',
      title: 'Yard / Recreation (Extended)',
      category: 'Recreation',
      description: 'Weekend extended recreation period in the yard.',
      location: 'Yard C',
    },
    {
      id: 's2',
      time: '18:00',
      title: 'Evening Chow',
      category: 'Meal',
      description: 'Dinner service in chow hall.',
      location: 'Chow Hall A',
    },
  ],
  Sunday: [
    {
      id: 'su1',
      time: '10:00',
      title: 'Religious Services',
      category: 'Program',
      description: 'Optional religious service in chapel as per facility rules.',
      location: 'Chapel',
    },
    {
      id: 'su2',
      time: '14:00',
      title: 'Family Video Call (If Scheduled)',
      category: 'Medical / Appointment',
      description: 'Pre-approved video call session with family.',
      location: 'Communication Room',
    },
  ],
};

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

        {/* Categories List (from backend) */}
        <View style={styles.listContainer}>
          {Object.keys(categoryColors).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={isTablet ? 64 : 48} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>No schedule categories</Text>
              <Text style={styles.emptyText}>
                Categories will appear here when configured by facility staff.
              </Text>
            </View>
          ) : (
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
                        <View style={[styles.categoryPill, { borderColor: color }]}> 
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