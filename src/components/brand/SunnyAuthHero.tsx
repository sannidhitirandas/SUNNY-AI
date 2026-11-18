import React from 'react';

interface SunnyAuthHeroProps {
  title: string;
  description: string;
  className?: string;
  compact?: boolean;
}

/** Shared 3D-inspired Sunny companion hero for every authentication screen. */
export const SunnyAuthHero: React.FC<SunnyAuthHeroProps> = ({
  title,
  description,
  className = '',
  compact = false,
}) => (
  <section className={`sunny-auth-hero ${compact ? 'sunny-auth-hero-compact' : ''} ${className}`} aria-labelledby="sunny-auth-title">
    <style>{`
      .sunny-auth-hero { position:relative; z-index:3; display:flex; flex-direction:column; align-items:center; text-align:center; margin:0 auto 1.15rem; width:100%; animation:sunny-auth-arrive .7s cubic-bezier(.2,.8,.2,1) both; }
      .sunny-auth-robot-stage { position:relative; width:min(100%,19rem); height:15rem; display:grid; place-items:center; isolation:isolate; perspective:900px; margin:-.4rem auto .25rem; }
      .sunny-auth-robot-aura { position:absolute; width:13rem; height:10rem; border-radius:50%; background:radial-gradient(ellipse,rgba(151,105,224,.44),rgba(255,216,77,.13) 44%,transparent 72%); filter:blur(18px); animation:sunny-auth-aura 5s ease-in-out infinite; }
      .sunny-auth-robot-orbit { position:absolute; width:14.2rem; height:4.4rem; border:1px solid rgba(255,216,77,.36); border-radius:50%; transform:rotate(-13deg) translateY(3.3rem); box-shadow:0 0 22px rgba(255,216,77,.12),inset 0 0 18px rgba(255,216,77,.06); }
      .sunny-auth-robot-orbit::after { content:''; position:absolute; width:.42rem; height:.42rem; right:1.3rem; top:.28rem; border-radius:50%; background:#FFE88A; box-shadow:0 0 12px #FFD84D; }
      .sunny-auth-robot { position:relative; z-index:2; width:12.2rem; height:12.2rem; overflow:visible; filter:drop-shadow(0 22px 24px rgba(7,3,18,.48)) drop-shadow(0 0 20px rgba(164,119,240,.24)); transform:translateY(-.25rem) rotateY(-8deg); animation:sunny-auth-float 5s ease-in-out infinite; }
      .sunny-auth-robot-shadow { position:absolute; z-index:1; bottom:1.25rem; width:7.8rem; height:1.1rem; border-radius:50%; background:rgba(8,4,20,.55); filter:blur(12px); }
      .sunny-auth-hero h1 { color:#fff; text-shadow:0 2px 16px rgba(10,4,26,.72); }
      .sunny-auth-hero p { color:rgba(245,237,255,.88); text-shadow:0 2px 12px rgba(10,4,26,.7); }
      .sunny-auth-hero .sunny-auth-eyebrow { display:inline-flex; align-items:center; gap:.45rem; margin-bottom:.35rem; color:#FFE27A; font-size:.62rem; font-weight:800; letter-spacing:.22em; text-transform:uppercase; }
      .sunny-auth-hero .sunny-auth-eyebrow::before,.sunny-auth-hero .sunny-auth-eyebrow::after { content:''; width:1rem; height:1px; background:linear-gradient(90deg,transparent,#FFD84D); }
      .sunny-auth-hero .sunny-auth-eyebrow::after { transform:scaleX(-1); }
      .sunny-auth-hero-compact .sunny-auth-robot-stage { height:11.25rem; width:min(100%,15rem); }
      .sunny-auth-hero-compact .sunny-auth-robot { width:9.4rem; height:9.4rem; }
      .sunny-auth-hero-compact .sunny-auth-robot-orbit { width:11rem; height:3.4rem; transform:rotate(-13deg) translateY(2.5rem); }
      .sunny-auth-hero-compact .sunny-auth-robot-aura { width:10rem; height:8rem; }
      @keyframes sunny-auth-float { 0%,100% { transform:translateY(-.25rem) rotateY(-8deg); } 50% { transform:translateY(-.8rem) rotateY(7deg); } }
      @keyframes sunny-auth-aura { 0%,100% { opacity:.72; transform:scale(.92); } 50% { opacity:1; transform:scale(1.08); } }
      @keyframes sunny-auth-arrive { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @media(max-width:640px) { .sunny-auth-robot-stage { height:13.1rem; } .sunny-auth-robot { width:10.8rem; height:10.8rem; } .sunny-auth-hero { margin-bottom:1rem; } }
      @media(max-height:760px) { .sunny-auth-robot-stage { height:10.5rem; } .sunny-auth-robot { width:9.4rem; height:9.4rem; } .sunny-auth-hero { margin-bottom:.75rem; } }
      @media(prefers-reduced-motion:reduce) { .sunny-auth-hero,.sunny-auth-robot,.sunny-auth-robot-aura { animation:none !important; } }
    `}</style>
    <div className="sunny-auth-robot-stage" aria-hidden="true">
      <div className="sunny-auth-robot-aura" />
      <div className="sunny-auth-robot-orbit" />
      <svg className="sunny-auth-robot" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sunny-robot-shell" x1="42" y1="30" x2="190" y2="211" gradientUnits="userSpaceOnUse"><stop stopColor="#F0D8FF"/><stop offset=".28" stopColor="#A77AE9"/><stop offset=".67" stopColor="#6940B7"/><stop offset="1" stopColor="#34205F"/></linearGradient>
          <linearGradient id="sunny-robot-side" x1="166" y1="68" x2="211" y2="164" gradientUnits="userSpaceOnUse"><stop stopColor="#E8C9FF"/><stop offset="1" stopColor="#59358F"/></linearGradient>
          <linearGradient id="sunny-robot-glass" x1="68" y1="73" x2="171" y2="151" gradientUnits="userSpaceOnUse"><stop stopColor="#332052"/><stop offset=".55" stopColor="#17102E"/><stop offset="1" stopColor="#493071"/></linearGradient>
          <linearGradient id="sunny-robot-gold" x1="84" y1="173" x2="157" y2="222" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF2A6"/><stop offset=".48" stopColor="#FFD84D"/><stop offset="1" stopColor="#C98A27"/></linearGradient>
        </defs>
        <ellipse cx="120" cy="211" rx="54" ry="10" fill="#0B0617" fillOpacity=".38"/>
        <path d="M89 177 78 195c-3 6 1 13 8 13h68c7 0 11-7 8-13l-11-18H89Z" fill="url(#sunny-robot-gold)" stroke="#FFF0A2" strokeWidth="2"/>
        <path d="M101 180v-12h38v12" stroke="#FFE98C" strokeWidth="7" strokeLinecap="round"/>
        <path d="M62 91c0-19 15-34 34-34h70c19 0 34 15 34 34v54c0 17-14 31-31 31H93c-17 0-31-14-31-31V91Z" fill="url(#sunny-robot-shell)" stroke="#EBD8FF" strokeWidth="3"/>
        <path d="M179 70c13 5 21 17 21 31v39c0 15-10 28-24 32l-7-13V85l10-15Z" fill="url(#sunny-robot-side)" opacity=".95"/>
        <path d="M75 95c0-13 11-24 24-24h64c13 0 24 11 24 24v39c0 13-11 24-24 24H99c-13 0-24-11-24-24V95Z" fill="url(#sunny-robot-glass)" stroke="#D8B8FF" strokeWidth="2.5"/>
        <path d="M84 91c4-8 12-13 21-13h42" stroke="#FFF" strokeOpacity=".48" strokeWidth="4" strokeLinecap="round"/>
        <ellipse cx="103" cy="112" rx="7" ry="10" fill="#FFE68A"/><ellipse cx="151" cy="112" rx="7" ry="10" fill="#FFE68A"/>
        <ellipse cx="103" cy="112" rx="3" ry="6" fill="#FFF9D7"/><ellipse cx="151" cy="112" rx="3" ry="6" fill="#FFF9D7"/>
        <path d="M111 137c5 6 13 8 20 8s15-2 20-8" stroke="#E8C7FF" strokeWidth="3" strokeLinecap="round"/>
        <path d="M120 56V42" stroke="#D8B7FF" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="120" cy="34" r="11" fill="url(#sunny-robot-gold)" stroke="#FFF0A2" strokeWidth="2"/>
        <path d="M57 105H43c-8 0-14 6-14 14v7c0 8 6 14 14 14h17M183 105h14c8 0 14 6 14 14v7c0 8-6 14-14 14h-17" stroke="#B88DF0" strokeWidth="8" strokeLinecap="round"/>
        <path d="M92 174v7m56-7v7" stroke="#F9E6FF" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="71" cy="77" r="4" fill="#FFF0A2"/><circle cx="174" cy="82" r="3" fill="#FFF0A2"/>
        <path d="M84 169c18 9 54 12 76 0" stroke="#FFF" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <div className="sunny-auth-robot-shadow" />
    </div>
    <span className="sunny-auth-eyebrow">YOUR AI COMPANION</span>
    <h1 id="sunny-auth-title" className="mb-1 text-3xl font-bold tracking-tight">{title}</h1>
    <p className="max-w-xs text-sm leading-relaxed">{description}</p>
  </section>
);
