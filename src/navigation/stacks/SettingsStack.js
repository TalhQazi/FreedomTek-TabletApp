import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HelpScreen from '../../screens/Settings/HelpScreen';
import LanguageSettingsScreen from '../../screens/Settings/LanguageSettingsScreen';
import PoliciesScreen from '../../screens/Settings/PoliciesScreen';
import PrivacyPolicyScreen from '../../screens/Settings/PrivacyPolicyScreen';
import SettingsHomeScreen from '../../screens/Settings/SettingsHomeScreen';
import SupportScreen from '../../screens/Settings/SupportScreen';
import TermsScreen from '../../screens/Settings/TermsScreen';
import UserGuideScreen from '../../screens/Settings/UserGuideScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} options={{ title: 'Language' }} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Policies" component={PoliciesScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="UserGuide" component={UserGuideScreen} options={{ title: 'User Guide' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Contact Support' }} />
    </Stack.Navigator>
  );
}
