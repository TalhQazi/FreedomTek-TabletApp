import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { translate } from '../../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;

const COLORS = {
  background: '#1E1F25',
  text: '#E5E7EB',
  primary: '#E63946',
  primaryText: '#FFFFFF',
  divider: '#2A2B31',
  card: '#2A2B31',
  selected: '#3A3B41',
};

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },]

export default function LanguageScreen({ navigation }) {
  const { language: currentLanguage, setAppLanguage } = useLanguage();

  const handleLanguageSelect = (code) => {
    setAppLanguage(code);
    navigation.navigate('Terms');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>{translate('auth.selectLanguage')}</Text>
          
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                currentLanguage === lang.code && styles.selectedLanguage
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>
                  {lang.name} {lang.nativeName && `(${lang.nativeName})`}
                </Text>
                {currentLanguage === lang.code && (
                  <Text style={styles.selectedText}>✓ {translate('common.selected')}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          <View style={styles.divider} />
          <Text style={styles.note}>{translate('auth.languageNote')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: isSmallDevice ? 16 : 24,
  },
  title: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    width: isTablet ? '80%' : '100%',
    maxWidth: 480,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    backgroundColor: COLORS.selected,
    borderColor: COLORS.primary,
  },
  flag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedText: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: COLORS.divider,
    marginVertical: 24,
  },
  note: {
    color: COLORS.text,
    opacity: 0.7,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 480,
  },
});
