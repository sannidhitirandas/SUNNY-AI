import React from 'react';
import { SunnyRobot3D } from '@/components/brand/SunnyRobot3D';

interface SunnyAuthHeroProps {
  title: string;
  description: string;
  className?: string;
  compact?: boolean;
}

/** Shared Three.js Sunny companion hero for every authentication screen. */
export const SunnyAuthHero: React.FC<SunnyAuthHeroProps> = ({
  title,
  description,
  className = '',
  compact = false,
}) => (
  <section className={`sunny-auth-hero ${compact ? 'sunny-auth-hero-compact' : ''} ${className}`} aria-labelledby="sunny-auth-title">
    <style>{`
      .sunny-auth-hero { position:relative; z-index:3; display:flex; flex-direction:column; align-items:center; text-align:center; margin:0 auto 1.15rem; width:100%; animation:sunny-auth-arrive .7s cubic-bezier(.2,.8,.2,1) both; }
      .sunny-auth-robot-stage { position:relative; width:min(100%,19rem); height:15rem; display:grid; place-items:center; isolation:isolate; margin:-.4rem auto .25rem; }
      .sunny-auth-robot-3d { position:relative; z-index:2; width:100%; height:100%; filter:drop-shadow(0 18px 20px rgba(7,3,18,.34)); }
      .sunny-auth-robot-3d-fallback { position:absolute; inset:0; display:grid; place-items:center; color:#D946EF; font-size:3rem; }
      .sunny-auth-hero h1 { color:#fff; text-shadow:0 2px 16px rgba(10,4,26,.72); }
      .sunny-auth-hero p { color:rgba(245,237,255,.88); text-shadow:0 2px 12px rgba(10,4,26,.7); }
      .sunny-auth-hero .sunny-auth-eyebrow { display:inline-flex; align-items:center; gap:.45rem; margin-bottom:.35rem; color:#F0ABFC; font-size:.62rem; font-weight:800; letter-spacing:.22em; text-transform:uppercase; }
      .sunny-auth-hero .sunny-auth-eyebrow::before,.sunny-auth-hero .sunny-auth-eyebrow::after { content:''; width:1rem; height:1px; background:linear-gradient(90deg,transparent,#D946EF); }
      .sunny-auth-hero .sunny-auth-eyebrow::after { transform:scaleX(-1); }
      .sunny-auth-hero-compact .sunny-auth-robot-stage { height:10.5rem; width:min(100%,14rem); }
      @keyframes sunny-auth-arrive { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @media(max-width:640px) { .sunny-auth-robot-stage { height:13rem; } .sunny-auth-hero { margin-bottom:1rem; } }
      @media(max-height:760px) { .sunny-auth-robot-stage { height:10.5rem; } .sunny-auth-hero { margin-bottom:.75rem; } }
      @media(prefers-reduced-motion:reduce) { .sunny-auth-hero,.sunny-auth-robot-aura { animation:none !important; } }
    `}</style>
    <div className="sunny-auth-robot-stage" aria-hidden="true">
      <SunnyRobot3D compact={compact} className="sunny-auth-robot-3d" />
    </div>
    <span className="sunny-auth-eyebrow">YOUR AI COMPANION</span>
    <h1 id="sunny-auth-title" className="mb-1 text-3xl font-bold tracking-tight">{title}</h1>
    <p className="max-w-xs text-sm leading-relaxed">{description}</p>
  </section>
);
