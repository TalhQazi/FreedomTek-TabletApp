import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_WIDTH < 375;

const COLORS = {
  background: '#0F0F23',
  card: '#1A1A2E',
  border: '#2D3047',
  text: '#E8EAED',
  muted: '#94A3B8',
  primary: '#6366F1',
  accent: '#E63946',
};

const BASE_URL = 'https://freedom-tech.onrender.com';

const STORAGE_KEYS = {
  profile: 'settings_profile_v1',
  language: 'settings_language_v1',
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ur', label: 'Urdu' },
];

export default function SettingsHomeScreen({ navigation }) {
  const { accessToken, user, logout } = useAuth();
  const { language, setAppLanguage } = useLanguage();
  const [profile, setProfile] = useState({
    name: 'John Doe',
    nickname: 'Johnny',
    inmateId: 'FT-000123',
    tablet: '',
    facility: 'FreedomTek Facility',
    email: 'n/a',
    phone: 'n/a',
    photoUri: '',
  });
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Try to load profile from backend first if we have a token
        if (accessToken) {
          const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            let nextProfile = {
              name: data.firstName || profile.name,
              nickname: profile.nickname,
              inmateId: data.inmateId || profile.inmateId,
              tablet: profile.tablet,
              facility: data.facilityId || profile.facility,
              email: data.email || profile.email,
              phone: profile.phone,
              photoUri: profile.photoUri,
            };

            // Attempt to fetch inmate details including tablet ID
            try {
              if (data.inmateId) {
                const inmateRes = await fetch(
                  `${BASE_URL}/inmates/lookup/${encodeURIComponent(data.inmateId)}`
                );
                if (inmateRes.ok) {
                  const inmateData = await inmateRes.json();
                  nextProfile = {
                    ...nextProfile,
                    inmateId: inmateData.inmateId || nextProfile.inmateId,
                    facility: inmateData.facility || nextProfile.facility,
                    tablet: inmateData.tablet || nextProfile.tablet,
                  };
                }
              }
            } catch {}

            setProfile(nextProfile);
            // Persist fresh profile so next launch also shows real inmate data
            persist(STORAGE_KEYS.profile, nextProfile);
            if (data.language) {
              setAppLanguage(data.language);
              persist(STORAGE_KEYS.language, data.language);
            }
          }
        }
      } catch {
        // ignore backend errors, fall back to local storage
      }

      try {
        const [p, l] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.profile),
          AsyncStorage.getItem(STORAGE_KEYS.language),
        ]);

        // Only fall back to stored profile when not authenticated
        if (!accessToken && p) {
          setProfile(JSON.parse(p));
        }
        if (l) {
          const storedLang = JSON.parse(l);
          setAppLanguage(storedLang);
        }
      } catch {
        // ignore storage errors
      }
    })();
  }, [accessToken]);

  const persist = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 1 
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const next = { ...profile, photoUri: asset.uri };
    setProfile(next);
    persist(STORAGE_KEYS.profile, next);
  };

  const handleSaveName = async () => {
    setEditingName(false);
    persist(STORAGE_KEYS.profile, profile);

    if (!accessToken) return;
    try {
      const res = await fetch(`${BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ firstName: profile.name }),
      });

      if (!res.ok) {
        let message = 'Failed to update profile.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {}

        if (res.status === 401 && logout) {
          Alert.alert('Session expired', 'Please log in again to update your profile.', [
            { text: 'OK', onPress: () => logout() },
          ]);
          return;
        }
        Alert.alert('Error', message);
        return;
      }

      const data = await res.json();
      if (data?.firstName) {
        const next = { ...profile, name: data.firstName };
        setProfile(next);
        persist(STORAGE_KEYS.profile, next);
      }
    } catch {
      // network error: keep local change, but notify user
      Alert.alert('Error', 'Unable to sync name with server. It is saved locally only.');
    }
  };

  const saveLanguage = async (code) => {
    setAppLanguage(code);
    persist(STORAGE_KEYS.language, code);

    if (!accessToken) return;
    try {
      const res = await fetch(`${BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ language: code }),
      });

      if (!res.ok) {
        let message = 'Failed to update language.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {}

        if (res.status === 401 && logout) {
          Alert.alert('Session expired', 'Please log in again to update language.', [
            { text: 'OK', onPress: () => logout() },
          ]);
          return;
        }

        Alert.alert('Error', message);
        return;
      }
    } catch {
      Alert.alert('Error', 'Unable to sync language with server. It is saved locally only.');
    }
  };

  const clearCache = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.profile),
      ]);
      // Reset to default values
      setProfile({
        name: 'John Doe',
        nickname: 'Johnny',
        inmateId: 'FT-000123',
        tablet: '',
        facility: 'FreedomTek Facility',
        email: 'n/a',
        phone: 'n/a',
        photoUri: '',
      });
    } catch {}
  };

  // navigation handlers are used inline below

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={pickProfileImage} activeOpacity={0.85}>
              <View style={styles.avatar}>
                {profile.photoUri ? (
                  <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={isTablet ? 56 : 48} color={COLORS.muted} />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              {!editingName ? (
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile.name}</Text>
                  <TouchableOpacity onPress={() => setEditingName(true)} style={styles.editButton}>
                    <Ionicons name="create" size={16} color="#FFFFFF" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.nameEditRow}>
                  <TextInput
                    value={profile.name}
                    onChangeText={(t) => setProfile({ ...profile, name: t })}
                    placeholder="Full Name"
                    placeholderTextColor={COLORS.muted}
                    style={styles.input}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveName} style={styles.saveButton}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.subText}>Inmate ID: {profile.inmateId}</Text>
              <Text style={styles.subText}>Tablet ID: {profile.tablet || 'N/A'}</Text>
              <Text style={styles.subText}>Facility: {profile.facility}</Text>
            </View>
          </View>
        </View>

        {/* Language */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Language</Text>
          <View style={styles.languageContainer}>
            {LANGUAGES.map((lng) => (
              <TouchableOpacity
                key={lng.code}
                style={[
                  styles.languageButton,
                  language === lng.code && styles.languageButtonActive
                ]}
                onPress={() => saveLanguage(lng.code)}
              >
                <Text style={[
                  styles.languageText,
                  language === lng.code && styles.languageTextActive
                ]}>
                  {lng.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="phone-portrait" size={16} color={COLORS.muted} />
            <Text style={styles.infoText}>App Version: 1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="hardware-chip" size={16} color={COLORS.muted} />
            <Text style={styles.infoText}>Device: {Platform.OS.toUpperCase()} Tablet</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={COLORS.muted} />
            <Text style={styles.infoText}>Last Updated: January 2024</Text>
          </View>
          <TouchableOpacity onPress={clearCache} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.clearButtonText}>Clear Profile Data</Text>
          </TouchableOpacity>
        </View>

        {/* About & Support */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About & Support</Text>
          
          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => navigation.navigate('Terms')}
            activeOpacity={0.7}
          >
            <View style={styles.linkContent}>
              <Ionicons name="document-text" size={20} color={COLORS.primary} />
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkTitle}>Terms of Service</Text>
                <Text style={styles.linkSubtitle}>Read our terms and conditions</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => navigation.navigate('PrivacyPolicy')}
            activeOpacity={0.7}
          >
            <View style={styles.linkContent}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkTitle}>Privacy Policy</Text>
                <Text style={styles.linkSubtitle}>How we protect your data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => navigation.navigate('UserGuide')}
            activeOpacity={0.7}
          >
            <View style={styles.linkContent}>
              <Ionicons name="book" size={20} color={COLORS.primary} />
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkTitle}>User Guide</Text>
                <Text style={styles.linkSubtitle}>Learn how to use the app</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => navigation.navigate('Support')}
            activeOpacity={0.7}
          >
            <View style={styles.linkContent}>
              <Ionicons name="headset" size={20} color={COLORS.primary} />
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkTitle}>Contact Support</Text>
                <Text style={styles.linkSubtitle}>Get help with the application</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* About items navigate to dedicated screens above */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  container: { 
    flex: 1 
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: isTablet ? 24 : 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: isTablet ? 20 : 16,
  },
  cardTitle: { 
    color: COLORS.text, 
    fontSize: isTablet ? 20 : 16, 
    fontWeight: '800', 
    marginBottom: 16 
  },
  profileRow: { 
    flexDirection: 'row', 
    gap: 16, 
    alignItems: 'flex-start' 
  },
  avatar: {
    width: isTablet ? 140 : 120,
    height: isTablet ? 140 : 120,
    borderRadius: isTablet ? 70 : 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: isTablet ? 70 : 60,
  },
  profileInfo: { 
    flex: 1 
  },
  nameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameEditRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { 
    color: COLORS.text, 
    fontSize: isTablet ? 24 : 20, 
    fontWeight: '800',
    flex: 1,
  },
  subText: { 
    color: COLORS.muted, 
    fontSize: isTablet ? 14 : 12, 
    marginTop: 2 
  },
  editButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: COLORS.primary, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8 
  },
  editButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: isTablet ? 14 : 12,
  },
  saveButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: COLORS.primary, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    marginLeft: 8 
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: isTablet ? 14 : 12,
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    fontSize: isTablet ? 16 : 14,
  },
  languageContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  languageButton: { 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 999, 
    paddingHorizontal: isTablet ? 16 : 12, 
    paddingVertical: isTablet ? 10 : 6, 
    backgroundColor: 'rgba(15, 15, 35, 0.8)' 
  },
  languageButtonActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary 
  },
  languageText: { 
    color: COLORS.muted, 
    fontWeight: '600',
    fontSize: isTablet ? 14 : 12,
  },
  languageTextActive: { 
    color: '#FFFFFF' 
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    color: COLORS.text,
    fontSize: isTablet ? 15 : 13,
  },
  clearButton: { 
    marginTop: 16,
    alignSelf: 'flex-start', 
    flexDirection: 'row', 
    gap: 8, 
    backgroundColor: COLORS.accent, 
    borderRadius: 10, 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  clearButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: isTablet ? 14 : 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    color: COLORS.text,
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkSubtitle: {
    color: COLORS.muted,
    fontSize: isTablet ? 14 : 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    paddingHorizontal: isTablet ? 40 : 16,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isTablet ? 24 : 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: isTablet ? 22 : 18,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: isTablet ? 24 : 20,
  },
  modalText: {
    color: COLORS.text,
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 24 : 22,
  },
  modalFooter: {
    padding: isTablet ? 24 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: isTablet ? 16 : 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
  },
});