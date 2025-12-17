import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSettingsScreen() {
  const { setEN, setES } = useLanguage();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language Settings (Dummy)</Text>
      <Button title="English" onPress={setEN} />
      <Button title="Español" onPress={setES} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 18, fontWeight: '600' },
});
