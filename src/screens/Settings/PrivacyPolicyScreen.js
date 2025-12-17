import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  background: '#0F0F23',
  card: '#1A1A2E',
  border: '#2D3047',
  text: '#E8EAED',
  muted: '#94A3B8',
};

export default function PrivacyPolicyScreen() {
  const today = new Date().toLocaleDateString();
  return (
    <SafeAreaView style={styles.safe}> 
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.updated}>Last Updated: {today}</Text>

          <Text style={styles.p}>Your privacy and security are important to us. This policy explains how we handle your information.</Text>

          <Text style={styles.h2}>Data We Collect</Text>
          <Text style={styles.li}>• Basic profile information</Text>
          <Text style={styles.li}>• Application usage statistics</Text>
          <Text style={styles.li}>• Facility-related activities</Text>

          <Text style={styles.h2}>How We Use Data</Text>
          <Text style={styles.li}>• Facility management and operations</Text>
          <Text style={styles.li}>• Security and monitoring purposes</Text>
          <Text style={styles.li}>• Improving user experience</Text>

          <Text style={styles.p}>All data is stored securely and accessed only by authorized personnel.</Text>
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
  updated: { color: COLORS.muted, fontSize: 12, marginBottom: 12 },
  h2: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  p: { color: COLORS.text, fontSize: 14, lineHeight: 22, marginBottom: 8 },
  li: { color: COLORS.text, fontSize: 14, lineHeight: 22, marginLeft: 2, marginBottom: 4 },
});
