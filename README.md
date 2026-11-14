# ☀️ Sunny — A Personal AI Companion

> *You don't have to start over every time you come back.*

Sunny is a warm, emotionally supportive AI companion built for conversations that feel personal, calm, and continuous. It combines a React web app, an Express API, Supabase-backed accounts and cloud data, and a native Android app powered by Capacitor.

**Sunny is designed around a simple idea: listen first, remember what matters (with user control), and make it easier to return to a conversation.**

---

## ✨ What Sunny includes

- **Personalised onboarding** — choose interests and the conversational style that feels right.
- **Flexible conversation starters** — listening, a little humour, encouragement, or an open-ended chat.
- **AI chat** — conversational context, recent chat history, typing feedback, retry states, and streamed responses where supported.
- **Image understanding** — attach an image and ask Sunny about it.
- **Document and file attachments** — add supported documents and spreadsheets for text extraction and discussion.
- **Memory controls** — review, add, edit, and delete memories; automatic memory features respect the user's memory settings and consent.
- **Chat wallpaper** — choose from built-in chat backgrounds; the selection is stored locally on that device.
- **Notifications** — optional morning, afternoon, and evening check-ins, memory follow-ups, daily limits, and quiet hours.
- **Audio preferences** — configure supported sound and music preferences.
- **Privacy and safety tools** — account/data controls, privacy information, grounding support, and safety resources.
- **Android app** — native Android project, device file picker integration, keyboard handling, deep-link support, and local notifications.

## 🎨 Visual identity

Sunny uses a cosy dark-purple theme with sunshine-yellow accents.

| Element | Colour | Purpose |
| --- | --- | --- |
| Main background | `#100B22` | Primary app canvas |
| Secondary background | `#17102C` | Headers and secondary surfaces |
| Card background | `#21163A` | Cards and grouped content |
| Elevated surface | `#302149` | Elevated interactive surfaces |
| Input background | `#1B1430` | Composer and form fields |
| Sunshine yellow | `#FFD84D` | Primary accent and highlights |
| Lavender text | `#C6B8E5` | Supporting text |
| Muted text | `#9B8AB9` | Captions and placeholders |

The app also includes a light theme preference.

---

## 🧠 AI providers and request flow

Provider credentials stay on the server. They are not bundled into the browser or Android client.

### Normal text conversations

1. The client sends the conversation to `POST /api/chat`.
2. The Express server tries Groq using `openai/gpt-oss-20b` first.
3. If needed, it can try the configured `GROQ_MODEL` as an alternative.
4. Temporary provider errors are returned as friendly retry messages.

### Image attachments

Images use a separate vision path because the normal text model is not an image-understanding model.

1. Sunny sends the image and conversation context to Gemini using `GEMINI_MODEL` (default: `gemini-3.8-flash`).
2. If Gemini is unavailable or returns an error, Sunny tries the OpenRouter vision fallback.
3. The current OpenRouter fallback model is `nvidia/nemotron-3.5-super-vl:free`.

The OpenRouter fallback is optional and is enabled by setting `OPENROUTER_API_KEY`. Free-model availability, rate limits, and response times are controlled by the provider and can change; a free model is not a guarantee of unlimited or uninterrupted service. Image responses may take longer when fallback is used.

### Text and document attachments

Supported document files are extracted on the server and added to the chat context. Text/document requests use the text-generation fallback path; image attachments use the vision path above.

```text
Text chat:
Client → Express /api/chat → Groq → configured Groq alternative (if needed)

Image chat:
Client → Express /api/chat → Gemini vision → OpenRouter vision fallback (if needed)

Document chat:
Client → Express /api/chat → server-side extraction → text AI response path
```

---

## 📎 Attachments

The server accepts up to **3 files per message**, with a maximum of **50 MB per file** and **50 MB combined** after decoding.

| Type | Supported formats |
| --- | --- |
| Documents | PDF, DOCX, TXT, Markdown |
| Data and spreadsheets | CSV, JSON, XLS, XLSX |
| Images | PNG, JPG/JPEG, WebP |

- Files are validated and processed on the server.
- PDF, DOCX, and spreadsheet contents are extracted into text for the AI context.
- Image bytes are sent to the vision provider.
- Extracted document text is limited to 30,000 characters per file and 80,000 characters combined.
- The Android app includes a native file-picker integration; the web app can use the browser's file selection.

Do not attach sensitive documents or personal images unless you are comfortable sending their contents to the configured AI provider(s).

---

## 🔐 Authentication, storage, and privacy

Sunny uses **Supabase Auth** for account authentication and Supabase database tables for cloud-backed preferences, chat messages, and memories. User-scoped Row Level Security (RLS) policies are defined in the SQL migrations.

- The frontend uses the Supabase project URL and publishable key.
- The Supabase service-role key, when configured for server-side administrative operations, must remain server-only.
- AI provider keys must never use a `VITE_` prefix.
- Chat wallpaper selection is stored in device-local storage and is not synced between devices.
- Android reminder delivery is local to the device; notification content is generic and does not include chat or memory details.

### Environment variables

Create a local `.env.local` file based on `.env.example`.

**Required for the corresponding integrations:**

```env
# Server-side AI providers
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key

# Supabase client configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

**Optional server configuration:**

```env
# Vision fallback when Gemini cannot process an image
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional preferred Groq alternative and Gemini model
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_MODEL=gemini-3.8-flash

# Server-only key for administrative Supabase operations, when required
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Hosting platform supplies PORT in production; local default is 3000
PORT=3000
```

Never commit real credentials, `.env.local`, service-role keys, or provider API keys to Git. If a secret is exposed, rotate it immediately.

### Supabase setup and migrations

Apply the SQL files in `supabase/migrations/` in numeric order using the Supabase SQL Editor:

1. `001_cloud_persistence.sql` — preferences, chat messages, memories, indexes, and RLS policies.
2. `002_automatic_memory.sql` — memory identity and optional expiry metadata.
3. `003_user_settings.sql` — persisted theme and notification preferences.
4. `004_audio_preferences.sql` — persisted audio preferences.

For an existing project, apply only migrations that have not already been run. Keep the Supabase Authentication URL Configuration aligned with the deployed web origin and the redirect URLs used by local development and the Android deep link. The app's Android callback scheme is `sunnyai://auth/callback`.

---

## 🔔 Android notifications

Sunny uses Capacitor Local Notifications for device-local reminders; it does not require a push-notification server.

- Notifications are opt-in and require Android permission where applicable.
- Morning, afternoon, and evening slots can be enabled or paused independently.
- Users can configure reminder times, memory follow-ups, a daily cap, and quiet hours.
- Reminder schedules use the device's local date, time, and timezone.
- Android may defer inexact alarms because of Doze mode or battery restrictions.
- The web app can save notification preferences but does not deliver local notifications.

After changing native Android dependencies or plugins, run `npx cap sync android`.

---

## 🏗️ Project structure

```text
SUNNY-AI/
├── android/                  # Native Android project and custom file-picker plugin
├── public/                   # Static assets, wallpapers, and app resources
├── server/
│   └── fileAttachments.ts    # Attachment validation and extraction
├── src/
│   ├── components/           # Brand, chat, home, memories, settings, and UI
│   ├── context/               # Auth, chat, memory, and preferences state
│   ├── lib/                   # API, auth routing, wallpaper, notifications, helpers
│   ├── screens/               # Main screens, onboarding, auth, and settings
│   ├── services/              # Auth, chat, memory, storage, audio, privacy, notifications
│   ├── types/                 # Shared application types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── migrations/            # Ordered database migrations
├── tests/                     # Node test-runner tests
├── server.ts                  # Express API and Vite/production server
├── capacitor.config.ts        # Capacitor app configuration
├── package.json
└── README.md
```

---

## 🚀 Run locally

### 1. Requirements

- Node.js (use a current supported LTS release)
- npm
- A Supabase project for authentication and cloud persistence
- API credentials for the AI providers you want to use

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env.local` and add your own credentials. Keep this file out of version control.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The development command starts the Express server with Vite middleware.

---

## 🧪 Quality checks

Run the TypeScript check:

```bash
npm run lint
```

Run the automated tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

The build runs TypeScript compilation followed by the Vite production build.

---

## 📱 Android development

The repository includes a Capacitor Android project.

After installing dependencies and configuring the environment:

```bash
npm run build
npx cap sync android
npx cap open android
```

Use Android Studio to build, install, and test the app on an emulator or physical device. Test native functionality on a real device where possible, especially the file picker, keyboard behaviour, deep links, and notification delivery.

The Capacitor app configuration uses:

- App name: `Sunny`
- App ID: `com.sannidhitirandas.sunny`
- Web assets directory: `dist`

---

## ☁️ Deployment

Sunny can run as a Node.js web service on a host such as Render.

Typical service commands:

**Build command**

```bash
npm install && npm run build
```

**Start command**

```bash
npm start
```

Set the environment variables in the hosting provider's dashboard. Do not put server secrets in frontend build variables. The server listens on the hosting platform's `PORT` value and serves the production assets from `dist/`.

Useful health check endpoint:

```text
GET /api/health
```

The health endpoint reports server and provider configuration status; it does not guarantee that an external provider is currently available.

---

## 🛡️ Security notes

- Keep Groq, Gemini, OpenRouter, and Supabase service-role credentials on the server.
- Only the Supabase publishable key belongs in the frontend. Supabase publishable keys are designed to be public; database access must still be protected by RLS.
- Keep `.env.local` and all real secret files out of Git.
- Maintain Supabase RLS policies and test access using separate user accounts.
- Uploaded files are checked for allowed extensions, declared MIME types, size limits, and selected file signatures. This is useful validation, not a substitute for malware scanning or a hardened document-processing sandbox.
- The current API rate limiter is in-memory and per server process. It helps with basic abuse control but is not a distributed production quota system; multiple instances can have separate counters and counters reset on restart.
- Avoid sending sensitive content to external AI services unless users have been clearly informed and have chosen to do so.
- Provider availability, model names, free-tier quotas, and terms can change. Review provider documentation before changing production configuration.

---

## 🧰 Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4
- **Backend:** Node.js, Express 5
- **Mobile:** Capacitor 8, Android
- **Authentication and cloud data:** Supabase
- **AI:** Groq, Google Gemini, OpenRouter (vision fallback)
- **File processing:** pdf-parse, Mammoth, SheetJS
- **Testing:** Node.js test runner with `tsx`

---

## 💛 Philosophy

Sunny is more than a chat box. It is a small, supportive space where users can talk in their own way, shape the experience around their needs, and stay in control of what gets remembered.

> *You don't have to start over every time you come back.*

---

## 🚦 Before a public release

The repository contains the app and deployment foundations, but a successful local build alone does not establish production readiness. Before publishing, verify the following on the deployed service and on real Android devices:

- Email/password sign-up, sign-in, password reset, Google OAuth, and session restoration.
- Account isolation with two separate test accounts, including chat history, memories, and preferences.
- Account deletion and confirmation that the user's cloud rows are removed.
- Image and document attachments, including invalid files, large files, interrupted uploads, and provider outages.
- Android deep links, keyboard behaviour, back navigation, file picker, wallpaper persistence, and notification permissions.
- `npm run lint`, `npm test`, and `npm run build` on the exact commit intended for release.
- A signed Android App Bundle installed and tested through a Play testing track before public rollout.
- A published privacy policy, terms, support contact, accurate store disclosures, and a process for handling user data requests.

The free AI-provider routes can be rate-limited or unavailable and may respond slowly. Do not promise unlimited service. The `/api/health` endpoint reports server configuration, not live provider health.

---

## 📄 License

See [LICENSE](LICENSE) for license information.
