import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SunnyAuthHero } from '@/components/brand/SunnyAuthHero';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';

export const PasswordRecoveryScreen: React.FC = () => {
  const { completePasswordRecovery, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await completePasswordRecovery(password);
    setLoading(false);
    if (!result.success) setError(result.error || 'Unable to update your password.');
  };

  return (
    <div className="sunny-recovery-screen sunny-auth-screen relative flex min-h-[100dvh] w-full flex-col justify-center overflow-x-hidden overflow-y-auto px-6 py-12">
      <style>{`
        .sunny-recovery-screen { isolation:isolate; background:transparent; }
        .sunny-recovery-video {
          position:fixed; z-index:0; inset:0; overflow:hidden; pointer-events:none; background:#121417;
        }
        .sunny-recovery-video video {
          position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center;
          opacity:1; filter:none;
        }
        .sunny-recovery-video::after { content:''; position:absolute; inset:0; background:transparent; }
        .sunny-recovery-rays svg line { stroke:#E8E1D5 !important; }
        .sunny-recovery-rays svg stop:nth-child(1) { stop-color:#F8F4EB; }
        .sunny-recovery-rays svg stop:nth-child(2) { stop-color:#E5D8C3; }
        .sunny-recovery-rays svg stop:nth-child(3) { stop-color:#BFAF98; }
        .sunny-recovery-rays > div > div:first-child { opacity:0 !important; }
        .sunny-recovery-card .sunny-app-button { background:linear-gradient(135deg,#FFE98A,#FFD84D) !important; color:#21152F !important; box-shadow:0 10px 28px -12px rgba(255,216,77,.55) !important; }
        .sunny-recovery-content { position:relative; z-index:1; width:100%; max-width:24rem; margin:0 auto; }
        .sunny-recovery-card {
          background:linear-gradient(145deg,rgba(35,23,58,.9),rgba(19,12,35,.92)); border:1px solid rgba(190,151,239,.36);
          box-shadow:0 26px 72px -28px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.1),0 0 36px rgba(123,76,184,.12);
          -webkit-backdrop-filter:blur(22px) saturate(1.15); backdrop-filter:blur(22px) saturate(1.15);
        }
        .sunny-recovery-content h1,.sunny-recovery-content p,.sunny-recovery-card label {
          text-shadow:0 1px 2px rgba(0,0,0,.98),0 3px 10px rgba(0,0,0,.95),0 8px 24px rgba(0,0,0,.88);
        }
        .sunny-recovery-card label { color:rgba(255,255,255,.96); }
        .sunny-recovery-card .sunny-app-field {
          color:#fff; background:rgba(16,10,31,.48); border-color:rgba(190,151,239,.34);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.08);
          -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
        }
        .sunny-recovery-card .sunny-app-field::placeholder { color:rgba(255,255,255,.68); }
        .sunny-recovery-card .sunny-app-field:focus {
          border-color:rgba(255,216,77,.9); box-shadow:0 0 0 3px rgba(255,216,77,.13);
        }
        .sunny-recovery-card input:focus { outline:none; }
        @media(max-width:640px) {
          .sunny-recovery-video { width:100vw; height:100dvh; }
          .sunny-recovery-video video { min-width:100%; min-height:100%; transform:translateZ(0); }
        }
      `}</style>
      <div className="sunny-recovery-video" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="metadata">
          <source src="/sunny-home-background.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="sunny-recovery-content">
        <SunnyAuthHero
          compact
          title="Choose a new password"
          description="Your recovery link is ready. Set a new password to continue."
        />
        <form onSubmit={handleUpdatePassword} className="sunny-recovery-card space-y-1 rounded-3xl p-5">
          <AppInput
            label="New Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            isPassword
          />
          <AppInput
            label="Confirm New Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />
          {error && <p className="py-1 text-xs font-medium text-[#FF8D9A]">{error}</p>}
          <AppButton
            title="Update Password"
            onPress={handleUpdatePassword}
            loading={loading}
            variant="primary"
            size="large"
            fullWidth
          />
          <AppButton
            title="Cancel and sign out"
            onPress={() => void logout()}
            variant="ghost"
            fullWidth
          />
        </form>
      </div>
    </div>
  );
};
