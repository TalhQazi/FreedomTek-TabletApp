import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalendarScreen from '../../screens/Calendar/CalendarScreen';
import CommissaryScreen from '../../screens/Commissary/CommissaryScreen';
import CoursesScreen from '../../screens/Courses/CoursesScreen';
import DashboardScreen from '../../screens/Home/DashboardScreen';
import CallsScreen from '../../screens/Calls/CallsScreen';
import OutgoingCallScreen from '../../screens/Calls/OutgoingCallScreen';
import IncomingCallScreen from '../../screens/Calls/IncomingCallScreen';
import CallActiveScreen from '../../screens/Calls/CallActiveScreen';
import CallEndScreen from '../../screens/Calls/CallEndScreen';
import LibraryScreen from '../../screens/Library/LibraryScreen';
import GamesScreen from '../../screens/Media/GamesScreen';
import PodcastScreen from '../../screens/Media/PodcastScreen';
import CalculatorScreen from '../../screens/Tools/CalculatorScreen';
import PhotosScreen from '../../screens/Photos/PhotosScreen';
import RequestsScreen from '../../screens/Requests/RequestsScreen';
import ScheduleScreen from '../../screens/Schedule/ScheduleScreen';
import SettingsStack from './SettingsStack';
import MessagesStack from './MessagesStack';
import BalanceInfoScreen from '../../screens/Wallet/BalanceInfoScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Courses" component={CoursesScreen} />
      <Stack.Screen name="Podcast" component={PodcastScreen} />
      <Stack.Screen name="Games" component={GamesScreen} />
      <Stack.Screen name="Emails" component={CalculatorScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="Calls" component={CallsScreen} />
      <Stack.Screen name="OutgoingCall" component={OutgoingCallScreen} />
      <Stack.Screen name="IncomingCall" component={IncomingCallScreen} />
      <Stack.Screen name="CallActive" component={CallActiveScreen} />
      <Stack.Screen name="CallEnd" component={CallEndScreen} />
      <Stack.Screen name="Commissary" component={CommissaryScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Photos" component={PhotosScreen} />
      <Stack.Screen name="Settings" component={SettingsStack} />
      <Stack.Screen name="Messages" component={MessagesStack} />
      <Stack.Screen name="BalanceInfo" component={BalanceInfoScreen} />
    </Stack.Navigator>
  );
}
