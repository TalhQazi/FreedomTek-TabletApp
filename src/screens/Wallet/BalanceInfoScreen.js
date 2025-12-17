import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlan } from '../../context/PlanContext';
import { getInmateWallet } from '../../api/walletApi';

export default function BalanceInfoScreen() {
  const { currentPlan, setCurrentPlan, balance, setBalance } = usePlan();
  const [loading, setLoading] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      const wallet = await getInmateWallet();
      setBalance(wallet.balance || 0);
      setCurrentPlan(wallet.currentPlan || null);
    } catch (error) {
      console.error('[BalanceInfo] Failed to load wallet', error);
      Alert.alert('Balance', error?.message || 'Unable to load balance information.');
    } finally {
      setLoading(false);
    }
  }, [setBalance, setCurrentPlan]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

  const planLabel = currentPlan
    ? currentPlan === 'bronze'
      ? 'Bronze'
      : currentPlan === 'silver'
      ? 'Silver'
      : 'Gold'
    : 'No active plan';

  const features = [];
  // Free features
  features.push('Calculator');
  features.push('Calendar');
  features.push('Settings');
  features.push('Time & clock');
  features.push('Notes');

  if (currentPlan === 'bronze' || currentPlan === 'silver' || currentPlan === 'gold') {
    features.push('Messages');
    features.push('Courses');
  }

  if (currentPlan === 'silver' || currentPlan === 'gold') {
    features.push('Podcast');
    features.push('Library');
    features.push('Schedule');
  }

  if (currentPlan === 'gold') {
    features.push('Calls');
    features.push('Games');
    features.push('Commissary');
    features.push('Photos');
    features.push('Requests');
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Balance & Plan Info</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            activeOpacity={0.8}
            onPress={loadWallet}
            disabled={loading}
          >
            <Text style={styles.refreshText}>{loading ? 'Refreshing…' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          This information matches what your family sees in the FreedomTek Family app.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Family wallet balance</Text>
          <Text style={styles.balanceValue}>{loading ? 'Loading…' : formatCurrency(balance)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current plan</Text>
          <Text style={styles.planValue}>{planLabel}</Text>
          {!currentPlan && (
            <Text style={styles.muted}>
              Ask your family to purchase a plan from the FreedomTek Family app to unlock more features.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Features you can use with this plan</Text>
          {features.map((f) => (
            <Text key={f} style={styles.featureItem}>
              • {f}
            </Text>
          ))}
        </View>

        <Text style={styles.footerNote}>
          Only your family can add balance or change plans. Any plan they purchase will automatically
          update what you can access here on your tablet.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E1F25',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 0,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#111827',
  },
  refreshText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 6,
  },
  balanceValue: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
  },
  planValue: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
  },
  muted: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 6,
  },
  featureItem: {
    color: '#E5E7EB',
    fontSize: 14,
    marginTop: 4,
  },
  footerNote: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
