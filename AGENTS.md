# Koffito

## Stack
- React Native
- Expo
- NativeWind
- TypeScript

## Rules
- Use functional components.
- Use NativeWind for styling.
- Keep components small and reusable.
- Never modify generated Expo files manually.
- Run `npx tsc --noEmit` after TypeScript changes.

## Architecture
- `src/app/` — Expo Router screens
- `src/components/` — reusable components
- `src/api/` — calls to the Koffito API (FastAPI) and mappers to the app's types
- `src/lib/api.ts` — the authenticated API client; `src/lib/supabase.ts` — Supabase Auth only
- `src/types/api.ts` — the API's request/response shapes (see `docs/frontend-integration.md`)
- `assets/` — images and other assets

## Data access
- Supabase is used for authentication only. Never read or write the database from the app
  (`supabase.from` / `supabase.rpc` are refused by the server); go through `src/api/`.
- Never put user ids in request bodies; the API takes them from the token.
- Unit tests run with `npm test` (Node, no bundler): modules under test must not import
  react-native or use runtime `@/` imports.