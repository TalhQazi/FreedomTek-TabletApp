import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DialerScreen from '../../screens/Phone/DialerScreen';
import HistoryScreen from '../../screens/Phone/HistoryScreen';
import ActiveCallScreen from '../../screens/Phone/ActiveCallScreen';

const Stack = createNativeStackNavigator();

export default function PhoneStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dialer" component={DialerScreen} />
      <Stack.Screen name="ActiveCall" component={ActiveCallScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}
