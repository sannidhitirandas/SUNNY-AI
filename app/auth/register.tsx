import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { Badge } from '@/components/ui/Badge';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { completeOnboarding, updatePreferredName } = usePreferences();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your preferred name or nickname.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      await updatePreferredName(name.trim());
      await completeOnboarding();
      router.replace('/(tabs)');
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SunnyLogo size="medium" />
          <Text style={styles.title}>Join Sunny</Text>
          <Text style={styles.subtitle}>Create your private companion space.</Text>
          <Badge label="Prototype Demo Mode" variant="yellow" style={styles.demoBadge} />
        </View>

        <View style={styles.form}>
          <AppInput
            label="What should Sunny call you?"
            placeholder="e.g. Alex, Sam, Sunshine"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError('');
            }}
          />

          <AppInput
            label="Email Address"
            placeholder="sunshine@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppInput
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            isPassword
          />

          <AppInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError('');
            }}
            isPassword
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.consentNotice}>
            By creating an account in demo mode, your data is securely stored locally on this device.
          </Text>

          <AppButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            size="large"
            fullWidth
            style={styles.btn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  demoBadge: {
    marginTop: Spacing.xs,
  },
  form: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  consentNotice: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  btn: {
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  linkText: {
    ...Typography.body,
    color: Colors.sunshineYellow,
    fontWeight: '600',
  },
});
