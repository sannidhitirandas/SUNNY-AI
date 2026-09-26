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

export default function LoginScreen() {
  const router = useRouter();
  const { login, enterAsDemoGuest } = useAuth();
  const { completeOnboarding } = usePreferences();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignIn = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in both your email and password.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      await completeOnboarding();
      router.replace('/(tabs)');
    } else {
      setError(res.error || 'Failed to sign in.');
    }
  };

  const handleDemoGuest = async () => {
    setLoading(true);
    await enterAsDemoGuest();
    await completeOnboarding();
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SunnyLogo size="large" />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your corner of sunshine.</Text>
          <Badge label="Prototype Demo Mode" variant="yellow" style={styles.demoBadge} />
        </View>

        <View style={styles.form}>
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
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            isPassword
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <AppButton
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            variant="primary"
            size="large"
            fullWidth
            style={styles.signInBtn}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or test with demo profile</Text>
            <View style={styles.dividerLine} />
          </View>

          <AppButton
            title="Explore in Demo Mode"
            onPress={handleDemoGuest}
            variant="secondary"
            fullWidth
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account yet? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.linkText}>Create one</Text>
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
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  demoBadge: {
    marginTop: Spacing.xs,
  },
  form: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  signInBtn: {
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginHorizontal: Spacing.sm,
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
