import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { isValidEmailAddress, validateLoginFields } from '@/lib/authValidation';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
}) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const validationError = validateLoginFields(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.error || 'Failed to sign in.');
      }
    } catch {
      setError('Sunny could not reach the authentication service. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setNotice('');
    if (!isValidEmailAddress(email)) {
      setError('Enter the email address for your Sunny account.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.requestPasswordReset(email);
      if (result.success) {
        setNotice('If a Sunny account uses this email, a reset link will arrive shortly. Check your inbox and spam folder.');
      } else {
        setError(result.error || 'Unable to send a reset email.');
      }
    } catch {
      setError('Sunny could not send a reset email. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12 bg-[#100B22]">
      <div className="flex flex-col items-center text-center mb-6">
        <SunnyLogo size="large" />
        <h1 className="text-2xl font-bold text-white mt-4 mb-1">{forgotPassword ? 'Reset your password' : 'Welcome back'}</h1>
        <p className="text-xs text-[#C6B8E5]">{forgotPassword ? 'We will send a secure reset link if this email has a Sunny account.' : 'Sign in to your corner of sunshine.'}</p>
      </div>

      <form onSubmit={forgotPassword ? handlePasswordReset : handleSignIn} className="space-y-1 mb-6">
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

        {!forgotPassword && <AppInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (error) setError('');
          }}
          isPassword
        />}

        {error && (
          <p className="text-xs text-[#FF8D9A] font-medium py-1">{error}</p>
        )}
        {notice && <p className="text-xs text-[#A8D9A0] font-medium py-1">{notice}</p>}

        <div className="pt-2">
          <AppButton
            title={forgotPassword ? 'Send Reset Link' : 'Sign In'}
            onPress={forgotPassword ? handlePasswordReset : handleSignIn}
            loading={loading}
            variant="primary"
            size="large"
            fullWidth
          />
        </div>
        {!forgotPassword && (
          <button
            type="button"
            onClick={() => { setForgotPassword(true); setError(''); setNotice(''); }}
            className="w-full text-xs text-[#FFD84D] font-semibold pt-3 hover:underline cursor-pointer"
          >
            Forgot password?
          </button>
        )}
        {forgotPassword && (
          <button
            type="button"
            onClick={() => { setForgotPassword(false); setError(''); setNotice(''); }}
            className="w-full text-xs text-[#FFD84D] font-semibold pt-3 hover:underline cursor-pointer"
          >
            Back to sign in
          </button>
        )}
      </form>

      {!forgotPassword && <div className="text-center text-xs text-[#C6B8E5]">
        Don't have an account yet?{' '}
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="text-[#FFD84D] font-bold hover:underline cursor-pointer ml-1"
        >
          Create one
        </button>
      </div>}
    </div>
  );
};
