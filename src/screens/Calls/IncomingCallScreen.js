import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = 'https://freedom-tech.onrender.com';

export default function IncomingCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fromLabel = 'Family', callId } = route.params || {};
  const { accessToken } = useAuth();

  const handleReject = () => {
    navigation.goBack();
  };

  const handleAccept = async () => {
    try {
      if (!callId || !accessToken) {
        Alert.alert('Error', 'Call information is missing. Please try again.');
        return;
      }

      const res = await fetch(`${BASE_URL}/calls/${callId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        let message = 'Failed to join call.';
        try {
          const body = await res.json();
          if (body && body.error) {
            message = body.error;
          }
        } catch (e) {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const data = await res.json();

      navigation.navigate('CallActive', {
        toLabel: fromLabel,
        callId: data.callId,
        roomUrl: data.roomUrl,
        token: data.token,
      });
    } catch (err) {
      console.error('Failed to join incoming call', err);
      Alert.alert('Error', err.message || 'Unable to join call. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.smallLabel}>Incoming call from</Text>
        <Text style={styles.name}>{fromLabel}</Text>
        <Text style={styles.notice}>This call may be monitored and recorded.</Text>

        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={40} color="#E5E7EB" />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
          >
            <Ionicons name="call" size={26} color="#FFFFFF" />
            <Text style={styles.actionText}>Accept</Text>
          </TouchableOpacity>
        </View>
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
  smallLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  name: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  notice: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2A2B31',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});
