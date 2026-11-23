import React from 'react';
import { SunnySun } from '@/components/brand/SunnySun';

interface SunnyLogoProps {
  size?: 'small' | 'medium' | 'large' | 'huge';
  showText?: boolean;
  showTagline?: boolean;
}

const DIMENSIONS = {
  small: { boxSize: 34, textSize: 'text-sm', taglineSize: 'text-xs' },
  medium: { boxSize: 48, textSize: 'text-lg', taglineSize: 'text-xs' },
  large: { boxSize: 76, textSize: 'text-2xl', taglineSize: 'text-sm' },
  huge: { boxSize: 100, textSize: 'text-3xl', taglineSize: 'text-base' },
} as const;

/** Sunny's brand mark: the smiling sun mascot, with optional wordmark and tagline. */
export const SunnyLogo: React.FC<SunnyLogoProps> = ({
  size = 'medium',
  showText = false,
  showTagline = false,
}) => {
  const dim = DIMENSIONS[size] ?? DIMENSIONS.medium;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: dim.boxSize, height: dim.boxSize }}>
        {/* Soft ambient glow */}
        <div
          className="pointer-events-none absolute rounded-full bg-[#FFD84D]/20 blur-md animate-glow"
          style={{ width: dim.boxSize * 1.1, height: dim.boxSize * 1.1 }}
        />
        <SunnySun compact className="relative z-10 h-full w-full" />
      </div>

      {showText && (
        <div className="mt-2.5 flex flex-col items-center">
          <span className={`font-bold tracking-tight text-white ${dim.textSize}`}>
            Sunny
          </span>
          {showTagline && (
            <span className={`mt-0.5 font-normal text-[#D6C2F2] ${dim.taglineSize}`}>
              Your little corner of sunshine
            </span>
          )}
        </div>
      )}
    </div>
  );
};
