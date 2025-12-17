import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { translate } from '../../i18n';

const COLORS = {
  background: '#1E1F25',
  text: '#E5E7EB',
  heading: '#E63946',
  border: '#3C3C43',
  primary: '#E63946',
  primaryText: '#FFFFFF',
  muted: '#9CA3AF',
};

export default function TermsScreen({ navigation }) {
  const [accepted, setAccepted] = useState(false);
  const { language } = useLanguage();

  const onContinue = () => {
    if (accepted) navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>{translate('terms.title')}</Text>

        <View style={styles.termsBox}>
          <ScrollView contentContainerStyle={styles.termsContent}>
            <Text style={styles.title}>FreedomTek™ {translate('terms.title')}</Text>
            <Text style={styles.updated}>{translate('terms.lastUpdated')}{"\n"}</Text>
            <Text style={styles.text}>{translate('terms.welcome')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.authUse')}</Text>
            <Text style={styles.text}>{translate('terms.authUseText')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.monitoring')}</Text>
            <Text style={styles.text}>{translate('terms.monitoringText')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.communication')}</Text>
            <Text style={styles.text}>{translate('terms.communicationText')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.privacy')}</Text>
            <Text style={styles.text}>{translate('terms.privacyText')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.media')}</Text>
            <Text style={styles.text}>{translate('terms.mediaText')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.grievance')}</Text>
            <Text style={styles.text}>{translate('terms.grievanceText')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.deviceRules')}</Text>
            <Text style={styles.text}>{translate('terms.deviceRulesText')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.behavior')}</Text>
            <Text style={styles.text}>{translate('terms.behaviorText')}{"\n"}</Text>

            <Text style={styles.section}>{translate('terms.acceptance')}</Text>
            <Text style={styles.text}>{translate('terms.acceptanceText')}</Text>
          </ScrollView>
        </View>

        <View style={styles.acceptRow}>
          <Pressable 
            onPress={() => setAccepted(prev => !prev)} 
            style={[styles.checkbox, accepted && styles.checkboxChecked]}
            accessibilityLabel={translate('auth.agreeTerms')}
          > 
            {accepted ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </Pressable>
          <Text style={styles.checkLabel}>{translate('auth.agreeTerms')}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onContinue}
          disabled={!accepted}
          style={[styles.button, !accepted && styles.buttonDisabled]}
          accessibilityLabel={translate('auth.acceptContinue')}
        >
          <Text style={styles.buttonText}>{translate('auth.acceptContinue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  container: { 
    flex: 1, 
    padding: 24, 
    gap: 16,
  },
  header: { 
    color: COLORS.heading, 
    fontSize: 22, 
    fontWeight: '800', 
    textAlign: 'center',
    marginBottom: 8,
  },
  termsBox: { 
    flex: 1, 
    borderColor: COLORS.border, 
    borderWidth: 1, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  termsContent: { 
    padding: 16,
  },
  title: { 
    color: COLORS.heading, 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 4,
    textAlign: 'center',
  },
  updated: { 
    color: COLORS.muted, 
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  section: { 
    color: COLORS.text, 
    fontSize: 16, 
    fontWeight: '700', 
    marginTop: 16,
    marginBottom: 4,
  },
  text: { 
    color: COLORS.text, 
    lineHeight: 20, 
    fontSize: 14,
  },
  acceptRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  checkbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 6, 
    borderWidth: 2, 
    borderColor: COLORS.border, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  checkboxChecked: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary,
  },
  checkboxMark: { 
    color: '#fff', 
    fontWeight: '900',
    fontSize: 14,
  },
  checkLabel: { 
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
  },
  button: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { 
    opacity: 0.5,
  },
  buttonText: { 
    color: COLORS.primaryText, 
    fontSize: 16, 
    fontWeight: '800',
  },
});
