import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { Badge } from '@/components/ui/Badge';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const { register } = useAuth();
  const { completeOnboarding, updatePreferredName } = usePreferences();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      onRegisterSuccess();
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12 bg-[#100B22]">
      <div className="flex flex-col items-center text-center mb-6">
        <SunnyLogo size="medium" />
        <h1 className="text-2xl font-bold text-white mt-4 mb-1">Join Sunny</h1>
        <p className="text-xs text-[#C6B8E5]">Create your private companion space.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-1 mb-6">
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

        {error && (
          <p className="text-xs text-[#FF8D9A] font-medium py-1">{error}</p>
        )}

        <p className="text-[11px] text-[#9B8AB9] text-center my-3 leading-relaxed">
          Your account will be created securely once account services are connected.
        </p>

        <AppButton
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          variant="primary"
          size="large"
          fullWidth
        />
      </form>

      <div className="text-center text-xs text-[#C6B8E5]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-[#FFD84D] font-bold hover:underline cursor-pointer ml-1"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
