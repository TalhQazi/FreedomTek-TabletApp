import React, { useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = 'https://freedom-tech.onrender.com';

export default function OutgoingCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { toLabel = 'Family', requestId, callId, channelName, roomUrl, token } = route.params || {};
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken || !callId) {
      return;
    }

    let socket = io(BASE_URL, {
      auth: {
        token: accessToken,
      },
    });

    socket.on('connect', () => {
      socket.emit('subscribe:notifications', ['calls']);
    });

    socket.on('notification', (payload) => {
      try {
        if (!payload || payload.type !== 'CALL_ACCEPTED') return;
        const incomingCallId = payload.metadata && payload.metadata.callId;
        if (!incomingCallId || String(incomingCallId) !== String(callId)) return;

        navigation.navigate('CallActive', { toLabel, requestId, callId, channelName, roomUrl, token });
      } catch (err) {
        // ignore
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [accessToken, callId, navigation, toLabel, requestId, channelName, roomUrl, token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Calling {toLabel}...</Text>
        <ActivityIndicator size="large" color="#E63946" style={{ marginTop: 24 }} />
        <Text style={styles.subtitle}>Connecting to secure facility line</Text>

        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={40} color="#E5E7EB" />
        </View>

        <TouchableOpacity
          style={styles.endButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="call" size={22} color="#FFFFFF" />
          <Text style={styles.endButtonText}>Cancel</Text>
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
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
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
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 40,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
