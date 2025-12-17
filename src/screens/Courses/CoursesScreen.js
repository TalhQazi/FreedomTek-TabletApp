import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  background: '#1E1F25',
  text: '#E5E7EB',
  card: '#2A2B31',
  border: '#3C3C43',
  primary: '#E63946',
  primaryText: '#FFFFFF',
  muted: '#9CA3AF',
};

const BASE_URL = 'https://freedom-tech.onrender.com';

export default function CoursesScreen() {
  const { accessToken, logout } = useAuth();

  const [courses, setCourses] = useState([]); // backend catalog
  const [enrollmentStatus, setEnrollmentStatus] = useState({}); // { [courseId]: 'in_progress' | 'completed' }
  const [selected, setSelected] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadCoursesAndEnrollments();
  }, [accessToken]);

  const loadCoursesAndEnrollments = async () => {
    setLoading(true);
    setError('');
    try {
      // Load catalog
      const catalogRes = await fetch(`${BASE_URL}/courses/catalog`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!catalogRes.ok) {
        let message = 'Failed to load courses.';
        try {
          const err = await catalogRes.json();
          if (err?.error) message = err.error;
          if (catalogRes.status === 401 && err?.error === 'Invalid token') {
            Alert.alert('Session expired', 'Please log in again to view courses.', [
              { text: 'OK', onPress: () => logout() },
            ]);
            return;
          }
        } catch {}
        setError(message);
        setCourses([]);
        return;
      }
      const catalog = await catalogRes.json();

      // Load enrollments for current user
      const enrollRes = await fetch(`${BASE_URL}/courses/enrollments`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      let statusMap = {};
      if (enrollRes.ok) {
        const enrollments = await enrollRes.json();
        if (Array.isArray(enrollments)) {
          statusMap = enrollments.reduce((acc, enrollment) => {
            const courseId = enrollment.courseId?._id || enrollment.courseId;
            if (courseId) acc[courseId] = enrollment.status || 'in_progress';
            return acc;
          }, {});
        }
      }

      setCourses(catalog || []);
      setEnrollmentStatus(statusMap);
    } catch {
      setError('Failed to load courses.');
      setCourses([]);
      setEnrollmentStatus({});
    } finally {
      setLoading(false);
    }
  };

  const openCourse = (course) => setSelected(course);
  const closeModal = () => setSelected(null);

  const statusLabel = (course) => {
    const id = course._id;
    const status = enrollmentStatus[id];
    if (status === 'in_progress') return 'In Progress';
    if (status === 'completed') return 'Completed';
    return 'Not enrolled';
  };

  const displayDuration = (course) => {
    if (typeof course.duration === 'number' && !Number.isNaN(course.duration)) {
      return `${course.duration} hours`;
    }
    return 'Self-paced';
  };

  const displaySchedule = (course) => {
    // Backend does not define schedule; provide a generic placeholder
    return course.category ? `Category: ${course.category}` : 'Scheduled by facility';
  };

  const handleStartSelected = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${BASE_URL}/courses/${selected._id}/enroll`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        let message = 'Failed to enroll in course.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
          if (res.status === 401 && err?.error === 'Invalid token') {
            Alert.alert('Session expired', 'Please log in again to enroll in courses.', [
              { text: 'OK', onPress: () => logout() },
            ]);
            return;
          }
        } catch {}
        Alert.alert('Error', message);
        return;
      }

      setInfoMessage('You are now enrolled. This course is marked as In Progress.');
      // Refresh enrollments to update status pill
      await loadCoursesAndEnrollments();
      setTimeout(() => {
        setInfoMessage('');
        closeModal();
      }, 1200);
    } catch {
      Alert.alert('Error', 'Failed to enroll in course.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => openCourse(item)}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.level}>{item.level || item.category}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{statusLabel(item)}</Text>
        </View>
      </View>
      <Text style={styles.short} numberOfLines={2}>{item.description || 'Facility-managed educational content.'}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{displayDuration(item)}</Text>
        <Text style={styles.meta}>{displaySchedule(item)}</Text>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => openCourse(item)}>
          <Text style={styles.primaryBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Courses & Programs</Text>
          <Text style={styles.headerSub}>View facility-approved education and skills modules.</Text>
        </View>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 8, color: COLORS.muted }}>Loading courses...</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
            <Text style={{ color: COLORS.muted, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
            <Text style={{ color: COLORS.muted, textAlign: 'center' }}>
              No courses are available at the moment.
              {"\n"}
              Please check back later or ask facility staff about education programs.
            </Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          />
        )}
      </View>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={styles.modalTitle}>{selected?.title}</Text>
              <Text style={styles.modalMeta}>{selected?.level} • {selected?.duration}</Text>
              <Text style={styles.modalMeta}>Status: {selected ? statusLabel(selected.id) : ''}</Text>
              <Text style={styles.modalMeta}>Schedule: {selected?.schedule}</Text>
              <Text style={styles.modalBody}>
                {selected?.short}
                {"\n\n"}
                This is a facility-managed course. Enrollment and completion status will be tracked by staff in
                the kiosk system. Content may include worksheets, videos or in-person sessions depending on
                facility rules.
              </Text>
              {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost]} onPress={closeModal}>
                <Text style={styles.modalBtnGhostText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={handleStartSelected}>
                <Text style={styles.modalBtnText}>Start Course</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.border },
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16 , backgroundColor: COLORS.background },
  headerTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  headerSub: { color: COLORS.muted, marginTop: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  statusText :{color: COLORS.text, fontSize: 12, fontWeight: '600'},
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
  level: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  short: { color: COLORS.text, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  meta: { color: COLORS.muted, fontSize: 12 },
  actionsRow: { marginTop: 12, alignItems: 'flex-end' },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  primaryBtnText: { color: COLORS.primaryText, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 640, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 16, padding: 16 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  modalMeta: { color: COLORS.muted, marginBottom: 4 },
  modalBody: { color: COLORS.text, marginTop: 8, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  modalBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  modalBtnText: { color: COLORS.primaryText, fontWeight: '800' },
  modalBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  modalBtnGhostText: { color: COLORS.text, fontWeight: '700' },
});
