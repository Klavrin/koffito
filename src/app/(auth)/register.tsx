import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AuthHero } from "@/components/auth/auth-hero";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";
import { Screen } from "@/components/layout";
import { Button, Header, Input, useToast } from "@/components/ui";
import { useSession } from "@/context/session";
import { describeError } from "@/lib/errors";
import {
  isValid,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from "@/lib/validation";

export default function RegisterPage() {
  const { signUp } = useSession();
  const toast = useToast();

  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", confirmation: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const setField = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const errors = {
    name: validateRequired(form.name, "What should we call you?"),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirmation: validatePasswordMatch(form.password, form.confirmation),
  };
  const showError = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  const handleRegister = async () => {
    setSubmitted(true);
    if (!isValid(errors)) return;

    setLoading(true);
    try {
      const needsConfirmation = await signUp({
        firstName: form.name.trim(),
        lastName: form.surname.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
      });

      // Otherwise the session guard takes over and Home sends new profiles to the survey.
      if (needsConfirmation) {
        toast.show({ title: "Check your inbox 📬", message: "Confirm your email, then log in to get started.", variant: "success" });
        router.replace("/login");
      }
    } catch (error) {
      toast.show({ title: "Couldn't create your account", message: describeError(error), variant: "error" });
      setLoading(false);
    }
  };

  return (
    <Screen
      header={<Header title="" onBack={router.canGoBack() ? router.back : undefined} />}
      contentClassName="gap-8 pt-4">
      <AuthHero title="Create your account" subtitle="A few details and you're ready for your first coffee talk." />

      <View className="gap-4">
        <View className="flex-row gap-3">
          <Input
            className="flex-1"
            label="Name"
            placeholder="George"
            textContentType="givenName"
            value={form.name}
            onChangeText={setField("name")}
            error={showError("name")}
          />
          <Input
            className="flex-1"
            label="Surname"
            placeholder="Optional"
            textContentType="familyName"
            value={form.surname}
            onChangeText={setField("surname")}
          />
        </View>
        <Input
          label="Email"
          placeholder="you@example.com"
          leftIcon="mail-outline"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          value={form.email}
          onChangeText={setField("email")}
          error={showError("email")}
        />
        <Input
          label="Password"
          placeholder="At least 8 characters"
          leftIcon="lock-closed-outline"
          secureTextEntry
          textContentType="newPassword"
          value={form.password}
          onChangeText={setField("password")}
          error={showError("password")}
        />
        <Input
          label="Confirm password"
          placeholder="Once more, just to be sure"
          leftIcon="lock-closed-outline"
          secureTextEntry
          textContentType="newPassword"
          value={form.confirmation}
          onChangeText={setField("confirmation")}
          onSubmitEditing={handleRegister}
          error={showError("confirmation")}
        />
      </View>

      <View className="gap-2">
        <Button title="Register" size="lg" fullWidth loading={loading} onPress={handleRegister} />
        <AuthSwitchLink prompt="Already have an account?" actionLabel="Log in" onPress={() => router.replace("/login")} />
      </View>
    </Screen>
  );
}
