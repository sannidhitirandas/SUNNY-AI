import React from 'react';

interface SunnyLogoProps {
  size?: 'small' | 'medium' | 'large' | 'huge';
  showText?: boolean;
  showTagline?: boolean;
}

export const SunnyLogo: React.FC<SunnyLogoProps> = ({
  size = 'medium',
  showText = false,
  showTagline = false,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { boxSize: 28, coreRadius: 7, rayLength: 3, textSize: 'text-sm', taglineSize: 'text-xs' };
      case 'large':
        return { boxSize: 64, coreRadius: 16, rayLength: 6, textSize: 'text-2xl', taglineSize: 'text-sm' };
      case 'huge':
        return { boxSize: 88, coreRadius: 22, rayLength: 8, textSize: 'text-3xl', taglineSize: 'text-base' };
      case 'medium':
      default:
        return { boxSize: 42, coreRadius: 11, rayLength: 4.5, textSize: 'text-lg', taglineSize: 'text-xs' };
    }
  };

  const dim = getDimensions();
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const center = dim.boxSize / 2;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: dim.boxSize, height: dim.boxSize }}>
        {/* Soft Ambient Glow */}
        <div
          className="absolute rounded-full bg-[#FFD84D]/20 blur-md animate-glow pointer-events-none"
          style={{ width: dim.boxSize * 1.3, height: dim.boxSize * 1.3 }}
        />

        {/* SVG Sun with Rays and Core */}
        <svg
          width={dim.boxSize}
          height={dim.boxSize}
          viewBox={`0 0 ${dim.boxSize} ${dim.boxSize}`}
          className="relative z-10 transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <radialGradient id={`sun-glow-${size}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFF9D2" />
              <stop offset="45%" stopColor="#FFD84D" />
              <stop offset="100%" stopColor="#F6BD45" />
            </radialGradient>
            <filter id={`drop-shadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#FFD84D" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Rays */}
          {rayAngles.map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const rStart = dim.coreRadius + 2.5;
            const rEnd = rStart + dim.rayLength;
            const x1 = center + rStart * Math.cos(rad);
            const y1 = center + rStart * Math.sin(rad);
            const x2 = center + rEnd * Math.cos(rad);
            const y2 = center + rEnd * Math.sin(rad);

            return (
              <line
                key={`ray-${angle}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFD84D"
                strokeWidth={size === 'huge' ? 3.5 : size === 'large' ? 2.8 : 2}
                strokeLinecap="round"
                opacity="0.9"
              />
            );
          })}

          {/* Core Sun Circle */}
          <circle
            cx={center}
            cy={center}
            r={dim.coreRadius}
            fill={`url(#sun-glow-${size})`}
            filter={`url(#drop-shadow-${size})`}
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col items-center mt-2.5">
          <span className={`font-bold tracking-tight text-white ${dim.textSize}`}>
            Sunny
          </span>
          {showTagline && (
            <span className={`text-[#C6B8E5] font-normal ${dim.taglineSize} mt-0.5`}>
              Your little corner of sunshine
            </span>
          )}
        </div>
      )}
    </div>
  );
};
