import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  background: '#0F0F23',
  card: '#1A1A2E',
  border: '#2D3047',
  text: '#E8EAED',
  muted: '#94A3B8',
};

export default function UserGuideScreen() {
  return (
    <SafeAreaView style={styles.safe}> 
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>User Guide</Text>

          <Text style={styles.h2}>Main Features</Text>
          <Text style={styles.li}>• Schedule: View daily activities and events</Text>
          <Text style={styles.li}>• Photos: Access facility-approved images</Text>
          <Text style={styles.li}>• Settings: Manage your profile and preferences</Text>

          <Text style={styles.h2}>Navigation</Text>
          <Text style={styles.li}>• Use the dashboard tiles to open modules</Text>
          <Text style={styles.li}>• Tap items to view details, use back to return</Text>

          <Text style={styles.h2}>Support</Text>
          <Text style={styles.li}>• For technical issues, contact facility IT support</Text>
          <Text style={styles.li}>• Report any app malfunctions immediately</Text>
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
  li: { color: COLORS.text, fontSize: 14, lineHeight: 22, marginLeft: 2, marginBottom: 8 },
});
