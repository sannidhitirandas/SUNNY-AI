# SUNNY-AI canonical project structure

Consolidated from the uploaded source ZIP. Duplicate/stale root application files were removed.

- `src/App.tsx` — application root
- `src/main.tsx` — React entry point
- `src/index.css` — application styles
- `src/screens/onboarding/OnboardingFlow.tsx` — onboarding flow
- `src/context/AuthContext.tsx` — single AuthContext implementation
- `src/services/` — service layer
- `src/types/` — shared types
- `server.ts` — development/production server
- `.env.local` — local environment configuration (sensitive)

The project does not contain `src/lib/supabase.ts`; the Supabase error previously seen in the browser came from a different/stale project copy.
