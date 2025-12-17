import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';
import NotesScreen from '../screens/Notes/NotesScreen';
import TimeScreen from '../screens/Time/TimeScreen';
import HomeStack from './stacks/HomeStack';
import MessagesStack from './stacks/MessagesStack';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const BASE_URL = 'https://freedom-tech.onrender.com';

function CallNotificationListener() {
  const { accessToken } = useAuth();
  const navigation = useNavigation();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    console.log('[Calls][Tablet] Initialising socket connection to', BASE_URL);

    const s = io(BASE_URL, {
      auth: {
        token: accessToken,
      },
    });

    socketRef.current = s;

    s.on('connect', () => {
      console.log('[Calls][Tablet] Socket connected');
      s.emit('subscribe:notifications', ['calls']);
    });

    s.on('connect_error', (err) => {
      console.error('[Calls][Tablet] Socket connect_error', err);
    });

    s.on('error', (err) => {
      console.error('[Calls][Tablet] Socket error', err);
    });

    s.on('notification', (payload) => {
      try {
        if (!payload || payload.type !== 'CALL_INCOMING') {
          return;
        }
        const callId = payload.metadata && payload.metadata.callId;
        if (!callId) {
          return;
        }

        console.log('[Calls][Tablet] Received CALL_INCOMING', payload);

        // We are inside the root Stack navigator (AppNavigator) where screens are 'Main' and 'Auth'.
        // Navigate into Main (tabs) -> HomeStack -> IncomingCall.
        navigation.navigate('Main', {
          screen: 'Home',
          params: {
            screen: 'IncomingCall',
            params: {
              fromLabel: 'Family',
              callId,
            },
          },
        });
      } catch (e) {
        console.error('Failed to handle incoming call notification', e);
      }
    });

    s.on('disconnect', (reason) => {
      console.log('[Calls][Tablet] Socket disconnected', reason);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [accessToken, navigation]);

  return null;
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <CallNotificationListener />
      <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E1F25',
          borderTopColor: '#2A2B31',
          height: 72 + insets.bottom,
          paddingBottom: 12 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#E63946',
        tabBarInactiveTintColor: '#E5E7EB',
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Home: 'home',
            Messages: 'chatbubbles',
            Time: 'time',
            Note: 'document-text',
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
        tabBarHideOnKeyboard: true,
      })}
      lazy={false}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Time" component={TimeScreen} />
      <Tab.Screen name="Note" component={NotesScreen} />
    </Tab.Navigator>
    </>
  );
}
