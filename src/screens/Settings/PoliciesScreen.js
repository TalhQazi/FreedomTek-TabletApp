import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PoliciesScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Policies (Dummy)</Text>
        <Text>Facility policies and rules will appear here.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
});
