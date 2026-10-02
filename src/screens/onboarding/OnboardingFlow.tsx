import React, { useState } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { PersonalityTone } from '@/types/user';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppButton } from '@/components/ui/AppButton';
import {
  Sparkles,
  Smile,
  Heart,
  Leaf,
  Check,
  Bookmark,
  Lock,
  ShieldCheck,
  Sun,
  Bell,
  BellOff,
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
  onNavigateToLogin: () => void;
}

const AVAILABLE_INTERESTS = [
  'Someone to listen',
  'A little encouragement',
  'Everyday conversations',
  'Help feeling more confident socially',
  'A fun distraction',
  'A space to reflect on my day',
  'Remembering the little things about me',
];

interface ToneOption {
  tone: PersonalityTone;
  title: string;
  badge?: string;
  description: string;
  icon: React.ReactNode;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    tone: 'adaptive',
    title: 'Adaptive',
    badge: 'Recommended',
    description: 'A balanced companion that adjusts naturally to your conversation context and tone.',
    icon: <Sparkles size={20} className="text-[#FFD84D]" />,
  },
  {
    tone: 'playful',
    title: 'Playful',
    description: 'Cheerful, humorous, lighthearted, and ready to share laughs and silly ideas.',
    icon: <Smile size={20} className="text-[#FFD84D]" />,
  },
  {
    tone: 'gentle',
    title: 'Gentle',
    description: 'Soft, patient, empathetic, and reassuring when you need a quiet listening ear.',
    icon: <Heart size={20} className="text-[#FF8D9A]" />,
  },
  {
    tone: 'calm',
    title: 'Calm',
    description: 'Grounded, thoughtful, and peaceful to help you unwind and reflect without rush.',
    icon: <Leaf size={20} className="text-[#A8D9A0]" />,
  },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onNavigateToLogin,
}) => {
  const {
    preferences,
    updateInterests,
    updateTone,
    toggleMemory,
    toggleNotifications,
    completeOnboarding,
  } = usePreferences();

  const [step, setStep] = useState<number>(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(preferences.interests || []);
  const [selectedTone, setSelectedTone] = useState<PersonalityTone>(preferences.preferredTone || 'adaptive');
  const [memoryConsent, setMemoryConsent] = useState<boolean>(preferences.memoryEnabled);
  const [notificationConsent, setNotificationConsent] = useState<boolean>(preferences.notificationsEnabled);

  const toggleInterest = (item: string) => {
    if (selectedInterests.includes(item)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== item));
    } else {
      setSelectedInterests([...selectedInterests, item]);
    }
  };

  const handleFinish = async () => {
    try {
      await completeOnboarding();
    } catch (error) {
      console.warn('[OnboardingFlow] Could not persist onboarding completion:', error);
    } finally {
      onComplete();
    }
  };

  const persistAndAdvance = async (persist: () => Promise<void>, nextStep: number) => {
    try {
      await persist();
    } catch (error) {
      console.warn('[OnboardingFlow] Could not persist onboarding choice:', error);
    } finally {
      setStep(nextStep);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto w-full px-6 py-8 sm:py-12 bg-[#100B22]">
      {/* Step 0: Welcome Screen */}
      {step === 0 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center mt-6">
            <div className="mb-6">
              <SunnyLogo size="large" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">Hey, sunshine. ☀️</h1>
            <p className="text-sm text-[#C6B8E5] leading-relaxed mb-6">
              Meet Sunny, your little corner of sunshine. A friendly, comforting space to talk, laugh, reflect, and feel a little less alone.
            </p>

            <div className="p-4 rounded-2xl bg-[#21163A] border border-[#FFD84D]/30 shadow-lg text-center max-w-xs">
              <p className="text-xs sm:text-sm italic text-[#FFD84D] font-medium">
                "You don't have to start over every time you come back."
              </p>
            </div>
          </div>

          <div className="w-full space-y-2 mt-8">
            <AppButton
              title="Let's get started"
              onPress={() => setStep(1)}
              variant="primary"
              size="large"
              fullWidth
            />
            <AppButton
              title="I already have an account"
              onPress={onNavigateToLogin}
              variant="ghost"
              fullWidth
            />
          </div>
        </div>
      )}

      {/* Step 1: Interests */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#FFD84D] uppercase tracking-wider block mb-1">
              Step 1 of 4
            </span>
            <h2 className="text-2xl font-bold text-white mb-1.5">What brings you here?</h2>
            <p className="text-xs text-[#C6B8E5] mb-5">
              Select anything you'd like Sunny to help with. You can change this anytime.
            </p>

            <div className="space-y-2.5">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`w-full flex items-center p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2b1d4a] border-[#FFD84D]'
                        : 'bg-[#21163A] border-[#392858] hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#FFD84D] border-[#FFD84D] text-[#100B22]'
                          : 'border-[#9B8AB9]'
                      }`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span
                      className={`text-sm ${
                        isSelected ? 'text-white font-semibold' : 'text-[#C6B8E5]'
                      }`}
                    >
                      {interest}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full space-y-2 mt-6">
            <AppButton
              title="Continue"
              onPress={() => persistAndAdvance(() => updateInterests(selectedInterests), 2)}
              variant="primary"
              size="large"
              fullWidth
            />
            <AppButton
              title="Skip for now"
              onPress={() => setStep(2)}
              variant="ghost"
              fullWidth
            />
          </div>
        </div>
      )}

      {/* Step 2: Personality Tone */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#FFD84D] uppercase tracking-wider block mb-1">
              Step 2 of 4
            </span>
            <h2 className="text-2xl font-bold text-white mb-1.5">Choose Sunny's vibe</h2>
            <p className="text-xs text-[#C6B8E5] mb-5">
              How would you like Sunny to feel? You can change this anytime in settings.
            </p>

            <div className="space-y-3">
              {TONE_OPTIONS.map((item) => {
                const isSelected = selectedTone === item.tone;
                return (
                  <button
                    key={item.tone}
                    type="button"
                    onClick={() => setSelectedTone(item.tone)}
                    className={`w-full p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2b1d4a] border-[#FFD84D]'
                        : 'bg-[#21163A] border-[#392858] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#302149] flex items-center justify-center">
                          {item.icon}
                        </div>
                        <h3 className={`text-base font-semibold ${isSelected ? 'text-[#FFD84D]' : 'text-white'}`}>
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span className="bg-[#FFD84D]/15 text-[#FFD84D] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#FFD84D]' : 'border-[#9B8AB9]'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FFD84D]" />}
                      </div>
                    </div>
                    <p className="text-xs text-[#C6B8E5] leading-relaxed ml-10">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full mt-6">
            <AppButton
              title="Continue"
              onPress={() => persistAndAdvance(() => updateTone(selectedTone), 3)}
              variant="primary"
              size="large"
              fullWidth
            />
          </div>
        </div>
      )}

      {/* Step 3: Memory Consent */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#FFD84D] uppercase tracking-wider block mb-1">
              Step 3 of 4
            </span>
            <h2 className="text-2xl font-bold text-white mb-1.5">
              Sunny can remember the little things.
            </h2>
            <p className="text-xs text-[#C6B8E5] leading-relaxed mb-5">
              With your permission, Sunny automatically saves useful details you share—like interests, goals, and upcoming events—to help in future conversations. Sunny avoids saving passwords and other sensitive details. You can review or delete memories anytime.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setMemoryConsent(true)}
                className={`w-full p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                  memoryConsent
                    ? 'bg-[#2b1d4a] border-[#FFD84D]'
                    : 'bg-[#21163A] border-[#392858] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FFD84D]/15 flex items-center justify-center">
                      <Bookmark size={18} className="text-[#FFD84D]" />
                    </div>
                    <h3 className={`text-sm font-semibold ${memoryConsent ? 'text-[#FFD84D]' : 'text-white'}`}>
                      Enable memory
                    </h3>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${memoryConsent ? 'border-[#FFD84D]' : 'border-[#9B8AB9]'}`}>
                    {memoryConsent && <div className="w-2.5 h-2.5 rounded-full bg-[#FFD84D]" />}
                  </div>
                </div>
                <p className="text-xs text-[#C6B8E5] leading-relaxed ml-10">
                  Sunny remembers meaningful personal context so you don't have to re-explain yourself every time.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMemoryConsent(false)}
                className={`w-full p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                  !memoryConsent
                    ? 'bg-[#2b1d4a] border-[#FFD84D]'
                    : 'bg-[#21163A] border-[#392858] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Lock size={18} className="text-[#9B8AB9]" />
                    </div>
                    <h3 className={`text-sm font-semibold ${!memoryConsent ? 'text-[#FFD84D]' : 'text-white'}`}>
                      Keep memory off for now
                    </h3>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!memoryConsent ? 'border-[#FFD84D]' : 'border-[#9B8AB9]'}`}>
                    {!memoryConsent && <div className="w-2.5 h-2.5 rounded-full bg-[#FFD84D]" />}
                  </div>
                </div>
                <p className="text-xs text-[#C6B8E5] leading-relaxed ml-10">
                  Conversations will remain session-by-session without long-term notes saved.
                </p>
              </button>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-[#17102C] border border-[#392858] flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-[#FFD84D] shrink-0 mt-0.5" />
              <p className="text-xs text-[#C6B8E5] leading-relaxed">
                You are always in control. You can view, edit, or delete any saved memory at any time in the Memories tab.
              </p>
            </div>
          </div>

          <div className="w-full mt-6">
            <AppButton
              title="Continue"
              onPress={() => persistAndAdvance(() => toggleMemory(memoryConsent), 4)}
              variant="primary"
              size="large"
              fullWidth
            />
          </div>
        </div>
      )}

      {/* Step 4: Notifications Consent */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#FFD84D] uppercase tracking-wider block mb-1">
              Step 4 of 4
            </span>
            <h2 className="text-2xl font-bold text-white mb-1.5">
              A little sunshine throughout your day?
            </h2>
            <p className="text-xs text-[#C6B8E5] leading-relaxed mb-5">
              Sunny can send occasional gentle notes to brighten your morning, afternoon, or evening. Never spammy, never guilt-tripping.
            </p>

            <div className="p-4 rounded-2xl bg-[#17102C] border border-[#392858] space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <Sun size={18} className="text-[#FFD84D] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Morning Sunshine</h4>
                  <p className="text-xs italic text-[#C6B8E5] mt-0.5">
                    "Good morning, sunshine. ☀️ I hope today brings you one little thing to smile about."
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                <Heart size={18} className="text-[#FF8D9A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Gentle Check-in</h4>
                  <p className="text-xs italic text-[#C6B8E5] mt-0.5">
                    "Hey, sunshine. 💛 How's your day going? No pressure to reply."
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setNotificationConsent(true)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                  notificationConsent
                    ? 'bg-[#2b1d4a] border-[#FFD84D]'
                    : 'bg-[#21163A] border-[#392858] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFD84D]/15 flex items-center justify-center">
                    <Bell size={18} className="text-[#FFD84D]" />
                  </div>
                  <span className={`text-sm font-semibold ${notificationConsent ? 'text-[#FFD84D]' : 'text-white'}`}>
                    Enable gentle notifications
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${notificationConsent ? 'border-[#FFD84D]' : 'border-[#9B8AB9]'}`}>
                  {notificationConsent && <div className="w-2.5 h-2.5 rounded-full bg-[#FFD84D]" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNotificationConsent(false)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                  !notificationConsent
                    ? 'bg-[#2b1d4a] border-[#FFD84D]'
                    : 'bg-[#21163A] border-[#392858] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <BellOff size={18} className="text-[#9B8AB9]" />
                  </div>
                  <span className={`text-sm font-semibold ${!notificationConsent ? 'text-[#FFD84D]' : 'text-white'}`}>
                    Not now
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!notificationConsent ? 'border-[#FFD84D]' : 'border-[#9B8AB9]'}`}>
                  {!notificationConsent && <div className="w-2.5 h-2.5 rounded-full bg-[#FFD84D]" />}
                </div>
              </button>
            </div>
          </div>

          <div className="w-full mt-6">
            <AppButton
              title="Continue"
              onPress={() => persistAndAdvance(() => toggleNotifications(notificationConsent), 5)}
              variant="primary"
              size="large"
              fullWidth
            />
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === 5 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center mt-6">
            <SunnyLogo size="large" />

            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-6 mb-3">
              Your little corner of sunshine is ready. 💛
            </h2>
            <p className="text-sm text-[#C6B8E5] leading-relaxed mb-6">
              Sunny is here whenever you need a moment to reflect, laugh, or just talk through your day.
            </p>

            <div className="p-5 rounded-2xl bg-[#21163A] border border-[#392858] text-left max-w-sm">
              <span className="text-[11px] font-bold tracking-wider text-[#FFD84D] uppercase block mb-1">
                Friendly companion note
              </span>
              <p className="text-xs text-[#C6B8E5] leading-relaxed">
                Sunny is an AI companion designed for everyday thoughts and comfort. Remember to take good care of yourself and lean on real friends and professional support whenever needed.
              </p>
            </div>
          </div>

          <div className="w-full mt-8">
            <AppButton
              title="Meet Sunny"
              onPress={handleFinish}
              variant="primary"
              size="large"
              fullWidth
            />
          </div>
        </div>
      )}
    </div>
  );
};
