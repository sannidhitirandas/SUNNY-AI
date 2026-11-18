import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePreferences } from '@/context/PreferencesContext';
import { notificationService } from '@/services/notificationService';
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
  ArrowLeft,
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
  onNavigateToLogin: () => void;
  registerHardwareBackHandler: (handler: (() => boolean) | null) => void;
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
    title: 'The Mix',
    badge: 'Recommended',
    description: 'A natural blend of listening, laughter, and encouragement that adapts to what you need.',
    icon: <Sparkles size={20} className="text-[#FFD84D]" />,
  },
  {
    tone: 'playful',
    title: 'Funny Friend',
    description: 'Playful banter, silly ideas, and laughs when the moment is right—without joking over real pain.',
    icon: <Smile size={20} className="text-[#FFD84D]" />,
  },
  {
    tone: 'gentle',
    title: 'Listener & Supportive',
    description: 'Listens first, takes your feelings seriously, and asks thoughtful questions before offering advice.',
    icon: <Heart size={20} className="text-[#FF8D9A]" />,
  },
  {
    tone: 'calm',
    title: 'Encourager',
    description: 'Believes in you realistically, celebrates small wins, and helps you find one manageable next step.',
    icon: <Leaf size={20} className="text-[#A8D9A0]" />,
  },
];

const TOTAL_STEPS = 4;

// Fixed positions so the sky looks the same every time (no layout jumps).
const SPARKLES: Array<{ left: string; top: string; size: number; delay: number; duration: number }> = [
  { left: '10%', top: '10%', size: 3, delay: 0.2, duration: 3.2 },
  { left: '28%', top: '6%', size: 2, delay: 1.1, duration: 2.8 },
  { left: '72%', top: '8%', size: 3, delay: 0.7, duration: 3.4 },
  { left: '91%', top: '18%', size: 2, delay: 1.5, duration: 3.0 },
  { left: '5%', top: '40%', size: 2, delay: 0.9, duration: 3.6 },
  { left: '95%', top: '46%', size: 3, delay: 0.4, duration: 2.9 },
  { left: '12%', top: '74%', size: 2, delay: 1.8, duration: 3.1 },
  { left: '88%', top: '80%', size: 2, delay: 1.2, duration: 3.3 },
];

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

const OnboardingStyles: React.FC = () => (
  <style>{`
    .ob-screen {
      isolation: isolate;
      background: transparent;
    }
    .ob-video-backdrop {
      position: fixed;
      z-index: 0;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      background: #100B22;
    }
    .ob-background-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      opacity: 1;
      filter: none;
    }
    .ob-video-overlay {
      position: absolute;
      inset: 0;
      background: transparent;
    }
    .ob-sparkle { z-index: 1; }
    .sunny-onboarding-shell {
      position: relative;
      z-index: 2;
    }
    .sunny-onboarding-choice {
      background: rgba(20, 16, 35, 0.48);
      border-color: rgba(255, 255, 255, 0.28);
      -webkit-backdrop-filter: blur(16px) saturate(1.15);
      backdrop-filter: blur(16px) saturate(1.15);
    }
    .sunny-onboarding-choice[aria-pressed="true"] {
      background: rgba(255, 216, 77, 0.18);
      border-color: rgba(255, 216, 77, 0.78);
    }
    .sunny-onboarding-quote {
      background: rgba(20, 16, 35, 0.42) !important;
      border-color: rgba(255, 255, 255, 0.32) !important;
      -webkit-backdrop-filter: blur(18px);
      backdrop-filter: blur(18px);
    }
    .sunny-onboarding-shell h1,
    .sunny-onboarding-shell h2,
    .sunny-onboarding-shell p {
      text-shadow: 0 2px 16px rgba(12, 8, 24, 0.42);
    }
    .ob-sparkle {
      position: absolute;
      border-radius: 9999px;
      background: #FFE9A3;
      box-shadow: 0 0 8px 1px rgba(255, 216, 77, 0.6);
      opacity: 0;
      pointer-events: none;
      animation: ob-twinkle var(--sparkle-duration) ease-in-out var(--sparkle-delay) infinite;
    }
    .ob-halo {
      position: absolute;
      inset: -46px;
      border-radius: 9999px;
      background: radial-gradient(circle, rgba(255, 216, 77, 0.32) 0%, rgba(246, 189, 69, 0.11) 45%, rgba(255, 216, 77, 0) 72%);
      animation: ob-halo-pulse 3.4s ease-in-out infinite;
      pointer-events: none;
    }
    .ob-step {
      animation: ob-fade-up 0.45s ease-out both;
    }
    .ob-cta {
      border-radius: 0.875rem;
      box-shadow: 0 10px 26px -12px rgba(255, 216, 77, 0.55);
    }
    .ob-progress-fill {
      transform-origin: left center;
      animation: ob-bar-fill 0.5s ease-out both;
    }
    @keyframes ob-fade-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ob-halo-pulse {
      0%, 100% { transform: scale(1);    opacity: 0.85; }
      50%      { transform: scale(1.12); opacity: 1; }
    }
    @keyframes ob-twinkle {
      0%, 100% { opacity: 0;   transform: scale(0.6); }
      50%      { opacity: 0.9; transform: scale(1); }
    }
    @keyframes ob-bar-fill {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    @media (max-width: 640px) {
      .ob-video-backdrop { position: fixed; inset: 0; width: 100vw; height: 100dvh; }
      .ob-background-video { display: block; width: 100%; height: 100%; min-width: 100%; min-height: 100%; object-fit: cover; object-position: center center; transform: translateZ(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .ob-step, .ob-halo, .ob-progress-fill { animation: none !important; }
      .ob-sparkle { animation: none !important; opacity: 0.45; }
    }
  `}</style>
);

const SunnyHero: React.FC = () => (
  <div className="relative">
    <div className="ob-halo" aria-hidden="true" />
    <div className="relative">
      <SunnyLogo size="large" />
    </div>
  </div>
);

interface ProgressHeaderProps {
  step: number;
  onBack: () => void;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ step, onBack }) => (
  <div className="mb-6">
    <div className="mb-3 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-[#C6B8E5] transition-colors hover:text-white"
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <span className="text-xs font-bold uppercase tracking-wider text-[#FFD84D]">
        Step {step} of {TOTAL_STEPS}
      </span>
    </div>
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step}>
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
        <div key={index} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#392858]">
          {index < step && (
            <div className="ob-progress-fill h-full w-full rounded-full bg-gradient-to-r from-[#F6BD45] to-[#FFD84D]" />
          )}
        </div>
      ))}
    </div>
  </div>
);

interface ChoiceCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  badge?: string;
  description?: string;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({
  selected,
  onClick,
  icon,
  iconBg = 'bg-[#302149]',
  title,
  badge,
  description,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`sunny-onboarding-choice w-full cursor-pointer rounded-2xl border p-4 text-left transition-all ${
      selected
        ? 'border-[#FFD84D] bg-[#2b1d4a] shadow-[0_0_0_1px_rgba(255,216,77,0.25),0_12px_28px_-18px_rgba(255,216,77,0.5)]'
        : 'border-[#392858] bg-[#21163A]/80 hover:border-white/25'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`text-base font-semibold ${selected ? 'text-[#FFD84D]' : 'text-white'}`}>{title}</h3>
          {badge && (
            <span className="rounded-full bg-[#FFD84D]/15 px-2 py-0.5 text-[10px] font-bold text-[#FFD84D]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-[#C6B8E5]">{description}</p>
        )}
      </div>
      <div
        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-[#FFD84D]' : 'border-[#9B8AB9]'
        }`}
        aria-hidden="true"
      >
        {selected && <div className="h-2.5 w-2.5 rounded-full bg-[#FFD84D]" />}
      </div>
    </div>
  </button>
);

const PrimaryAction: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ob-cta">{children}</div>
);

/* ------------------------------------------------------------------ */
/* Main flow                                                           */
/* ------------------------------------------------------------------ */

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onNavigateToLogin,
  registerHardwareBackHandler,
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
  const [notificationPermissionNote, setNotificationPermissionNote] = useState<string | null>(null);

  React.useEffect(() => {
    registerHardwareBackHandler(() => {
      if (step === 0) return false;
      setStep((currentStep) => currentStep - 1);
      return true;
    });
    return () => registerHardwareBackHandler(null);
  }, [step, registerHardwareBackHandler]);

  const goBack = () => setStep((currentStep) => Math.max(0, currentStep - 1));

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

  const handleNotificationContinue = async () => {
    let selected = notificationConsent;
    setNotificationPermissionNote(null);
    if (selected && !preferences.notificationsEnabled && Capacitor.getPlatform() === 'android') {
      try {
        const status = await notificationService.requestPermissionFromUser();
        if (status.permission !== 'granted' || !status.systemEnabled) {
          selected = false;
          setNotificationConsent(false);
          setNotificationPermissionNote('Android notification access was not granted. You can enable it later in Settings.');
        }
      } catch {
        selected = false;
        setNotificationConsent(false);
        setNotificationPermissionNote('Sunny could not request Android notification access. You can try again later in Settings.');
      }
    }
    await persistAndAdvance(() => toggleNotifications(selected), 5);
  };

  return (
    <div className="ob-screen sunny-onboarding relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      <OnboardingStyles />

      <div className="ob-video-backdrop" aria-hidden="true">
        <video className="ob-background-video" autoPlay muted loop playsInline preload="metadata">
          <source src="/sunny-home-background.mp4" type="video/mp4" />
        </video>
        <span className="ob-video-overlay" />
      </div>

      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className="ob-sparkle"
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
        className="sunny-onboarding-shell relative mx-auto flex min-h-[100dvh] flex-col px-5 py-6 sm:py-10"
        style={{ width: '100%', maxWidth: '28rem' }}
      >
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div key="step-0" className="ob-step flex flex-1 flex-col justify-between">
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="mb-8">
                <SunnyHero />
              </div>

              <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">Hey, sunshine. ☀️</h1>
              <p className="mb-6 max-w-xs text-base leading-relaxed text-[#C6B8E5]">
                Meet Sunny, your little corner of sunshine. A friendly, comforting space to talk, laugh, reflect, and feel a little less alone.
              </p>

              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#392858] bg-[#21163A]/80 px-3 py-1.5 text-xs font-medium text-[#C6B8E5]">
                  <Heart size={13} className="text-[#FF8D9A]" /> Listens
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#392858] bg-[#21163A]/80 px-3 py-1.5 text-xs font-medium text-[#C6B8E5]">
                  <Smile size={13} className="text-[#FFD84D]" /> Laughs with you
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#392858] bg-[#21163A]/80 px-3 py-1.5 text-xs font-medium text-[#C6B8E5]">
                  <Leaf size={13} className="text-[#A8D9A0]" /> Cheers you on
                </span>
              </div>

              <div className="sunny-onboarding-quote max-w-xs rounded-2xl border border-[#FFD84D]/30 bg-[#21163A]/80 p-4 text-center shadow-lg">
                <p className="text-sm font-medium italic text-[#FFD84D]">
                  &ldquo;You don&rsquo;t have to start over every time you come back.&rdquo;
                </p>
              </div>
            </div>

            <div className="mt-8 w-full space-y-2">
              <PrimaryAction>
                <AppButton
                  title="Let's get started"
                  onPress={() => setStep(1)}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </PrimaryAction>
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
          <div key="step-1" className="ob-step flex flex-1 flex-col justify-between">
            <div>
              <ProgressHeader step={1} onBack={goBack} />
              <h2 className="mb-1.5 text-3xl font-bold tracking-tight text-white">What brings you here?</h2>
              <p className="mb-6 text-sm leading-relaxed text-[#C6B8E5]">
                Select anything you'd like Sunny to help with. You can change this anytime.
              </p>

              <div className="flex flex-wrap gap-2.5">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      aria-pressed={isSelected}
                      className={`sunny-onboarding-interest inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-left text-sm transition-all ${
                        isSelected
                          ? 'border-[#FFD84D] bg-[#2b1d4a] font-semibold text-white shadow-[0_8px_20px_-14px_rgba(255,216,77,0.6)]'
                          : 'border-[#392858] bg-[#21163A]/80 text-[#C6B8E5] hover:border-white/25'
                      }`}
                    >
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FFD84D] text-[#100B22]">
                          <Check size={11} strokeWidth={3.5} />
                        </span>
                      )}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 w-full space-y-2">
              <PrimaryAction>
                <AppButton
                  title="Continue"
                  onPress={() => persistAndAdvance(() => updateInterests(selectedInterests), 2)}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </PrimaryAction>
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
          <div key="step-2" className="ob-step flex flex-1 flex-col justify-between">
            <div>
              <ProgressHeader step={2} onBack={goBack} />
              <h2 className="mb-1.5 text-3xl font-bold tracking-tight text-white">Choose Sunny's vibe</h2>
              <p className="mb-6 text-sm leading-relaxed text-[#C6B8E5]">
                How would you like Sunny to feel? You can change this anytime in settings.
              </p>

              <div className="space-y-3">
                {TONE_OPTIONS.map((item) => (
                  <ChoiceCard
                    key={item.tone}
                    selected={selectedTone === item.tone}
                    onClick={() => setSelectedTone(item.tone)}
                    icon={item.icon}
                    title={item.title}
                    badge={item.badge}
                    description={item.description}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 w-full">
              <PrimaryAction>
                <AppButton
                  title="Continue"
                  onPress={() => persistAndAdvance(() => updateTone(selectedTone), 3)}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </PrimaryAction>
            </div>
          </div>
        )}

        {/* Step 3: Memory Consent */}
        {step === 3 && (
          <div key="step-3" className="ob-step flex flex-1 flex-col justify-between">
            <div>
              <ProgressHeader step={3} onBack={goBack} />
              <h2 className="mb-1.5 text-3xl font-bold tracking-tight text-white">
                Sunny can remember the little things.
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-[#C6B8E5]">
                With your permission, Sunny automatically saves useful details you share—like interests, goals, and upcoming events—to help in future conversations. Sunny avoids saving passwords and other sensitive details. You can review or delete memories anytime.
              </p>

              <div className="space-y-3">
                <ChoiceCard
                  selected={memoryConsent}
                  onClick={() => setMemoryConsent(true)}
                  icon={<Bookmark size={18} className="text-[#FFD84D]" />}
                  iconBg="bg-[#FFD84D]/15"
                  title="Enable memory"
                  description="Sunny remembers meaningful personal context so you don't have to re-explain yourself every time."
                />
                <ChoiceCard
                  selected={!memoryConsent}
                  onClick={() => setMemoryConsent(false)}
                  icon={<Lock size={18} className="text-[#9B8AB9]" />}
                  iconBg="bg-white/5"
                  title="Keep memory off for now"
                  description="Conversations will remain session-by-session without long-term notes saved."
                />
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#392858] bg-[#17102C]/80 p-3.5">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#FFD84D]" />
                <p className="text-sm leading-relaxed text-[#C6B8E5]">
                  You are always in control. You can view, edit, or delete any saved memory at any time in the Memories tab.
                </p>
              </div>
            </div>

            <div className="mt-8 w-full">
              <PrimaryAction>
                <AppButton
                  title="Continue"
                  onPress={() => persistAndAdvance(() => toggleMemory(memoryConsent), 4)}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </PrimaryAction>
            </div>
          </div>
        )}

        {/* Step 4: Notifications Consent */}
        {step === 4 && (
          <div key="step-4" className="ob-step flex flex-1 flex-col justify-between">
            <div>
              <ProgressHeader step={4} onBack={goBack} />
              <h2 className="mb-1.5 text-3xl font-bold tracking-tight text-white">
                A little sunshine throughout your day?
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-[#C6B8E5]">
                Sunny can send occasional gentle notes to brighten your morning, afternoon, or evening. Never spammy, never guilt-tripping.
              </p>

              <div className="sunny-onboarding-notification-preview mb-4 space-y-3 rounded-2xl border border-[#392858] bg-[#17102C]/80 p-4">
                <div className="flex items-start gap-3">
                  <Sun size={18} className="mt-0.5 shrink-0 text-[#FFD84D]" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Morning Sunshine</h4>
                    <p className="mt-0.5 text-sm italic text-[#C6B8E5]">
                      "Good morning, sunshine. ☀️ I hope today brings you one little thing to smile about."
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                  <Heart size={18} className="mt-0.5 shrink-0 text-[#FF8D9A]" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Gentle Check-in</h4>
                    <p className="mt-0.5 text-sm italic text-[#C6B8E5]">
                      "Hey, sunshine. 💛 How's your day going? No pressure to reply."
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <ChoiceCard
                  selected={notificationConsent}
                  onClick={() => setNotificationConsent(true)}
                  icon={<Bell size={18} className="text-[#FFD84D]" />}
                  iconBg="bg-[#FFD84D]/15"
                  title="Enable gentle notifications"
                />
                <ChoiceCard
                  selected={!notificationConsent}
                  onClick={() => setNotificationConsent(false)}
                  icon={<BellOff size={18} className="text-[#9B8AB9]" />}
                  iconBg="bg-white/5"
                  title="Not now"
                />
              </div>
            </div>

            <div className="mt-8 w-full">
              <PrimaryAction>
                <AppButton
                  title="Continue"
                  onPress={handleNotificationContinue}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </PrimaryAction>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 5 && (
          <div key="step-5" className="ob-step flex flex-1 flex-col justify-between">
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="mb-8">
                <SunnyHero />
              </div>

              <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">
                Your little corner of sunshine is ready. 💛
              </h2>
              <p className="mb-6 max-w-sm text-base leading-relaxed text-[#C6B8E5]">
                Sunny is here whenever you need a moment to reflect, laugh, or just talk through your day.
              </p>
              {notificationPermissionNote && (
                <p role="status" className="mb-4 max-w-sm text-sm text-[#C6B8E5]">{notificationPermissionNote}</p>
              )}

              <div className="sunny-onboarding-note max-w-sm rounded-2xl border border-[#392858] bg-[#21163A]/80 p-5 text-left">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#FFD84D]">
                  Friendly companion note
                </span>
                <p className="text-sm leading-relaxed text-[#C6B8E5]">
                  Sunny is an AI companion designed for everyday thoughts and comfort. Remember to take good care of yourself and lean on real friends and professional support whenever needed.
                </p>
              </div>
            </div>

            <div className="mt-8 w-full">
              <PrimaryAction>
                <AppButton
                  title="Meet Sunny"
                  onPress={handleFinish}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </PrimaryAction>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};