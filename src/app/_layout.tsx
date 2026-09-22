import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ProfileLoadError } from "@/components/auth/profile-load-error";
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
            <EventsProvider>
              <RootNavigator />
            </EventsProvider>
          </SessionProvider>
        </ToastProvider>
      </KoffitoThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { session, isLoading, profileError } = useSession();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  // The stored session (and then the profile row) is still loading; the splash screen covers this.
  if (isLoading) return null;

  // Signed in, but the profile request failed: offer a retry instead of an empty app.
  if (session && profileError) {
    return <ProfileLoadError />;
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
