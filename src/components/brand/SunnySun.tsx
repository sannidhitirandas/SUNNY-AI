import React, { useId } from 'react';

interface SunnySunProps {
  className?: string;
  /** Compact mode crops tightly around the sun (no sparkles) for small avatars. */
  compact?: boolean;
}

const PETALS = 16;
const CX = 140;
const CY = 120;

const SPARKLE_PATH = 'M0 -14 Q2 -2 14 0 Q2 2 0 14 Q-2 2 -14 0 Q-2 -2 0 -14Z';

/**
 * Sunny's mascot: a glossy, smiling sun with scalloped petals, rosy cheeks and
 * happy closed eyes. Pure SVG, no assets or WebGL required.
 */
export const SunnySun: React.FC<SunnySunProps> = ({ className = '', compact = false }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bodyGradient = `sunny-sun-body-${uid}`;
  const petalGradient = `sunny-sun-petal-${uid}`;
  const shineGradient = `sunny-sun-shine-${uid}`;

  return (
    <>
      <style>{`
        .sunny-sun { display:block; overflow:visible; }
        .sunny-sun-float { animation: sunny-sun-float 5s ease-in-out infinite; }
        .sunny-sun-petals { transform-origin:${CX}px ${CY}px; animation: sunny-sun-spin 70s linear infinite; }
        .sunny-sun-eyes { transform-box:fill-box; transform-origin:center; animation: sunny-sun-blink 6s ease-in-out infinite; }
        .sunny-sun-sparkle { transform-box:fill-box; transform-origin:center; animation: sunny-sun-twinkle 3.2s ease-in-out infinite; }
        .sunny-sun-sparkle-b { animation-delay:1.4s; }
        @keyframes sunny-sun-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
        @keyframes sunny-sun-spin { to { transform:rotate(360deg); } }
        @keyframes sunny-sun-blink { 0%,92%,100% { transform:scaleY(1); } 96% { transform:scaleY(.2); } }
        @keyframes sunny-sun-twinkle { 0%,100% { opacity:.55; transform:scale(.85); } 50% { opacity:1; transform:scale(1.1); } }
        @media(prefers-reduced-motion:reduce) {
          .sunny-sun-float,.sunny-sun-petals,.sunny-sun-eyes,.sunny-sun-sparkle { animation:none !important; }
        }
      `}</style>
      {/* The wrapper owns the size; the SVG fills it absolutely so it can never overflow its box. */}
      <div className={`sunny-sun-wrap ${className}`} style={{ position: 'relative', minWidth: 0, minHeight: 0 }}>
      <svg
        className="sunny-sun"
        viewBox={compact ? '28 8 224 224' : '-30 0 340 240'}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Sunny, a smiling sun with rosy cheeks"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'drop-shadow(0 0 16px rgba(255, 200, 70, 0.35))' }}
      >
        <defs>
          <radialGradient id={bodyGradient} cx="36%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#FFF3B0" />
            <stop offset="45%" stopColor="#FFD84D" />
            <stop offset="100%" stopColor="#FDB347" />
          </radialGradient>
          <radialGradient id={petalGradient} gradientUnits="userSpaceOnUse" cx={CX - 24} cy={CY - 34} r="150">
            <stop offset="0%" stopColor="#FFEA82" />
            <stop offset="60%" stopColor="#FFD24A" />
            <stop offset="100%" stopColor="#FDBB4A" />
          </radialGradient>
          <radialGradient id={shineGradient} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {!compact && (
          <>
            <g transform="translate(8 44)" className="sunny-sun-sparkle">
              <path d={SPARKLE_PATH} fill="#FFD84D" />
            </g>
            <g transform="translate(268 26) scale(.7)" className="sunny-sun-sparkle sunny-sun-sparkle-b">
              <path d={SPARKLE_PATH} fill="#FFD84D" />
            </g>
          </>
        )}

        <g className="sunny-sun-float">
          <g className="sunny-sun-petals">
            {Array.from({ length: PETALS }, (_, i) => (
              <ellipse
                key={i}
                cx={CX}
                cy={CY - 88}
                rx="21"
                ry="27"
                fill={`url(#${petalGradient})`}
                transform={`rotate(${(360 / PETALS) * i} ${CX} ${CY})`}
              />
            ))}
          </g>

          <circle cx={CX} cy={CY} r="84" fill={`url(#${bodyGradient})`} />
          <ellipse cx={CX - 30} cy={CY - 44} rx="40" ry="26" fill={`url(#${shineGradient})`} transform={`rotate(-24 ${CX - 30} ${CY - 44})`} />

          {/* Rosy cheeks */}
          <ellipse cx={CX - 46} cy={CY + 20} rx="15" ry="8.5" fill="#F4A08A" opacity="0.75" />
          <ellipse cx={CX + 46} cy={CY + 20} rx="15" ry="8.5" fill="#F4A08A" opacity="0.75" />

          {/* Happy closed eyes */}
          <g className="sunny-sun-eyes" fill="none" stroke="#8A5A2B" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={`M${CX - 44} ${CY - 2} Q${CX - 32} ${CY - 20} ${CX - 20} ${CY - 2}`} />
            <path d={`M${CX + 20} ${CY - 2} Q${CX + 32} ${CY - 20} ${CX + 44} ${CY - 2}`} />
          </g>

          {/* Smile */}
          <path
            d={`M${CX - 24} ${CY + 18} Q${CX} ${CY + 46} ${CX + 24} ${CY + 18}`}
            fill="none"
            stroke="#8A5A2B"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
      </div>
    </>
  );
};
