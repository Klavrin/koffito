import { router } from "expo-router";
import { useRef, useState } from "react";
import type { TextInput } from "react-native";
import { View } from "react-native";

import { AuthHero } from "@/components/auth/auth-hero";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";
import { Screen } from "@/components/layout";
import { Button, Header, Input, useToast } from "@/components/ui";
import { useSession } from "@/context/session";
import { describeError } from "@/lib/errors";
import { isValid, validateEmail, validateRequired } from "@/lib/validation";

export default function LoginPage() {
  const { signIn } = useSession();
  const toast = useToast();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const errors = {
    email: validateEmail(email),
    password: validateRequired(password, "Enter your password"),
  };

  const handleLogin = async () => {
    setSubmitted(true);
    if (!isValid(errors)) return;

    setLoading(true);
    try {
      // On success the session guard swaps to the signed-in stack.
      await signIn(email, password);
    } catch (error) {
      toast.show({ title: "Couldn't log you in", message: describeError(error), variant: "error" });
      setLoading(false);
    }
  };

  return (
    <Screen
      header={<Header title="" onBack={router.canGoBack() ? router.back : undefined} />}
      contentClassName="gap-8 pt-4">
      <AuthHero emoji="👋" title="Welcome back" subtitle="Your next coffee chat is waiting for you." />

      <View className="gap-4">
        <Input
          label="Email"
          placeholder="you@example.com"
          leftIcon="mail-outline"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={submitted ? errors.email : undefined}
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
