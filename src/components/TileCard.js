import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TileCard({ title }) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#eef2ff', padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, fontWeight: '600' },
});
