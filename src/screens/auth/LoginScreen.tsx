import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { isValidEmailAddress, validateLoginFields } from '@/lib/authValidation';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  registerHardwareBackHandler: (handler: (() => boolean) | null) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  registerHardwareBackHandler,
}) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    registerHardwareBackHandler(() => {
      if (!forgotPassword) return false;
      setForgotPassword(false);
      setError('');
      setNotice('');
      return true;
    });
    return () => registerHardwareBackHandler(null);
  }, [forgotPassword, registerHardwareBackHandler]);

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

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (!result.success) {
        setError(result.error || 'Unable to continue with Google.');
        setGoogleLoading(false);
      }
      // On success Supabase redirects to Google and returns to Sunny after consent.
    } catch {
      setError('Sunny could not start Google sign-in. Check your connection and try again.');
      setGoogleLoading(false);
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
          <>
            <div className="flex items-center gap-3 py-3" aria-hidden="true">
              <div className="h-px flex-1 bg-[#392858]" />
              <span className="text-[11px] font-medium text-[#9B8AB9]">OR</span>
              <div className="h-px flex-1 bg-[#392858]" />
            </div>
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={loading || googleLoading}
              className="w-full min-h-12 flex items-center justify-center gap-3 rounded-xl border border-[#493660] bg-[#21163A] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#302149] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
              ) : (
                <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.06 13.22l7.98 6.19C12.93 13.72 18.05 9.5 24 9.5Z" transform="translate(0 4)" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.94 46.98 24.55Z" />
                  <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.53 10.78l8-6.19Z" transform="translate(1 0)" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-5.95 0-11.07-4.22-12.96-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -1)" />
                </svg>
              )}
              Continue with Google
            </button>
          </>
        )}
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
