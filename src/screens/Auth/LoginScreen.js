import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  background: '#1E1F25',
  card: '#2A2B31',
  text: '#E5E7EB',
  border: '#3C3C43',
  primary: '#E63946',
  primaryText: '#FFFFFF',
  muted: '#9CA3AF',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [inmateId, setInmateId] = useState('INM-');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleInmateIdChange = (text) => {
    // Always enforce the 'INM-' prefix and allow up to 3 digits after it
    let value = text || '';

    // If user tries to delete everything, restore prefix
    if (!value.startsWith('INM-')) {
      // Remove any non-digit and take last 3 as digits portion
      const digits = value.replace(/\D/g, '').slice(-3);
      value = `INM-${digits}`;
    }

    // Limit to 'INM-' + 3 digits
    if (value.length > 7) {
      value = value.slice(0, 7);
    }

    setInmateId(value);
  };

  const onLogin = async () => {
    setError('');
    try {
      if (!inmateId || !password) {
        setError('Please enter inmate ID and password.');
        return;
      }
      await login(inmateId, password);
    } catch (e) {
      setError(e.message || 'Login failed.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Inmate Login</Text>

        <View style={styles.card}>
          <TextInput
            placeholder="Inmate ID (e.g. INM-123)"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={inmateId}
            onChangeText={handleInmateIdChange}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={onLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.linkText} onPress={() => navigation.navigate('Register')}>
          New user? Register
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24, alignItems: 'center', gap: 16, justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '700' },
  card: { width: '100%', maxWidth: 520, backgroundColor: COLORS.card, padding: 20, borderRadius: 14, borderColor: COLORS.border, borderWidth: 1, gap: 12 },
  input: { backgroundColor: '#1F2127', color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
  button: { marginTop: 8, backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', width: '100%', maxWidth: 520 },
  buttonText: { color: COLORS.primaryText, fontSize: 18, fontWeight: '800' },
  linkText: { color: '#93c5fd', marginTop: 8, fontWeight: '600' },
  error: { color: '#fca5a5' },
});
