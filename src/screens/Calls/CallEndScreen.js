import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export default function CallEndScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { durationSeconds = 0, toLabel = 'Family', requestId } = route.params || {};
  const { accessToken } = useAuth();

  const BASE_URL = 'https://freedom-tech.onrender.com';

  const formatTime = (total) => {
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBack = async () => {
    try {
      if (requestId && accessToken) {
        await fetch(`${BASE_URL}/requests/${requestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          // Mark this request as closed because a call was completed, so
          // the tablet UI can treat it as an expired/used request.
          body: JSON.stringify({ status: 'closed', comment: 'expired_by_call' }),
        });
      }
    } catch (e) {
      // Silently ignore errors; call UI has already completed
    }

    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Call ended</Text>
        <Text style={styles.subtitle}>With {toLabel}</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>{formatTime(durationSeconds)}</Text>
          <Text style={styles.summaryNote}>Billing & monitoring will be added in future phases.</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleBack}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1E1F25',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    width: '100%',
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  summaryValue: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryNote: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 32,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
