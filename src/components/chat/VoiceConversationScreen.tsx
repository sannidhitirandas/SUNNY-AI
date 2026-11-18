import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, MicOff, PhoneOff, Volume2, VolumeX, Waves } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike { isFinal: boolean; 0: SpeechRecognitionAlternativeLike }
interface SpeechRecognitionEventLike { results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionErrorLike { error: string }
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface VoiceConversationScreenProps {
  messages: ChatMessage[];
  isThinking: boolean;
  sendMessage: (content: string) => Promise<void>;
  onClose: () => void;
}

export const VoiceConversationScreen: React.FC<VoiceConversationScreenProps> = ({
  messages, isThinking, sendMessage, onClose,
}) => {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baselineAssistantIdRef = useRef(messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.id);
  const submittedRef = useRef(false);
  const finalSubmissionRef = useRef(false);
  const mountedRef = useRef(true);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError('');
    setTranscript('');
    finalSubmissionRef.current = false;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Try Chrome on Android or desktop.');
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = navigator.language || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let interim = '';
        let finalText = '';
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
          else interim += result[0].transcript;
        }
        setTranscript(finalText || interim);
        if (finalText.trim() && !finalSubmissionRef.current) {
          finalSubmissionRef.current = true;
          setListening(false);
          submittedRef.current = true;
          baselineAssistantIdRef.current = messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.id;
          void sendMessage(finalText.trim());
        }
      };
      recognition.onerror = (event) => {
        setListening(false);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError(event.error === 'not-allowed'
            ? 'Microphone permission was denied. Allow microphone access and try again.'
            : 'The microphone stopped unexpectedly. Tap the mic to try again.');
        }
      };
      recognition.onend = () => {
        if (mountedRef.current) setListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setError('Could not start the microphone. Check permission and try again.');
    }
  }, [messages, sendMessage]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recognitionRef.current?.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!submittedRef.current || isThinking) return;
    const latest = messages.filter((m) => m.role === 'assistant').slice(-1)[0];
    if (!latest || latest.id === baselineAssistantIdRef.current) return;
    submittedRef.current = false;
    baselineAssistantIdRef.current = latest.id;
    if (!autoSpeak || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latest.content);
    utterance.rate = 1;
    utterance.pitch = 1.04;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [messages, isThinking, autoSpeak]);

  const close = () => {
    recognitionRef.current?.abort();
    stopSpeaking();
    onClose();
  };

  const status = isThinking ? 'Sunny is thinking' : speaking ? 'Sunny is speaking' : listening ? 'Listening to you' : 'Ready when you are';

  return (
    <section className="sunny-voice-mode fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden text-white" role="dialog" aria-modal="true" aria-label="Voice conversation with Sunny">
      <style>{`
        .sunny-voice-mode { background:radial-gradient(ellipse at 50% 38%,rgba(139,92,246,.28),transparent 43%),radial-gradient(ellipse at 50% 100%,rgba(91,33,182,.2),transparent 55%),linear-gradient(155deg,#100B22,#1D1237 55%,#100B22); }
        .sunny-voice-orb { background:radial-gradient(circle at 34% 28%,#E9D5FF 0%,#C4B5FD 16%,#8B5CF6 48%,#5B21B6 78%,#32105F 100%); box-shadow:0 0 35px rgba(167,139,250,.35),0 0 100px rgba(139,92,246,.22),inset -12px -16px 30px rgba(35,12,76,.4),inset 8px 8px 24px rgba(255,255,255,.35); }
        .sunny-voice-orb::before,.sunny-voice-orb::after { content:''; position:absolute; inset:-18px; border:1px solid rgba(196,181,253,.22); border-radius:9999px; }
        .sunny-voice-orb::after { inset:-36px; border-color:rgba(196,181,253,.11); }
        .sunny-voice-orb.is-active { animation:sunny-orb-pulse 1.8s ease-in-out infinite; }
        @keyframes sunny-orb-pulse { 0%,100% { transform:scale(1); box-shadow:0 0 35px rgba(167,139,250,.35),0 0 100px rgba(139,92,246,.22),inset -12px -16px 30px rgba(35,12,76,.4),inset 8px 8px 24px rgba(255,255,255,.35); } 50% { transform:scale(1.055); box-shadow:0 0 55px rgba(196,181,253,.55),0 0 130px rgba(139,92,246,.35),inset -12px -16px 30px rgba(35,12,76,.4),inset 8px 8px 24px rgba(255,255,255,.35); } }
        .sunny-voice-wave span { display:block; width:3px; border-radius:9px; background:#C4B5FD; animation:sunny-wave .9s ease-in-out infinite alternate; }
        .sunny-voice-wave span:nth-child(2n) { animation-delay:.18s; } .sunny-voice-wave span:nth-child(3n) { animation-delay:.34s; }
        @keyframes sunny-wave { from { height:6px; opacity:.45; } to { height:25px; opacity:1; } }
        .sunny-voice-mode button:focus-visible { outline:2px solid #DDD6FE; outline-offset:4px; }
        @media (prefers-reduced-motion:reduce) { .sunny-voice-orb.is-active,.sunny-voice-wave span { animation:none; } }
      `}</style>
      <header className="flex items-center justify-between px-5 pt-[max(1.2rem,env(safe-area-inset-top))] pb-4">
        <button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[.06] text-[#E9D5FF]" aria-label="Back to chat"><ArrowLeft size={20}/></button>
        <div className="text-center"><p className="text-[10px] font-bold tracking-[.28em] text-[#C4B5FD]">SUNNY AI</p><p className="mt-1 text-sm font-semibold text-white/90">Voice conversation</p></div>
        <button type="button" onClick={() => setAutoSpeak((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[.06] text-[#D8CCF3]" aria-label={autoSpeak ? 'Turn off voice replies' : 'Turn on voice replies'}>{autoSpeak ? <Volume2 size={19}/> : <VolumeX size={19}/>}</button>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-7 pb-8 text-center">
        <div className="mb-8 flex items-center gap-2 rounded-full border border-[#B99AFF]/20 bg-[#B99AFF]/[.08] px-4 py-2 text-xs font-medium text-[#E9D5FF]">
          <span className={`h-2 w-2 rounded-full ${isThinking || speaking || listening ? 'bg-[#C4B5FD] shadow-[0_0_12px_#C4B5FD]' : 'bg-[#9D8ABF]'}`}/>
          {status}
        </div>
        <div className="relative mb-12 flex h-64 w-64 items-center justify-center">
          <div className={`sunny-voice-orb relative h-40 w-40 rounded-full ${isThinking || speaking || listening ? 'is-active' : ''}`}>
            <div className="absolute inset-0 flex items-center justify-center"><Waves size={43} strokeWidth={1.35} className="text-white/90"/></div>
          </div>
        </div>
        <p className="max-w-sm text-xl font-semibold tracking-tight text-white">{isThinking ? 'Give me a moment…' : speaking ? 'I’m right here.' : listening ? 'I’m listening.' : 'Talk to me, anytime.'}</p>
        <p className="mt-2 min-h-6 max-w-sm text-sm leading-relaxed text-[#C6B8E5]">{transcript || (error ? error : 'A quiet space to talk things through, hands-free.')}</p>
        {error && <button type="button" onClick={() => { setError(''); startListening(); }} className="mt-3 text-xs font-semibold text-[#D8B4FE] underline underline-offset-4">Try microphone again</button>}
        <div className="mt-12 flex items-center gap-7">
          <button type="button" onClick={() => { stopListening(); stopSpeaking(); }} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[.06] text-[#D8CCF3]" aria-label="Stop audio"><VolumeX size={19}/></button>
          <button type="button" disabled={isThinking} onClick={listening ? stopListening : startListening} className={`flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[#D8B4FE]/40 shadow-[0_0_35px_rgba(139,92,246,.28)] transition-all active:scale-95 disabled:cursor-wait disabled:opacity-50 ${listening ? 'bg-[#F0ABFC] text-[#32105F]' : 'bg-gradient-to-br from-[#A78BFA] to-[#6D28D9] text-white'}`} aria-label={listening ? 'Stop listening' : 'Start speaking'}>{listening ? <MicOff size={28}/> : <Mic size={28}/>}</button>
          <button type="button" onClick={close} className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F0ABFC]/20 bg-[#F0ABFC]/[.08] text-[#F0ABFC]" aria-label="End voice conversation"><PhoneOff size={19}/></button>
        </div>
        <div className="sunny-voice-wave mt-7 flex h-7 items-center justify-center gap-1" aria-hidden="true">{Array.from({length:9},(_,i)=><span key={i}/>)}</div>
        <p className="mt-2 text-[10px] font-medium tracking-[.14em] text-[#8F80AD]">YOUR VOICE STAYS IN THIS CONVERSATION</p>
      </div>
    </section>
  );
};
