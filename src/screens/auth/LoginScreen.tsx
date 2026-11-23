import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { isValidEmailAddress, validateLoginFields } from '@/lib/authValidation';
import { SunnyAuthHero } from '@/components/brand/SunnyAuthHero';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  registerHardwareBackHandler: (handler: (() => boolean) | null) => void;
}

// Fixed positions so the sky looks the same every time (no layout jumps).
const SPARKLES: Array<{ left: string; top: string; size: number; delay: number; duration: number }> = [
  { left: '10%', top: '14%', size: 3, delay: 0.2, duration: 3.2 },
  { left: '26%', top: '8%', size: 2, delay: 1.1, duration: 2.8 },
  { left: '74%', top: '10%', size: 3, delay: 0.7, duration: 3.4 },
  { left: '90%', top: '20%', size: 2, delay: 1.5, duration: 3.0 },
  { left: '6%', top: '42%', size: 2, delay: 0.9, duration: 3.6 },
  { left: '94%', top: '48%', size: 3, delay: 0.4, duration: 2.9 },
  { left: '14%', top: '72%', size: 2, delay: 1.8, duration: 3.1 },
  { left: '86%', top: '78%', size: 2, delay: 1.2, duration: 3.3 },
];

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
    if (loading) return;
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
    <div className="login-screen sunny-auth-screen relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      <style>{`
        .login-screen {
          isolation: isolate;
          background: radial-gradient(ellipse at 50% 12%, #381A60 0%, #25103F 44%, #12051F 100%);
        }

        .login-sparkle {
          position: absolute;
          z-index: 1;
          border-radius: 9999px;
          background: #D946EF;
          box-shadow: 0 0 8px 1px rgba(218, 199, 169, 0.32);
          opacity: 0;
          pointer-events: none;
          animation: login-twinkle var(--sparkle-duration) ease-in-out var(--sparkle-delay) infinite;
        }

        .login-halo {
          position: absolute;
          inset: -40px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(218, 199, 169, 0.18) 0%, rgba(190, 176, 155, 0.06) 45%, rgba(218, 199, 169, 0) 72%);
          animation: login-halo-pulse 3.4s ease-in-out infinite;
          pointer-events: none;
        }

        .login-card {
          background: linear-gradient(145deg, rgba(35, 23, 58, .88), rgba(19, 12, 35, .9));
          border: 1px solid rgba(190, 151, 239, 0.36);
          box-shadow: 0 26px 72px -28px rgba(0, 0, 0, .62), 0 1px 0 rgba(255, 255, 255, .1) inset, 0 0 36px rgba(123, 76, 184, .12);
          -webkit-backdrop-filter: blur(22px) saturate(1.15);
          backdrop-filter: blur(22px) saturate(1.15);
          animation: login-fade-up 0.7s ease-out 0.15s both;
        }


        .login-cta .sunny-app-button { background: linear-gradient(135deg,#F0ABFC,#D946EF) !important; color: #25103F !important; box-shadow: 0 10px 28px -12px rgba(217,70,239,.55) !important; }
        .login-cta .sunny-app-button:hover { background: linear-gradient(135deg,#F5D0FE,#F0ABFC) !important; }
        .login-hero h1 { color: #fff; text-shadow: 0 2px 16px rgba(10,4,26,.72); }
        .login-hero p { color: rgba(245,237,255,.9); text-shadow: 0 2px 12px rgba(10,4,26,.7); }
        .login-card label {
          color: rgba(255, 255, 255, 0.96);
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
        }
        .login-card .sunny-app-field {
          color: #fff;
          background: rgba(16, 10, 31, 0.48);
          border-color: rgba(190, 151, 239, 0.34);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset;
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
        }
        .login-card .sunny-app-field::placeholder {
          color: rgba(222, 207, 243, 0.72);
        }
        .login-card .sunny-app-field:focus {
          border-color: rgba(217,70,239, 0.9);
          box-shadow: 0 0 0 3px rgba(217,70,239, 0.13);
        }
        .login-hero {
          position: relative;
          z-index: 3;
          animation: login-fade-up 0.7s ease-out both;
        }

        /* Gold focus ring on the text fields */
        .login-card input:focus {
          outline: none;
        }

        .login-cta {
          border-radius: 0.875rem;
          box-shadow: 0 10px 26px -12px rgba(218, 199, 169, 0.28);
        }

        @keyframes login-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes login-halo-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%      { transform: scale(1.12); opacity: 1; }
        }
        @keyframes login-twinkle {
          0%, 100% { opacity: 0;    transform: scale(0.6); }
          50%      { opacity: 0.9;  transform: scale(1); }
        }


        @media (prefers-reduced-motion: reduce) {
          .login-hero,
          .login-card,
          .login-halo {
            animation: none !important;
          }
          .login-sparkle {
            animation: none !important;
            opacity: 0.45;
          }
        }
      `}</style>

      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className="login-sparkle"
          aria-hidden="true"
          style={
            {
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              '--sparkle-delay': `${sparkle.delay}s`,
              '--sparkle-duration': `${sparkle.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Inline width keeps the column narrow on desktop even if global CSS overrides utility classes. */}
      <div
        className="sunny-auth-shell relative mx-auto flex min-h-[100dvh] flex-col justify-center px-5 py-10"
        style={{ width: '100%', maxWidth: '26rem', position: 'relative', zIndex: 2 }}
      >
        <SunnyAuthHero
          compact
          className="login-hero"
          title={forgotPassword ? 'Reset your password' : 'Welcome back'}
          description={forgotPassword
            ? 'We will send a secure reset link if this email has a Sunny account.'
            : 'Good to see you again.'}
        />

        <div className="login-card sunny-auth-card rounded-3xl p-5 sm:p-6">
          <form
            onSubmit={forgotPassword ? handlePasswordReset : handleSignIn}
            autoComplete="on"
            className="space-y-1"
          >
            <AppInput
              label="Email Address"
              placeholder="sunshine@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoComplete="username"
              autoCapitalize="none"
            />

            {!forgotPassword && (
              <AppInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                isPassword
                autoComplete="current-password"
                autoCapitalize="none"
              />
            )}

            {error && (
              <p role="alert" className="py-1 text-sm font-medium text-[#FF8D9A]">{error}</p>
            )}
            {notice && (
              <p role="status" className="py-1 text-sm font-medium text-[#A8D9A0]">{notice}</p>
            )}

            <div className="pt-3">
              <div className="login-cta">
                <AppButton
                  title={forgotPassword ? 'Send Reset Link' : 'Sign In'}
                  onPress={forgotPassword ? handlePasswordReset : handleSignIn}
                  loading={loading}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </div>
            </div>

            {!forgotPassword && (
              <>
                <div className="flex items-center gap-3 py-4" aria-hidden="true">
                  <div className="h-px flex-1 bg-[#4A2A73]" />
                  <span className="text-xs font-medium tracking-wide text-[#C4BFB5]">OR</span>
                  <div className="h-px flex-1 bg-[#4A2A73]" />
                </div>
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={loading || googleLoading}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/20 hover:border-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {googleLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
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
                className="w-full cursor-pointer pt-4 text-sm font-semibold text-[#F0ABFC] hover:underline"
              >
                Forgot password?
              </button>
            )}
            {forgotPassword && (
              <button
                type="button"
                onClick={() => { setForgotPassword(false); setError(''); setNotice(''); }}
                className="w-full cursor-pointer pt-4 text-sm font-semibold text-[#D946EF] hover:underline"
              >
                Back to sign in
              </button>
            )}
          </form>
        </div>

        {!forgotPassword && (
          <div className="mt-6 text-center text-sm text-[#D6C2F2]">
            Don&apos;t have an account yet?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="ml-1 cursor-pointer font-bold text-[#D946EF] hover:underline"
            >
              Create one
            </button>
          </div>
        )}
      </div>
    </div>
  );
};