import React, { useState } from 'react';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { ArrowLeft, Shield, Phone, ExternalLink, RotateCcw } from 'lucide-react';

interface SafetyScreenProps {
  onBack: () => void;
}

const CRISIS_RESOURCES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    contact: 'Call or Text 988',
    detail: 'Free, confidential, available 24/7 across the US & Canada.',
    href: 'tel:988',
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    detail: 'Connect with a crisis counselor 24/7 via text message.',
    href: 'sms:741741',
  },
  {
    name: 'The Trevor Project',
    contact: '1-866-488-7386',
    detail: '24/7 confidential crisis intervention for LGBTQ young people.',
    href: 'tel:18664887386',
  },
  {
    name: 'International Helplines',
    contact: 'findahelpline.com',
    detail: 'Free, confidential crisis resources in over 130 countries.',
    href: 'https://findahelpline.com',
  },
];

export const SafetyScreen: React.FC<SafetyScreenProps> = ({ onBack }) => {
  const [breathingStep, setBreathingStep] = useState(0);

  const GROUNDING_STEPS = [
    { title: 'Take a slow breath', instruction: 'Inhale gently for 4 seconds, hold for 4, and exhale for 4.' },
    { title: '5 things you can see', instruction: 'Look around and notice five distinct objects in your room.' },
    { title: '4 things you can feel', instruction: 'Notice your feet on the floor, your clothes against your skin, or the temperature in the room.' },
    { title: '3 things you can hear', instruction: 'Listen for sounds in the background: wind, humming, distant voices.' },
    { title: '2 things you can smell', instruction: 'Notice any scent around you or breathe in fresh air.' },
    { title: '1 thing you like about yourself', instruction: 'Acknowledge one kind quality or strength you have.' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Top Bar */}
      <div className="flex items-center gap-3 py-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg bg-[#21163A] border border-[#392858] text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
          aria-label="Back to settings"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">Help & Emotional Safety</h1>
      </div>

      {/* Important Boundary Card */}
      <AppCard className="p-5 mb-6 bg-[#17102C] border-[#FFD84D]/35">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-[#FFD84D]" />
          <h2 className="text-base font-bold text-[#FFD84D]">Sunny is an AI Companion</h2>
        </div>
        <p className="text-xs text-[#C6B8E5] leading-relaxed">
          Sunny is designed for everyday conversation, personal reflection, and light encouragement.
          <br /><br />
          Sunny is <strong className="text-white font-bold">not</strong> a human, therapist, physician, or emergency service. It cannot provide clinical assessments, crisis intervention, or medical advice.
        </p>
      </AppCard>

      {/* 24/7 Crisis Support Section */}
      <div className="mb-6">
        <h3 className="text-[11px] font-bold tracking-wider text-[#9B8AB9] uppercase px-1 mb-1">
          IMMEDIATE CRISIS SUPPORT
        </h3>
        <p className="text-xs text-[#C6B8E5] mb-3 px-1">
          If you or someone you know is in immediate danger or experiencing a mental health emergency, please contact these free, confidential resources:
        </p>

        <div className="space-y-3">
          {CRISIS_RESOURCES.map((r, i) => (
            <AppCard key={i} className="p-4 bg-[#21163A]">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FF8D9A]/15 flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-[#FF8D9A]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{r.name}</h4>
                    <span className="text-xs font-bold text-[#FFD84D] block">{r.contact}</span>
                  </div>
                </div>

                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-[#FFD84D]/15 hover:bg-[#FFD84D]/25 border border-[#FFD84D]/30 text-[#FFD84D] text-xs font-bold px-2.5 py-1 rounded-lg transition-colors shrink-0"
                >
                  <span>Connect</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <p className="text-xs text-[#C6B8E5] leading-relaxed mt-2">{r.detail}</p>
            </AppCard>
          ))}
        </div>
      </div>

      {/* Interactive Mindful Grounding Tool */}
      <div className="mb-6">
        <h3 className="text-[11px] font-bold tracking-wider text-[#9B8AB9] uppercase px-1 mb-1">
          GENTLE GROUNDING EXERCISE
        </h3>
        <p className="text-xs text-[#C6B8E5] mb-3 px-1">
          When things feel overwhelming, try the 5-4-3-2-1 technique to reconnect with your senses:
        </p>

        <AppCard elevated className="p-6 text-center border-[#392858]">
          <span className="text-xs font-bold text-[#FFD84D] uppercase tracking-wider block mb-1">
            Step {breathingStep + 1} of {GROUNDING_STEPS.length}
          </span>
          <h3 className="text-xl font-bold text-white mb-2">
            {GROUNDING_STEPS[breathingStep].title}
          </h3>
          <p className="text-sm text-[#C6B8E5] max-w-sm mx-auto leading-relaxed mb-6">
            {GROUNDING_STEPS[breathingStep].instruction}
          </p>

          <div className="flex items-center justify-center gap-3">
            <AppButton
              title={breathingStep === GROUNDING_STEPS.length - 1 ? 'Start Over' : 'Next Step'}
              onPress={() => setBreathingStep((prev) => (prev + 1) % GROUNDING_STEPS.length)}
              variant="primary"
              size="medium"
            />
            {breathingStep > 0 && (
              <button
                type="button"
                onClick={() => setBreathingStep(0)}
                className="p-2 rounded-xl text-[#9B8AB9] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Reset to beginning"
              >
                <RotateCcw size={18} />
              </button>
            )}
          </div>
        </AppCard>
      </div>
    </div>
  );
};
