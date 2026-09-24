import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import type React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Screen } from "@/components/layout";
import { Button, ErrorState } from "@/components/ui";
import { ToastProvider } from "@/components/ui/toast";
import { EventsProvider } from "@/context/events";
import { SessionProvider, useSession } from "@/context/session";
import { KoffitoThemeProvider } from "@/theme/theme-provider";
import "../../global.css";

SplashScreen.preventAutoHideAsync();

// DEV ONLY — start on the dev jump-menu. Remove this line and `src/app/dev.tsx` to restore normal startup.
export const unstable_settings = { initialRouteName: "dev" };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Keep the splash screen up until fonts are ready (or failed, falling back to system fonts).
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KoffitoThemeProvider>
        <ToastProvider>
          <SessionProvider>
            <ScopedEventsProvider>
              <RootNavigator />
            </ScopedEventsProvider>
          </SessionProvider>
        </ToastProvider>
      </KoffitoThemeProvider>
    </GestureHandlerRootView>
  );
}

/** Remounts the events store per signed-in user so nothing leaks between accounts. */
function ScopedEventsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  return <EventsProvider key={session?.user.id ?? "signed-out"}>{children}</EventsProvider>;
}

function RootNavigator() {
  const { session, isLoading, profileStatus, profileError, reloadProfile, signOut } = useSession();

  if (isLoading) return null;

  // Signed in, but the profile hasn't come back from the API yet.
  if (session && profileStatus === "loading") return null;

  if (session && profileStatus === "error") {
    return (
      <Screen contentClassName="flex-1 justify-center gap-4">
        <ErrorState
          title="We couldn't reach the coffee bar"
          description={profileError}
          onRetry={reloadProfile}
        />
        <Button title="Log out" variant="ghost" onPress={signOut} />
      </Screen>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      {/* DEV ONLY — unguarded so it is reachable in either session state. */}
      <Stack.Screen name="dev" />
    </Stack>
  );
}
