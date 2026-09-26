import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { Badge } from '@/components/ui/Badge';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
}) => {
  const { login, enterAsDemoGuest } = useAuth();
  const { completeOnboarding } = usePreferences();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      onLoginSuccess();
    } else {
      setError(res.error || 'Failed to sign in.');
    }
  };

  const handleDemoGuest = async () => {
    setLoading(true);
    await enterAsDemoGuest();
    await completeOnboarding();
    setLoading(false);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12 bg-[#100B22]">
      <div className="flex flex-col items-center text-center mb-6">
        <SunnyLogo size="large" />
        <h1 className="text-2xl font-bold text-white mt-4 mb-1">Welcome back</h1>
        <p className="text-xs text-[#C6B8E5]">Sign in to your corner of sunshine.</p>
        <div className="mt-2">
          <Badge label="Prototype Demo Mode" variant="yellow" />
        </div>
      </div>

      <form onSubmit={handleSignIn} className="space-y-1 mb-6">
        <AppInput
          label="Email Address"
          placeholder="sunshine@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          keyboardType="email-address"
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

        {error && (
          <p className="text-xs text-[#FF8D9A] font-medium py-1">{error}</p>
        )}

        <div className="pt-2">
          <AppButton
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            variant="primary"
            size="large"
            fullWidth
          />
        </div>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-[#392858]" />
          <span className="text-[11px] text-[#9B8AB9] px-3 uppercase tracking-wider">
            or test with demo profile
          </span>
          <div className="flex-1 h-px bg-[#392858]" />
        </div>

        <AppButton
          title="Explore in Demo Mode"
          onPress={handleDemoGuest}
          variant="secondary"
          fullWidth
        />
      </form>

      <div className="text-center text-xs text-[#C6B8E5]">
        Don't have an account yet?{' '}
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="text-[#FFD84D] font-bold hover:underline cursor-pointer ml-1"
        >
          Create one
        </button>
      </div>
    </div>
  );
};
