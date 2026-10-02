import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { validateRegistrationFields } from '@/lib/authValidation';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
  registerHardwareBackHandler: (handler: (() => boolean) | null) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  registerHardwareBackHandler,
}) => {
  const { register } = useAuth();
  const { completeOnboarding, updatePreferredName } = usePreferences();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  React.useEffect(() => {
    registerHardwareBackHandler(() => {
      onNavigateToLogin();
      return true;
    });
    return () => registerHardwareBackHandler(null);
  }, [onNavigateToLogin, registerHardwareBackHandler]);

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const validationError = validateRegistrationFields({ name, email, password, confirmPassword });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password);
      if (!res.success) {
        setError(res.error || 'Registration failed.');
        return;
      }

      await updatePreferredName(name.trim());
      if (res.requiresEmailConfirmation) {
        setConfirmationRequired(true);
        return;
      }

      await completeOnboarding();
      onRegisterSuccess();
    } catch {
      setError('Sunny could not reach the authentication service. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12 bg-[#100B22]">
      <div className="flex flex-col items-center text-center mb-6">
        <SunnyLogo size="medium" />
        <h1 className="text-2xl font-bold text-white mt-4 mb-1">Join Sunny</h1>
        <p className="text-xs text-[#C6B8E5]">Create your secure Sunny account.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-1 mb-6">
        {!confirmationRequired && <>
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

        {error && (
          <p className="text-xs text-[#FF8D9A] font-medium py-1">{error}</p>
        )}

        <AppButton
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          variant="primary"
          size="large"
          fullWidth
        />
        </>}

        {confirmationRequired && (
          <div className="text-[11px] text-[#A8D9A0] text-center my-3 leading-relaxed" role="status">
            Account created. Check {email.trim()} for a verification link. After verifying, return here and sign in below.
          </div>
        )}
        {confirmationRequired && (
          <AppButton
            title="Continue to Sign In"
            onPress={onNavigateToLogin}
            variant="primary"
            size="large"
            fullWidth
          />
        )}
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
