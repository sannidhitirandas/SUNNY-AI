# ☀️ Sunny — A Personal AI Companion App

> *"You don't have to start over every time you come back."*

Sunny is a warm, emotionally supportive AI companion application built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS**, **Express**, and **Supabase**. It combines a cozy, premium visual identity with real authentication and server-side AI conversations, creating a calm digital space to talk, laugh, reflect, and feel heard.

---

## 🎨 Visual Identity — Dark Purple + Sunshine Yellow

Sunny uses a bespoke dark theme designed to feel calm, warm, and welcoming:

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
| **Success / Warning / Error** | `#A8D9A0` / `#F6BD45` / `#FF8D9A` | Status states |

---

## 📱 Core Features

### 1. Splash & Guided Onboarding

- **Splash Screen**: Glowing animated sun logo with smooth fade-in and automatic routing.
- **Welcome**: Warm introduction to Sunny's purpose.
- **Interests**: Select goals such as listening, encouragement, and reflection.
- **Personality Choice**: Choose Sunny's conversational vibe (**Adaptive**, **Playful**, **Gentle**, or **Calm**).
- **Memory Consent**: Clear consent flow for memory-related features.
- **Notification Consent**: Optional check-in notification preferences.
- **Completion**: Smooth transition into Sunny's main experience.

### 2. Authentication

- Email/password authentication through **Supabase Auth**.
- Login and registration validation.
- Password visibility toggle.
- Display name / preferred name support.
- Persistent authenticated sessions.
- Optional guest/demo access where enabled by the application.

### 3. Home Screen — The Heart of Sunny

- **Header**: Sunny branding, tagline, and quick settings access.
- **Greeting Card**: Welcomes the user by their preferred name with a **Talk to Sunny** CTA.
- **Conversation Starters ("What's the vibe today?")**:
  1. *I need someone to listen*
  2. *Distract me and make me laugh*
  3. *I need a little encouragement*
  4. *Let's talk about anything*
- Conversation starters can launch Chat with the selected context.
- **Daily Sunshine**: Rotating thoughtful reminders and reflections.
- **Recent Conversation Preview**: Quick access to recent conversation context.

### 4. Chat Screen — The Main Experience

- **Sunny & User Message Bubbles** with timestamps and delivery states.
- **Typing Indicator** while Sunny generates a response.
- **Auto-Expanding Composer** for multiline messages.
- **Real AI Conversations** through the application's server-side AI service.
- **Groq as the primary AI provider** for fast responses.
- **Gemini as the fallback provider** when the primary provider is unavailable.
- Conversational context including recent chat history, selected tone, preferred name, memory setting, and available memories.
- Friendly retry/error states when AI providers are temporarily unavailable.
- Crisis-safety routing for supported safety keywords and emergency resources.
- **Chat Options** for clearing conversations, accessing memories, and viewing safety information.

### 5. Memories Management

- Live search and category filtering.
- Memory categories include **Personal, Relationships, Events, Ongoing, and Preferences**.
- Add, edit, and delete memory items.
- Explicit memory consent and memory enable/disable controls.
- Privacy-focused memory management.
- Clear controls for removing stored conversation or memory data.

### 6. Settings & Privacy

- **Your Sunny**: Personality and preferred-name controls.
- **Memory**: Memory enable/disable and memory management.
- **Notifications**: Notification preferences and quiet-hours settings.
- **Privacy & Security**: Data export, chat clearing, and data-wipe controls.
- **Help & Safety**: Crisis resources and a 5-4-3-2-1 grounding tool.
- **Account**: Profile information, onboarding replay, sign out, and account/data controls.

---

## 🧠 AI Architecture

Sunny keeps provider credentials on the server and never exposes AI API keys to the browser.

```
React Frontend
      │
      ▼
POST /api/chat
      │
      ▼
Express Server
      │
      ├──► Groq (Primary)
      │       │
      │       └── openai/gpt-oss-120b
      │
      └──► Gemini (Fallback)
              │
              ├── gemini-3.8-flash
              ├── gemini-3.7-flash
              └── gemini-3.6-flash
```

The server handles provider selection, timeouts, fallback behavior, and friendly error responses.

---

## 🔐 Authentication & Data

Sunny uses **Supabase** for authentication and application configuration.

The browser uses only the Supabase URL and publishable key. Secret provider credentials remain server-side.

### Environment variables

Required server/client configuration:

```env
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Optional:

```env
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
```

**Never commit `.env.local`, API keys, service-role keys, private keys, or other secrets to GitHub.**

Do not place `GROQ_API_KEY` or `GEMINI_API_KEY` in `VITE_` variables. Vite variables are exposed to the frontend.

### Database migrations

For an existing project with `001_cloud_persistence.sql` already applied, apply `supabase/migrations/002_automatic_memory.sql` in the Supabase SQL Editor before deploying the updated server. New database setups should apply migrations `001` and `002` in order. The second migration adds an idempotency key and optional expiry to memories; existing user-scoped Row Level Security policies remain enabled.

Automatic extraction and authenticated memory retrieval run through the Express `/api/chat` endpoint, so deploy the updated backend as well as the Android/web client.

---

## 🏗️ Project Architecture

```
SUNNY-AI/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── constants/
│   │   └── theme.ts
│   │
│   ├── types/
│   │   ├── chat.ts
│   │   ├── memory.ts
│   │   ├── user.ts
│   │   └── notifications.ts
│   │
│   ├── services/
│   │   ├── storageService.ts
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── memoryService.ts
│   │   ├── notificationService.ts
│   │   └── privacyService.ts
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── PreferencesContext.tsx
│   │   ├── ChatContext.tsx
│   │   └── MemoryContext.tsx
│   │
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── MemoriesScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── onboarding/
│   │   ├── auth/
│   │   └── settings/
│   │
│   └── components/
│       ├── brand/
│       ├── ui/
│       ├── home/
│       ├── chat/
│       ├── memories/
│       └── settings/
│
├── server.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

### Service responsibilities

| Service | Responsibility |
| :--- | :--- |
| `authService.ts` | Supabase authentication and user sessions |
| `chatService.ts` | Chat requests, conversation context, and AI response handling |
| `memoryService.ts` | Memory operations and consent handling |
| `notificationService.ts` | Notification preferences and schedules |
| `privacyService.ts` | Data export and privacy controls |
| `storageService.ts` | Local application persistence and fallback storage |
| `server.ts` | Express API, AI providers, rate limiting, and production serving |

---

## 🚀 Running Sunny Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env.local` file using `.env.example` as a reference.

Add your own credentials locally:

```env
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### 3. Start the development server

```bash
npm run dev
```

Sunny runs on:

```
http://localhost:3000
```

The Express server binds to `0.0.0.0` so it can also run correctly in cloud hosting environments.

---

## 🏭 Production Build

Build the frontend and TypeScript server:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The server uses the `PORT` environment variable when provided by the hosting platform.

---

## ☁️ Deployment

Sunny can be deployed as a Node/Express web service on platforms such as Render.

Typical configuration:

**Build command**

```bash
npm install && npm run build
```

**Start command**

```bash
npm start
```

Configure the required environment variables in the hosting provider's dashboard rather than committing them to the repository.

---

## 🔒 Security Notes

- AI provider API keys are server-side only.
- Never expose `GROQ_API_KEY` or `GEMINI_API_KEY` through `VITE_` environment variables.
- Never commit `.env.local`.
- Never commit Supabase service-role or other secret keys.
- The Supabase publishable key is intended for client-side use and should still be protected by correct Supabase Row Level Security policies.
- Keep authentication and database authorization enforced by Supabase rather than trusting client-side state.
- Rotate any credential immediately if it is accidentally committed or exposed.

---

## 🛠️ Tech Stack

- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Express**
- **Supabase**
- **Groq API**
- **Google Gemini API**
- **Node.js**

---

## 💛 Philosophy

Sunny is built around a simple idea:

> *You shouldn't have to start over every time you come back.*

The goal is to make conversations feel warm and natural while giving users control over their preferences, memories, privacy, and data.

---

## 📄 License

See the [LICENSE](LICENSE) file for license information.
