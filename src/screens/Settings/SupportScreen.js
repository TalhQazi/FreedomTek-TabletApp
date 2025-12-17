import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  background: '#0F0F23',
  card: '#1A1A2E',
  border: '#2D3047',
  text: '#E8EAED',
  muted: '#94A3B8',
  primary: '#6366F1',
};

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.safe}> 
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Contact Support</Text>
          <Text style={styles.p}>Need help? Facility support is available.</Text>

          <Text style={styles.h2}>Facility Support</Text>
          <Text style={styles.li}>• Technical Issues: IT Department</Text>
          <Text style={styles.li}>• Schedule Questions: Case Manager</Text>
          <Text style={styles.li}>• General Inquiries: Administration</Text>

          <Text style={styles.p}>For urgent matters, contact facility staff immediately.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  h2: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  p: { color: COLORS.text, fontSize: 14, lineHeight: 22, marginBottom: 8 },
  li: { color: COLORS.text, fontSize: 14, lineHeight: 22, marginLeft: 2, marginBottom: 4 },
});
