# ☀️ Sunny — A Personal AI Companion App

> *"You don't have to start over every time you come back."*

Sunny is a warm, emotionally supportive AI companion application built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS**. Designed with a cozy, premium visual identity of deep dark purple and radiant sunshine yellow, Sunny offers a calm, safe digital corner to talk, laugh, reflect, and feel heard.

---

## 🎨 Visual Identity — Dark Purple + Sunshine Yellow

Sunny adheres to a bespoke, comforting dark theme:

| Element | Hex Color | Usage |
| :--- | :--- | :--- |
| **Main Background** | `#100B22` | Deep purple primary canvas |
| **Secondary Background** | `#17102C` | Headers, tab bars, banners |
| **Card Background** | `#21163A` | Conversation cards, memory cards |
| **Elevated Card** | `#302149` | Interactive surfaces & buttons |
| **Input Background** | `#1B1430` | Text composer & inputs |
| **Sunshine Yellow** | `#FFD84D` | Primary action buttons, sun rays, highlights |
| **Warm Gold** | `#F6BD45` | Secondary glows & badges |
| **Primary Text** | `#FFFFFF` | Clear, readable high contrast body |
| **Lavender Text** | `#C6B8E5` | Supporting descriptions & subtitles |
| **Muted Text** | `#9B8AB9` | Captions, placeholders & timestamps |
| **Borders** | `#392858` | Subtle card & row boundaries |
| **Success / Warning / Error**| `#A8D9A0` / `#F6BD45` / `#FF8D9A` | Status states |

---

## 📱 Core Features Implemented

### 1. Splash & Guided Onboarding Flow
- **Splash Screen**: Glowing animated sun logo, smooth fade-in, and auto-routing.
- **Welcome**: Warm introduction to Sunny's purpose.
- **Interests**: Multi-selectable goals (listening, encouragement, reflection).
- **Personality Choice**: Select Sunny's conversational vibe (**Adaptive**, **Playful**, **Gentle**, **Calm**).
- **Memory Consent**: Transparent consent selection for saving personal memories.
- **Notification Consent**: Gentle check-in opt-in explanation.
- **Completion**: Cheerful entry into Sunny's space.

### 2. Authentication Flow
- **Login**: Email/password sign-in with field validation, password toggle, and one-tap **Explore in Demo Mode** guest access.
- **Sign-Up**: Display name, email, password strength check, and local storage consent.

### 3. Home Screen — The Heart of Sunny
- **Header**: Brand logo, tagline, demo mode indicator, and quick settings link.
- **Greeting Card**: Welcomes the user by their preferred name with "Talk to Sunny" primary CTA.
- **Conversation Starters ("What's the vibe today?")**: 4 intent-driven cards:
  1. *I need someone to listen* (Empathetic / Gentle)
  2. *Distract me and make me laugh* (Playful / Humorous)
  3. *I need a little encouragement* (Supportive / Grounding)
  4. *Let's talk about anything* (Open curiosity)
  *Tapping any card directly launches the Chat screen with the selected context.*
- **Daily Sunshine**: Rotating thoughtful reminders and reflections with "Another ☀️" button.
- **Recent Conversation Preview**: Tap-to-resume last conversation snippet.

### 4. Chat Screen — The Main Experience
- **Sunny & User Message Bubbles**:
  - Sunny: Dark purple card bubble with avatar badge, timestamp, and demo tag.
  - User: Radiant sunshine yellow bubble with dark purple text, timestamps, and delivery indicators.
- **Typing Indicator**: Animated 3-dot pulse while Sunny is generating a reply.
- **Auto-Expanding Composer**: Multiline text input with character limits, send button with up arrow.
- **Realistic Demo AI Engine**:
  - Deterministic contextual responses reflecting the chosen personality tone.
  - Built-in crisis keywords detection routing to immediate emergency resources.
  - Retry failed message handling.
- **Chat Options Modal**: Clear chat, view memories, and access crisis safety info.

### 5. Memories Management Vault
- **Live Search & Category Filters**: Filter memories by *All, Personal, Relationships, Events, Ongoing, Preferences*.
- **Add / Edit / Delete**:
  - Dedicated **MemoryModal** for saving and updating notes with explicit confirmation.
  - Delete with confirmation.
- **Memory Disabled State**: Clear UI when memory is toggled off, respecting privacy.
- **Sample Memories**: Pre-seeded demo memories that users can view, edit, delete, or reset.

### 6. Comprehensive Settings
- **Section A (Your Sunny)**: Personality switcher modal, preferred name editor, theme indicator.
- **Section B (Memory)**: Master memory toggle switch, manage saved memories, privacy explanation.
- **Section C (Notifications)**: Preferences screen link, quiet hours notice.
- **Section D (Privacy & Security)**: Data export in standard JSON, clear chat history, wipe data.
- **Section E (Help & Safety)**: Crisis hotlines (988 Lifeline, 741741, international) and interactive 5-4-3-2-1 mindful grounding tool.
- **Section F (Account)**: Profile details, replay onboarding, sign out, and wipe account.

---

## 🏗️ Architecture & Clean Service Layer

```
src/
├── main.tsx                         # Root entry with React 19 & Context providers
├── App.tsx                          # App shell, tab router, bottom nav
├── index.css                        # Tailwind CSS v4 & theme variables
├── constants/
│   └── theme.ts                     # Color palette & spacing constants
├── types/
│   ├── chat.ts                      # Chat message & session interfaces
│   ├── memory.ts                    # Memory items & categories
│   ├── user.ts                      # User profile & preferences
│   └── notifications.ts             # Notification schedules
├── services/
│   ├── storageService.ts            # LocalStorage persistence wrapper with in-memory fallback
│   ├── authService.ts               # Authentication & demo guest sessions
│   ├── chatService.ts               # Chat session manager & AI engine
│   ├── memoryService.ts             # Memory store, category filters & consent handling
│   ├── notificationService.ts       # Notification schedules & preview items
│   └── privacyService.ts            # Data export (JSON) & permanent wipe controls
├── context/
│   ├── AuthContext.tsx              # Authentication state
│   ├── PreferencesContext.tsx       # Tone, name, memory & notification toggles
│   ├── ChatContext.tsx              # Chat state & intent triggers
│   └── MemoryContext.tsx            # Memory items & search filters
├── screens/
│   ├── SplashScreen.tsx             # Animated startup splash
│   ├── HomeScreen.tsx               # Home tab
│   ├── ChatScreen.tsx               # Chat tab
│   ├── MemoriesScreen.tsx           # Memories tab
│   ├── SettingsScreen.tsx           # Settings tab
│   ├── onboarding/                  # Multi-step onboarding flow
│   ├── auth/                        # Login & Register views
│   └── settings/                    # Detail sub-screens (Safety, Privacy, Notifications, About)
└── components/
    ├── brand/                       # SunnyLogo SVG component
    ├── ui/                          # AppButton, AppCard, AppInput, Badge, EmptyState
    ├── home/                        # GreetingCard, ConversationStarter, DailySunshineCard, RecentConversations
    ├── chat/                        # ChatHeader, MessageBubble, MessageComposer, TypingIndicator
    ├── memories/                    # MemoryCard, MemoryModal
    └── settings/                    # SettingsRow, SettingsSection
```

---

## 🚀 Running the App

```bash
npm run dev
```

Listens on port `3000` with host `0.0.0.0`.


## Gemini API setup
Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL=gemini-2.5-flash` in your server environment. Do not expose the key in frontend `VITE_` variables or commit local env files.


## Sunny AI provider setup

Sunny uses Groq as the primary AI provider and Gemini as the fallback. The default Groq model is `openai/gpt-oss-120b`; set `GROQ_MODEL` in your local `.env.local` if your Groq account uses a different available model. Never commit `.env.local` or API keys.
