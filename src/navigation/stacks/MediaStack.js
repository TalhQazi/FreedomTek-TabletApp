import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MediaHomeScreen from '../../screens/Media/MediaHomeScreen';
import PlayerScreen from '../../screens/Media/PlayerScreen';

const Stack = createNativeStackNavigator();

export default function MediaStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MediaHome" component={MediaHomeScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} />
    </Stack.Navigator>
  );
}
