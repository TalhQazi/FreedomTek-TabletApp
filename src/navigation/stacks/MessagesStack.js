import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InboxScreen from '../../screens/Messages/InboxScreen';
import ComposeScreen from '../../screens/Messages/ComposeScreen';
import ThreadScreen from '../../screens/Messages/ThreadScreen';
import VideoChatScreen from '../../screens/Messages/VideoChatScreen';

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="Compose" component={ComposeScreen} />
      <Stack.Screen name="Thread" component={ThreadScreen} />
      <Stack.Screen name="VideoChat" component={VideoChatScreen} />
    </Stack.Navigator>
  );
}
