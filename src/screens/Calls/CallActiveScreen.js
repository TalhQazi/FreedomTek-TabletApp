import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = 'https://freedom-tech.onrender.com';

export default function CallActiveScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { toLabel = 'Family', requestId, callId, channelName, roomUrl, token } = route.params || {};
  const { accessToken } = useAuth();

  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Ensure microphone/audio permissions are granted before joining Daily call
    const setupAudioPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Microphone permission not granted. Call audio may not work.');
        }

        // Configure audio mode only on native platforms (skip on web)
        if (Platform.OS === 'ios') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } else if (Platform.OS === 'android') {
          await Audio.setAudioModeAsync({
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        }
      } catch (err) {
        console.warn('Failed to configure audio mode for call', err);
      }
    };

    setupAudioPermissions();

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Notify backend that call has started (logging only, no Agora)
    const startCall = async () => {
      if (!callId || !accessToken) {
        return;
      }

      try {
        await fetch(`https://freedom-tech.onrender.com/calls/${callId}/start`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (err) {
        console.error('Failed to mark call started', err);
      }
    };

    startCall();

    // Connect to realtime notifications to listen for CALL_ENDED
    if (accessToken && callId) {
      const socket = io(BASE_URL, {
        auth: {
          token: accessToken,
        },
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('subscribe:notifications', ['calls']);
      });

      socket.on('notification', (payload) => {
        try {
          if (!payload || payload.type !== 'CALL_ENDED') return;
          const incomingCallId = payload.metadata && payload.metadata.callId;
          if (!incomingCallId || String(incomingCallId) !== String(callId)) return;

          // Other side ended the call -> end locally as well
          endCall();
        } catch (err) {
          // ignore
        }
      });
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [callId, accessToken]);

  const endCall = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Notify backend that call has ended (Phase-2 logging only)
    if (callId && accessToken) {
      try {
        await fetch(`https://freedom-tech.onrender.com/calls/${callId}/end`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (err) {
        console.error('Failed to mark call ended', err);
      }
    }

    navigation.replace('CallEnd', { durationSeconds: seconds, toLabel, requestId });
  };

  const formatTime = (total) => {
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
          <Text style={styles.name}>{toLabel}</Text>
          <Text style={styles.status}>Secure audio call</Text>
        </View>

        <View style={styles.callBody}>
          {roomUrl && token ? (
            <WebView
              source={{ uri: `${roomUrl}?t=${encodeURIComponent(token)}` }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            />
          ) : (
            <View style={styles.fallback}>
              <Text style={styles.status}>Connecting to call...</Text>
            </View>
          )}
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
            <Ionicons name="call" size={26} color="#FFFFFF" />
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
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timer: {
    color: '#E5E7EB',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  name: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  status: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  callBody: {
    flex: 1,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  webview: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
