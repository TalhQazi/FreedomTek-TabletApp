import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { MessagesProvider } from './src/context/MessagesContext';
import { PlanProvider } from './src/context/PlanContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <PlanProvider>
            <MessagesProvider>
              <NavigationContainer theme={DefaultTheme}>
                <StatusBar hidden animated />
                <AppNavigator />
              </NavigationContainer>
            </MessagesProvider>
          </PlanProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
