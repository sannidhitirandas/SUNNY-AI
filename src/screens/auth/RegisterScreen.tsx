import React, { useState } from 'react';
import { Mail } from 'lucide-react';
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

// Fixed positions so the sky looks the same every time (no layout jumps).
const SPARKLES: Array<{ left: string; top: string; size: number; delay: number; duration: number }> = [
  { left: '10%', top: '12%', size: 3, delay: 0.2, duration: 3.2 },
  { left: '27%', top: '7%', size: 2, delay: 1.1, duration: 2.8 },
  { left: '73%', top: '9%', size: 3, delay: 0.7, duration: 3.4 },
  { left: '90%', top: '19%', size: 2, delay: 1.5, duration: 3.0 },
  { left: '5%', top: '41%', size: 2, delay: 0.9, duration: 3.6 },
  { left: '95%', top: '47%', size: 3, delay: 0.4, duration: 2.9 },
  { left: '13%', top: '73%', size: 2, delay: 1.8, duration: 3.1 },
  { left: '87%', top: '79%', size: 2, delay: 1.2, duration: 3.3 },
];

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
    <div className="reg-screen relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      <style>{`
        .reg-screen {
          background:
            radial-gradient(ellipse 120% 50% at 50% 108%, rgba(255, 216, 77, 0.22) 0%, rgba(246, 189, 69, 0.10) 40%, rgba(16, 11, 34, 0) 72%),
            linear-gradient(180deg, #100B22 0%, #17102C 55%, #221339 85%, #301a49 100%);
        }
        .reg-sparkle {
          position: absolute;
          border-radius: 9999px;
          background: #FFE9A3;
          box-shadow: 0 0 8px 1px rgba(255, 216, 77, 0.6);
          opacity: 0;
          pointer-events: none;
          animation: reg-twinkle var(--sparkle-duration) ease-in-out var(--sparkle-delay) infinite;
        }
        .reg-halo {
          position: absolute;
          inset: -36px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255, 216, 77, 0.30) 0%, rgba(246, 189, 69, 0.10) 45%, rgba(255, 216, 77, 0) 72%);
          animation: reg-halo-pulse 3.4s ease-in-out infinite;
          pointer-events: none;
        }
        .reg-card {
          background: rgba(33, 22, 58, 0.78);
          border: 1px solid #392858;
          box-shadow: 0 20px 50px -24px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 216, 77, 0.04) inset;
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          animation: reg-fade-up 0.7s ease-out 0.15s both;
        }
        .reg-hero {
          animation: reg-fade-up 0.7s ease-out both;
        }
        .reg-cta {
          border-radius: 0.875rem;
          box-shadow: 0 10px 26px -12px rgba(255, 216, 77, 0.55);
        }
        @keyframes reg-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes reg-halo-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%      { transform: scale(1.12); opacity: 1; }
        }
        @keyframes reg-twinkle {
          0%, 100% { opacity: 0;   transform: scale(0.6); }
          50%      { opacity: 0.9; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reg-hero, .reg-card, .reg-halo { animation: none !important; }
          .reg-sparkle { animation: none !important; opacity: 0.45; }
        }
      `}</style>

      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className="reg-sparkle"
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
        className="relative mx-auto flex min-h-[100dvh] flex-col justify-center px-5 py-10"
        style={{ width: '100%', maxWidth: '26rem' }}
      >
        <div className="reg-hero mb-6 flex flex-col items-center text-center">
          <div className="relative">
            <div className="reg-halo" aria-hidden="true" />
            <div className="relative">
              <SunnyLogo size="medium" />
            </div>
          </div>
          <h1 className="mt-5 mb-1.5 text-3xl font-bold tracking-tight text-white">
            {confirmationRequired ? 'Check your inbox' : 'Join Sunny'}
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-[#C6B8E5]">
            {confirmationRequired
              ? 'One quick step and your little corner of sunshine is ready.'
              : 'Create your secure Sunny account.'}
          </p>
        </div>

        <div className="reg-card rounded-3xl p-5 sm:p-6">
          <form onSubmit={handleRegister} autoComplete="on" className="space-y-1">
            {!confirmationRequired && (
              <>
                <AppInput
                  label="What should Sunny call you?"
                  placeholder="e.g. Alex, Sam, Sunshine"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError('');
                  }}
                  autoCapitalize="words"
                  autoComplete="nickname"
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
                  autoComplete="username"
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                />

                {error && (
                  <p role="alert" className="py-1 text-sm font-medium text-[#FF8D9A]">{error}</p>
                )}

                <div className="pt-2">
                  <div className="reg-cta">
                    <AppButton
                      title="Create Account"
                      onPress={handleRegister}
                      loading={loading}
                      variant="primary"
                      size="large"
                      fullWidth
                    />
                  </div>
                </div>
              </>
            )}

            {confirmationRequired && (
              <>
                <div
                  className="my-2 flex items-start gap-3 rounded-2xl border border-[#A8D9A0]/30 bg-[#A8D9A0]/10 p-4"
                  role="status"
                >
                  <Mail size={20} className="mt-0.5 shrink-0 text-[#A8D9A0]" />
                  <p className="text-sm leading-relaxed text-[#A8D9A0]">
                    Account created. Check {email.trim()} for a verification link. After verifying, return here and sign in below.
                  </p>
                </div>
                <div className="pt-3">
                  <div className="reg-cta">
                    <AppButton
                      title="Continue to Sign In"
                      onPress={onNavigateToLogin}
                      variant="primary"
                      size="large"
                      fullWidth
                    />
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-[#C6B8E5]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="ml-1 cursor-pointer font-bold text-[#FFD84D] hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};