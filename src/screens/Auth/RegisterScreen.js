import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
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

const BASE_URL = 'https://freedom-tech.onrender.com';

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [facility, setFacility] = useState('');
  const [inmateId, setInmateId] = useState('');
  const [tabletId, setTabletId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateInmateId = () => {
    const random = Math.floor(1 + Math.random() * 999);
    return `INM-${String(random).padStart(3, '0')}`;
  };

  const generateTabletId = () => {
    const random = Math.floor(1 + Math.random() * 999);
    return `TAB-${String(random).padStart(3, '0')}`;
  };

  useEffect(() => {
    setInmateId(generateInmateId());
    setTabletId(generateTabletId());
  }, []);

  const onRegister = async () => {
    setError('');
    setSuccess('');
    const trimmedName = name.trim();
    const trimmedFacility = facility.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirm.trim();

    if (!trimmedName || !trimmedPassword || !trimmedConfirm || !inmateId || !tabletId) {
      const message = 'Please fill all required fields.';
      setError(message);
      Alert.alert('Missing information', message);
      return;
    }

    if (trimmedPassword.length < 4) {
      const message = 'Password must be at least 4 characters.';
      setError(message);
      Alert.alert('Weak password', message);
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      const message = 'Passwords do not match.';
      setError(message);
      Alert.alert('Password mismatch', message);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/inmate-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          password: trimmedPassword,
          facility: trimmedFacility,
          inmateId,
          tabletId,
        }),
      });

      if (!res.ok) {
        let message = 'Registration failed.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
          if (err?.message) message = err.message;
        } catch {
          // ignore parse errors
        }
        setError(message);
        Alert.alert('Registration failed', message);
        return;
      }

      setSuccess('Account created successfully!');
      Alert.alert(
        'Registration successful',
        'Your account has been created. You can now log in.',
        [
          {
            text: 'Go to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (err) {
      console.log('Registration error:', err);
      const message = 'Network error. Please check your connection.';
      setError(message);
      Alert.alert('Registration failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Register Inmate Account</Text>

        <View style={styles.card}>
          <TextInput
            placeholder="First Name"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Inmate ID"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, styles.readonly]}
            value={inmateId}
            editable={false}
          />
          <TextInput
            placeholder="Facility"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={facility}
            onChangeText={setFacility}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Tablet ID"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, styles.readonly]}
            value={tabletId}
            editable={false}
          />
          <TextInput
            placeholder="Create Password"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.button, (isLoading || !name.trim() || !password.trim() || !confirm.trim()) && styles.buttonDisabled]}
          activeOpacity={0.85}
          onPress={onRegister}
          disabled={isLoading || !name.trim() || !password.trim() || !confirm.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primaryText} />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>
          Already have an account? Login
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
  success: { color: '#86efac' },
});
