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
  const { session, profile, ready } = useSession();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // The stored session is still being restored; the splash screen covers this.
  if (!ready) {
    return null;
  }

  // Signed in, but the profile request failed: offer a retry instead of an empty app.
  if (session && !profile) {
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
    </Stack>
  );
}
