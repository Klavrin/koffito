# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Point the app at Supabase and the Koffito API

   Copy `.env.example` to `.env` and fill in the Supabase project URL and publishable key
   (Supabase dashboard → Project Settings → API) plus the API base URL. All three values are
   safe to ship in the client.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Backend

Koffito keeps its data in Supabase (Postgres + Auth), but the app never reads or writes the
database directly:

- **Supabase is used for authentication only** — sign up, sign in, sign out and token refresh.
  `src/lib/supabase.ts` holds the client; on iOS/Android the session is stored encrypted on the
  device, on the web it falls back to `localStorage`.
- **Every data request goes to the Koffito API** (FastAPI, in the sibling `Koffito-Backend`
  repository) with `Authorization: Bearer <access_token>`. `src/lib/api.ts` attaches the token,
  refreshes the session once on a `401` and retries, and maps the API's error envelope to
  `ApiError`. Everything the screens need lives in `src/api/`, which calls the endpoints and maps
  the responses to the app's types; `src/types/api.ts` mirrors the API's request/response shapes.
- **Direct database access from the app is closed.** The server refuses `supabase.from()` /
  `supabase.rpc()` calls from clients; the API verifies the token on every request and calls
  Supabase with the user's own token, so row-level security still applies.

The full contract is in [`docs/frontend-integration.md`](docs/frontend-integration.md).

For local development, run the API next to the app:

```bash
cd ../Koffito-Backend && uv run koffito   # serves http://127.0.0.1:8000
```

and set `EXPO_PUBLIC_API_URL` accordingly (see `.env.example` for simulator, emulator and device URLs).

Coffee talks are created by admins (`profiles.is_admin`), and the café plus the other guests stay
hidden until the event's reveal time — the API simply leaves them out, and the UI shows a
"surprise café" until then.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
