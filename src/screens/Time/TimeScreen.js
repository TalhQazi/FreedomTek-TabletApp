import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  background: '#1E1F25',
  text: '#E5E7EB',
  accent: '#E63946',
  card: '#2A2B31',
  border: '#3C3C43',
};

export default function TimeScreen() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const localTime = now.toLocaleTimeString();
  const localDate = now.toDateString();
  const utcTime = now.toUTCString().split(' ').slice(0, 5).join(' ');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>Local Time</Text>
          <Text style={styles.time}>{localTime}</Text>
          <Text style={styles.date}>{localDate}</Text>
        </View>

        <View style={styles.cardSecondary}>
          <Text style={styles.label}>International (UTC)</Text>
          <Text style={styles.utc}>{utcTime}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  cardSecondary: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#15161C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
  },
  label: { color: COLORS.accent, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  time: { color: COLORS.text, fontSize: 44, fontWeight: '900', letterSpacing: 1 },
  date: { color: COLORS.text, fontSize: 16, opacity: 0.9 },
  utc: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
});
