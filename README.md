# ☀️ Sunny — A Personal AI Companion App

> *"You don't have to start over every time you come back."*

Sunny is a warm, emotionally supportive AI companion mobile application built with **React Native**, **Expo (SDK 57)**, **TypeScript**, and **Expo Router**. Designed with a cozy, premium visual identity of deep dark purple and radiant sunshine yellow, Sunny offers a calm, safe digital corner to talk, laugh, reflect, and feel heard.

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
- **Splash Screen (`app/index.tsx`)**: Glowing animated sun logo, smooth fade-in, and auto-routing.
- **Welcome (`app/onboarding/index.tsx`)**: Warm introduction to Sunny's purpose.
- **Interests (`app/onboarding/interests.tsx`)**: Multi-selectable goals (listening, encouragement, reflection).
- **Personality Choice (`app/onboarding/personality.tsx`)**: Select Sunny's conversational vibe (**Adaptive**, **Playful**, **Gentle**, **Calm**).
- **Memory Consent (`app/onboarding/memory.tsx`)**: Transparent consent selection for saving personal memories.
- **Notification Consent (`app/onboarding/notifications.tsx`)**: Gentle check-in opt-in explanation.
- **Completion (`app/onboarding/complete.tsx`)**: Cheerful entry into Sunny's space.

### 2. Authentication Flow
- **Login (`app/auth/login.tsx`)**: Email/password sign-in with field validation, password toggle, and one-tap **Explore in Demo Mode** guest access.
- **Sign-Up (`app/auth/register.tsx`)**: Display name, email, password strength check, and local storage consent.

### 3. Home Screen — The Heart of Sunny (`app/(tabs)/index.tsx`)
- **Header**: Brand logo, tagline, demo mode indicator, and quick settings link.
- **Greeting Card**: Welcomes the user by their preferred name with "Talk to Sunny" primary CTA.
- **Conversation Starters ("What's the vibe today?")**: 4 intent-driven cards:
  1. *I need someone to listen* (Empathetic / Gentle)
  2. *Distract me and make me laugh* (Playful / Humorous)
  3. *I need a little encouragement* (Supportive / Grounding)
  4. *Let's talk about anything* (Open curiosity)
  *Tapping any card directly launches the Chat screen with the selected context.*
- **Daily Sunshine**: Rotating thoughtful reminders and reflections with "Another" button.
- **Recent Conversation Preview**: Tap-to-resume last conversation snippet.

### 4. Chat Screen — The Main Experience (`app/(tabs)/chat.tsx`)
- **Sunny & User Message Bubbles**:
  - Sunny: Dark purple card bubble with avatar badge, timestamp, and demo tag.
  - User: Radiant sunshine yellow bubble with dark purple text, timestamps, and delivery indicators.
- **Typing Indicator**: Animated 3-dot pulse while Sunny is generating a reply.
- **Auto-Expanding Composer**: Multiline text input with character limits, send button with up arrow, disabled when empty.
- **Realistic Demo AI Engine (`services/chatService.ts`)**:
  - Deterministic contextual responses reflecting the chosen personality tone.
  - Built-in crisis keywords detection routing to immediate emergency resources.
  - Retry failed message handling.
- **Chat Options Modal**: Clear chat, view memories, and access crisis safety info.

### 5. Memories Management Vault (`app/(tabs)/memories.tsx`)
- **Live Search & Category Filters**: Filter memories by *All, Personal, Relationships, Events, Ongoing, Preferences*.
- **Add / Edit / Delete**:
  - Dedicated **MemoryModal** for saving and updating notes with explicit confirmation.
  - Delete with confirmation alert.
- **Memory Disabled State**: Clear UI when memory is toggled off, respecting privacy.
- **Sample Memories**: Pre-seeded demo memories that users can view, edit, delete, or reset.

### 6. Comprehensive Settings (`app/(tabs)/settings.tsx`)
- **Section A (Your Sunny)**: Personality switcher modal, preferred name editor, theme indicator.
- **Section B (Memory)**: Master memory toggle switch, manage saved memories, privacy explanation.
- **Section C (Notifications)**: Preferences screen link, quiet hours notice.
- **Section D (Privacy & Security)**: Data export in standard JSON, clear chat history, wipe data.
- **Section E (Help & Safety)**: Crisis hotlines (988 Lifeline, 741741, international) and interactive 5-4-3-2-1 mindful grounding tool.
- **Section F (Account)**: Profile details, replay onboarding, sign out, and wipe account.

---

## 🏗️ Architecture & Clean Service Layer

```
app/
├── _layout.tsx                     # Root layout, ThemeProvider, Context providers
├── index.tsx                       # Animated Splash Screen
├── modal.tsx                       # Quick reflection modal
├── +not-found.tsx                  # Themed 404 page
├── +html.tsx                       # Web preview layout with dark theme
├── onboarding/                     # Onboarding steps
├── auth/                           # Login & Register
├── (tabs)/                         # 4-tab bottom navigation
│   ├── _layout.tsx                 # Tab navigation styling
│   ├── index.tsx                   # Home screen
│   ├── chat.tsx                    # Chat screen
│   ├── memories.tsx                # Memories vault screen
│   └── settings.tsx                # Settings screen
└── settings/                       # Secondary detail screens
    ├── notifications.tsx           # Notification schedule & quiet hours
    ├── privacy.tsx                 # Data export & privacy manifesto
    ├── safety.tsx                  # Crisis lifelines & grounding tool
    └── about.tsx                   # Architecture & principles

components/                         # Modular design system
├── brand/SunnyLogo.tsx             # Custom glowing sun symbol
├── ui/                             # AppButton, AppCard, AppInput, Badge, EmptyState, LoadingState
├── chat/                           # ChatHeader, MessageBubble, MessageComposer, TypingIndicator
├── home/                           # GreetingCard, ConversationStarter, DailySunshineCard, RecentConversations
├── memories/                       # MemoryCard, MemoryModal
└── settings/                       # SettingsRow, SettingsSection

context/                            # Global state management
├── AuthContext.tsx                 # User authentication & demo guest mode
├── PreferencesContext.tsx          # Tone, name, memory & notification toggles
├── ChatContext.tsx                 # Chat messages, sending states, starter intents
└── MemoryContext.tsx               # Memory list, filters, mutations

services/                           # Typed API contracts
├── storageService.ts               # AsyncStorage local persistence wrapper
├── authService.ts                  # Authentication service & credentials validation
├── chatService.ts                  # Chat session management & deterministic AI engine
├── memoryService.ts                # Memory store, category filters & consent handling
├── notificationService.ts          # Notification schedules & demo preview items
└── privacyService.ts               # Data export (JSON) & permanent wipe controls
```

---

## 🚀 How to Run the App (Expo Go)

### Prerequisites
- Install **Node.js** (v18 or higher; v24 is installed and verified).
- Install the **Expo Go** app on your phone:
  - [Expo Go for Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [Expo Go for iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

### Step 1: Install Dependencies
Open a terminal in the project directory:
```bash
npm install
```

### Step 2: Start the Expo Development Server
Run:
```bash
npx expo start
```
*or*
```bash
npm start
```

### Step 3: Open on Your Device
- **Android**: Open the **Expo Go** app and tap **"Scan QR code"**, then scan the QR code displayed in your terminal.
- **iOS**: Open the native **Camera** app, scan the QR code, and tap the prompt to open in **Expo Go**.
- **Web Preview**: Press `w` in the terminal to view the application in your browser.
- **Clear Cache** (if needed):
  ```bash
  npx expo start -c
  ```

---

## 🧪 Testing & Validation Report

| Check | Tool / Command | Result |
| :--- | :--- | :--- |
| **TypeScript Strict Compilation** | `npx tsc --noEmit` | **Passed (0 errors)** |
| **Expo Environment & Dependency Audit** | `npx expo-doctor` | **21/21 checks passed (100%)** |
| **Bundling & Static Export** | `npx expo export --platform web` | **Static & client bundle generated successfully** |
| **Storage Persistence** | `@react-native-async-storage/async-storage` | **Verified local state persistence for preferences, chat & memories** |

---

## 🔮 Backend Integration Roadmap (Phase 2 & 3)

The app is built with strict interfaces so that replacing mock services with real backend endpoints requires **zero changes to UI components**:

1. **AI Model Provider**: Connect `chatService.ts` to your Node.js/Python server-side endpoint (`POST /chat/sessions/:id/messages`) that queries Google Gemini API or other LLMs via streaming or REST.
2. **PostgreSQL Database**: Persist user profiles, message logs, and memory indexes securely behind an authenticated backend.
3. **Push Notification Service**: Register APNs / FCM push tokens in `notificationService.ts` using Expo Notifications for delivery of scheduled sunshine messages.
