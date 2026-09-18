import { router } from "expo-router";
import { useRef, useState } from "react";
import type { TextInput } from "react-native";
import { View } from "react-native";

import { AuthHero } from "@/components/auth/auth-hero";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";
import { Screen } from "@/components/layout";
import { Button, Header, Input } from "@/components/ui";
import { useSession } from "@/context/session";
import { isValid, validateRequired } from "@/lib/validation";

export default function LoginPage() {
  const { signIn } = useSession();
  const passwordRef = useRef<TextInput>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const errors = {
    identifier: validateRequired(identifier, "Enter your username or email"),
    password: validateRequired(password, "Enter your password"),
  };

  const handleLogin = () => {
    setSubmitted(true);
    if (!isValid(errors)) return;

    setLoading(true);
    // Stand-in for the real request; the session guard swaps to the signed-in stack.
    setTimeout(() => signIn(), 600);
  };

  return (
    <Screen
      header={<Header title="" onBack={router.canGoBack() ? router.back : undefined} />}
      contentClassName="gap-8 pt-4">
      <AuthHero emoji="👋" title="Welcome back" subtitle="Your next coffee chat is waiting for you." />

      <View className="gap-4">
        <Input
          label="Username or email"
          placeholder="you@example.com"
          leftIcon="person-outline"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          value={identifier}
          onChangeText={setIdentifier}
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={submitted ? errors.identifier : undefined}
        />
        <Input
          ref={passwordRef}
          label="Password"
          placeholder="Your password"
          leftIcon="lock-closed-outline"
          secureTextEntry
          textContentType="password"
          returnKeyType="done"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          error={submitted ? errors.password : undefined}
        />
      </View>

      <View className="gap-2">
        <Button title="Log in" size="lg" fullWidth loading={loading} onPress={handleLogin} />
        <AuthSwitchLink
          prompt="Don't have an account?"
          actionLabel="Register"
          onPress={() => router.replace("/register")}
        />
      </View>
    </Screen>
  );
}
