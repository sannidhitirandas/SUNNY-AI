import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { AppCard } from '../ui/AppCard';
import { storageService } from '@/services/storageService';

const DAILY_REMINDERS = [
  "You don't have to figure everything out today. One small step is enough.",
  'Taking a break is not giving up. It is giving yourself room to breathe.',
  'Be proud of yourself for showing up today, even in quiet, gentle ways.',
  "Whatever pace you are moving at right now is completely okay.",
  "You are allowed to take things one breath and one moment at a time.",
  "You don't have to carry the whole mountain today. Just the next gentle step.",
];

const MOODS = [
  { id: 'great', emoji: '😄', label: 'Great' },
  { id: 'good', emoji: '😊', label: 'Good' },
  { id: 'okay', emoji: '😐', label: 'Okay' },
  { id: 'low', emoji: '😔', label: 'Low' },
  { id: 'rough', emoji: '🥺', label: 'Rough' },
] as const;

type MoodId = typeof MOODS[number]['id'];
type MoodEntry = { mood: MoodId; note: string; updatedAt: string };
type MoodHistory = Record<string, MoodEntry>;
const MOOD_STORAGE_KEY = '@sunny_daily_mood_checkins_v1';

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

export const DailySunshineCard: React.FC = () => {
  const [index, setIndex] = useState<number>(0);
  const [history, setHistory] = useState<MoodHistory>({});
  const [note, setNote] = useState('');
  const [ready, setReady] = useState(false);
  const today = getLocalDateKey(new Date());
  const todaysEntry = history[today];

  useEffect(() => {
    let active = true;
    void storageService.getItem<MoodHistory>(MOOD_STORAGE_KEY, {}).then((saved) => {
      if (!active) return;
      const safeHistory = saved && typeof saved === 'object' ? saved : {};
      setHistory(safeHistory);
      setNote(safeHistory[today]?.note ?? '');
      setReady(true);
    });
    return () => { active = false; };
  }, [today]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - offset));
    const key = getLocalDateKey(date);
    return {
      key,
      day: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1),
      mood: history[key]?.mood,
      isToday: key === today,
    };
  }), [history, today]);

  const saveHistory = async (next: MoodHistory) => {
    setHistory(next);
    await storageService.setItem(MOOD_STORAGE_KEY, next);
  };

  const handleMoodSelect = (mood: MoodId) => {
    const existing = history[today];
    void saveHistory({
      ...history,
      [today]: { mood, note, updatedAt: new Date().toISOString() },
    });
  };

  const handleNoteChange = (value: string) => {
    setNote(value);
    if (todaysEntry) {
      const next = { ...history, [today]: { ...todaysEntry, note: value, updatedAt: new Date().toISOString() } };
      void saveHistory(next);
    }
  };

  const selectedMood = MOODS.find((mood) => mood.id === todaysEntry?.mood);

  return (
    <div className="sunny-home-section space-y-4">
      <section className="sunny-mood-card">
        <div className="sunny-mood-heading">
          <div className="sunny-mood-heading-icon"><Heart size={17} /></div>
          <div>
            <p className="sunny-mood-eyebrow">A LITTLE MOMENT FOR YOU</p>
            <h2>How are you feeling today?</h2>
            <p>Whatever it is, you can be honest here.</p>
          </div>
        </div>

        <div className="sunny-mood-options" role="group" aria-label="Choose today's mood">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => handleMoodSelect(mood.id)}
              disabled={!ready}
              aria-pressed={todaysEntry?.mood === mood.id}
              className="sunny-mood-option"
            >
              <span className="sunny-mood-emoji" aria-hidden="true">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className="sunny-mood-reflection">
            <label htmlFor="sunny-mood-note">Want to put a little more into words?</label>
            <textarea
              id="sunny-mood-note"
              value={note}
              onChange={(event) => handleNoteChange(event.target.value)}
              onBlur={() => {
                if (todaysEntry) void saveHistory({
                  ...history,
                  [today]: { ...todaysEntry, note, updatedAt: new Date().toISOString() },
                });
              }}
              maxLength={280}
              rows={2}
              placeholder="A little thought about today… (optional)"
            />
            <span className="sunny-mood-saved">Saved on this device · {note.length}/280</span>
          </div>
        )}

        <div className="sunny-mood-week" aria-label="Your mood check-ins from the last seven days">
          <div className="sunny-mood-week-title">Your little week</div>
          <div className="sunny-mood-week-days">
            {week.map((day) => {
              const mood = MOODS.find((item) => item.id === day.mood);
              return (
                <div className={`sunny-mood-day ${day.isToday ? 'is-today' : ''}`} key={day.key}>
                  <span className="sunny-mood-day-emoji">{mood?.emoji ?? '·'}</span>
                  <span>{day.isToday ? 'Today' : day.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AppCard className="sunny-daily-card my-5 rounded-[24px] border border-[#7C6394]/30 bg-gradient-to-r from-[#302044] via-[#261B3A] to-[#211633] p-4 shadow-[0_10px_30px_rgba(0,0,0,.14)] sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFD84D]">
            Little reminder 💛
          </span>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % DAILY_REMINDERS.length)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD84D]/20 bg-[#FFD84D]/10 px-3 py-1.5 text-xs font-semibold text-[#FFD84D] transition-all hover:border-[#FFD84D]/40 hover:bg-[#FFD84D]/20 active:scale-95 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Another ☀️</span>
          </button>
        </div>
        <p key={index} className="sunny-reminder-text text-[15px] leading-relaxed text-[#F5EDFF] sm:text-xl">
          "{DAILY_REMINDERS[index]}"
        </p>
      </AppCard>
    </div>
  );
};
