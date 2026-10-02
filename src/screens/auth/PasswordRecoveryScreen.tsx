import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
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
    <div className="min-h-screen flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12 bg-[#100B22]">
      <div className="flex flex-col items-center text-center mb-6">
        <SunnyLogo size="large" />
        <h1 className="text-2xl font-bold text-white mt-4 mb-1">Choose a new password</h1>
        <p className="text-xs text-[#C6B8E5]">Your recovery link is ready. Set a new password to continue.</p>
      </div>
      <form onSubmit={handleUpdatePassword} className="space-y-1">
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
        {error && <p className="text-xs text-[#FF8D9A] font-medium py-1">{error}</p>}
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
  );
};