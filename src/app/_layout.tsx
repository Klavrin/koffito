import { Redirect, Stack } from "expo-router";
import { useState } from "react";
import "../../global.css";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // temporary: will come from supabase

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      {!isLoggedIn && <Redirect href="/login" />}
    </Stack>
  );
}
